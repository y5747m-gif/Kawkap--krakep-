import { NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { changeOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

type Ctx = { params: { id: string } };

/** PATCH — تحديث حالة الطلب من لوحة الإدارة */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) return jsonError("صلاحيات غير كافية", 403);

  try {
    const body = await req.json();
    const status = String(body.status ?? "") as OrderStatus;
    const order = changeOrderStatus(params.id, status, user.name);
    if (!order) return jsonError("الطلب غير موجود", 404);
    return jsonOk({ order });
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذر تحديث الطلب";
    return jsonError(message, 400);
  }
}
