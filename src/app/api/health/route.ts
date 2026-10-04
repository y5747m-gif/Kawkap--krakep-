import { databaseStorageMode, get } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** فحص جاهزية بسيط للمراقبة بعد النشر، من دون كشف أي بيانات حساسة. */
export async function GET() {
  try {
    const result = get<{ ok: number }>("SELECT 1 AS ok");
    if (result?.ok !== 1) throw new Error("Database check returned an invalid result");

    return Response.json(
      {
        ok: true,
        database: "ready",
        storage: databaseStorageMode,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
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
