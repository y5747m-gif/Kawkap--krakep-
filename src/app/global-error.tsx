"use client";

/**
 * صفحة الخطأ العام — تُعرض عندما ينهار الجذر (Root Layout) نفسه.
 * تُعرض دون أي أنماط خارجية لذلك تستخدم أنماطًا مضمّنة، وتُبقي التجربة
 * عربية RTL ودودة بدل رسالة «Internal Server Error» الجامدة.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif",
          background: "linear-gradient(180deg, #eef6f3 0%, #f7f9f8 100%)",
          color: "#123c33",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }} aria-hidden>
            🪐
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>
            حدث خطأ في الخادم (500)
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: "0 0 20px", color: "#4a635c" }}>
            نعتذر عن الإزعاج — واجهت المنصة خطأ غير متوقع. حاول مرة أخرى، وإن
            تكرر الخطأ تواصل مع الإدارة.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 14,
                padding: "12px 22px",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                color: "#ffffff",
                background: "#1fa27c",
              }}
            >
              إعادة المحاولة
            </button>
            <a
              href="/"
              style={{
                borderRadius: 14,
                padding: "12px 22px",
                fontSize: 14,
                fontWeight: 700,
                color: "#1fa27c",
                background: "#ffffff",
                border: "1.5px solid #1fa27c55",
                textDecoration: "none",
              }}
            >
              الرئيسية
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
