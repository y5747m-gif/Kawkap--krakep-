import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** رفع صور المنتجات والصور الشخصية — حتى 8 صور للمنتج (يُفحص عدد الصور عند حفظ المنتج) */
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("لم يتم إرسال أي ملف");

    const ext = ALLOWED[file.type];
    if (!ext) return jsonError("صيغة الصورة غير مدعومة — استخدم JPG أو PNG أو WebP");
    if (file.size > MAX_SIZE) return jsonError("حجم الصورة كبير — الحد الأقصى 5 ميجابايت");

    const dir = path.join(process.cwd(), "public", "uploads", "user");
    fs.mkdirSync(dir, { recursive: true });

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, name), buffer);

    return jsonOk({ url: `/uploads/user/${name}` });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر رفع الصورة، حاول مرة أخرى", 500);
  }
}
