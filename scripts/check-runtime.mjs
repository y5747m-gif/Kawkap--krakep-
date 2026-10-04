#!/usr/bin/env node
/**
 * فحص بيئة التشغيل قبل إقلاع التطبيق (يُستدعى عبر predev/prestart/prebuild).
 *
 * السبب الأكثر شيوعًا لظهور «500 Internal Server Error» على كل الصفحات هو
 * تشغيل التطبيق بإصدار Node أقدم من 22.13 — وحدة node:sqlite المدمجة غير
 * متوفرة حينها فيفشل استيراد طبقة قاعدة البيانات في كل طلب. هذا الفحص يوقف
 * الإقلاع مبكرًا برسالة واضحة بدل أخطاء 500 مبهمة.
 */
const REQUIRED_MAJOR = 22;
const REQUIRED_MINOR = 13;

const [major, minor] = process.versions.node.split(".").map(Number);
const versionOk =
  major > REQUIRED_MAJOR || (major === REQUIRED_MAJOR && minor >= REQUIRED_MINOR);

let sqliteOk = false;
try {
  const mod = await import("node:sqlite");
  sqliteOk = typeof mod.DatabaseSync === "function";
} catch {
  sqliteOk = false;
}

if (!versionOk || !sqliteOk) {
  console.error(`
┌────────────────────────────────────────────────────────────────┐
│  ⛔  بيئة التشغيل غير مدعومة — لا يمكن تشغيل التطبيق          │
├────────────────────────────────────────────────────────────────┤
  إصدار Node الحالي : v${process.versions.node}
  الإصدار المطلوب   : v22.13.0 أو أحدث

  يعتمد التطبيق على وحدة «node:sqlite» المدمجة في Node.
  بدونها تفشل كل الصفحات وتظهر «500 Internal Server Error».

  الحل:
    1) ثبّت Node v22.13.0 أو أحدث من https://nodejs.org
       (أو باستخدام: nvm install 22 && nvm use 22)
    2) أعد تشغيل الأمر من جديد.

  إن كان إصدارك حديثًا ولا تزال المشكلة، شغّل Node بالخيار:
    node --experimental-sqlite
└────────────────────────────────────────────────────────────────┘
`);
  process.exit(1);
}

console.log(`✓ بيئة التشغيل سليمة (Node v${process.versions.node})`);
