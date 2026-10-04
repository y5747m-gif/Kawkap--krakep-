/**
 * ============================================================
 * خدمة الطلبات — كوكب كراكيب
 * ============================================================
 * تدفق الطلب الكامل:
 *   Create Order → Generate Order ID → Save to Database
 *   → Generate WhatsApp Message → WhatsApp Link → يُعاد الرابط للواجهة
 *
 * الطلب يُحفظ دائمًا في قاعدة البيانات أولًا، ثم يُفتح WhatsApp —
 * فإذا أغلق العميل واتساب يظل الطلب محفوظًا ويظهر في لوحة الإدارة.
 */
import {
  createOrderRecord, getOrderByCode,
  updateOrderStatus, listSellerIdsForOrder, incrementSalesCount, type NewOrderItem,
} from "./models/orders";
import { getProductRow, getCartItems, clearCart, setProductStatus } from "./models/products";
import { getUserById } from "./models/users";
import { notify } from "./models/misc";
import { generateOrderCode } from "./ids";
import { createOwnerOrderLink } from "./whatsapp";
import { sanitizeText, normalizeEgyptianPhone, isValidQuantity } from "./validate";
import { ORDER_STATUS_MAP } from "./constants";
import { computeLineTotal } from "./pricing";
import type { CurrentUser, CreateOrderResult, DeliveryMethod, OrderStatus, OrderWithItems } from "./types";
import { formatMoney, formatQuantity } from "./format";

// ------------------------- إنشاء الطلب -------------------------

export interface CreateOrderPayload {
  source: "PRODUCT" | "CART";
  productId?: string;
  quantity?: number;
  customerName: string;
  customerPhone: string;
  gov?: string | null;
  area?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryMethod: DeliveryMethod;
  notes?: string | null;
}

export class OrderValidationError extends Error {}

function v(cond: unknown, message: string): asserts cond {
  if (!cond) throw new OrderValidationError(message);
}

/**
 * إنشاء طلب جديد — عميل واحد قد يطلب منتجًا واحدًا أو سلته كاملة (منتجات من عدة بائعين).
 * تُنشأ الطلبات الفرعية (seller_orders) تلقائيًا لكل بائع.
 */
