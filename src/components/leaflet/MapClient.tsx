"use client";

import dynamic from "next/dynamic";

/** تحميل مكونات الخريطة على جهة العميل فقط (Leaflet يحتاج window) */
export const MapExplorer = dynamic(() => import("./MapExplorer"), {
  ssr: false,
  loading: () => <div className="skeleton h-[70vh] min-h-[420px] w-full" />,
});

export const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="skeleton h-56 w-full" />,
});
