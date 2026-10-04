/**
 * ============================================================
 * الإرسال التلقائي لواتساب المالك (اختياري) — كوكب كراكيب
 * ============================================================
 * السلوك الافتراضي: كل طلب (شراء أو بيع) يُحفظ في قاعدة البيانات ثم
 * يُفتح واتساب المالك تلقائيًا من متصفح العميل برسالة جاهزة (wa.me).
 *
 * هذه الوحدة تضيف طبقة إضافية: لو ضبطت متغيّرات WhatsApp Cloud API
 * في البيئة، يرسل الخادم نفس الرسالة إلى رقم المالك مباشرة —
 * فيصل الطلب حتى لو لم يُكمل العميل فتح واتساب.
 *
 *   KK_WHATSAPP_TOKEN     — Access Token من WhatsApp Cloud API
 *   KK_WHATSAPP_PHONE_ID  — Phone Number ID الخاص بحساب الأعمال
 *
 * بدون هذه المتغيّرات لا يحدث شيء (ولا أي خطأ) ويظل رابط wa.me هو الطريق.
 */
import { getOwnerWhatsappIntl } from "./settings";

const GRAPH_VERSION = "v21.0";

export function isAutoSendEnabled(): boolean {
  return !!(process.env.KK_WHATSAPP_TOKEN && process.env.KK_WHATSAPP_PHONE_ID);
}

/**
 * إرسال رسالة نصية إلى واتساب المالك عبر WhatsApp Cloud API.
 * لا ترمي أي استثناء أبدًا — فشل الإرسال لا يُفشل الطلب.
 */
export async function sendOwnerWhatsAppMessage(text: string): Promise<boolean> {
  const token = process.env.KK_WHATSAPP_TOKEN;
  const phoneId = process.env.KK_WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: getOwnerWhatsappIntl(),
        type: "text",
        text: { preview_url: true, body: text },
      }),
    });

    if (!res.ok) {
      console.error("[whatsapp] تعذر الإرسال التلقائي:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[whatsapp] خطأ في الإرسال التلقائي:", e);
    return false;
  }
}
