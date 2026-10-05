"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Eye, Trash2, Pause, Play, PenLine, Loader2, Check, X, EyeOff, Star, StarOff,
  Plus, Tag, Save,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "@/components/Toast";
import { formatUnitPrice, formatNumber, formatDate } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

const STATUS_TABS = [
  { key: "ALL", label: "الكل" },
  { key: "PENDING", label: "بانتظار المراجعة" },
  { key: "ACTIVE", label: "منشورة" },
  { key: "PAUSED", label: "موقوفة" },
  { key: "REJECTED", label: "مرفوضة" },
  { key: "HIDDEN", label: "مخفية" },
  { key: "SOLD", label: "مباعة" },
];

/** جدول منتجات الإدارة — كل أدوات الإشراف على الإعلانات */
export default function AdminProductsTable({
  initialProducts, total, initialStatus, initialQ,
}: {
  initialProducts: ProductCardData[];
  total: number;
  initialStatus: string;
  initialQ: string;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState(initialQ);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  /** تعديل سعر منتج معروض مباشرة من اللوحة */
  const [priceEdit, setPriceEdit] = useState<{ id: string; value: string } | null>(null);

  function goto(newStatus?: string, newQ?: string) {
    const s = newStatus ?? status;
    const query = newQ ?? q;
    const params = new URLSearchParams();
    if (s && s !== "ALL") params.set("status", s);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/admin/products?${params.toString()}`);
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(message, "success");
      router.refresh();
      // إزالة من القائمة إذا أصبحت خارج الفلتر الحالي
      if (status !== "ALL" && body.status && body.status !== status) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: data.product.status, featured: data.product.featured ?? p.featured } : p)));
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("تم حذف الإعلان", "success");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  /** حفظ السعر الجديد لمنتج معروض على الموقع */
  async function savePrice(id: string) {
    const value = Number(priceEdit?.value);
    if (!priceEdit || !Number.isFinite(value) || value <= 0) {
      toast("أدخل سعرًا صحيحًا أكبر من صفر", "error");
      return;
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price: value } : p)));
      setPriceEdit(null);
      toast("تم تحديث السعر على الموقع", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* أدوات */}
      <div className="flex flex-col gap-3 rounded-3xl border border-planet-100/60 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => { e.preventDefault(); goto(); }}
            className="flex flex-1 items-center gap-2 rounded-2xl border border-planet-200 bg-planet-50/50 px-4 py-2.5"
          >
            <Search size={16} className="text-planet-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في الإعلانات..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <span className="chip shrink-0 border-planet-200 bg-planet-50 text-planet-700">{formatNumber(total)} إعلان</span>
          <Link href="/admin/products/new" className="btn-primary shrink-0 px-4 py-2.5 text-xs sm:text-sm">
            <Plus size={15} /> أضف منتجًا
          </Link>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatus(t.key); goto(t.key); }}
              className={`chip shrink-0 px-3.5 py-1.5 text-xs ${
                status === t.key ? "border-planet-500 bg-planet-500 text-white" : "border-planet-100 bg-white text-planet-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* القائمة */}
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className={`rounded-3xl border bg-white p-4 ${p.status === "PENDING" ? "border-gold-400/60 shadow-[0_0_0_4px_rgba(245,158,11,.08)]" : "border-planet-100/60"}`}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={`/products/${p.id}`} className="shrink-0">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="h-20 w-28 rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-20 w-28 items-center justify-center rounded-2xl bg-planet-100 text-planet-300"><Eye size={22} /></span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/products/${p.id}`} className="line-clamp-1 text-sm font-extrabold text-planet-950 hover:text-planet-600">
                    {p.title}
                  </Link>
                  <StatusBadge status={p.status} type="product" />
                  {p.featured && <span className="chip border-gold-400/50 bg-gold-500/15 text-gold-600"><Star size={11} className="fill-gold-500" /> مميز</span>}
                  {p.isDemo && <span className="chip border-sky-200 bg-sky-50 text-sky-600">تجريبي</span>}
                  {p.isGuestSeller && (
                    <span className="chip border-violet-200 bg-violet-50 text-violet-600">نُشر بدون حساب</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-planet-500">
                  {p.categoryName} · البائع: <span className="font-bold">{p.sellerName}</span> · {p.gov}{p.area ? ` — ${p.area}` : ""} · {formatDate(p.createdAt)}
                </p>
                {priceEdit?.id === p.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-planet-200 bg-planet-50/60 p-2">
                    <Tag size={14} className="text-planet-500" />
                    <input
                      autoFocus
                      type="number"
                      min={1}
                      value={priceEdit.value}
                      onChange={(e) => setPriceEdit({ id: p.id, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") savePrice(p.id);
                        if (e.key === "Escape") setPriceEdit(null);
                      }}
                      className="w-28 rounded-xl border border-planet-200 bg-white px-3 py-1.5 text-sm font-black text-planet-800 outline-none focus:border-planet-500"
                      dir="ltr"
                    />
                    <span className="text-[11px] font-bold text-planet-500">
                      جنيه {p.pricingType === "PER_KG" ? "/ كجم" : p.pricingType === "PER_PIECE" ? "/ قطعة" : ""}
                    </span>
                    <button onClick={() => savePrice(p.id)} disabled={busy === p.id} className="chip border-planet-300 bg-planet-500 text-white">
                      <Save size={12} /> حفظ السعر
                    </button>
                    <button onClick={() => setPriceEdit(null)} className="chip border-planet-200 bg-white text-planet-500">
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-black text-planet-600">
                    {formatUnitPrice(p.price, p.pricingType, p.unit)}
                    <button
                      onClick={() => setPriceEdit({ id: p.id, value: String(p.price) })}
                      className="chip border-gold-300 bg-gold-50 py-0.5 text-[10px] text-gold-700 transition-colors hover:bg-gold-100"
                    >
                      <Tag size={11} /> تعديل السعر
                    </button>
                    <span className="text-[11px] font-bold text-planet-400">
                      {formatNumber(p.quantity)} {p.unit} · {formatNumber(p.views)} مشاهدة
                    </span>
                  </p>
                )}

                {/* الإجراءات */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {busy === p.id ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-planet-500"><Loader2 size={13} className="animate-spin" /> جارٍ التنفيذ...</span>
                  ) : (
                    <>
                      {p.status === "PENDING" && (
                        <>
                          <button onClick={() => patch(p.id, { status: "ACTIVE" }, "تم قبول الإعلان ونشره")} className="chip border-planet-300 bg-planet-500 text-white">
                            <Check size={12} /> قبول ونشر
                          </button>
                          <button onClick={() => patch(p.id, { status: "REJECTED" }, "تم رفض الإعلان")} className="chip border-rose-300 bg-rose-500 text-white">
                            <X size={12} /> رفض
                          </button>
                        </>
                      )}
                      {p.status === "ACTIVE" && (
                        <button onClick={() => patch(p.id, { status: "HIDDEN" }, "تم إخفاء الإعلان")} className="chip border-planet-200 bg-white text-planet-600">
                          <EyeOff size={12} /> إخفاء
                        </button>
                      )}
                      {(p.status === "HIDDEN" || p.status === "REJECTED" || p.status === "PAUSED") && (
                        <button onClick={() => patch(p.id, { status: "ACTIVE" }, "تم نشر الإعلان")} className="chip border-planet-300 bg-planet-500 text-white">
                          <Play size={12} /> نشر
                        </button>
                      )}
                      {p.status === "ACTIVE" && (
                        <button onClick={() => patch(p.id, { status: "PAUSED" }, "تم إيقاف الإعلان")} className="chip border-planet-200 bg-white text-planet-600">
                          <Pause size={12} /> إيقاف
                        </button>
                      )}
                      <button onClick={() => patch(p.id, { featured: !p.featured }, p.featured ? "أُلغي تمييز الإعلان" : "تم تمييز الإعلان")} className={`chip ${p.featured ? "border-gold-300 bg-gold-500/15 text-gold-600" : "border-gold-200 bg-white text-gold-500"}`}>
                        {p.featured ? <StarOff size={12} /> : <Star size={12} />}
                        {p.featured ? "إلغاء التمييز" : "تمييز"}
                      </button>
                      <Link href={`/sell/${p.id}`} className="chip border-planet-200 bg-white text-planet-600">
                        <PenLine size={12} /> تعديل
                      </Link>
                      {confirmDelete === p.id ? (
                        <>
                          <button onClick={() => remove(p.id)} className="chip border-rose-400 bg-rose-500 text-white"><Trash2 size={12} /> تأكيد الحذف</button>
                          <button onClick={() => setConfirmDelete(null)} className="chip border-planet-200 bg-white text-planet-500">إلغاء</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(p.id)} className="chip border-rose-200 bg-rose-50 text-rose-600">
                          <Trash2 size={12} /> حذف
                        </button>
                      )}
                      <Link href={`/products/${p.id}`} className="chip ms-auto border-planet-200 bg-white text-planet-600">
                        <Eye size={12} /> معاينة
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!products.length && (
          <p className="rounded-3xl border border-planet-100/60 bg-white px-4 py-12 text-center text-sm text-planet-400">
            لا توجد إعلانات مطابقة
          </p>
        )}
      </div>
    </div>
  );
}
