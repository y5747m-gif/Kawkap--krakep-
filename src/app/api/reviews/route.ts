import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { getOrderByCode, hasReview, insertReview } from "@/lib/models/orders";
import { notify } from "@/lib/models/misc";
import { sanitizeText } from "@/lib/validate";

/**
 * POST /api/reviews — تقييم البائع بعد إتمام الطلب فقط
 * يُمنع التقييم لمنتج لم يتم طلبه فعليًا أو قبل اكتمال الطلب.
 */
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);

  try {
    const body = await req.json();
    const orderCode = String(body.orderCode ?? "");
    const rating = Math.round(Number(body.rating));
    const comment = body.comment ? sanitizeText(body.comment, 500) : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonError("التقييم يجب أن يكون من 1 إلى 5 نجوم");
    }

    const order = getOrderByCode(orderCode);
    if (!order) return jsonError("الطلب غير موجود", 404);
    if (order.buyerId !== user.id) return jsonError("يمكنك تقييم طلباتك أنت فقط", 403);
    if (order.status !== "COMPLETED") return jsonError("يمكنك التقييم بعد اكتمال الطلب فقط");
    if (hasReview(order.id)) return jsonError("تم تقييم هذا الطلب بالفعل");

    const firstItem = order.items[0];
    if (!firstItem) return jsonError("لا توجد بنود في هذا الطلب", 400);

    insertReview({
      orderId: order.id,
      productId: firstItem.productId,
      sellerId: firstItem.sellerId,
      buyerId: user.id,
      rating,
      comment,
    });

    notify({
      userId: firstItem.sellerId,
      type: "SYSTEM",
      title: "تقييم جديد",
      body: `${user.name} قيّمك بمقدار ${rating} من 5${comment ? ` — "${comment}"` : ""}`,
      link: "/seller",
    });

    return jsonOk({ done: true });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر إضافة التقييم", 500);
  }
}
