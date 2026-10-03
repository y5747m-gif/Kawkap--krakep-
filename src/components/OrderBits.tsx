"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { toast } from "./Toast";
import { openOwnerWhatsApp } from "@/lib/whatsapp-link";

/** زر "فتح WhatsApp" — يفتح رابط المالك المجهز ويسجل العملية */
export function OpenOwnerWhatsAppButton({
  url, orderCode, variant = "big",
}: { url: string; orderCode: string; variant?: "big" | "small" }) {
  function open() {
    openOwnerWhatsApp(url);
    fetch(`/api/orders/${orderCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappOpened: true }),
    }).catch(() => {});
  }

  if (variant === "small") {
    return (
      <button onClick={open} className="btn-whatsapp px-3.5 py-2 text-xs">
        <WhatsAppIcon size={14} /> فتح WhatsApp
      </button>
    );
  }

  return (
    <button onClick={open} className="btn-whatsapp w-full px-6 py-4 text-base">
      <WhatsAppIcon size={19} />
      فتح WhatsApp
    </button>
  );
}

/** نموذج تقييم البائع بعد إتمام الطلب — من 1 إلى 5 نجوم مع تعليق اختياري */
export function ReviewForm({ orderCode }: { orderCode: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (rating < 1) return toast("اختر عدد النجوم", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, rating, comment: comment || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("شكرًا لتقييمك!", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-1.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} نجوم`}
            className="transition-transform hover:scale-125 active:scale-95"
          >
            <Star
              size={34}
              className={
                i <= (hover || rating)
                  ? "fill-gold-400 text-gold-400 drop-shadow-[0_2px_8px_rgba(251,191,36,.5)]"
                  : "fill-planet-100 text-planet-200"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        className="field min-h-20"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="تعليق اختياري عن تجربتك مع البائع..."
        maxLength={500}
      />
      <button onClick={submit} disabled={loading} className="btn-primary w-full py-3.5">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Star size={16} className="fill-white" />}
        إرسال التقييم
      </button>
    </div>
  );
}
