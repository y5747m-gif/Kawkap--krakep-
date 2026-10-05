import { NextRequest } from "next/server";
import { MIME_BY_EXT, readUploadedFile, uploadsStorageMode } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * مسار احتياطي لتقديم الصور المرفوعة وقت التشغيل عندما لا يمكن حفظها داخل
 * `public/uploads/user` الساكن (مثل Vercel حيث نظام الملفات للقراءة فقط).
 *
 * في البيئات ذات القرص الدائم (التطوير المحلي، استضافة Node تقليدية) تُخدَّم
 * الصور مباشرة كملفات ساكنة من `public/` ولا يصل الطلب إلى هذا المسار أصلًا؛
 * هذا المسار يتولى الأمر فقط حين يبحث Next.js عن أصل ساكن غير موجود بنفس
 * الرابط فيمرّر الطلب لهذا الـ Route Handler.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const ext = file.split(".").pop()?.toLowerCase() || "";
  const mime = MIME_BY_EXT[ext];
  if (!mime) return new Response("Not found", { status: 404 });

  const buffer = readUploadedFile(file);
  if (!buffer) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": uploadsStorageMode === "persistent"
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
}
