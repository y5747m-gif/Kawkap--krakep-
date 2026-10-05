/** ثوابت المنصة: التصنيفات، المحافظات، حالات الطلب، أنواع الأسعار ... */

export const SITE_NAME = "كوكب كراكيب";
export const SITE_TAGLINE = "حوّل كراكيبك إلى قيمة";

/**
 * الإعداد المركزي الوحيد لرقم واتساب المالك.
 * القيمة الافتراضية: 01013178718 — وتُستخدم في الروابط بالصيغة الدولية +201013178718
 * يمكن تغييرها من لوحة الإدارة (Admin Settings) دون تعديل الكود.
 */
export const OWNER_WHATSAPP_NUMBER = "01013178718";

/** مفاتيح إعدادات الإدارة المخزنة في قاعدة البيانات */
export const SETTING_KEYS = {
  OWNER_WHATSAPP: "OWNER_WHATSAPP_NUMBER",
  REQUIRE_APPROVAL: "REQUIRE_APPROVAL", // "true" = النشر بعد موافقة الإدارة
  DEMO_MODE: "DEMO_MODE", // "true" = إظهار البيانات التجريبية (للتطوير فقط)
  /** خانات إضافية يضيفها المالك فتظهر لكل من يعرض شيئًا للبيع (JSON) */
  CUSTOM_FIELDS: "CUSTOM_LISTING_FIELDS",
} as const;

/** الحد الأقصى للخانات الإضافية التي يضيفها المالك */
export const MAX_OWNER_FIELDS = 10;

