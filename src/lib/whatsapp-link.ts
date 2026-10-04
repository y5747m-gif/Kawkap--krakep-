/**
 * الوحدة النقية لبناء روابط WhatsApp — تصلح للاستخدام في المتصفح والخادم.
 * رقم المالك لا يظهر في الواجهة، يُستخدم فقط داخل روابط wa.me.
 */
import { toWhatsAppIntl } from "./validate";

/** رابط wa.me لأي رقم مع رسالة جاهزة */
export function createWhatsAppOrderLink(phone: string, message: string): string {
  const intl = toWhatsAppIntl(phone);
  if (!intl) return "#";
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/** فتح محادثة واتساب مع عميل — من لوحة الإدارة */
export function openCustomerWhatsApp(phone: string, message: string): void {
  const url = createWhatsAppOrderLink(phone, message);
  if (url !== "#" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener");
  }
}

/** فتح رابط واتساب المالك المُعد مسبقًا (يُبنى في الخادم من الإعدادات) */
export function openOwnerWhatsApp(url: string): void {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
}
