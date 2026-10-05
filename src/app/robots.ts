import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * ‎/robots.txt‎ — كان يعود بخطأ 404 لكل زاحف يفحص الموقع.
 * نمنع فهرسة المسارات الخاصة (الإدارة، الحساب، السلة، نقاط الـ API).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/account", "/cart", "/checkout", "/orders", "/notifications", "/owner"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
