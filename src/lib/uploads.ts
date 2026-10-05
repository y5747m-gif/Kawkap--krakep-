/**
 * تخزين صور الرفع (منتجات + صور شخصية) — كوكب كراكيب
 *
 * المشكلة: مجلد `public/uploads/user` مُستثنى من Git عمدًا (ملفات وقت التشغيل)،
 * وعلى Vercel يكون نظام ملفات الدالة **للقراءة فقط** باستثناء `/tmp` — بالضبط
 * نفس المشكلة التي عولجت لقاعدة البيانات في `lib/db.ts`. قبل هذا الإصلاح كانت
 * محاولة `fs.mkdirSync` / `fs.writeFileSync` داخل `public/uploads/user` تفشل
 * بخطأ EROFS على Vercel، فيعود `/api/upload` بخطأ ويظهر للعميل أن الموقع
 * "لا يضيف صور" رغم اختيار الملف وصحّته.
 *
 * الحل: على أي بيئة بنظام ملفات دائم (التطوير المحلي، استضافة Node تقليدية،
 * أو عند ضبط KK_UPLOADS_DIR) تُحفظ الصور مباشرة داخل public/uploads/user
 * وتُخدَّم كملف ساكن عادي بالرابط /uploads/user/<name>. أما على Vercel (أو
 * أي بيئة بنظام ملفات للقراءة فقط) فتُحفظ الصور في /tmp، ويُخدِّمها Route
 * Handler احتياطي عند `src/app/uploads/user/[file]/route.ts` بنفس الرابط
 * تمامًا — فلا داعٍ لتعديل أي كود يتحقق من الرابط `/uploads/...`.
 *
 * ملاحظة: تمامًا مثل قاعدة البيانات المؤقتة على Vercel، فـ /tmp غير دائم
 * وغير مشترك بين نسخ الدالة؛ للإنتاج الحقيقي اضبط KK_UPLOADS_DIR على قرص
 * دائم أو استخدم تخزينًا خارجيًا (S3 / Cloudinary) — راجع README.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const IS_VERCEL = process.env.VERCEL === "1";
const BUNDLED_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "user");

export type UploadStorageMode = "persistent" | "vercel-temporary";

function resolveUploadsDir(): { dir: string; mode: UploadStorageMode } {
  if (process.env.KK_UPLOADS_DIR) {
    const dir = path.resolve(process.env.KK_UPLOADS_DIR);
    fs.mkdirSync(dir, { recursive: true });
    return { dir, mode: "persistent" };
  }

  if (!IS_VERCEL) {
    fs.mkdirSync(BUNDLED_UPLOADS_DIR, { recursive: true });
    return { dir: BUNDLED_UPLOADS_DIR, mode: "persistent" };
  }

  const dir = path.join(os.tmpdir(), "kawkap-krakep-uploads");
  fs.mkdirSync(dir, { recursive: true });
  return { dir, mode: "vercel-temporary" };
}

const resolved = resolveUploadsDir();
export const uploadsDir = resolved.dir;
export const uploadsStorageMode = resolved.mode;

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** حفظ ملف مرفوع وإرجاع رابطه العام — دائمًا بنفس صيغة /uploads/user/<name> */
export function saveUploadedFile(buffer: Buffer, ext: string, name: string): string {
  fs.writeFileSync(path.join(uploadsDir, name), buffer);
  return `/uploads/user/${name}`;
}

/** قراءة ملف مرفوع من التخزين المؤقت (تُستخدم فقط عندما لا يوجد الملف كأصل ساكن) */
export function readUploadedFile(name: string): Buffer | null {
  const safeName = path.basename(name); // منع الخروج خارج المجلد (path traversal)
  if (safeName !== name) return null;
  const filePath = path.join(uploadsDir, safeName);
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}
