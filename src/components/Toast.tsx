"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";

type ToastType = "success" | "info" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let counter = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l([...items]));
}

export function toast(message: string, type: ToastType = "info") {
  const item = { id: ++counter, message, type };
  items = [...items, item];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== item.id);
    emit();
  }, 3500);
}

const ICONS = { success: CheckCircle2, info: Info, error: AlertCircle };
const COLORS = {
  success: "border-planet-200 bg-planet-50 text-planet-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lift backdrop-blur animate-fade-up ${COLORS[t.type]}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
