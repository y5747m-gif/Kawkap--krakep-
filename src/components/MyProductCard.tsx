"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Pause, Play, PenLine, Loader2, PackageSearch } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { toast } from "./Toast";
import { formatQuantity, formatUnitPrice, formatNumber, timeAgo } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

/** كرت إعلاني في «أنا أبيع» — تعديل، إيقاف/تشغيل، حذف */
export default function MyProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function togglePause() {
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: product.status === "ACTIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(product.status === "ACTIVE" ? "تم إيقاف الإعلان" : "تم تنشيط الإعلان", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("تم حذف الإعلان", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="flex gap-4 p-4">
        <Link href={`/products/${product.id}`} className="relative shrink-0">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.title} className="h-24 w-28 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-24 w-28 items-center justify-center rounded-2xl bg-planet-100 text-planet-300">
              <PackageSearch size={26} />
            </span>
          )}
          {product.featured && (
            <span className="absolute start-1.5 top-1.5 rounded-full bg-gold-500 px-2 py-0.5 text-[9px] font-black text-white">
              مميز
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/products/${product.id}`} className="line-clamp-1 text-sm font-extrabold text-planet-950 hover:text-planet-600">
              {product.title}
            </Link>
            <StatusBadge status={product.status} type="product" />
          </div>
          <p className="mt-1 text-sm font-black text-planet-600">
            {formatUnitPrice(product.price, product.pricingType, product.unit)}
            <span className="ms-2 text-[11px] font-bold text-planet-400">
              {formatQuantity(product.quantity, product.unit)}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-3 text-[11px] font-bold text-planet-500">
            <span className="inline-flex items-center gap-1"><Eye size={12} /> {formatNumber(product.views)} مشاهدة</span>
            <span>{timeAgo(product.createdAt)}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/sell/${product.id}`} className="btn-outline px-3 py-2.5 text-xs sm:py-1.5">
              <PenLine size={12} /> تعديل
            </Link>
            {(product.status === "ACTIVE" || product.status === "PAUSED") && (
              <button onClick={togglePause} disabled={busy} className="btn-outline px-3 py-2.5 text-xs sm:py-1.5">
                {busy ? <Loader2 size={12} className="animate-spin" /> : product.status === "ACTIVE" ? <Pause size={12} /> : <Play size={12} />}
                {product.status === "ACTIVE" ? "إيقاف" : "تنشيط"}
              </button>
            )}
            {confirmDelete ? (
              <span className="flex items-center gap-1.5">
                <button onClick={remove} disabled={busy} className="chip border-rose-300 bg-rose-500 text-white">
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} تأكيد الحذف
                </button>
                <button onClick={() => setConfirmDelete(false)} className="chip border-planet-200 bg-white text-planet-600">
                  إلغاء
                </button>
              </span>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="chip border-rose-200 bg-rose-50 text-rose-600">
                <Trash2 size={12} /> حذف
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
