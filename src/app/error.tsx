"use client";

/**
 * صفحة الخطأ الداخلي (500) — تظهر بدل رسالة Next.js الجامدة
 * «Internal Server Error» عند أي استثناء غير متوقع في الصفحات.
 */
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Logo from "@/components/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // يُسجَّل في الطرفية للمطور ولا يظهر للمستخدم
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <Logo size={90} withText={false} />
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle size={28} />
        </span>
        <h1 className="mt-2 text-5xl font-black text-planet-950">500</h1>
        <p className="mt-2 text-base font-extrabold text-planet-800">
          حدث خطأ غير متوقع في الخادم
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-planet-500">
          نعتذر عن الإزعاج — جرّب إعادة المحاولة، وإن تكرر الخطأ تواصل مع
          الإدارة وأخبرنا بما كنت تفعله قبل ظهوره.
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-[11px] text-planet-400" dir="ltr">
            ref: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary px-6 py-3 text-sm">
          <RotateCcw size={16} /> إعادة المحاولة
        </button>
        <Link href="/" className="btn-outline px-6 py-3 text-sm">
          <Home size={16} /> الرئيسية
        </Link>
      </div>
    </div>
  );
}
