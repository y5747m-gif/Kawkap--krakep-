"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Loader2, Phone, KeyRound, Mail, User as UserIcon, MapPin } from "lucide-react";
import Logo from "@/components/Logo";
import { toast } from "@/components/Toast";
import { GOVERNORATES } from "@/lib/constants";

function RegisterForm() {
  const sp = useSearchParams();
  const requestedNext = sp.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account";
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", gov: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`تم إنشاء حسابك — أهلًا ${data.user.name}!`, "success");
      // تنقّل كامل حتى يقرأ الـ Server Component كوكي الجلسة الجديدة فورًا؛
      // push + refresh كانا يتسابقان أحيانًا فيعيدان العميل لنموذج الدخول.
      window.location.assign(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-3xl p-5 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center"><Logo size={54} withText={false} /></div>
          <h1 className="text-xl font-black text-planet-950">انضم لكوكب كراكيب</h1>
          <p className="mt-1 text-sm text-planet-500">حساب واحد للبيع والشراء — بدون أي رسوم</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">الاسم <span className="text-rose-500">*</span></label>
            <div className="relative">
              <UserIcon size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input className="field pe-11" value={form.name} onChange={set("name")} placeholder="مثال: أحمد محمد" autoFocus required />
            </div>
          </div>
          <div>
            <label className="field-label">رقم الهاتف <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Phone size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input className="field pe-11" value={form.phone} onChange={set("phone")} placeholder="01xxxxxxxxx" inputMode="tel" dir="ltr" required />
            </div>
          </div>
          <div>
            <label className="field-label">البريد الإلكتروني (اختياري)</label>
            <div className="relative">
              <Mail size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input type="email" className="field pe-11" value={form.email} onChange={set("email")} placeholder="name@email.com" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="field-label">المحافظة</label>
            <div className="relative">
              <MapPin size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <select className="field pe-11" value={form.gov} onChange={set("gov")}>
                <option value="">اختر محافظتك</option>
                {GOVERNORATES.map((g) => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">كلمة المرور <span className="text-rose-500">*</span></label>
            <div className="relative">
              <KeyRound size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input type="password" className="field pe-11" value={form.password} onChange={set("password")} placeholder="6 أحرف على الأقل" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-sell w-full px-6 py-4 text-base">
            {loading ? <Loader2 size={19} className="animate-spin" /> : <UserPlus size={18} />}
            إنشاء الحساب
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-planet-600">
          عندك حساب بالفعل؟{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-planet-600 hover:underline">
            سجل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto h-96 max-w-md" />}>
      <RegisterForm />
    </Suspense>
  );
}
