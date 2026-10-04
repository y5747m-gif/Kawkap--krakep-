"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";
import { GOVERNORATES } from "@/lib/constants";

/** منتقي الموقع على الخريطة — يستخدمه نموذج إضافة المنتج */
export default function MapPicker({
  lat, lng, gov, onChange,
}: {
  lat: number | null;
  lng: number | null;
  gov?: string | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const govDef = GOVERNORATES.find((g) => g.name === gov);
  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : govDef ? [govDef.lat, govDef.lng] : [30.0444, 31.2357];

  function ClickCatcher() {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function Recenter({ c }: { c: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView(c, Math.max(map.getZoom(), 11));
    }, [c[0], c[1], map]); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-planet-200">
        <MapContainer center={center} zoom={lat != null ? 14 : 10} className="h-56 w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher />
          <Recenter c={center} />
          {lat != null && lng != null && (
            <Marker
              position={[lat, lng]}
              icon={L.divIcon({
                className: "",
                html: `<div style="width:16px;height:16px;border-radius:50%;background:#1fa27c;border:3px solid #fff;box-shadow:0 0 0 7px rgba(31,162,124,.3)"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          )}
        </MapContainer>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-planet-500">
        <Crosshair size={12} className="text-planet-400" />
        اضغط على الخريطة لتحديد موقع المنتج بدقة — أو استخدم زر «موقعي الحالي»
      </p>
    </div>
  );
}
