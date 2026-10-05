/**
 * ============================================================
 * بنّاء رسائل واتساب — كوكب كراكيب
 * ============================================================
 * وحدة نقية (تعمل في الخادم والمتصفح) تبني كل الرسائل التي تصل
 * لمالك المنصة على واتساب، منسّقة باحترافية وبإيموجيز واضحة:
 *
 *   generateOrderWhatsAppMessage()   — طلب شراء جديد (منتج واحد أو سلة)
 *   generateListingWhatsAppMessage() — طلب عرض منتج للبيع (من معالج البيع)
 *   generateInquiryMessage()         — استفسار العميل عن طلبه
 *   generateCustomerMessage()        — رسالة الإدارة للعميل
 *   generateContactMessage()         — تواصل عام من زر واتساب العائم
 *
 * ملاحظات التنسيق:
 *  - واتساب يدعم *عريض* و _مائل_ — نستخدمها لإبراز العناوين والأرقام.
 *  - كل قسم يبدأ بإيموجي ويفصل بينها خط فاصل لسهولة القراءة على الموبايل.
 *  - الرسالة ديناميكية 100%: تتغير مع العميل والمنتج والكمية والسعر والموقع.
 */
import { formatMoney, formatUnitPrice, formatQuantity, formatDateTime, formatNumber } from "./format";
import {
  DELIVERY_METHOD_MAP, SITE_NAME, SITE_TAGLINE, CONDITION_MAP, PRICING_TYPE_MAP,
} from "./constants";
import type { OrderWithItems } from "./types";

/** خط فاصل بين أقسام الرسالة */
const DIV = "━━━━━━━━━━━━━━━";
const SOFT = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄";

/** سطر «مفتاح: قيمة» مع إيموجي — يتجاهل القيم الفارغة */
function line(emoji: string, label: string, value?: string | number | null): string | null {
  const v = typeof value === "number" ? String(value) : (value ?? "").trim();
  if (!v || v === "-") return null;
  return `${emoji} *${label}:* ${v}`;
}

/**
 * تجميع الأسطر: يحذف القيم غير الموجودة (null/undefined) ويُبقي
 * السطور الفارغة "" لأنها مقصودة للفصل بين أقسام الرسالة.
 */
function block(...lines: (string | null | undefined)[]): string {
  return lines.filter((l): l is string => l !== null && l !== undefined).join("\n");
}

