import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { upsertConversation, listConversations } from "@/lib/models/users";
import { sanitizeText } from "@/lib/validate";

/** GET — محادثاتي (تواصل البائعين عبر واتساب) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ conversations: [] });
  return jsonOk({ conversations: listConversations(user.id) });
}

/** POST — تسجيل محادثة جديدة عند التواصل مع بائع */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ skipped: true }); // الزوار لا تُحفظ محادثاتهم
  try {
    const body = await req.json();
    const sellerId = String(body.sellerId ?? "");
    const productId = body.productId ? String(body.productId) : null;
    const productTitle = body.productTitle ? sanitizeText(body.productTitle, 120) : null;
    if (!sellerId || sellerId === user.id) return jsonOk({ skipped: true });
    upsertConversation(user.id, sellerId, productId, productTitle);
    return jsonOk({ done: true });
  } catch {
    return jsonError("بيانات غير صحيحة", 400);
  }
}
