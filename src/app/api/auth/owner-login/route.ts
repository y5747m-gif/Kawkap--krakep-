import { NextRequest } from "next/server";
import { loginUser, startSession, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";

/**
 * POST /api/auth/owner-login — دخول المالك فقط (زر القفل أعلى الموقع).
 *
 * يختلف عن دخول العميل العادي: لا تُفتح جلسة إطلاقًا إن لم يكن الحساب
 * حساب المالك (ADMIN)، حتى لا يُستخدم باب الإدارة لتسجيل دخول عادي.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    if (!identifier || !password) return jsonError("أدخل بيانات الدخول");

    const result = loginUser(identifier, password);
    if (!result.ok || !result.user) return jsonError(result.error ?? "بيانات الدخول غير صحيحة", 401);

    if (!isAdmin(result.user)) {
      return jsonError("هذا الحساب ليس حساب مالك المنصة — استخدم دخول العملاء العادي", 403);
    }

    await startSession(result.user.id);
    return jsonOk({ user: result.user });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر تسجيل الدخول، حاول مرة أخرى", 500);
  }
}
