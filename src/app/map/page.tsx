import { MapPinned } from "lucide-react";
import { MapExplorer } from "@/components/leaflet/MapClient";
import { searchProducts } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

/** خريطة الكراكيب القريبة — Marker لكل منتج */
export default async function MapPage() {
  const { items, total } = searchProducts({ withCoordsOnly: true, limit: 60 });

  const products = items
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      pricingType: p.pricingType,
      unit: p.unit,
      image: p.image,
      gov: p.gov,
      area: p.area,
      lat: p.latitude!,
      lng: p.longitude!,
      featured: p.featured,
    }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-planet-950">
            <MapPinned size={26} className="text-tealx-500" />
            خريطة الكراكيب
          </h1>
          <p className="mt-1 text-sm text-planet-600">
            {formatNumber(products.length)} من {formatNumber(total)} إعلان على الخريطة — اضغط أي علامة لعرض المنتج
          </p>
        </div>
      </div>
      <MapExplorer products={products} />
    </div>
  );
}
