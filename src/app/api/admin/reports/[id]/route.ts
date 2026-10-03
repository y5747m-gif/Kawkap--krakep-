import { NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { updateReportStatus } from "@/lib/models/misc";

type Ctx = { params: { id: string } };

/** PATCH — معالجة بلاغ أو تجاهله */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) return jsonError("صلاحيات غير كافية", 403);
  try {
    const body = await req.json();
    const status = String(body.status ?? "");
    if (!["OPEN", "RESOLVED", "DISMISSED"].includes(status)) return jsonError("حالة غير صحيحة");
    updateReportStatus(params.id, status as "OPEN" | "RESOLVED" | "DISMISSED");
    return jsonOk({ done: true });
  } catch {
    return jsonError("تعذر تحديث البلاغ", 400);
  }
}
