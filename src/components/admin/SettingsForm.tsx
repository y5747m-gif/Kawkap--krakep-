"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Phone, ShieldCheck, Eye, FlaskConical, Zap, ClipboardCheck,
  ListPlus, Plus, X, GripVertical,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { toast } from "@/components/Toast";
import { SETTING_KEYS, MAX_OWNER_FIELDS, SPEC_SUGGESTIONS } from "@/lib/constants";
import { toWhatsAppIntl } from "@/lib/validate";

/** نموذج إعدادات المنصة — OWNER_WHATSAPP_NUMBER في مكان واحد فقط */
export default function AdminSettingsForm({
  initial,
}: {
  initial: {
    ownerWhatsapp: string; requireApproval: boolean; demoMode: boolean;
    currentIntl: string; customFields: string[];
  };
}) {
  const router = useRouter();
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(initial.ownerWhatsapp);
  const [requireApproval, setRequireApproval] = useState(initial.requireApproval);
  const [demoMode, setDemoMode] = useState(initial.demoMode);
  const [customFields, setCustomFields] = useState<string[]>(initial.customFields);
  const [newField, setNewField] = useState("");
  const [saving, setSaving] = useState(false);

  function addField(raw?: string) {
    const label = (raw ?? newField).trim();
    if (!label) return;
    if (customFields.length >= MAX_OWNER_FIELDS) {
      toast(`الحد الأقصى ${MAX_OWNER_FIELDS} خانات`, "error");
      return;
    }
    if (customFields.some((f) => f === label)) {
      toast("هذه الخانة موجودة بالفعل", "error");
      return;
    }
    setCustomFields((prev) => [...prev, label.slice(0, 40)]);
    setNewField("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [SETTING_KEYS.OWNER_WHATSAPP]: ownerWhatsapp,
          [SETTING_KEYS.REQUIRE_APPROVAL]: requireApproval,
          [SETTING_KEYS.DEMO_MODE]: demoMode,
          [SETTING_KEYS.CUSTOM_FIELDS]: customFields,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("تم حفظ الإعدادات بنجاح", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* رقم واتساب المالك */}
      <div className="rounded-3xl border border-planet-100/60 bg-white p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-planet-950">
          <Phone size={18} className="text-planet-600" /> رقم واتساب المالك
        </h2>
        <p className="mb-4 text-xs font-bold leading-6 text-planet-500">
          تُوجَّه إليه كل رسائل الطلبات الجديدة تلقائيًا — الرقم لا يظهر في واجهة المستخدم العامة،
          ويُستخدم فقط داخل روابط واتساب (الإعداد المركزي الوحيد: OWNER_WHATSAPP_NUMBER)
        </p>
        <input
          className="field max-w-xs"
          value={ownerWhatsapp}
          onChange={(e) => setOwnerWhatsapp(e.target.value)}
          placeholder="01013178718"
          dir="ltr"
          inputMode="tel"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="chip border-planet-200 bg-planet-50 text-planet-700">
            الصيغة الدولية المستخدمة في الروابط: <span dir="ltr" className="font-black">+{toWhatsAppIntl(ownerWhatsapp) ?? "—"}</span>
          </span>
          <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700">
            <WhatsAppIcon size={12} /> كل طلب جديد يصل هنا
          </span>
        </div>
      </div>

      {/* الخانات الإضافية — يضيفها المالك فتظهر لكل من يعرض شيئًا للبيع */}
      <div className="rounded-3xl border border-planet-100/60 bg-white p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-planet-950">
          <ListPlus size={18} className="text-planet-600" /> خانات إضافية في صفحة البيع
        </h2>
        <p className="mb-4 text-xs font-bold leading-6 text-planet-500">
          أضف أي خانة تريدها (مثل «رقم الموتور» أو «عدد ساعات التشغيل») فتظهر تلقائيًا لكل من يعرض شيئًا للبيع
          داخل خطوة المواصفات — وتظهر قيمتها في صفحة المنتج وفي رسالة الواتساب
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field flex-1"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addField(); }
            }}
            placeholder="اسم الخانة الجديدة — مثال: رقم الموتور"
            maxLength={40}
          />
          <button
            type="button"
            onClick={() => addField()}
            disabled={!newField.trim() || customFields.length >= MAX_OWNER_FIELDS}
            className="btn-outline shrink-0 px-5 py-3 text-sm disabled:opacity-50"
          >
            <Plus size={16} /> أضف خانة
          </button>
        </div>

        {customFields.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {customFields.map((f, i) => (
              <li
                key={`${f}-${i}`}
                className="flex items-center gap-2 rounded-2xl border border-planet-100 bg-planet-50/50 px-3 py-2.5"
              >
                <GripVertical size={14} className="shrink-0 text-planet-300" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-planet-800 outline-none"
                  value={f}
                  maxLength={40}
                  onChange={(e) =>
                    setCustomFields((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                  }
                />
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-xl p-1.5 text-rose-500 transition-colors hover:bg-rose-50"
                  aria-label={`حذف خانة ${f}`}
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-planet-200 px-4 py-5 text-center text-xs font-bold text-planet-400">
            لا توجد خانات إضافية بعد — الخانات الأساسية (الوزن، النوع، الحالة...) تعمل دائمًا
          </p>
        )}

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold text-planet-500">اقتراحات سريعة:</p>
          <div className="flex flex-wrap gap-1.5">
            {SPEC_SUGGESTIONS.filter((sug) => !customFields.includes(sug)).slice(0, 10).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => addField(sug)}
                className="chip border-planet-200 bg-white text-[11px] text-planet-600 transition-colors hover:border-planet-400 hover:bg-planet-50"
              >
                <Plus size={11} /> {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* سياسة النشر */}
      <div className="rounded-3xl border border-planet-100/60 bg-white p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-planet-950">
          <ShieldCheck size={18} className="text-planet-600" /> المراجعة قبل النشر
        </h2>
        <p className="mb-4 text-xs font-bold leading-6 text-planet-500">
          اختر بين النشر الفوري لإعلانات العملاء أو مراجعتها من الإدارة قبل ظهورها
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRequireApproval(false)}
            className={`rounded-2xl border-2 p-4 text-start transition-all ${!requireApproval ? "border-planet-500 bg-planet-50 shadow-glow" : "border-planet-100"}`}
          >
            <Zap size={19} className={`mb-2 ${!requireApproval ? "text-planet-600" : "text-planet-300"}`} />
            <p className="text-sm font-extrabold text-planet-900">نشر فوري</p>
            <p className="mt-0.5 text-[11px] font-bold text-planet-500">تظهر الإعلانات مباشرة بدون مراجعة</p>
          </button>
          <button
            type="button"
            onClick={() => setRequireApproval(true)}
            className={`rounded-2xl border-2 p-4 text-start transition-all ${requireApproval ? "border-planet-500 bg-planet-50 shadow-glow" : "border-planet-100"}`}
          >
            <ClipboardCheck size={19} className={`mb-2 ${requireApproval ? "text-planet-600" : "text-planet-300"}`} />
            <p className="text-sm font-extrabold text-planet-900">النشر بعد موافقة الإدارة</p>
            <p className="mt-0.5 text-[11px] font-bold text-planet-500">كل إعلان جديد يظهر في قائمة المراجعة أولًا</p>
          </button>
        </div>
      </div>

      {/* البيانات التجريبية */}
      <div className="rounded-3xl border border-planet-100/60 bg-white p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-planet-950">
          <FlaskConical size={18} className="text-planet-600" /> البيانات التجريبية
        </h2>
        <p className="mb-4 text-xs font-bold leading-6 text-planet-500">
          بيانات العرض التجريبية للتطوير فقط — أوقفها في الإنتاج لتظهر المنتجات الحقيقية التي يضيفها المستخدمون فقط
        </p>
        <button
          type="button"
          onClick={() => setDemoMode((v) => !v)}
          className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
            demoMode ? "border-sky-400 bg-sky-50" : "border-planet-100"
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm font-extrabold text-planet-900">
            <Eye size={18} className={demoMode ? "text-sky-500" : "text-planet-300"} />
            {demoMode ? "وضع التطوير مُفعّل — البيانات التجريبية ظاهرة" : "وضع الإنتاج — البيانات التجريبية مخفية"}
          </span>
          <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${demoMode ? "bg-sky-500" : "bg-planet-200"}`}>
            <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${demoMode ? "start-[22px]" : "start-0.5"}`} />
          </span>
        </button>
      </div>

      <button type="submit" disabled={saving} className="btn-sell px-8 py-4 text-base">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        حفظ الإعدادات
      </button>
    </form>
  );
}
