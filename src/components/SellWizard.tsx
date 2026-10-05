"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Camera, ClipboardList, MapPin, FileCheck2, Loader2,
  CheckCircle2, Package, Tag, Banknote, Scale, HandCoins, Truck, ListChecks,
  PenLine, Send, Plus, X, UserRound, Phone,
} from "lucide-react";
import ImageUploader, { type UploadedImage } from "./ImageUploader";
import CategoryIcon from "./CategoryIcon";
import WhatsAppIcon from "./WhatsAppIcon";
import { MapPicker } from "@/components/leaflet/MapClient";
import { toast } from "./Toast";
import {
  CATEGORIES, CONDITIONS, PRICING_TYPES, UNITS, GOVERNORATES, MAX_PRODUCT_IMAGES,
  WEIGHT_UNITS, SPEC_SUGGESTIONS, MAX_CUSTOM_SPECS, GUEST_SELLER_NAME,
} from "@/lib/constants";
import { formatMoney, formatQuantity, formatUnitPrice } from "@/lib/format";
import { listSpecRows } from "@/lib/specs";
import type { PricingType, ProductCondition, ProductSpec } from "@/lib/types";

const STEPS = [
  { label: "ماذا تبيع؟", icon: Tag },
  { label: "الصور", icon: Camera },
  { label: "المواصفات", icon: ListChecks },
  { label: "السعر والتفاصيل", icon: ClipboardList },
  { label: "الموقع", icon: MapPin },
  { label: "راجع إعلانك", icon: FileCheck2 },
];

const LAST_STEP = STEPS.length - 1;

export interface SellWizardInitial {
  productId?: string;
  title?: string;
  categorySlug?: string;
  description?: string;
  price?: number;
  pricingType?: PricingType;
  quantity?: number;
  unit?: string;
  condition?: ProductCondition;
  gov?: string;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasDelivery?: boolean;
  negotiable?: boolean;
  contactPhone?: string | null;
  notes?: string | null;
  sellerName?: string | null;
  // المواصفات الكاملة
  weight?: number | null;
  weightUnit?: string | null;
  itemType?: string | null;
  brand?: string | null;
  model?: string | null;
  material?: string | null;
  color?: string | null;
  year?: number | null;
  dimensions?: string | null;
  specs?: ProductSpec[];
  images?: { url: string }[];
}

interface SpecRow extends ProductSpec {
  id: string;
}

/**
 * معالج إضافة/تعديل إعلان للبيع — 6 خطوات مع معاينة كاملة قبل النشر.
 *
 * «اعرض شيئًا للبيع» هو أهم زر في التطبيق وهذه رحلته:
 *  - لا يحتاج تسجيل دخول إطلاقًا (الحساب اختياري تمامًا).
 *  - خطوة كاملة للمواصفات: الوزن، النوع، الخامة، الماركة، الموديل،
 *    اللون، سنة الصنع، المقاسات + أي مواصفات أخرى يكتبها البائع بنفسه.
 */
