"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open, onClose, title, children, wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-planet-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative z-10 max-h-[90dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-white/70 bg-white shadow-lift animate-fade-up sm:max-h-[85dvh] sm:rounded-3xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
      >
        {/* مقبض السحب — يوضح أن النافذة تُغلق بالسحب على الهاتف */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
          <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-planet-200 sm:hidden" />
          <div className="flex items-center justify-between gap-3 border-b border-planet-50 px-4 py-3 sm:px-5 sm:py-4">
            <h3 className="truncate text-base font-extrabold text-planet-900">{title}</h3>
            <button onClick={onClose} className="icon-btn shrink-0" aria-label="إغلاق">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-4 py-5 pb-[calc(1.25rem_+_env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-5">{children}</div>
      </div>
    </div>
  );
}
