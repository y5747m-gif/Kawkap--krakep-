"use client";

import { useEffect, useState } from "react";
import { LocateFixed, Compass } from "lucide-react";
import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/types";

/** "كراكيب قريبة منك" — يستخدم موقع المستخدم لعرض الأقرب مع المسافة التقريبية */
export default function NearbyProducts() {
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [state, setState] = useState<"idle" | "locating" | "ready" | "denied">("idle");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/products?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&sort=distance&limit=8`
          );
          const data = await res.json();
          setProducts(data.products ?? []);
          setState("ready");
        } catch {
          setState("denied");
        }
      },
      () => setState("denied"),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  if (state === "idle" || state === "locating") {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-80" />
        ))}
      </div>
    );
  }

  if (state === "denied" || !products?.length) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tealx-500/15 text-tealx-600">
          <Compass size={26} />
        </span>
        <p className="max-w-md text-sm font-bold leading-7 text-planet-700">
          {state === "denied"
            ? "فعّل تحديد الموقع في متصفحك لتعرض لك الكراكيب الأقرب لمكانك مع المسافة التقريبية."
            : "لا توجد إعلانات بإحداثيات موقع قريبة منك حاليًا."}
        </p>
        <a href="/map" className="btn-outline px-5 py-2.5 text-sm">
          <LocateFixed size={16} /> استكشف خريطة الكراكيب
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