export default function SellWizard({
  initial = {}, seller, ownerFields = [], adminMode = false,
}: {
  initial?: SellWizardInitial;
  /** بيانات صاحب الحساب — null عندما ينشر زائر بدون تسجيل دخول */
  seller: { name: string; phone: string; gov: string | null; avatarUrl: string | null } | null;
  /** خانات إضافية عرّفها مالك المنصة من لوحة الإدارة فتظهر للجميع */
  ownerFields?: string[];
  /** وضع الإدارة: المالك يضيف منتجًا من اللوحة (بدون فتح واتساب) */
  adminMode?: boolean;
}) {
  const router = useRouter();
  const isEdit = !!initial.productId;
  const isGuest = !seller;

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(initial.title ?? "");
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug ?? "");
  const [images, setImages] = useState<UploadedImage[]>(
    (initial.images ?? []).map((img, i) => ({ id: `init-${i}`, url: img.url }))
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [condition, setCondition] = useState<ProductCondition>(initial.condition ?? "USED");
  const [pricingType, setPricingType] = useState<PricingType>(initial.pricingType ?? "FIXED");
  const [price, setPrice] = useState<string>(initial.price ? String(initial.price) : "");
  const [quantity, setQuantity] = useState<string>(initial.quantity ? String(initial.quantity) : "1");
  const [unit, setUnit] = useState(initial.unit ?? "كجم");
  const [negotiable, setNegotiable] = useState(initial.negotiable ?? false);
  const [hasDelivery, setHasDelivery] = useState(initial.hasDelivery ?? false);
  const [sellerName, setSellerName] = useState(initial.sellerName ?? "");
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? seller?.phone ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [gov, setGov] = useState(initial.gov ?? seller?.gov ?? "");
  const [area, setArea] = useState(initial.area ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.latitude != null && initial.longitude != null ? { lat: initial.latitude, lng: initial.longitude } : null
  );

  // ---------- المواصفات (كلها اختيارية) ----------
  const [weight, setWeight] = useState(initial.weight != null ? String(initial.weight) : "");
  const [weightUnit, setWeightUnit] = useState(initial.weightUnit ?? "كجم");
  const [itemType, setItemType] = useState(initial.itemType ?? "");
  const [material, setMaterial] = useState(initial.material ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [model, setModel] = useState(initial.model ?? "");
  const [color, setColor] = useState(initial.color ?? "");
  const [year, setYear] = useState(initial.year != null ? String(initial.year) : "");
  const [dimensions, setDimensions] = useState(initial.dimensions ?? "");
  /** قيم الخانات التي أضافها المالك — تُحفظ كمواصفات عادية باسم الخانة */
  const [ownerValues, setOwnerValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of ownerFields) out[f] = (initial.specs ?? []).find((s) => s.label === f)?.value ?? "";
    return out;
  });
  const [customSpecs, setCustomSpecs] = useState<SpecRow[]>(
    (initial.specs ?? [])
      .filter((s) => !ownerFields.includes(s.label))
      .map((s, i) => ({ id: `spec-${i}`, label: s.label, value: s.value }))
  );

  const [publishing, setPublishing] = useState(false);
  /** يُملأ فقط عندما يحجب المتصفح فتح واتساب تلقائيًا بعد نشر الإعلان */
  const [published, setPublished] = useState<{ whatsappUrl: string; nextUrl: string } | null>(null);
  /** نافذة واتساب تُفتح لحظة الضغط (داخل حدث المستخدم) حتى لا يحجبها المتصفح */
  const waWindow = useRef<Window | null>(null);

  const perUnit = pricingType === "PER_KG" || pricingType === "PER_PIECE";
  const displayName = (seller?.name || sellerName.trim() || GUEST_SELLER_NAME);

  const specsPayload = {
    weight: weight.trim() ? Number(weight) : null,
    weightUnit: weight.trim() ? weightUnit : null,
    itemType: itemType.trim() || null,
    material: material.trim() || null,
    brand: brand.trim() || null,
    model: model.trim() || null,
    color: color.trim() || null,
    year: year.trim() ? Number(year) : null,
    dimensions: dimensions.trim() || null,
    specs: [
      ...ownerFields.map((f) => ({ label: f, value: (ownerValues[f] ?? "").trim() })),
      ...customSpecs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => !ownerFields.includes(s.label)),
    ].filter((s) => s.label && s.value),
  };
  const previewSpecs = listSpecRows(specsPayload);

  // ---------- المواصفات الحرة ----------
  function addSpec(label = "") {
    if (customSpecs.length >= MAX_CUSTOM_SPECS) {
      return toast(`الحد الأقصى ${MAX_CUSTOM_SPECS} مواصفات إضافية`, "info");
    }
    setCustomSpecs((rows) => [...rows, { id: `spec-${Date.now()}-${rows.length}`, label, value: "" }]);
  }

  function updateSpec(id: string, patch: Partial<ProductSpec>) {
    setCustomSpecs((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeSpec(id: string) {
    setCustomSpecs((rows) => rows.filter((r) => r.id !== id));
  }

  function validateStep(i: number): string | null {
    if (i === 0) {
      if (title.trim().length < 3) return "اكتب اسم المنتج (3 أحرف على الأقل)";
      if (!categorySlug) return "اختر التصنيف";
    }
    if (i === 1) {
      if (images.length === 0) return "أضف صورة واحدة على الأقل";
      if (images.length > MAX_PRODUCT_IMAGES) return `الحد الأقصى ${MAX_PRODUCT_IMAGES} صور`;
    }
    // الخطوة 2 (المواصفات) اختيارية بالكامل — لا تحقق فيها
    if (i === 3) {
      if (description.trim().length < 10) return "اكتب وصفًا واضحًا (10 أحرف على الأقل)";
      if (!price || Number(price) <= 0) return "أدخل سعرًا صحيحًا";
      if (!quantity || Number(quantity) <= 0) return "أدخل كمية صحيحة";
      // رقم التواصل اختياري — نتحقق من شكله فقط إذا كتبه البائع
      const digits = contactPhone.replace(/\D/g, "").replace(/^(0020|20)/, "0");
      if (contactPhone.trim() && !/^01[0125]\d{8}$/.test(digits)) {
        return "رقم التواصل غير صحيح — اتركه فارغًا أو اكتبه بالشكل 01xxxxxxxxx";
      }
    }
    if (i === 4) {
      if (!gov) return "اختر المحافظة";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return toast(err, "error");
    setStep((s) => Math.min(s + 1, LAST_STEP));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function locateMe() {
    if (!("geolocation" in navigator)) return toast("المتصفح لا يدعم تحديد الموقع", "error");
    toast("جارٍ تحديد موقعك...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast("تم تحديد موقعك", "success");
      },
      () => toast("تعذر تحديد الموقع — اختر الموقع يدويًا", "error"),
      { timeout: 8000 }
    );
  }

  async function publish() {
    // فتح نافذة واتساب مبكرًا (ضمن نقرة المستخدم) لتفادي حاجب النوافذ المنبثقة
    if (!isEdit && !adminMode && typeof window !== "undefined") {
      waWindow.current = window.open("", "_blank");
    }

    setPublishing(true);
    try {
      const payload = {
        title: title.trim(),
        categorySlug,
        description: description.trim(),
        price: Number(price),
        pricingType,
        quantity: Number(quantity),
        unit,
        condition,
        gov,
        area: area.trim() || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        hasDelivery,
        negotiable,
        contactPhone: contactPhone.trim() || null,
        notes: notes.trim() || null,
        sellerName: sellerName.trim() || null,
        ...specsPayload,
        images: images.map((i) => i.url),
      };

      const res = await fetch(isEdit ? `/api/products/${initial.productId}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        waWindow.current?.close();
        waWindow.current = null;
        throw new Error(data.error || "تعذر إرسال الطلب");
      }

      if (isEdit) {
        toast("تم تحديث إعلانك بنجاح", "success");
        router.push(`/products/${initial.productId}`);
        return;
      }

      // ------- المالك يضيف من اللوحة: نشر مباشر بلا واتساب -------
      if (adminMode) {
        toast("تم نشر المنتج على الموقع", "success");
        router.push("/admin/products");
        router.refresh();
        return;
      }

      // ------- الطلب يصل تلقائيًا لواتساب مالك المنصة -------
      // بعد الإرسال ينتقل العميل إلى سجل بيع للعرض فقط بدل فتح واجهة
      // التعديل أو إعادته إلى معالج إضافة إعلان جديد.
      const nextUrl = `/sales?submitted=${encodeURIComponent(data.product.id)}`;

      let whatsappOpened = true;
      if (data.whatsappUrl) {
        if (waWindow.current && !waWindow.current.closed) {
          waWindow.current.location.href = data.whatsappUrl;
        } else {
          // قد يمنع حاجب النوافذ المنبثقة الفتح تمامًا — وكان الإعلان حينها
          // يُنشر بلا أن يصل إشعار للإدارة وبلا أن يفهم البائع ما حدث.
          whatsappOpened = !!window.open(data.whatsappUrl, "_blank", "noopener");
        }
      }

      if (!whatsappOpened && data.whatsappUrl) {
        // نعرض للبائع رابطًا ظاهرًا بدل الفتح التلقائي المحجوب
        setPublished({ whatsappUrl: data.whatsappUrl as string, nextUrl });
        setPublishing(false);
        return;
      }

      toast(
        data.status === "PENDING"
          ? "تم إرسال طلبك للإدارة عبر واتساب — سيظهر الإعلان بعد المراجعة"
          : "تم نشر إعلانك ووصل الطلب لإدارة كوكب كراكيب على واتساب",
        "success"
      );
      router.push(nextUrl);
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
      setPublishing(false);
    }
  }

  // نُشر الإعلان لكن المتصفح منع فتح واتساب — نعرض الرابط بوضوح بدل الصمت
  if (published) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-planet-100 bg-white p-6 text-center shadow-soft">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-planet-50 text-planet-600">
          <CheckCircle2 size={32} />
        </span>
        <h2 className="text-xl font-black text-planet-950">تم نشر إعلانك</h2>
        <p className="text-sm leading-7 text-planet-600">
          منع متصفحك فتح واتساب تلقائيًا. اضغط الزر بالأسفل لإرسال تفاصيل الإعلان
          لإدارة كوكب كراكيب — إعلانك محفوظ بالفعل في كل الأحوال.
        </p>
        <a
          href={published.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp w-full px-6 py-3.5 text-base"
        >
          <WhatsAppIcon size={19} /> أبلغ الإدارة على واتساب
        </a>
        <button
          type="button"
          onClick={() => router.push(published.nextUrl)}
          className="btn-outline w-full px-6 py-3 text-sm"
        >
          متابعة إلى الإعلان
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* شريط الخطوات */}
      <div className="glass mb-6 flex items-center justify-between rounded-3xl p-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                    done
                      ? "bg-planet-500 text-white"
                      : active
                        ? "bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow"
                        : "bg-planet-50 text-planet-400"
                  }`}
                >
                  {done ? <CheckCircle2 size={19} /> : <Icon size={18} />}
                </span>
                <span className={`hidden text-[10px] font-extrabold sm:block ${active ? "text-planet-800" : "text-planet-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < LAST_STEP && (
                <div className={`mx-1 h-1 flex-1 rounded-full ${i < step ? "bg-planet-500" : "bg-planet-100"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-5 sm:p-7">
        {/* ================= الخطوة 1: ماذا تريد أن تبيع؟ ================= */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <Tag size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">ماذا تريد أن تبيع؟</h2>
              <p className="mt-1 text-sm text-planet-500">اكتب اسم الشيء واختر تصنيفه المناسب</p>
            </div>

            <div>
              <label className="field-label">اسم المنتج <span className="text-rose-500">*</span></label>
              <input
                className="field text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: خردة نحاس"
                maxLength={120}
                autoFocus
              />
            </div>

            <div>
              <label className="field-label">التصنيف <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const selected = categorySlug === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategorySlug(c.slug)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all ${
                        selected ? "border-planet-500 bg-planet-50 shadow-glow" : "border-planet-100 bg-white hover:border-planet-300"
                      }`}
                      style={selected ? { borderColor: c.color } : undefined}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${c.color}1c`, color: c.color }}
                      >
                        <CategoryIcon icon={c.icon} size={18} />
                      </span>
                      <span className={`text-[11px] font-extrabold ${selected ? "text-planet-800" : "text-planet-600"}`}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= الخطوة 2: الصور ================= */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <Camera size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">صور المنتج</h2>
              <p className="mt-1 text-sm text-planet-500">حتى {MAX_PRODUCT_IMAGES} صور — الأولى تكون الرئيسية</p>
            </div>
            <ImageUploader images={images} onChange={setImages} />
          </div>
        )}

        {/* ================= الخطوة 3: المواصفات الكاملة ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <ListChecks size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">مواصفات ما تبيعه</h2>
              <p className="mt-1 text-sm text-planet-500">
                كم وزنه؟ ما نوعه؟ خامته؟ ماركته؟ — كل الحقول اختيارية، املأ ما تعرفه فقط
              </p>
            </div>

            <div>
              <label className="field-label">حالة المنتج</label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCondition(c.key as ProductCondition)}
                    className={`chip px-4 py-2 text-sm ${
                      condition === c.key
                        ? "border-planet-500 bg-planet-50 text-planet-800 shadow-glow"
                        : "border-planet-100 bg-white text-planet-600"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">الوزن</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="field"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="مثال: 25"
                    min={0}
                    step="any"
                    inputMode="decimal"
                  />
                  <select className="field w-28" value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
                    {WEIGHT_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] font-bold text-planet-400">الوزن التقريبي يكفي</p>
              </div>
              <div>
                <label className="field-label">النوع</label>
                <input
                  className="field"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  placeholder="مثال: نحاس أحمر / غسالة أوتوماتيك"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="field-label">الخامة</label>
                <input
                  className="field"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="مثال: ألومنيوم / خشب زان / بلاستيك"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="field-label">الماركة</label>
                <input
                  className="field"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="مثال: توشيبا"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="field-label">الموديل</label>
                <input
                  className="field"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="مثال: AW-9020"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="field-label">اللون</label>
                <input
                  className="field"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="مثال: أبيض"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="field-label">سنة الصنع</label>
                <input
                  type="number"
                  className="field"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="مثال: 2015"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="field-label">المقاسات / الأبعاد</label>
                <input
                  className="field"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="مثال: 120 × 60 × 75 سم"
                  maxLength={80}
                />
              </div>
            </div>

            {/* ---------- خانات أضافها مالك المنصة ---------- */}
            {ownerFields.length > 0 && (
              <div className="rounded-2xl border border-gold-300/50 bg-gold-50/60 p-4">
                <p className="mb-0.5 text-sm font-extrabold text-planet-900">خانات إضافية من إدارة الموقع</p>
                <p className="mb-3 text-[11px] font-bold text-planet-500">
                  املأ ما ينطبق على شيئك — كلها اختيارية
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ownerFields.map((f) => (
                    <div key={f}>
                      <label className="field-label">{f}</label>
                      <input
                        className="field"
                        value={ownerValues[f] ?? ""}
                        onChange={(e) => setOwnerValues((prev) => ({ ...prev, [f]: e.target.value }))}
                        placeholder={f}
                        maxLength={120}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- مواصفات إضافية يكتبها البائع ---------- */}
            <div className="rounded-2xl border-2 border-dashed border-planet-200 bg-planet-50/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-planet-900">مواصفات إضافية</p>
                  <p className="text-[11px] font-bold text-planet-500">
                    أضف أي تفصيلة أخرى عن شيئك: القدرة، السعة، عدد القطع، هل يعمل؟ ... وهكذا
                  </p>
                </div>
                <button type="button" onClick={() => addSpec()} className="btn-outline px-4 py-2 text-xs">
                  <Plus size={14} /> أضف مواصفة
                </button>
              </div>

              {customSpecs.length > 0 && (
                <div className="mb-3 space-y-2.5">
                  {customSpecs.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <input
                        className="field w-2/5"
                        value={row.label}
                        onChange={(e) => updateSpec(row.id, { label: e.target.value })}
                        placeholder="اسم المواصفة"
                        maxLength={40}
                      />
                      <input
                        className="field flex-1"
                        value={row.value}
                        onChange={(e) => updateSpec(row.id, { value: e.target.value })}
                        placeholder="القيمة"
                        maxLength={120}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(row.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100"
                        aria-label="حذف المواصفة"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {SPEC_SUGGESTIONS.filter((s) => !customSpecs.some((r) => r.label === s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSpec(s)}
                    className="chip border-planet-200 bg-white px-3 py-1.5 text-[11px] text-planet-600 hover:border-planet-400"
                  >
                    <Plus size={11} /> {s}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-2xl border border-tealx-300/40 bg-tealx-500/10 px-4 py-3 text-xs font-bold leading-6 text-tealx-700">
              كلما كتبت مواصفات أدق، وصل إعلانك لمشترين أكثر جدية — وتصل المواصفات كاملة لإدارة كوكب كراكيب على واتساب.
            </p>
          </div>
        )}

        {/* ================= الخطوة 4: السعر والتفاصيل ================= */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <ClipboardList size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">السعر والتفاصيل</h2>
              <p className="mt-1 text-sm text-planet-500">كل التفاصيل تساعد المشتري على اتخاذ قراره</p>
            </div>

            <div>
              <label className="field-label">الوصف <span className="text-rose-500">*</span></label>
              <textarea
                className="field min-h-28"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف المنتج: حالته، مناسب لماذا، أي تفاصيل مهمة..."
                maxLength={3000}
              />
              <p className="mt-1 text-[11px] font-bold text-planet-400">{description.length} / 3000 حرف</p>
            </div>

            <div>
              <label className="field-label">نوع السعر</label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRICING_TYPES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPricingType(p.key as PricingType)}
                    className={`rounded-2xl border-2 p-3 text-center transition-all ${
                      pricingType === p.key ? "border-planet-500 bg-planet-50 shadow-glow" : "border-planet-100 bg-white hover:border-planet-300"
                    }`}
                  >
                    <Banknote size={18} className={`mx-auto mb-1.5 ${pricingType === p.key ? "text-planet-600" : "text-planet-400"}`} />
                    <span className={`block text-xs font-extrabold ${pricingType === p.key ? "text-planet-800" : "text-planet-600"}`}>{p.label}</span>
                    <span className="mt-0.5 block text-[10px] text-planet-400">{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">
                  السعر {perUnit ? "(لكل وحدة)" : ""} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="field pe-14"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={perUnit ? "34" : "850"}
                    min={0}
                  />
                  <span className="absolute inset-y-0 end-4 flex items-center text-sm font-bold text-planet-500">جنيه</span>
                </div>
                {perUnit && price && Number(quantity) > 0 && (
                  <p className="mt-1.5 text-xs font-extrabold text-tealx-600">
                    = {formatMoney(Number(price) * Number(quantity))} للكمية الكاملة
                  </p>
                )}
              </div>
              <div>
                <label className="field-label">الكمية <span className="text-rose-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="field"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="25"
                    min={0}
                  />
                  <select className="field w-32" value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setNegotiable((v) => !v)}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  negotiable ? "border-tealx-500 bg-tealx-500/10" : "border-planet-100 bg-white"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-planet-800">
                  <HandCoins size={18} className={negotiable ? "text-tealx-600" : "text-planet-400"} />
                  السعر قابل للتفاوض
                </span>
                <Toggle on={negotiable} />
              </button>
              <button
                type="button"
                onClick={() => setHasDelivery((v) => !v)}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  hasDelivery ? "border-planet-500 bg-planet-50" : "border-planet-100 bg-white"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-planet-800">
                  <Truck size={18} className={hasDelivery ? "text-planet-600" : "text-planet-400"} />
                  يوجد توصيل
                </span>
                <Toggle on={hasDelivery} />
              </button>
            </div>

            {/* ---------- بيانات التواصل: كلها اختيارية ---------- */}
            <div className="rounded-2xl border border-planet-100 bg-planet-50/60 p-4">
              <p className="mb-3 text-sm font-extrabold text-planet-900">بيانات التواصل (اختيارية)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {isGuest && (
                  <div>
                    <label className="field-label">اسمك</label>
                    <div className="relative">
                      <UserRound size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
                      <input
                        className="field pe-11"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="مثال: أحمد (اختياري)"
                        maxLength={60}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-planet-400">لو تركته فارغًا سيظهر الإعلان باسم «بائع ضيف»</p>
                  </div>
                )}
                <div>
                  <label className="field-label">رقم التواصل</label>
                  <div className="relative">
                    <Phone size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
                    <input
                      className="field pe-11"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="01xxxxxxxxx (اختياري)"
                      dir="ltr"
                      inputMode="tel"
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-planet-400">
                    اختياري — بدونه يتواصل معك فريق كوكب كراكيب من واتساب الذي ترسل منه
                  </p>
                </div>
                <div className={isGuest ? "sm:col-span-2" : ""}>
                  <label className="field-label">ملاحظات إضافية</label>
                  <input
                    className="field"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: متاح للاستلام بعد 5 مساءً"
                    maxLength={600}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= الخطوة 5: الموقع ================= */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <MapPin size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">موقع المنتج</h2>
              <p className="mt-1 text-sm text-planet-500">أين يوجد الشيء المعروض؟</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">المحافظة <span className="text-rose-500">*</span></label>
                <select className="field" value={gov} onChange={(e) => setGov(e.target.value)}>
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">المنطقة</label>
                <input className="field" value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: مدينة نصر" />
              </div>
            </div>

            <button type="button" onClick={locateMe} className={`chip px-4 py-2.5 text-sm ${coords ? "border-planet-400 bg-planet-50 text-planet-700" : "border-tealx-300 bg-tealx-500/10 text-tealx-700"}`}>
              <MapPin size={15} /> {coords ? "تم تحديد موقعك على الخريطة" : "استخدام موقعي الحالي"}
            </button>

            <MapPicker
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              gov={gov}
              onChange={(lat, lng) => setCoords({ lat, lng })}
            />

            <p className="rounded-2xl border border-gold-400/30 bg-gold-500/10 px-4 py-3 text-xs font-bold leading-6 text-gold-600">
              خصوصيتك مهمة: لن يُعرض عنوان دقيق للعامة — فقط المحافظة والمنطقة والمسافة التقريبية للمهتمين.
            </p>
          </div>
        )}

        {/* ================= الخطوة 6: راجع إعلانك ================= */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lift">
                <FileCheck2 size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">راجع إعلانك</h2>
              <p className="mt-1 text-sm text-planet-500">هكذا سيظهر إعلانك للمشترين</p>
            </div>

            {/* بطاقة المعاينة */}
            <div className="overflow-hidden rounded-3xl border border-planet-100 bg-white shadow-lift">
              <div className="relative aspect-[16/9] bg-planet-50">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0].url} alt={title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full items-center justify-center text-planet-300"><Package size={44} /></div>
                )}
                {images.length > 1 && (
                  <span className="absolute bottom-3 end-3 rounded-full bg-planet-950/70 px-3 py-1 text-xs font-bold text-white">
                    +{images.length - 1} صور
                  </span>
                )}
              </div>
              <div className="space-y-3 p-5">
                <h3 className="text-lg font-black text-planet-950">{title || "اسم المنتج"}</h3>
                <p className="text-2xl font-black text-planet-600">
                  {formatUnitPrice(Number(price) || 0, pricingType, unit)}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="chip border-planet-100 bg-planet-50 text-planet-700">
                    <Scale size={12} /> {formatQuantity(Number(quantity) || 0, unit)}
                  </span>
                  <span className="chip border-planet-100 bg-planet-50 text-planet-700">
                    <MapPin size={12} /> {gov}{area ? ` — ${area}` : ""}
                  </span>
                  {negotiable && <span className="chip border-tealx-300 bg-tealx-500/10 text-tealx-600">قابل للتفاوض</span>}
                  {hasDelivery && <span className="chip border-planet-200 bg-planet-50 text-planet-700"><Truck size={12} /> توصيل</span>}
                </div>
                <p className="line-clamp-3 text-sm leading-7 text-planet-700">{description}</p>

                {/* المواصفات كما ستظهر في صفحة الإعلان */}
                {previewSpecs.length > 0 && (
                  <div className="rounded-2xl border border-planet-100 bg-planet-50/60 p-3.5">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-planet-800">
                      <ListChecks size={14} className="text-planet-500" /> المواصفات
                    </p>
                    <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {previewSpecs.map((s) => (
                        <div key={`${s.label}-${s.value}`} className="flex items-baseline justify-between gap-3 text-xs">
                          <dt className="font-bold text-planet-500">{s.label}</dt>
                          <dd className="truncate font-extrabold text-planet-900">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <div className="flex items-center gap-2.5 border-t border-planet-50 pt-3.5">
                  {seller?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={seller.avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 text-sm font-black text-white">
                      {displayName.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-planet-900">{displayName}</p>
                    <p className="text-[11px] text-planet-500">
                      {isGuest ? "بائع بدون حساب على كوكب كراكيب" : "بائع على كوكب كراكيب"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={back} className="btn-outline flex-1 px-6 py-4 text-base">
                <PenLine size={17} /> تعديل
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={publishing}
                className={`flex-[2] px-6 py-4 text-base ${isEdit || adminMode ? "btn-sell" : "btn-whatsapp glow-pulse"}`}
              >
                {publishing ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : isEdit || adminMode ? (
                  <Send size={19} />
                ) : (
                  <WhatsAppIcon size={20} />
                )}
                {isEdit ? "حفظ التعديلات" : adminMode ? "نشر المنتج على الموقع" : "إرسال الطلب عبر واتساب"}
              </button>
            </div>

            {!isEdit && !adminMode && (
              <p className="flex items-start justify-center gap-2 rounded-2xl border border-planet-100 bg-planet-50/70 px-4 py-3 text-center text-[11px] font-bold leading-6 text-planet-600">
                <WhatsAppIcon size={14} className="mt-0.5 shrink-0 text-[#25D366]" />
                بضغطك «إرسال الطلب» يُحفظ إعلانك في النظام فورًا — بدون أي تسجيل — ثم يُفتح واتساب برسالة
                منسّقة بكل مواصفات ما تبيعه تصل مباشرة لإدارة كوكب كراكيب لمتابعتها معك.
              </p>
            )}
          </div>
        )}

        {/* أزرار التنقل */}
        {step < LAST_STEP && (
          <div className="mt-7 flex items-center justify-between border-t border-planet-50 pt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="btn-outline px-5 py-3 text-sm disabled:invisible"
            >
              <ChevronRight size={16} /> السابق
            </button>
            <span className="text-xs font-bold text-planet-400">خطوة {step + 1} من {STEPS.length}</span>
            <button type="button" onClick={next} className="btn-primary px-6 py-3 text-sm">
              التالي <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-planet-500" : "bg-planet-200"
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`}
      />
    </span>
  );
}
