"use client";

import { Sparkles } from "lucide-react";

/** إعادة تشغيل مقدمة الكوكب — تمسح علامة الجلسة وتعيد تشغيل الحركة فورًا */
export default function ReplayIntroButton() {
  function replay() {
    try {
      sessionStorage.removeItem("kk-intro-seen-v1");
    } catch {
      /* الجلسة غير متاحة */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.dispatchEvent(new Event("kk:replay-intro"));
  }

  return (
    <button
      type="button"
      onClick={replay}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-bold text-tealx-300 transition-colors hover:bg-white/15 hover:text-white"
    >
      <Sparkles size={12} /> شاهد مقدمة الكوكب
    </button>
  );
}
