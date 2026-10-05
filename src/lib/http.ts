import type { NextRequest } from "next/server";

/** الرابط الأساسي للموقع (لروابط المنتجات داخل رسائل واتساب) */
export function getBaseUrl(req?: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

/**
 * هل وصل الطلب عبر HTTPS فعلًا؟ يُستخدم لضبط علم Secure على كوكي الجلسة:
 * المتصفح يرفض Set-Cookie: Secure كليًا على الروابط العادية http://، فلو
 * عُتمد NODE_ENV وحده في الإنتاج لعاد المستخدم لصفحة الدخول بعد «نجاح»
 * تسجيل الدخول لأن كوكي الجلسة لم تُحفظ أصلًا.
 */
export function isSecureRequest(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim().toLowerCase() === "https";
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, ...data }, init);
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}
