"use client";

import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

/**
 * زر البيع الرئيسي — أهم زر في التطبيق
 * Green Gradient + Glow + Rounded + أيقونة كاميرا + أنيميشن عند الضغط
 */
export default function SellButton({
  size = "md",
  label = "اعرض شيئًا للبيع",
  withIcon = true,
  full = false,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  withIcon?: boolean;
  full?: boolean;
}) {
  const router = useRouter();
  const dims =
    size === "sm"
      ? "px-4 py-2.5 text-sm rounded-2xl"
      : size === "lg"
        ? "px-8 py-4 text-lg rounded-3xl"
        : "px-6 py-3.5 text-base rounded-2xl";

  return (
    <button
      onClick={() => router.push("/sell")}
      className={`btn-sell group ${dims} ${full ? "w-full" : ""}`}
    >
      {withIcon && (
        <Camera size={size === "lg" ? 22 : 18} strokeWidth={2.4} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
      )}
      <span>{label}</span>
    </button>
  );
}
