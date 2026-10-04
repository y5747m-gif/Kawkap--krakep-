"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Share2, Flag, Loader2, MessageCircle } from "lucide-react";
import Modal from "./Modal";
import OrderForm from "./OrderForm";
import WhatsAppIcon from "./WhatsAppIcon";
import { toast } from "./Toast";
import { createWhatsAppOrderLink } from "@/lib/whatsapp-client";
import type { Address } from "@/lib/types";
import type { OrderFormProduct } from "./OrderForm";

/** زر "اطلب الآن" — يفتح نموذج الطلب */
export function OrderNowButton({
  product, viewer, addresses, disabled = false, disabledReason,
}: {
  product: OrderFormProduct;
  viewer: { name: string; phone: string; gov: string | null; area: string | null } | null;
  addresses: Address[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => (disabled ? toast(disabledReason || "غير متاح", "info") : setOpen(true))}
        className="btn-sell w-full px-6 py-4 text-base"
        disabled={disabled}
      >
        <ShoppingBag size={19} />
        {disabled ? (disabledReason || "غير متاح للطلب") : "اطلب الآن"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="طلب المنتج" wide>
        <OrderForm source="PRODUCT" product={product} viewer={viewer} addresses={addresses} />
      </Modal>
    </>
  );
}

/** زر "تواصل مع البائع" — يفتح واتساب البائع مباشرة ويسجل المحادثة */
export function ContactSellerButton({
  sellerId, sellerName, sellerPhone, productTitle, productId,
}: {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  productTitle: string;
  productId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function contact() {
    setLoading(true);
    const message = `مرحبًا ${sellerName}، مهتم بإعلانك «${productTitle}» على كوكب كراكيب. هل ما زال متاحًا؟`;
    window.open(createWhatsAppOrderLink(sellerPhone, message), "_blank", "noopener");

    // تسجيل المحادثة (للمستخدمين المسجلين)
    fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, productId, productTitle }),
    })
      .then(() => router.refresh())
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return (
    <button onClick={contact} disabled={loading} className="btn-whatsapp w-full px-6 py-4 text-base">
      {loading ? <Loader2 size={18} className="animate-spin" /> : <WhatsAppIcon size={18} />}
      تواصل مع البائع
    </button>
  );
}

/** زر المشاركة */
export function ShareButton({ title, url }: { title: string; url: string }) {
  async function share() {
    const shareData = { title: `${title} — كوكب كراكيب`, text: `شوف الإعلان ده على كوكب كراكيب: ${title}`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* أُلغيت */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast("تم نسخ رابط المنتج", "success");
      } catch {
        toast("تعذر النسخ", "error");
      }
    }
  }

  return (
    <button onClick={share} className="btn-outline gap-2 px-4 py-3 text-sm">
      <Share2 size={16} /> مشاركة
    </button>
  );
}

/** زر الإبلاغ عن الإعلان */
export function ReportButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return toast("اختر سبب البلاغ", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast("تم إرسال البلاغ — شكرًا لمساعدتك", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="chip border-planet-200 bg-white/80 text-planet-500 hover:text-rose-600">
        <Flag size={12} /> إبلاغ
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setDone(false); }} title="الإبلاغ عن الإعلان">
        {done ? (
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-planet-700">تم استلام بلاغك وسيتم مراجعته من إدارة المنصة.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="field-label">سبب البلاغ</label>
              <select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">اختر السبب</option>
                {["إعلان مخالف أو محتوى غير لائق", "سعر أو بيانات مضللة", "منتج مكرر", "لا يمكن الوصول للبائع", "سبب آخر"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">تفاصيل إضافية (اختياري)</label>
              <textarea className="field min-h-20" value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Flag size={16} />} إرسال البلاغ
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
