"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2, KeyRound, UserRound, ShieldCheck, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { toast } from "@/components/Toast";

function OwnerLoginForm() {
  const sp = useSearchParams();
  const requested = sp.get("next");
  const next = requested?.startsWith("/admin") ? requested : "/admin";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/owner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      // قد يعود الخادم بصفحة خطأ غير JSON (مثل 500 من الاستضافة) — نتجنب
      // رمي خطأ تحويل فيظل الزر عالقًا بلا رسالة مفهومة للمالك.
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "تعذر تسجيل الدخول، حاول مرة أخرى");
      if (!data?.user) throw new Error("استجابة غير متوقعة من الخادم");
      toast(`أهلًا بك ${data.user.name} — لوحة الإدارة جاهزة`, "success");
      // استبدال الصفحة (وليس تنقّلًا داخليًا) مهم هنا: لوحة الإدارة Server
      // Component وتقرأ كوكي الجلسة من الخادم، لذلك يجب أن يبدأ طلب جديد بعد
      // نجاح تسجيل الدخول. replace أيضًا يمنع رجوع زر المتصفح إلى نموذج الدخول.
      window.location.replace(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-planet-900 via-[#062a21] to-planet-950 p-5 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -top-20 end-0 h-52 w-52 rounded-full bg-gold-500/20 blur-3xl" />

        <div className="relative mb-7 text-center">
          <div className="mb-4 flex justify-center [&_.text-planet-900]:!text-white [&_.text-planet-500]:!text-tealx-400">
            <Logo size={48} withText={false} />
          </div>
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/20 text-gold-400 ring-1 ring-gold-400/40">
            <Lock size={26} />
          </span>
          <h1 className="text-xl font-black">دخول مالك المنصة</h1>
          <p className="mt-1.5 text-sm text-white/60">
            لوحة الإدارة: الطلبات، العملاء، الإعلانات والأسعار
          </p>
        </div>

        <form onSubmit={submit} className="relative space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-white/70">اسم الدخول (الهاتف أو البريد)</label>
            <div className="relative">
              <UserRound size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 pe-11 text-sm font-bold text-white outline-none transition-all placeholder:text-white/35 focus:border-gold-400/60 focus:bg-white/15"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="01013178718"
                dir="ltr"
                autoFocus
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-white/70">كلمة المرور</label>
            <div className="relative">
              <KeyRound size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 pe-11 text-sm font-bold text-white outline-none transition-all placeholder:text-white/35 focus:border-gold-400/60 focus:bg-white/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-gold-500 to-gold-600 px-6 py-4 text-base font-extrabold text-white shadow-lift transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? <Loader2 size={19} className="animate-spin" /> : <ShieldCheck size={18} />}
            دخول لوحة الإدارة
          </button>
        </form>

        <p className="relative mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold leading-6 text-white/45">
          <Lock size={12} /> هذه الصفحة للمالك فقط — العملاء لا يحتاجون أي تسجيل دخول للبيع أو الشراء
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 font-extrabold text-planet-600 hover:underline">
          <ArrowLeft size={15} /> العودة للموقع
        </Link>
        <span className="text-planet-300">·</span>
        <Link href="/login" className="font-bold text-planet-500 hover:underline">
          دخول العملاء
        </Link>
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto h-96 max-w-md" />}>
      <OwnerLoginForm />
    </Suspense>
  );
}
