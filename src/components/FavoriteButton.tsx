"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "./Toast";

/** زر المفضلة ❤ (أيقونة SVG) — يتطلب تسجيل الدخول */
export default function FavoriteButton({
  productId, initial = false, floating = false,
}: { productId: string; initial?: boolean; floating?: boolean }) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast("سجل الدخول لحفظ المنتجات في مفضلتك", "info");
          router.push("/login");
          return;
        }
        throw new Error(data.error);
      }
      setFav(data.favorited);
      toast(data.favorited ? "أُضيف إلى مفضلتك" : "أُزيل من مفضلتك", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  }

  if (floating) {
    return (
      <button
        onClick={toggle}
        aria-label="إضافة للمفضلة"
        className="absolute bottom-2.5 end-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition-transform hover:scale-110 active:scale-90"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-planet-500" />
        ) : (
          <Heart size={18} className={fav ? "fill-rose-500 text-rose-500" : "text-planet-400"} />
        )}
      </button>
    );
  }

  return (
    <button onClick={toggle} className="btn-outline min-h-[3rem] gap-2 px-4 py-3 text-sm" disabled={loading}>
      {loading ? <Loader2 size={17} className="animate-spin" /> : <Heart size={17} className={fav ? "fill-rose-500 text-rose-500" : ""} />}
      {fav ? "في المفضلة" : "أضف للمفضلة"}
    </button>
  );
}
