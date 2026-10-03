"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";

export default function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      window.dispatchEvent(new Event("kk:notification"));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={markAll} disabled={loading} className="btn-outline px-4 py-2.5 text-xs">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
      تعليم الكل كمقروء
    </button>
  );
}
