import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import {
  getCartItems, addToCart, updateCartItem, removeCartItem, clearCart, cartCount,
} from "@/lib/models/products";

export async function GET() {
  const user = getCurrentUser();
  if (!user) return jsonOk({ items: [], count: 0 });
  return jsonOk({ items: getCartItems(user.id), count: cartCount(user.id) });
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول لإضافة المنتجات للسلة", 401);
  try {
    const body = await req.json();
    const productId = String(body.productId ?? "");
    const quantity = Number(body.quantity ?? 1);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return jsonError("بيانات غير صحيحة");
    }
    addToCart(user.id, productId, Math.min(quantity, 100000));
    return jsonOk({ count: cartCount(user.id) });
  } catch (e) {
    return jsonError("تعذر إضافة المنتج للسلة", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);
  const body = await req.json();
  const itemId = String(body.itemId ?? "");
  const quantity = Number(body.quantity);
  if (!itemId || !Number.isFinite(quantity)) return jsonError("بيانات غير صحيحة");
  updateCartItem(user.id, itemId, quantity);
  return jsonOk({ items: getCartItems(user.id) });
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);
  const sp = req.nextUrl.searchParams;
  if (sp.get("clear") === "1") {
    clearCart(user.id);
    return jsonOk({ items: [] });
  }
  const itemId = sp.get("itemId");
  if (!itemId) return jsonError("بيانات غير صحيحة");
  removeCartItem(user.id, itemId);
  return jsonOk({ items: getCartItems(user.id) });
}
