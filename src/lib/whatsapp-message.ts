/**
 * بنّاء رسائل واتساب — وحدة نقية قابلة للاستخدام في الخادم والمتصفح.
 * الرسالة ديناميكية بالكامل: تتغير مع العميل والمنتج والكمية والسعر والموقع.
 */
import { formatMoney, formatUnitPrice, formatQuantity, formatDateTime, formatNumber } from "./format";
import { DELIVERY_METHOD_MAP, SITE_NAME } from "./constants";
import type { OrderWithItems } from "./types";

/** رسالة الطلب الموجهة لمالك المنصة */
export function generateOrderWhatsAppMessage(order: OrderWithItems, productLink?: string): string {
  const lines: string[] = [];

  lines.push(`🪐 ${SITE_NAME}`);
  lines.push("📦 طلب جديد");
  lines.push("");
  lines.push("رقم الطلب:");
  lines.push(`#${order.orderCode}`);
  lines.push("");
  lines.push("👤 بيانات العميل:");
  lines.push(`الاسم: ${order.customerName}`);
  lines.push(`الهاتف: ${order.customerPhone}`);
  lines.push("");

  const single = order.items.length === 1 ? order.items[0] : null;

  if (single) {
    lines.push("🛍️ المنتج:");
    lines.push(single.title);
    lines.push("");
    lines.push("📦 الكمية:");
    lines.push(formatQuantity(single.quantity, single.unit));
    lines.push("");
    lines.push("💰 السعر:");
    lines.push(formatUnitPrice(single.price, single.pricingType, single.unit));
    lines.push("");
    lines.push("💵 الإجمالي:");
    lines.push(formatMoney(single.lineTotal));
    lines.push("");
    lines.push("📍 موقع المنتج:");
    lines.push(productLocationText(single.productGov ?? "-", single.productArea));
  } else {
    lines.push("🛍️ المنتجات:");
    order.items.forEach((item, i) => {
      lines.push(
        `${formatNumber(i + 1)}) ${item.title} — البائع: ${item.sellerName} — ` +
        `${formatQuantity(item.quantity, item.unit)} × ${formatUnitPrice(item.price, item.pricingType, item.unit)} = ${formatMoney(item.lineTotal)}`
      );
    });
    lines.push("");
    lines.push("💵 الإجمالي:");
    lines.push(formatMoney(order.total));
  }

  lines.push("");
  lines.push("📍 موقع العميل:");
  lines.push(customerLocationText(order));
  lines.push("");
  lines.push("🚚 طريقة الاستلام:");
  lines.push(DELIVERY_METHOD_MAP[order.deliveryMethod] ?? order.deliveryMethod);
  lines.push("");
  lines.push("📝 ملاحظات:");
  lines.push(order.notes?.trim() || "—");
  lines.push("");
  lines.push("🕒 تاريخ الطلب:");
  lines.push(formatDateTime(order.createdAt));
  lines.push("");
  lines.push("رابط المنتج:");
  lines.push(productLink || `${formatNumber(order.items.length)} منتجات في هذا الطلب`);
  if (!single && order.items.length > 1) {
    lines.push(`(${formatNumber(order.items.length)} منتجات من ${formatNumber(new Set(order.items.map((i) => i.sellerId)).size)} بائعين)`);
  }
  lines.push("");
  lines.push("يرجى متابعة الطلب من لوحة الإدارة.");

  return lines.join("\n");
}

/** رسالة التواصل مع العميل من لوحة الإدارة */
export function generateCustomerMessage(order: OrderWithItems): string {
  const items = order.items.map((i) => `«${i.title}»`).join(" و ");
  return `🪐 ${SITE_NAME}\nمرحبًا ${order.customerName}،\nنتواصل معك بخصوص طلبك رقم #${order.orderCode} (${items}) بقيمة ${formatMoney(order.total)}.\nي سرّنا تأكيد التفاصيل معك.`;
}

function customerLocationText(order: OrderWithItems): string {
  const parts = [order.gov, order.area, order.address].filter(Boolean);
  return parts.length ? parts.join(" — ") : "—";
}

function productLocationText(gov: string, area?: string | null): string {
  return area ? `${gov} — ${area}` : gov;
}
