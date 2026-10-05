import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getCurrentUser, ensureGuestToken } from "@/lib/auth";
import { jsonOk, jsonError, isSecureRequest } from "@/lib/http";
import { saveUploadedFile } from "@/lib/uploads";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * رفع صور المنتجات والصور الشخصية — حتى 8 صور للمنتج
 * (يُفحص عدد الصور عند حفظ المنتج).
 *
 * التسجيل اختياري: الزائر الذي يعرض شيئًا للبيع بدون حساب يرفع صوره أيضًا،
 * ويُمنح رمز زائر يربط إعلانه بمتصفحه.
 *
 * التخزين يتكيّف تلقائيًا مع بيئة التشغيل (راجع lib/uploads.ts) حتى لا يفشل
 * الرفع بخطأ "نظام ملفات للقراءة فقط" على استضافات serverless مثل Vercel.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) await ensureGuestToken(isSecureRequest(req));

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("لم يتم إرسال أي ملف");

    const ext = ALLOWED[file.type];
    if (!ext) return jsonError("صيغة الصورة غير مدعومة — استخدم JPG أو PNG أو WebP");
    if (file.size > MAX_SIZE) return jsonError("حجم الصورة كبير — الحد الأقصى 5 ميجابايت");

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = saveUploadedFile(buffer, ext, name);

    return jsonOk({ url });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر رفع الصورة، حاول مرة أخرى", 500);
  }
}
