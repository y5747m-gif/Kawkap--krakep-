"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Compass } from "lucide-react";
import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/types";

type State = "idle" | "locating" | "ready" | "denied" | "empty";

/**
 * «كراكيب قريبة منك» — يعرض الأقرب لموقع الزائر مع المسافة التقريبية.
 *
 * تغيير مهم في السلوك: كان المكوّن يطلب إذن الموقع تلقائيًا بمجرد فتح
 * الصفحة الرئيسية، فيظهر للزائر نافذة إذن قبل أن يرى الموقع أصلًا، ويبقى
 * القسم هياكل تحميل (skeleton) حتى ينتهي المهلة إن تجاهلها — وهو جزء كبير
 * من الإحساس بأن الصفحة «واقفة».
 * الآن: زر صريح يضغطه الزائر، ويُستخدم الموقع تلقائيًا فقط إن كان الإذن
 * ممنوحًا مسبقًا لهذا الموقع (بلا أي نافذة إذن جديدة).
 */
export default function NearbyProducts() {
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [state, setState] = useState<State>("idle");
  const requested = useRef(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    requested.current = true;
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/products?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&sort=distance&limit=8`
          );
          const data = await res.json();
          const items: ProductCardData[] = data.products ?? [];
          setProducts(items);
          setState(items.length ? "ready" : "empty");
        } catch {
          setState("denied");
        }
      },
      () => setState("denied"),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // تشغيل تلقائي فقط عندما يكون الإذن ممنوحًا من قبل — بلا إزعاج الزائر
  useEffect(() => {
    let cancelled = false;
    if (!("geolocation" in navigator) || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted" && !requested.current) locate();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locate]);

  if (state === "locating") {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-80" />
        ))}
      </div>
    );
  }

  if (state === "ready" && products?.length) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  const message =
    state === "denied"
      ? "تعذّر تحديد موقعك — فعّل إذن الموقع في المتصفح ثم أعد المحاولة، أو استكشف الخريطة."
      : state === "empty"
        ? "لا توجد إعلانات بإحداثيات موقع قريبة منك حاليًا — جرّب خريطة الكراكيب."
        : "اضغط الزر لتعرض لك الكراكيب الأقرب لمكانك مع المسافة التقريبية.";

  return (
    <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tealx-500/15 text-tealx-600">
        <Compass size={26} />
      </span>
      <p className="max-w-md text-sm font-bold leading-7 text-planet-700">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button type="button" onClick={locate} className="btn-primary px-5 py-2.5 text-sm">
          <LocateFixed size={16} />
          اعرض الكراكيب القريبة مني
        </button>
        <a href="/map" className="btn-outline px-5 py-2.5 text-sm">
          <Compass size={16} /> استكشف خريطة الكراكيب
        </a>
      </div>
    </div>
  );
}
