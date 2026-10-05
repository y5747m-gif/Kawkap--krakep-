"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, ShoppingCart, Minus, Plus, Store, ArrowLeft } from "lucide-react";
import { toast } from "./Toast";
import { formatMoney, formatUnitPrice, formatQuantity } from "@/lib/format";
import { computeLineTotal } from "@/lib/pricing";
import type { CartItemData } from "@/lib/types";

/** عرض السلة — تعديل الكميات، حذف، تجميع حسب البائع، ثم إتمام الطلب */
export default function CartView({ initialItems }: { initialItems: CartItemData[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);

  async function updateQty(itemId: string, qty: number) {
    if (qty <= 0) return removeItem(itemId);
    setBusy(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)));
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusy(itemId);
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      window.dispatchEvent(new Event("kk:cart-changed"));
      toast("أُزيل المنتج من السلة", "success");
    } catch {
      toast("تعذر حذف المنتج", "error");
    } finally {
      setBusy(null);
    }
  }

  // تجميع البنود حسب البائع
  const groups = new Map<string, { sellerName: string; items: CartItemData[]; total: number }>();
  for (const item of items) {
    const g = groups.get(item.product.sellerId) ?? { sellerName: item.product.sellerName, items: [], total: 0 };
    g.items.push(item);
    g.total += computeLineTotal(item.product.pricingType, item.product.price, item.quantity);
    groups.set(item.product.sellerId, g);
  }
  const total = items.reduce(
    (s, i) => s + computeLineTotal(i.product.pricingType, i.product.price, i.quantity), 0
  );

  if (!items.length) {
    return (
      <div className="glass mx-auto max-w-md rounded-3xl px-6 py-12 text-center">
        <ShoppingCart size={44} className="mx-auto mb-4 text-planet-300" />
        <h2 className="text-lg font-extrabold text-planet-900">سلتك فارغة</h2>
        <p className="mt-1.5 text-sm text-planet-600">تصفح الكراكيب وأضف ما يعجبك</p>
        <Link href="/products" className="btn-primary mt-5 px-6 py-3 text-sm">تصفح الكراكيب</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {[...groups.entries()].map(([sellerId, g]) => (
          <div key={sellerId} className="glass overflow-hidden rounded-3xl">
            <div className="flex items-center gap-2 border-b border-planet-50 bg-planet-50/50 px-5 py-3">
              <Store size={16} className="text-planet-600" />
              <span className="text-sm font-extrabold text-planet-800">بائع: {g.sellerName}</span>
              <span className="chip ms-auto border-planet-200 bg-white text-planet-600">
                {g.items.length} منتج · {formatMoney(g.total)}
              </span>
            </div>
            <div className="divide-y divide-planet-50">
              {g.items.map((item) => {
                const perUnit = item.product.pricingType === "PER_KG" || item.product.pricingType === "PER_PIECE";
                const line = computeLineTotal(item.product.pricingType, item.product.price, item.quantity);
                return (
                  <div key={item.id} className="flex gap-3.5 p-4">
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      {item.product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.image} alt={item.product.title} className="h-20 w-24 rounded-2xl object-cover" />
                      ) : (
                        <span className="flex h-20 w-24 items-center justify-center rounded-2xl bg-planet-100 text-planet-300">
                          <ShoppingCart size={24} />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.productId}`} className="line-clamp-1 text-sm font-extrabold text-planet-950 hover:text-planet-600">
                        {item.product.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-planet-500">
                        {formatUnitPrice(item.product.price, item.product.pricingType, item.product.unit)}
                        {perUnit && ` · المتاح ${formatQuantity(item.product.quantity, item.product.unit)}`}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        {perUnit ? (
                          <div className="flex items-center gap-1" dir="ltr">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="btn-outline h-9 w-9 rounded-xl p-0 sm:h-8 sm:w-8" aria-label="تقليل" disabled={busy === item.id}>
                              <Minus size={13} />
                            </button>
                            <span className="w-14 rounded-lg border border-planet-200 bg-white py-1 text-center text-xs font-extrabold">
                              {busy === item.id ? <Loader2 size={12} className="mx-auto animate-spin" /> : item.quantity}
                            </span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="btn-outline h-9 w-9 rounded-xl p-0 sm:h-8 sm:w-8" aria-label="زيادة" disabled={busy === item.id}>
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-planet-600">{formatQuantity(item.product.quantity, item.product.unit)} — دفعة كاملة</span>
                        )}
                        <button onClick={() => removeItem(item.id)} className="chip border-rose-200 bg-rose-50 text-rose-600" disabled={busy === item.id}>
                          <Trash2 size={12} /> حذف
                        </button>
                        <span className="ms-auto text-sm font-black text-planet-600">{formatMoney(line)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* الملخص */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="glass space-y-4 rounded-3xl p-4 sm:p-6">
          <h2 className="text-base font-extrabold text-planet-950">ملخص الطلب</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-planet-600">
              <span>عدد المنتجات</span>
              <span className="font-bold">{items.length}</span>
            </div>
            <div className="flex justify-between text-planet-600">
              <span>عدد البائعين</span>
              <span className="font-bold">{groups.size}</span>
            </div>
            <div className="flex justify-between border-t border-planet-100 pt-3 text-base">
              <span className="font-extrabold text-planet-900">الإجمالي</span>
              <span className="font-black text-planet-600">{formatMoney(total)}</span>
            </div>
          </div>
          <p className="rounded-2xl bg-planet-50/80 px-4 py-3 text-[11px] font-bold leading-5 text-planet-600">
            سيتم تنظيم طلبك تلقائيًا كطلب رئيسي مع طلبات فرعية لكل بائع، وتصل كل التفاصيل لإدارة المنصة عبر واتساب.
          </p>
          <button onClick={() => router.push("/checkout")} className="btn-sell w-full px-6 py-4 text-base">
            إتمام الطلب <ArrowLeft size={18} />
          </button>
          <Link href="/products" className="btn-ghost w-full py-2.5 text-sm">أكمل التصفح</Link>
        </div>
      </div>
    </div>
  );
}
