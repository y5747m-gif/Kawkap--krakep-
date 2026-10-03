"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Camera, ClipboardList, MapPin, FileCheck2, Loader2,
  CheckCircle2, Package, Tag, FileText, Banknote, Scale, HandCoins, Truck, Phone,
  Star, Sparkles, PenLine,
} from "lucide-react";
import ImageUploader, { type UploadedImage } from "./ImageUploader";
import CategoryIcon from "./CategoryIcon";
import { MapPicker } from "@/components/leaflet/MapClient";
import { toast } from "./Toast";
import {
  CATEGORIES, CONDITIONS, PRICING_TYPES, UNITS, GOVERNORATES, MAX_PRODUCT_IMAGES,
} from "@/lib/constants";
import { formatMoney, formatQuantity, formatUnitPrice } from "@/lib/format";
import type { PricingType, ProductCondition } from "@/lib/types";

const STEPS = [
  { label: "ماذا تبيع؟", icon: Tag },
  { label: "الصور", icon: Camera },
  { label: "التفاصيل", icon: ClipboardList },
  { label: "الموقع", icon: MapPin },
  { label: "راجع إعلانك", icon: FileCheck2 },
];

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
  images?: { url: string }[];
}

/**
 * معالج إضافة/تعديل إعلان للبيع — 5 خطوات مع معاينة كاملة قبل النشر.
 * "اعرض شيئًا للبيع" هو أهم زر في التطبيق وهذه رحلته.
 */
export default function SellWizard({
  initial = {}, seller,
}: {
  initial?: SellWizardInitial;
  seller: { name: string; phone: string; gov: string | null; avatarUrl: string | null };
}) {
  const router = useRouter();
  const isEdit = !!initial.productId;

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
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? seller.phone);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [gov, setGov] = useState(initial.gov ?? seller.gov ?? "");
  const [area, setArea] = useState(initial.area ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.latitude != null && initial.longitude != null ? { lat: initial.latitude, lng: initial.longitude } : null
  );
  const [publishing, setPublishing] = useState(false);

  const perUnit = pricingType === "PER_KG" || pricingType === "PER_PIECE";

  function validateStep(i: number): string | null {
    if (i === 0) {
      if (title.trim().length < 3) return "اكتب اسم المنتج (3 أحرف على الأقل)";
      if (!categorySlug) return "اختر التصنيف";
    }
    if (i === 1) {
      if (images.length === 0) return "أضف صورة واحدة على الأقل";
      if (images.length > MAX_PRODUCT_IMAGES) return `الحد الأقصى ${MAX_PRODUCT_IMAGES} صور`;
    }
    if (i === 2) {
      if (description.trim().length < 10) return "اكتب وصفًا واضحًا (10 أحرف على الأقل)";
      if (!price || Number(price) <= 0) return "أدخل سعرًا صحيحًا";
      if (!quantity || Number(quantity) <= 0) return "أدخل كمية صحيحة";
      if (!/^01[0125]\d{8}$/.test(contactPhone.replace(/\D/g, "").replace(/^(20|0020)/, ""))) return "رقم التواصل غير صحيح";
    }
    if (i === 3) {
      if (!gov) return "اختر المحافظة";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return toast(err, "error");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
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
        contactPhone,
        notes: notes.trim() || null,
        images: images.map((i) => i.url),
      };

      const res = await fetch(isEdit ? `/api/products/${initial.productId}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر نشر الإعلان");

      if (isEdit) {
        toast("تم تحديث إعلانك بنجاح", "success");
        router.push(`/products/${initial.productId}`);
      } else if (data.status === "PENDING") {
        toast("تم إرسال إعلانك للمراجعة — سيظهر بعد موافقة الإدارة", "success");
        router.push("/account?tab=selling");
      } else {
        toast("تم نشر إعلانك بنجاح", "success");
        router.push(`/products/${data.product.id}`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
      setPublishing(false);
    }
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
              {i < STEPS.length - 1 && (
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

        {/* ================= الخطوة 3: التفاصيل ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-up">
            <div className="text-center">
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-white shadow-glow">
                <ClipboardList size={26} />
              </span>
              <h2 className="text-xl font-black text-planet-950">تفاصيل المنتج</h2>
              <p className="mt-1 text-sm text-planet-500">كل التفاصيل تساعد المشتري على اتخاذ قراره</p>
            </div>

            <div>
              <label className="field-label">الوصف <span className="text-rose-500">*</span></label>
              <textarea
                className="field min-h-28"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف المنتج: حالته، مناسبة لماذا، أي تفاصيل مهمة..."
                maxLength={3000}
              />
              <p className="mt-1 text-[11px] font-bold text-planet-400">{description.length} / 3000 حرف</p>
            </div>

            <div>
              <label className="field-label">الحالة</label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">رقم التواصل</label>
                <input
                  className="field"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  inputMode="tel"
                />
                <p className="mt-1 text-[11px] font-bold text-planet-400">يظهر للمشترين للتواصل معك مباشرة</p>
              </div>
              <div>
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
        )}

        {/* ================= الخطوة 4: الموقع ================= */}
        {step === 3 && (
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

        {/* ================= الخطوة 5: راجع إعلانك ================= */}
        {step === 4 && (
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
                  <img src={images[0].url} alt={title} className="h-full w-full object-cover" />
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
                <div className="flex items-center gap-2.5 border-t border-planet-50 pt-3.5">
                  {seller.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={seller.avatarUrl} alt={seller.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 text-sm font-black text-white">
                      {seller.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-planet-900">{seller.name}</p>
                    <p className="text-[11px] text-planet-500">بائع على كوكب كراكيب</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={back} className="btn-outline flex-1 px-6 py-4 text-base">
                <PenLine size={17} /> تعديل
              </button>
              <button type="button" onClick={publish} disabled={publishing} className="btn-sell flex-[2] px-6 py-4 text-base">
                {publishing ? <Loader2 size={19} className="animate-spin" /> : <Sparkles size={19} />}
                {isEdit ? "حفظ التعديلات" : "نشر الإعلان"}
              </button>
            </div>
          </div>
        )}

        {/* أزرار التنقل */}
        {step < 4 && (
          <div className="mt-7 flex items-center justify-between border-t border-planet-50 pt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="btn-outline px-5 py-3 text-sm disabled:invisible"
            >
              <ChevronRight size={16} /> السابق
            </button>
            <span className="text-xs font-bold text-planet-400">خطوة {step + 1} من 5</span>
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
