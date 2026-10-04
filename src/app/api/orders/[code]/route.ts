import { NextRequest } from "next/server";
import { jsonOk, jsonError, getBaseUrl } from "@/lib/http";
import { getOrderByCode, markOrderWhatsappSent } from "@/lib/models/orders";
import { createOwnerOrderLink, createOwnerInquiryLink } from "@/lib/whatsapp";

type Ctx = { params: Promise<{ code: string }> };

/** GET — تفاصيل الطلب + رابط واتساب المالك المُعاد توليده من الإعدادات */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const order = getOrderByCode(code);
  if (!order) return jsonError("الطلب غير موجود", 404);
  return jsonOk({
    order,
    whatsappUrl: createOwnerOrderLink(order, getBaseUrl(req)),
    inquiryUrl: createOwnerInquiryLink(order, getBaseUrl(req)),
  });
}

/** PATCH — تسجيل أن العميل فتح واتساب المالك للطلب */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const order = getOrderByCode(code);
  if (!order) return jsonError("الطلب غير موجود", 404);
  try {
    const body = await req.json();
    if (body.whatsappOpened) markOrderWhatsappSent(order.id);
    return jsonOk({ updated: true });
  } catch {
    return jsonError("بيانات غير صحيحة", 400);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return PATCH(req, { params });
}
