"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Phone, ShieldCheck, Eye, FlaskConical, Zap, ClipboardCheck } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { toast } from "@/components/Toast";
import { SETTING_KEYS } from "@/lib/constants";
import { toWhatsAppIntl } from "@/lib/validate";

/** نموذج إعدادات المنصة — OWNER_WHATSAPP_NUMBER في مكان واحد فقط */
export default function AdminSettingsForm({
  initial,
}: {
  initial: { ownerWhatsapp: string; requireApproval: boolean; demoMode: boolean; currentIntl: string };
}) {
  const router = useRouter();
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(initial.ownerWhatsapp);
  const [requireApproval, setRequireApproval] = useState(initial.requireApproval);
  const [demoMode, setDemoMode] = useState(initial.demoMode);
  const [saving, setSaving] = useState(false);

  const intlPreview = toWhatsAppIntl(ownerWhatsapp) ?? "رقم غير صالح";

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
