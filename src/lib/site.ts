import { headers } from "next/headers";

const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * الرابط الأساسي للموقع كما يراه الزائر — يُستخدم في ‎robots.txt‎
 * و‎sitemap.xml‎ وبيانات المشاركة (Open Graph).
 *
 * الترتيب: ‎NEXT_PUBLIC_SITE_URL‎ ثم عنوان Vercel التلقائي ثم ‎localhost‎.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return FALLBACK_SITE_URL;
}

/** نفس الرابط لكن مستنتجًا من ترويسات الطلب الحالي عند غياب الإعداد */
export async function getRequestSiteUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/+$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* خارج سياق الطلب */
  }
  return getSiteUrl();
}
