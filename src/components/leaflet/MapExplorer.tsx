"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, PackageSearch } from "lucide-react";
import { formatMoney, formatUnitPrice } from "@/lib/format";
import { haversineKm, formatDistance } from "@/lib/geo";
import type { PricingType } from "@/lib/types";

export interface MapProduct {
  id: string;
  title: string;
  price: number;
  pricingType: PricingType;
  unit: string;
  image: string | null;
  gov: string;
  area: string | null;
  lat: number;
  lng: number;
  featured: boolean;
}

const EGYPT_CENTER: [number, number] = [30.0444, 31.2357];

function priceIcon(p: MapProduct): L.DivIcon {
  const label = p.pricingType === "FIXED" || p.pricingType === "BULK"
    ? formatMoney(p.price).replace(" جنيه", "")
    : `${p.price}`;
  return L.divIcon({
    className: "",
    html: `<div class="kk-marker ${p.featured ? "is-featured" : ""}">${label} ج</div>`,
    iconSize: [60, 26],
    iconAnchor: [30, 26],
  });
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

/** خريطة الكراكيب — Marker لكل منتج مع بطاقة عند الضغط */
export default function MapExplorer({ products }: { products: MapProduct[] }) {
  const [userPoint, setUserPoint] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  function locate() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPoint([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 shadow-lift">
      <MapContainer
        center={userPoint ?? EGYPT_CENTER}
        zoom={userPoint ? 12 : 11}
        scrollWheelZoom
        className="h-[70vh] min-h-[420px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={userPoint} />

        {products.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={priceIcon(p)}>
            <Popup>
              <div className="kk-map-popup">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="h-28 w-full rounded-xl object-cover" />
                )}
                <p className="mt-2 line-clamp-1 text-sm font-extrabold text-planet-950">{p.title}</p>
                <p className="text-sm font-black text-planet-600">
                  {formatUnitPrice(p.price, p.pricingType, p.unit)}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-planet-500">
                  <MapPin size={11} /> {p.gov}{p.area ? ` — ${p.area}` : ""}
                  {userPoint && (
                    <span className="font-bold text-tealx-600">
                      · {formatDistance(haversineKm({ lat: userPoint[0], lng: userPoint[1] }, { lat: p.lat, lng: p.lng }))}
                    </span>
                  )}
                </p>
                <Link href={`/products/${p.id}`} className="btn-primary mt-2.5 block w-full rounded-xl px-3 py-2 text-center text-xs">
                  عرض المنتج
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {userPoint && (
          <Marker position={userPoint} icon={L.divIcon({ className: "", html: `<div style="width:14px;height:14px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 6px rgba(14,165,233,.25)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })} />
        )}
      </MapContainer>

      {/* زر تحديد الموقع */}
      <button
        onClick={locate}
        className="btn-primary absolute bottom-5 end-5 z-[400] px-4 py-2.5 text-xs shadow-lift"
      >
        <Navigation size={15} className={locating ? "animate-spin" : ""} />
        {userPoint ? "أنت هنا" : "كراكيب قريبة مني"}
      </button>

      {products.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-planet-700">
            <PackageSearch size={22} className="text-planet-500" />
            لا توجد إعلانات بإحداثيات على الخريطة بعد
          </div>
        </div>
      )}
    </div>
  );
}
