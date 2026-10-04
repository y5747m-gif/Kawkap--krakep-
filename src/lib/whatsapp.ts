/**
 * ============================================================
 * WhatsApp Utility — كوكب كراكيب (جهة الخادم)
 * ============================================================
 * الخدمة المستقلة لكل ما يتعلق بواتساب:
 *   generateOrderWhatsAppMessage() — بناء رسالة الطلب الديناميكية
 *   createWhatsAppOrderLink()      — تجهيز رابط wa.me
 *   openOwnerWhatsApp()            — فتح محادثة المالك (جهة العميل)
 *   openCustomerWhatsApp()         — فتح محادثة العميل (من لوحة الإدارة)
 *
 * رقم المالك يأتي من الإعدادات المركزية (settings.ts) في مكان واحد فقط،
 * القيمة الافتراضية 01013178718 وتُستخدم في الروابط بالصيغة الدولية +201013178718.
 * يمكن تغيير طريقة الإرسال لاحقًا (WhatsApp Business API) من هذه الوحدة فقط
 * دون تعديل بقية النظام.
 */
import { getOwnerWhatsappIntl } from "./settings";
import { toWhatsAppIntl } from "./validate";
import { generateOrderWhatsAppMessage as buildMessage } from "./whatsapp-message";
import { SITE_NAME } from "./constants";
import type { OrderWithItems } from "./types";

export { generateOrderWhatsAppMessage } from "./whatsapp-message";

/** رابط WhatsApp جاهز لأي رقم بالصيغة الدولية (أرقام فقط) */
export function createWhatsAppOrderLink(phoneIntl: string, message: string): string {
  return `https://wa.me/${phoneIntl}?text=${encodeURIComponent(message)}`;
}

/** رابط محادثة المالك برسالة طلب مُجهزة — يُبنى من الإعدادات المركزية */
export function createOwnerOrderLink(order: OrderWithItems, baseUrl: string): string {
  const firstProduct = order.items[0];
  const link = firstProduct ? `${baseUrl}/products/${firstProduct.productId}` : undefined;
  const message = buildMessage(order, link);
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), message);
}

/** رسالة استفسار العميل عن طلبه (تُفتح على رقم المالك) */
export function createOwnerInquiryLink(order: OrderWithItems, baseUrl: string): string {
  const message = `🪐 ${SITE_NAME}\nاستفسار عن الطلب رقم #${order.orderCode}\nالاسم: ${order.customerName}\nالهاتف: ${order.customerPhone}\nرابط الطلب: ${baseUrl}/orders/${order.orderCode}`;
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), message);
}

/** تحويل أي صيغة رقم إلى الصيغة الدولية لروابط wa.me */
export { toWhatsAppIntl };
