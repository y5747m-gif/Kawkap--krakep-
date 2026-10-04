/**
 * إعدادات المنصة المركزية (Admin Settings)
 * كل الإعدادات مخزنة في جدول admin_settings وقابلة للتعديل من لوحة الإدارة.
 *
 * ملاحظة مهمة: رقم واتساب المالك موجود في مكان واحد فقط هنا
 * (الافتراضي في constants.ts + القيمة المعدلة في قاعدة البيانات).
 */
import { get, all, run } from "./db";
import { OWNER_WHATSAPP_NUMBER, SETTING_KEYS } from "./constants";
import { toWhatsAppIntl } from "./validate";

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.OWNER_WHATSAPP]: OWNER_WHATSAPP_NUMBER, // 01013178718
  [SETTING_KEYS.REQUIRE_APPROVAL]: "false",
  [SETTING_KEYS.DEMO_MODE]: "true",
};

export function getSetting(key: string): string {
  const row = get<{ value: string }>("SELECT value FROM admin_settings WHERE key = ?", key);
  return row?.value ?? DEFAULTS[key] ?? "";
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString()
  );
}

export function getAllSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM admin_settings");
  const result = { ...DEFAULTS };
  for (const r of rows) result[r.key] = r.value;
  return result;
}

/** هل نعرض البيانات التجريبية؟ (للتطوير فقط — في الإنتاج تُضبط على false) */
export function isDemoMode(): boolean {
  return getSetting(SETTING_KEYS.DEMO_MODE) !== "false";
}

/** هل يتطلب النشر موافقة الإدارة أولًا؟ */
export function requiresApproval(): boolean {
  return getSetting(SETTING_KEYS.REQUIRE_APPROVAL) === "true";
}

/** رقم واتساب المالك بالصيغة المحلية (كما أدخله المالك) */
export function getOwnerWhatsappLocal(): string {
  return getSetting(SETTING_KEYS.OWNER_WHATSAPP) || OWNER_WHATSAPP_NUMBER;
}

/** رقم واتساب المالك بالصيغة الدولية المستخدمة في الروابط: 201013178718 */
export function getOwnerWhatsappIntl(): string {
  const intl = toWhatsAppIntl(getOwnerWhatsappLocal());
  return intl || toWhatsAppIntl(OWNER_WHATSAPP_NUMBER) || "201013178718";
}
