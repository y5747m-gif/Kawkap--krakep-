import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError, getBaseUrl } from "@/lib/http";
import { createOrder, OrderValidationError } from "@/lib/orders";
import { listBuyerOrders } from "@/lib/models/orders";
import type { DeliveryMethod } from "@/lib/types";

/**
 * POST /api/orders — إنشاء طلب جديد
 * التدفق: حفظ الطلب في قاعدة البيانات → توليد رقم الطلب → تجهيز رسالة واتساب
 * الديناميكية → إرجاع رابط واتساب المالك ليفتحه العميل.
 * الطلب محفوظ دائمًا حتى لو لم يرسل العميل رسالة الواتساب.
 */
export async function POST(req: NextRequest) {
  const viewer = await getCurrentUser();
  try {
    const body = await req.json();
    const result = createOrder(
      {
        source: body.source === "CART" ? "CART" : "PRODUCT",
        productId: body.productId,
        quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
        customerName: String(body.customerName ?? ""),
        customerPhone: String(body.customerPhone ?? ""),
        gov: body.gov ?? null,
        area: body.area ?? null,
        address: body.address ?? null,
        latitude: body.latitude != null && Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null,
        longitude: body.longitude != null && Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null,
        deliveryMethod: (body.deliveryMethod ?? "PICKUP") as DeliveryMethod,
        notes: body.notes ?? null,
      },
      viewer,
      getBaseUrl(req)
    );
    return jsonOk({
      orderCode: result.order.orderCode,
      order: result.order,
      whatsappUrl: result.whatsappUrl,
    });
  } catch (e) {
    if (e instanceof OrderValidationError) return jsonError(e.message);
    console.error(e);
    return jsonError("تعذر إنشاء الطلب، حاول مرة أخرى", 500);
  }
}

/** GET — طلباتي كمشترٍ */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);
  return jsonOk({ orders: listBuyerOrders(user.id) });
}
