import { NextRequest } from "next/server";
import { loginUser, startSession } from "@/lib/auth";
import { jsonOk, jsonError, isSecureRequest } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    if (!identifier || !password) return jsonError("أدخل بيانات الدخول");

    const result = loginUser(identifier, password);
    if (!result.ok) return jsonError(result.error!);

    await startSession(result.user!.id, isSecureRequest(req));
    return jsonOk({ user: result.user });
  } catch (e) {
    console.error(e);
    return jsonError("حدث خطأ غير متوقع، حاول مرة أخرى", 500);
  }
}
