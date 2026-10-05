import type { MetadataRoute } from "next";

/**
 * ملف التعريف (Web App Manifest) — يُقدَّم على ‎/manifest.webmanifest‎.
 *
 * قبل إضافته كان المتصفح (وأدوات الفحص وأجهزة أندرويد) يطلب هذا الملف
 * فيعود **404**، ولم يكن بالإمكان تثبيت الموقع كتطبيق على الهاتف.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "كوكب كراكيب — عندك كراكيب؟ حوّلها لقيمة",
    short_name: "كوكب كراكيب",
    description:
      "منصة يعرض فيها العملاء ما لا يحتاجونه للبيع، ويشتري منها الآخرون — اعرض شيئًا للبيع وتصفح الكراكيب القريبة منك.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1faf6",
    theme_color: "#0f4439",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "اعرض شيئًا للبيع", short_name: "بيع", url: "/sell" },
      { name: "تصفح الكراكيب", short_name: "الكراكيب", url: "/products" },
      { name: "خريطة الكراكيب", short_name: "الخريطة", url: "/map" },
    ],
  };
}
