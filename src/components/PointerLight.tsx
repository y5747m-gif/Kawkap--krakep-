"use client";

import { useEffect } from "react";

/**
 * إضاءة تتبع المؤشر داخل البطاقات التي تحمل الصنف ‎.spot‎
 * تحدّث متغيرَي CSS فقط (بدون إعادة رسم React) وتعمل مع rAF للأداء.
 */
export default function PointerLight() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      el.style.setProperty("--kk-mx", `${x}px`);
      el.style.setProperty("--kk-my", `${y}px`);
      pending = null;
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.(".spot") as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pending = { el, x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