/** رابط الموقع على خرائط جوجل (يفتح مباشرة من واتساب) */
function mapsLink(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function locationText(gov?: string | null, area?: string | null, address?: string | null): string {
  const parts = [gov, area, address].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(" — ") : "";
}

/** ترويسة موحّدة لكل رسائل المنصة */
function header(title: string): string {
  return block(`🪐 *${SITE_NAME}* 🪐`, DIV, title, DIV);
}

/** تذييل موحّد */
function footer(extra?: string | null): string {
  return block(DIV, extra, `🪐 _${SITE_NAME} — ${SITE_TAGLINE}_`);
}

// ============================================================
// 1) طلب شراء جديد → يصل لواتساب المالك تلقائيًا
// ============================================================

export function generateOrderWhatsAppMessage(order: OrderWithItems, productLink?: string): string {
  const single = order.items.length === 1 ? order.items[0] : null;
  const sellersCount = new Set(order.items.map((i) => i.sellerId)).size;

  // ---------- العميل ----------
  const customer = block(
    "👤 *بيانات العميل*",
    line("🔸", "الاسم", order.customerName),
    line("📱", "الهاتف", order.customerPhone),
    line("📍", "الموقع", locationText(order.gov, order.area, order.address) || "لم يحدده العميل"),
    line("🗺️", "الموقع على الخريطة", mapsLink(order.latitude, order.longitude)),
  );

  // ---------- المنتجات ----------
  let products: string;
  if (single) {
    products = block(
      "🛍️ *المنتج المطلوب*",
      line("📦", "المنتج", single.title),
      line("🧑‍🌾", "البائع", single.sellerName),
      line("⚖️", "الكمية", formatQuantity(single.quantity, single.unit)),
      line("💰", "السعر", formatUnitPrice(single.price, single.pricingType, single.unit)),
      line("🧾", "إجمالي البند", formatMoney(single.lineTotal)),
      line("📍", "مكان المنتج", locationText(single.productGov, single.productArea)),
      line("🔗", "رابط المنتج", productLink),
    );
  } else {
    const rows = order.items.map((item, i) =>
      block(
        `*${formatNumber(i + 1)})* ${item.title}`,
        `   🧑‍🌾 البائع: ${item.sellerName}`,
        `   ⚖️ ${formatQuantity(item.quantity, item.unit)} × ${formatUnitPrice(item.price, item.pricingType, item.unit)}`,
        `   🧾 الإجمالي: ${formatMoney(item.lineTotal)}`,
      )
    ).join(`\n${SOFT}\n`);

    products = block(
      `🛍️ *منتجات الطلب (${formatNumber(order.items.length)})*`,
      rows,
      SOFT,
      `🧑‍🌾 *عدد البائعين:* ${formatNumber(sellersCount)}`,
    );
  }

  // ---------- التسليم ----------
  const delivery = block(
    "🚚 *التسليم والملاحظات*",
    line("🚚", "طريقة الاستلام", DELIVERY_METHOD_MAP[order.deliveryMethod] ?? order.deliveryMethod),
    line("📝", "ملاحظات العميل", order.notes?.trim() || "لا توجد ملاحظات"),
    line("🕒", "تاريخ الطلب", formatDateTime(order.createdAt)),
  );

  return block(
    header("🛒 *طلب جديد وصل الآن!*"),
    "",
    `🔖 *رقم الطلب:* #${order.orderCode}`,
    `💵 *إجمالي الطلب:* ${formatMoney(order.total)}`,
    "",
    customer,
    "",
    products,
    "",
    delivery,
    "",
    `💵 *الإجمالي النهائي: ${formatMoney(order.total)}*`,
    "",
    footer("✅ الطلب محفوظ في لوحة الإدارة ويمكن متابعة حالته من هناك."),
  );
}

// ============================================================
// 2) طلب عرض منتج للبيع → يصل لواتساب المالك تلقائيًا
// ============================================================

export interface ListingSpecLine {
  label: string;
  value: string;
}

export interface ListingMessageData {
  /** كود الإعلان الداخلي (إن وُجد) */
  code?: string | null;
  title: string;
  categoryName?: string | null;
  condition?: string | null;
  description?: string | null;
  price: number;
  pricingType: string;
  quantity: number;
  unit: string;
  negotiable?: boolean;
  hasDelivery?: boolean;
  gov?: string | null;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imagesCount?: number;
  notes?: string | null;
  contactPhone?: string | null;
  sellerName: string;
  sellerPhone?: string | null;
  /** نُشر بدون حساب */
  isGuest?: boolean;
  status?: string | null;
  createdAt?: string | null;
  productLink?: string | null;
  imageLinks?: string[];
  // ---------- المواصفات الكاملة لما يُباع (كلها اختيارية) ----------
  weight?: number | null;
  weightUnit?: string | null;
  itemType?: string | null;
  brand?: string | null;
  model?: string | null;
  material?: string | null;
  color?: string | null;
  year?: number | null;
  dimensions?: string | null;
  specs?: ListingSpecLine[];
}

/** رسالة «أريد بيع هذا الشيء» التي يرسلها البائع لمالك المنصة */
export function generateListingWhatsAppMessage(data: ListingMessageData): string {
  const pricing = PRICING_TYPE_MAP[data.pricingType]?.label ?? "";
  const totalValue =
    data.pricingType === "PER_KG" || data.pricingType === "PER_PIECE"
      ? data.price * data.quantity
      : data.price;

  const seller = block(
    "👤 *بيانات البائع*",
    line("🔸", "الاسم", data.sellerName),
    line("📱", "رقم التواصل", data.contactPhone || data.sellerPhone || "لم يتركه البائع — رد على هذه المحادثة"),
    line("🧾", "نوع الحساب", data.isGuest ? "نشر بدون حساب (ضيف)" : null),
    line("📍", "الموقع", locationText(data.gov, data.area) || "لم يحدده البائع"),
    line("🗺️", "الموقع على الخريطة", mapsLink(data.latitude, data.longitude)),
  );

  const item = block(
    "📦 *تفاصيل المعروض للبيع*",
    line("🏷️", "المنتج", data.title),
    line("🗂️", "التصنيف", data.categoryName),
    line("✨", "الحالة", data.condition ? (CONDITION_MAP[data.condition] ?? data.condition) : null),
    line("⚖️", "الكمية", formatQuantity(data.quantity, data.unit)),
    line("💰", "السعر", `${formatUnitPrice(data.price, data.pricingType, data.unit)}${pricing ? ` (${pricing})` : ""}`),
    line("🧾", "القيمة التقديرية للكمية", formatMoney(totalValue)),
    line("🤝", "قابل للتفاوض", data.negotiable ? "نعم ✅" : "لا ❌"),
    line("🚚", "يوجد توصيل", data.hasDelivery ? "نعم ✅" : "لا ❌"),
    line("🖼️", "عدد الصور", data.imagesCount ? imagesLabel(data.imagesCount) : null),
  );

  // ---------- المواصفات الكاملة كما أدخلها البائع ----------
  const customSpecs = (data.specs ?? [])
    .filter((s) => s && String(s.label).trim() && String(s.value).trim())
    .map((s) => line("▫️", String(s.label).trim(), String(s.value).trim()));

  const specLines = [
    line("⚖️", "الوزن", data.weight != null ? `${formatNumber(data.weight)} ${data.weightUnit || "كجم"}` : null),
    line("🧩", "النوع", data.itemType),
    line("🧪", "الخامة", data.material),
    line("🏭", "الماركة", data.brand),
    line("🔧", "الموديل", data.model),
    line("🎨", "اللون", data.color),
    line("📅", "سنة الصنع", data.year != null ? String(data.year) : null),
    line("📐", "المقاسات", data.dimensions),
    ...customSpecs,
  ].filter(Boolean);

  const specifications = specLines.length
    ? block("🧾 *المواصفات الكاملة*", ...specLines)
    : null;

  const details = block(
    "📝 *الوصف والملاحظات*",
    data.description ? `🔹 ${truncate(data.description, 600)}` : null,
    line("📌", "ملاحظات إضافية", data.notes?.trim() || null),
  );

  const links = block(
    line("🔗", "رابط الإعلان", data.productLink),
    data.imageLinks?.length ? line("🖼️", "الصورة الرئيسية", data.imageLinks[0]) : null,
    line("🕒", "تاريخ الإرسال", data.createdAt ? formatDateTime(data.createdAt) : formatDateTime(new Date().toISOString())),
    line("📋", "حالة الإعلان", statusLabel(data.status)),
  );

  return block(
    header("🆕 *طلب جديد: عميل يريد بيع كراكيبه!*"),
    "",
    data.code ? `🔖 *كود الإعلان:* #${data.code}` : null,
    "",
    seller,
    "",
    item,
    specifications ? "" : null,
    specifications,
    "",
    details,
    "",
    links,
    "",
    footer("✅ الإعلان محفوظ في لوحة الإدارة بانتظار متابعتك."),
  );
}

function statusLabel(status?: string | null): string | null {
  if (!status) return null;
  if (status === "ACTIVE") return "منشور ومتاح للمشترين ✅";
  if (status === "PENDING") return "بانتظار مراجعة الإدارة ⏳";
  return status;
}

/** صياغة عربية سليمة لعدد الصور */
function imagesLabel(n: number): string {
  if (n === 1) return "صورة واحدة";
  if (n === 2) return "صورتان";
  if (n <= 10) return `${formatNumber(n)} صور`;
  return `${formatNumber(n)} صورة`;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

// ============================================================
// 3) استفسار العميل عن طلبه
// ============================================================

export function generateInquiryMessage(order: OrderWithItems, orderLink?: string): string {
  return block(
    header("❓ *استفسار عن طلب*"),
    "",
    line("🔖", "رقم الطلب", `#${order.orderCode}`),
    line("👤", "الاسم", order.customerName),
    line("📱", "الهاتف", order.customerPhone),
    line("💵", "قيمة الطلب", formatMoney(order.total)),
    line("🔗", "رابط الطلب", orderLink),
    "",
    "✍️ _اكتب استفسارك هنا وسيرد عليك فريق كوكب كراكيب في أقرب وقت._",
    "",
    footer(),
  );
}

// ============================================================
// 4) رسالة الإدارة للعميل (من لوحة الإدارة)
// ============================================================

export function generateCustomerMessage(order: OrderWithItems): string {
  const items = order.items.map((i) => `• ${i.title} (${formatQuantity(i.quantity, i.unit)})`).join("\n");
  return block(
    `🪐 *${SITE_NAME}*`,
    DIV,
    `مرحبًا ${order.customerName} 👋`,
    "",
    `نتواصل معك بخصوص طلبك رقم *#${order.orderCode}*:`,
    items,
    "",
    `💵 *الإجمالي:* ${formatMoney(order.total)}`,
    `🚚 *طريقة الاستلام:* ${DELIVERY_METHOD_MAP[order.deliveryMethod] ?? order.deliveryMethod}`,
    "",
    "يسعدنا تأكيد التفاصيل معك وتحديد الموعد المناسب ✅",
    DIV,
    `🪐 _${SITE_NAME} — ${SITE_TAGLINE}_`,
  );
}

// ============================================================
// 5) تواصل عام (زر واتساب العائم)
// ============================================================

export function generateContactMessage(pageUrl?: string): string {
  return block(
    `🪐 *${SITE_NAME}*`,
    DIV,
    "مرحبًا 👋",
    "أريد الاستفسار عن البيع أو الشراء على المنصة.",
    pageUrl ? `🔗 *الصفحة:* ${pageUrl}` : null,
    DIV,
    `🪐 _${SITE_TAGLINE}_`,
  );
}
