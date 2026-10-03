"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Flag, Loader2 } from "lucide-react";
import { toast } from "@/components/Toast";
import { timeAgo } from "@/lib/format";
import type { Report } from "@/lib/types";

export default function AdminReportsList({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState<string | null>(null);

  async function update(id: string, status: "RESOLVED" | "DISMISSED") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast(status === "RESOLVED" ? "تم تعليم البلاغ كمعالج" : "تم تجاهل البلاغ", "success");
    } catch {
      toast("حدث خطأ", "error");
    } finally {
      setBusy(null);
    }
  }

  if (!reports.length) {
    return (
      <p className="rounded-3xl border border-planet-100/60 bg-white px-4 py-12 text-center text-sm text-planet-400">
        لا توجد بلاغات — كل شيء تحت السيطرة
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className={`rounded-3xl border p-4 ${r.status === "OPEN" ? "border-rose-200 bg-rose-50/40" : "border-planet-100/60 bg-white opacity-75"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-extrabold text-planet-950">
              <Flag size={15} className={r.status === "OPEN" ? "text-rose-500" : "text-planet-300"} />
              {r.reason}
              {r.status !== "OPEN" && (
                <span className="chip border-planet-200 bg-planet-50 text-planet-600">
                  {r.status === "RESOLVED" ? "معالج" : "مُتجاهل"}
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-planet-400">{timeAgo(r.createdAt)}</span>
          </div>
          {r.details && <p className="mt-2 rounded-2xl bg-white/70 px-4 py-2.5 text-xs leading-6 text-planet-600">{r.details}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {r.productId && (
              <Link href={`/products/${r.productId}`} className="chip border-planet-200 bg-white text-planet-700">
                {r.productTitle ?? "المنتج"} — عرض الإعلان
              </Link>
            )}
            {r.reporterName && <span className="chip border-planet-100 bg-white text-planet-500">المُبلِّغ: {r.reporterName}</span>}
            {r.status === "OPEN" && (
              <span className="ms-auto flex gap-1.5">
                <button onClick={() => update(r.id, "RESOLVED")} disabled={busy === r.id} className="chip border-planet-300 bg-planet-500 text-white">
                  {busy === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} معالج
                </button>
                <button onClick={() => update(r.id, "DISMISSED")} disabled={busy === r.id} className="chip border-planet-200 bg-white text-planet-500">
                  <X size={12} /> تجاهل
                </button>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
