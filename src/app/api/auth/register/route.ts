import { NextRequest } from "next/server";
import { registerUser, startSession } from "@/lib/auth";
import { normalizeEgyptianPhone, isValidEmail, sanitizeText } from "@/lib/validate";
import { jsonOk, jsonError, isSecureRequest } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitizeText(body.name, 60);
    const phone = normalizeEgyptianPhone(String(body.phone ?? ""));
    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const password = String(body.password ?? "");
    const gov = body.gov ? sanitizeText(body.gov, 40) : undefined;
    const area = body.area ? sanitizeText(body.area, 60) : undefined;

    if (!phone) return jsonError("أدخل رقم هاتف مصري صحيح مثل 01012345678");
    if (email && !isValidEmail(email)) return jsonError("البريد الإلكتروني غير صحيح");

    const result = registerUser({ name, phone, email: email || undefined, password, gov, area });
    if (!result.ok) return jsonError(result.error!);

    await startSession(result.user!.id, isSecureRequest(req));
    return jsonOk({ user: result.user });
  } catch (e) {
    console.error(e);
    return jsonError("حدث خطأ غير متوقع، حاول مرة أخرى", 500);
  }
}
