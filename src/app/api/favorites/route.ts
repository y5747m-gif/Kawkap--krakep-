import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { toggleFavorite, listFavorites } from "@/lib/models/products";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ favorites: [] });
  return jsonOk({ favorites: listFavorites(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("سجل الدخول لحفظ المنتجات في مفضلتك", 401);
  const body = await req.json();
  const productId = String(body.productId ?? "");
  if (!productId) return jsonError("بيانات غير صحيحة");
  try {
    const result = toggleFavorite(user.id, productId);
    return jsonOk(result);
  } catch {
    return jsonError("المنتج غير موجود", 404);
  }
}