export interface CategoryDef {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

/** التصنيفات الستة عشر للمنصة */
export const CATEGORIES: CategoryDef[] = [
  { slug: "metals", name: "المعادن", icon: "layers", color: "#64748b" },
  { slug: "copper", name: "النحاس", icon: "coins", color: "#d97706" },
  { slug: "iron", name: "الحديد", icon: "anvil", color: "#71717a" },
  { slug: "aluminum", name: "الألومنيوم", icon: "package", color: "#94a3b8" },
  { slug: "plastic", name: "البلاستيك", icon: "cup-soda", color: "#0ea5e9" },
  { slug: "cardboard", name: "الكرتون", icon: "box", color: "#b45309" },
  { slug: "paper", name: "الورق", icon: "newspaper", color: "#6b7280" },
  { slug: "electronics", name: "الإلكترونيات", icon: "cpu", color: "#8b5cf6" },
  { slug: "appliances", name: "الأجهزة الكهربائية", icon: "washing-machine", color: "#0d9488" },
  { slug: "vintage", name: "الأجهزة القديمة", icon: "radio", color: "#a16207" },
  { slug: "used-oil", name: "الزيوت المستعملة", icon: "droplets", color: "#78716c" },
  { slug: "wood", name: "الأخشاب", icon: "tree-pine", color: "#16a34a" },
  { slug: "spare-parts", name: "قطع الغيار", icon: "wrench", color: "#dc2626" },
  { slug: "furniture", name: "أثاث", icon: "sofa", color: "#be185d" },
  { slug: "tools", name: "أدوات", icon: "hammer", color: "#ea580c" },
  { slug: "other", name: "أخرى", icon: "tags", color: "#1fa27c" },
];

export interface GovDef {
  name: string;
  lat: number;
  lng: number;
}

/** محافظات مصر مع الإحداثيات التقريبية (تُستخدم للخرائط والمسافات) */
export const GOVERNORATES: GovDef[] = [
  { name: "القاهرة", lat: 30.0444, lng: 31.2357 },
  { name: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { name: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { name: "القليوبية", lat: 30.3292, lng: 31.2167 },
  { name: "الدقهلية", lat: 31.0409, lng: 31.3785 },
  { name: "الشرقية", lat: 30.5877, lng: 31.502 },
  { name: "الغربية", lat: 30.8754, lng: 31.0335 },
  { name: "المنوفية", lat: 30.5972, lng: 30.9876 },
  { name: "البحيرة", lat: 30.8481, lng: 30.3436 },
  { name: "كفر الشيخ", lat: 31.1107, lng: 30.9388 },
  { name: "دمياط", lat: 31.4175, lng: 31.8144 },
  { name: "بورسعيد", lat: 31.2653, lng: 32.3019 },
  { name: "الإسماعيلية", lat: 30.5852, lng: 32.2654 },
  { name: "السويس", lat: 29.9668, lng: 32.5498 },
  { name: "شمال سيناء", lat: 31.1376, lng: 33.7984 },
  { name: "جنوب سيناء", lat: 27.9158, lng: 34.3299 },
  { name: "الفيوم", lat: 29.3084, lng: 30.8428 },
  { name: "بني سويف", lat: 29.0661, lng: 31.0994 },
  { name: "المنيا", lat: 28.1099, lng: 30.7503 },
  { name: "أسيوط", lat: 27.1809, lng: 31.1837 },
  { name: "سوهاج", lat: 26.5591, lng: 31.6957 },
  { name: "قنا", lat: 26.1551, lng: 32.716 },
  { name: "الأقصر", lat: 25.6872, lng: 32.6396 },
  { name: "أسوان", lat: 24.0889, lng: 32.8998 },
  { name: "البحر الأحمر", lat: 27.2579, lng: 33.8116 },
  { name: "مطروح", lat: 31.3543, lng: 27.2373 },
  { name: "الوادي الجديد", lat: 25.4574, lng: 30.5463 },
];

/** حالات الطلب التسع مع التسميات والألوان */
export const ORDER_STATUSES: {
  key: string;
  label: string;
  badge: string;
  dot: string;
}[] = [
  { key: "NEW", label: "طلب جديد", badge: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  { key: "REVIEWED", label: "تمت المراجعة", badge: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  { key: "CONTACTED", label: "تم التواصل", badge: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  { key: "PROCESSING", label: "قيد التنفيذ", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { key: "READY", label: "جاهز للاستلام", badge: "bg-teal-100 text-teal-800 border-teal-200", dot: "bg-teal-500" },
  { key: "DELIVERED", label: "تم التسليم", badge: "bg-cyan-100 text-cyan-800 border-cyan-200", dot: "bg-cyan-500" },
  { key: "COMPLETED", label: "مكتمل", badge: "bg-planet-100 text-planet-800 border-planet-200", dot: "bg-planet-500" },
  { key: "CANCELLED", label: "ملغي", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  { key: "REJECTED", label: "مرفوض", badge: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
];

export const ORDER_STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> =
  Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, s]));

/** ترتيب الحالات للخط الزمني */
export const ORDER_TIMELINE = ["NEW", "REVIEWED", "CONTACTED", "PROCESSING", "READY", "DELIVERED", "COMPLETED"];

export const PRICING_TYPES: { key: string; label: string; hint: string }[] = [
  { key: "FIXED", label: "سعر ثابت", hint: "سعر واحد للدفعة كلها" },
  { key: "PER_KG", label: "سعر لكل كيلو", hint: "يُحسب الإجمالي حسب الوزن" },
  { key: "PER_PIECE", label: "سعر لكل قطعة", hint: "يُحسب الإجمالي حسب عدد القطع" },
  { key: "BULK", label: "سعر للمجموعة", hint: "سعر لكل المجموعة معًا" },
];

export const PRICING_TYPE_MAP: Record<string, { label: string; hint: string }> =
  Object.fromEntries(PRICING_TYPES.map((p) => [p.key, p]));

export const CONDITIONS: { key: string; label: string }[] = [
  { key: "NEW", label: "جديد" },
  { key: "LIKE_NEW", label: "شبه جديد" },
  { key: "USED", label: "مستعمل" },
  { key: "OLD", label: "قديم" },
  { key: "SCRAP", label: "خردة / للتدوير" },
];

export const CONDITION_MAP: Record<string, string> = Object.fromEntries(
  CONDITIONS.map((c) => [c.key, c.label])
);

export const DELIVERY_METHODS: { key: string; label: string; desc: string }[] = [
  { key: "PICKUP", label: "استلام من موقع المنتج", desc: "تستلم المنتج من البائع مباشرة" },
  { key: "DELIVERY", label: "توصيل للعميل", desc: "يتفق الطرفان على التوصيل" },
  { key: "MEETUP", label: "الالتقاء في مكان وسيط", desc: "مكان قريب يناسب الطرفين" },
];

export const DELIVERY_METHOD_MAP: Record<string, string> = {
  PICKUP: "استلام من موقع المنتج",
  DELIVERY: "توصيل للعميل",
  MEETUP: "الالتقاء في مكان وسيط",
};

export const UNITS = ["قطعة", "كجم", "طن", "لتر", "متر", "كرتونة", "شيكارة", "باليت"];

/** وحدات الوزن المتاحة في مواصفات المنتج */
export const WEIGHT_UNITS = ["كجم", "جرام", "طن", "رطل"];

/**
 * مواصفات إضافية جاهزة يقترحها المعالج على البائع بضغطة واحدة —
 * ويمكنه كتابة أي مواصفة أخرى بنفسه (مفتاح + قيمة).
 */
export const SPEC_SUGGESTIONS = [
  "القدرة (وات)",
  "السعة",
  "الجهد (فولت)",
  "عدد القطع",
  "المقاس",
  "الطول",
  "العرض",
  "الارتفاع",
  "درجة النقاء",
  "سُمك المعدن",
  "هل يعمل؟",
  "يحتاج صيانة؟",
  "الضمان",
  "بلد الصنع",
  "مدة الاستخدام",
  "سبب البيع",
];

/** الحد الأقصى للمواصفات الإضافية الحرة في الإعلان الواحد */
export const MAX_CUSTOM_SPECS = 12;

/** اسم البائع الافتراضي عند النشر بدون حساب */
export const GUEST_SELLER_NAME = "بائع ضيف";

export const PRODUCT_STATUS_MAP: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "بانتظار المراجعة", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  ACTIVE: { label: "منشور", badge: "bg-planet-100 text-planet-800 border-planet-200" },
  PAUSED: { label: "موقوف", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  REJECTED: { label: "مرفوض", badge: "bg-rose-100 text-rose-800 border-rose-200" },
  HIDDEN: { label: "مخفي", badge: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  SOLD: { label: "مباع", badge: "bg-teal-100 text-teal-800 border-teal-200" },
};

export const MAX_PRODUCT_IMAGES = 8;

export const REPORT_REASONS = [
  "إعلان مخالف أو محتوى غير لائق",
  "سعر أو بيانات مضللة",
  "منتج مكرر",
  "لا يمكن الوصول للبائع",
  "سبب آخر",
];
