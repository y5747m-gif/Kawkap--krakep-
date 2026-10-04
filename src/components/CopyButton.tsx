"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** زر نسخ — يعرض علامة صح عند النجاح */
export default function CopyButton({
  text, label = "نسخ", className = "btn-outline px-3 py-2 text-xs",
}: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copy} className={className}>
      {copied ? <Check size={14} className="text-planet-600" /> : <Copy size={14} />}
      {copied ? "تم النسخ" : label}
    </button>
  );
}
