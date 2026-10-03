"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2, Phone, Mail, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";
import { toast } from "@/components/Toast";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`أهلًا بك ${data.user.name}!`, "success");
      router.push(next);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-3xl p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center"><Logo size={54} withText={false} /></div>
          <h1 className="text-xl font-black text-planet-950">أهلًا بعودتك</h1>
          <p className="mt-1 text-sm text-planet-500">سجل الدخول لتتابع إعلاناتك وطلباتك</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">رقم الهاتف أو البريد الإلكتروني</label>
            <div className="relative">
              <Phone size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input
                className="field pe-11"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="01xxxxxxxxx"
                autoFocus
                required
              />
            </div>
          </div>
          <div>
            <label className="field-label">كلمة المرور</label>
            <div className="relative">
              <KeyRound size={16} className="absolute end-4 top-1/2 -translate-y-1/2 text-planet-400" />
              <input
                type="password"
                className="field pe-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-sell w-full px-6 py-4 text-base">
            {loading ? <Loader2 size={19} className="animate-spin" /> : <LogIn size={18} />}
            تسجيل الدخول
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-planet-600">
          ما عندك حساب؟{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-extrabold text-planet-600 hover:underline">
            أنشئ حسابك مجانًا
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs leading-6 text-planet-500">
        حساب واحد يكفي — تشتري وتبيع بنفس الحساب على كوكب كراكيب
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto h-96 max-w-md" />}>
      <LoginForm />
    </Suspense>
  );
}