export function createOrder(
  payload: CreateOrderPayload,
  viewer: CurrentUser | null,
  baseUrl: string
): CreateOrderResult {
  // ---------- التحقق من صحة البيانات (منع الطلبات الوهمية) ----------
  const customerName = sanitizeText(payload.customerName, 80);
  v(customerName.length >= 2, "من فضلك أدخل الاسم بشكل صحيح");

  const phone = normalizeEgyptianPhone(payload.customerPhone || "");
  v(!!phone, "من فضلك أدخل رقم هاتف مصري صحيح مثل 01012345678");

  const methods: DeliveryMethod[] = ["PICKUP", "DELIVERY", "MEETUP"];
  v(methods.includes(payload.deliveryMethod), "اختر طريقة استلام صحيحة");

  const gov = payload.gov ? sanitizeText(payload.gov, 40) : null;
  const area = payload.area ? sanitizeText(payload.area, 60) : null;
  const address = payload.address ? sanitizeText(payload.address, 240) : null;
  const notes = payload.notes ? sanitizeText(payload.notes, 600) : null;

  if (payload.deliveryMethod === "DELIVERY") {
    v(!!gov, "حدد المحافظة لإتمام التوصيل");
    v(!!address, "أدخل عنوان الاستلام لإتمام التوصيل");
  } else {
    v(!!gov, "حدد المحافظة");
  }

  // ---------- بناء بنود الطلب ----------
  const items: NewOrderItem[] = [];

  if (payload.source === "PRODUCT") {
    const product = getProductRow(payload.productId || "");
    v(!!product, "المنتج غير موجود");
    v(product!.status === "ACTIVE", "هذا الإعلان غير متاح للطلب حاليًا");
    if (viewer) v(product!.sellerId !== viewer.id, "لا يمكنك طلب منتجك أنت");

    let quantity: number;
    if (product!.pricingType === "PER_KG" || product!.pricingType === "PER_PIECE") {
      quantity = payload.quantity ?? 1;
      v(isValidQuantity(quantity), "أدخل كمية صحيحة");
      v(quantity <= product!.quantity, `الكمية المتاحة هي ${formatQuantity(product!.quantity, product!.unit)} فقط`);
    } else {
      // سعر ثابت / للمجموعة — الطلب على الدفعة كلها
      quantity = product!.quantity;
    }

    items.push({
      productId: product!.id,
      sellerId: product!.sellerId,
      sellerName: getSellerName(product!.sellerId),
      title: product!.title,
      unit: product!.unit,
      price: product!.price,
      pricingType: product!.pricingType,
      quantity,
      lineTotal: computeLineTotal(product!.pricingType, product!.price, quantity),
    });
  } else {
    // طلب من السلة — قد يحتوي منتجات من بائعين مختلفين
    v(!!viewer, "سجل الدخول لإتمام طلب السلة");
    const cartItems = getCartItems(viewer!.id);
    v(cartItems.length > 0, "سلتك فارغة");

    for (const ci of cartItems) {
      if (ci.product.status !== "ACTIVE") continue;
      if (viewer && ci.product.sellerId === viewer.id) continue;
      const product = getProductRow(ci.productId);
      if (!product) continue;
      const quantity = Math.min(ci.quantity, product.quantity);
      if (quantity <= 0) continue;
      items.push({
        productId: product.id,
        sellerId: product.sellerId,
        sellerName: ci.product.sellerName,
        title: product.title,
        unit: product.unit,
        price: product.price,
        pricingType: product.pricingType,
        quantity,
        lineTotal: computeLineTotal(product.pricingType, product.price, quantity),
      });
    }
    v(items.length > 0, "لا توجد منتجات متاحة للطلب في سلتك");
  }

  // ---------- الحفظ في قاعدة البيانات ----------
  const order = createOrderRecord({
    orderCode: generateOrderCode(),
    buyerId: viewer?.id ?? null,
    customerName,
    customerPhone: phone!,
    gov,
    area,
    address,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    deliveryMethod: payload.deliveryMethod,
    notes,
    items,
  });

  // ---------- الإشعارات ----------
  // 1) لكل بائع: لديك طلب جديد
  const sellerIds = [...new Set(items.map((i) => i.sellerId))];
  for (const sellerId of sellerIds) {
    const sellerItems = items.filter((i) => i.sellerId === sellerId);
    notify({
      userId: sellerId,
      type: "NEW_ORDER",
      title: "لديك طلب جديد",
      body: `طلب رقم #${order.orderCode} على ${sellerItems.map((i) => `«${i.title}»`).join(" و ")} بقيمة ${formatMoney(sellerItems.reduce((s, i) => s + i.lineTotal, 0))}`,
      link: "/seller",
    });
  }
  // 2) للمشتري (إن كان مسجلًا): تم إنشاء طلبك
  if (viewer) {
    notify({
      userId: viewer.id,
      type: "ORDER_CREATED",
      title: "تم إنشاء طلبك بنجاح",
      body: `رقم الطلب: ${order.orderCode} — سيتم التواصل معك لتأكيد التفاصيل`,
      link: `/orders/${order.orderCode}`,
    });
  }

  // ---------- تجهيز رابط واتساب المالك (بعد الحفظ) ----------
  const fullOrder = getOrderByCode(order.orderCode)!;
  const whatsappUrl = createOwnerOrderLink(fullOrder, baseUrl);

  // تفريغ السلة بعد طلبها
  if (payload.source === "CART" && viewer) clearCart(viewer.id);

  return { order: fullOrder, whatsappUrl };
}

function getSellerName(sellerId: string): string {
  return getUserById(sellerId)?.name ?? "بائع";
}

// ------------------------- تحديث حالة الطلب (الإدارة) -------------------------

export function changeOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorName: string
): OrderWithItems | null {
  v(!!ORDER_STATUS_MAP[status], "حالة طلب غير معروفة");
  const updated = updateOrderStatus(orderId, status);
  if (!updated) return null;

  const order = getOrderByCode(updated.orderCode);
  if (!order) return null;

  const statusLabel = ORDER_STATUS_MAP[status].label;

  // إشعار المشتري
  if (order.buyerId) {
    notify({
      userId: order.buyerId,
      type: status === "COMPLETED" ? "ORDER_COMPLETED" : "ORDER_STATUS",
      title: status === "COMPLETED" ? "تم إتمام طلبك" : `تم تحديث حالة طلبك: ${statusLabel}`,
      body: `الطلب رقم #${order.orderCode} — ${statusLabel}`,
      link: `/orders/${order.orderCode}`,
    });
  }

  // إشعار البائعين
  for (const sellerId of listSellerIdsForOrder(orderId)) {
    notify({
      userId: sellerId,
      type: "ORDER_UPDATED",
      title: `تحديث على الطلب #${order.orderCode}: ${statusLabel}`,
      body: `تم التحديث بواسطة ${actorName}`,
      link: "/seller",
    });
    // عند الإتمام يُحتسب بيع للبائع
    if (status === "COMPLETED") incrementSalesCount(sellerId);
  }

  // عند الإتمام: تعليم المنتجات المطلوبة بالكامل كمباعة
  if (status === "COMPLETED") {
    for (const item of order.items) {
      const product = getProductRow(item.productId);
      if (product && product.status === "ACTIVE" && item.quantity >= product.quantity) {
        setProductStatus(product.id, "SOLD");
      }
    }
  }

  return order;
}
