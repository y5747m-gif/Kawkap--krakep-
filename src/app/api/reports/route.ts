import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { createReport } from "@/lib/models/misc";
import { sanitizeText } from "@/lib/validate";

/** POST — الإبلاغ عن إعلان مخالف */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId ?? "");
    const reason = sanitizeText(body.reason, 120);
    const details = body.details ? sanitizeText(body.details, 500) : null;
    if (!productId || !reason) return jsonError("بيانات غير صحيحة");

    const user = getCurrentUser();
    createReport({ reporterId: user?.id ?? null, productId, reason, details });
    return jsonOk({ done: true });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر إرسال البلاغ", 500);
  }
}
