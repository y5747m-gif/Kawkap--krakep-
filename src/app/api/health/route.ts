import { databaseStorageMode, get } from "@/lib/db";
import { signedSessionsEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** فحص جاهزية بسيط للمراقبة بعد النشر، من دون كشف أي بيانات حساسة. */
export async function GET() {
  try {
    const result = get<{ ok: number }>("SELECT 1 AS ok");
    if (result?.ok !== 1) throw new Error("Database check returned an invalid result");

    // على التخزين المؤقت (Vercel) بدون KK_SESSION_SECRET تُفقد الجلسة بين
    // الدوال فلا تفتح لوحة الإدارة — نُظهر ذلك هنا لتسهيل التشخيص.
    const sharedDatabase = databaseStorageMode === "persistent";
    const body: Record<string, unknown> = {
      ok: true,
      database: "ready",
      storage: databaseStorageMode,
      sessions: sharedDatabase
        ? "database"
        : signedSessionsEnabled()
          ? "signed"
          : "unreliable",
      timestamp: new Date().toISOString(),
    };
    if (!sharedDatabase && !signedSessionsEnabled()) {
      body.warning =
        "KK_SESSION_SECRET غير مضبوط — على هذه الاستضافة لن تُحفظ جلسة الدخول بين الدوال ولن تفتح لوحة الإدارة حتى تضبطه.";
    }

    return Response.json(body, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      {
        ok: false,
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
