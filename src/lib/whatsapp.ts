/**
 * ============================================================
 * WhatsApp Utility — كوكب كراكيب (جهة الخادم)
 * ============================================================
 * الخدمة المستقلة لكل ما يتعلق بواتساب:
 *   generateOrderWhatsAppMessage()   — بناء رسالة الطلب الديناميكية
 *   generateListingWhatsAppMessage() — بناء رسالة «أريد بيع هذا الشيء»
 *   createWhatsAppOrderLink()        — تجهيز رابط wa.me
 *   createOwnerOrderLink()           — طلب شراء → واتساب المالك
 *   createOwnerListingLink()         — طلب بيع (إعلان جديد) → واتساب المالك
 *   createOwnerInquiryLink()         — استفسار العميل → واتساب المالك
 *   createOwnerContactLink()         — تواصل عام → واتساب المالك
 *
 * رقم المالك يأتي من الإعدادات المركزية (settings.ts) في مكان واحد فقط،
 * القيمة الافتراضية 01013178718 وتُستخدم في الروابط بالصيغة الدولية +201013178718.
 * يمكن تغيير طريقة الإرسال لاحقًا (WhatsApp Business API) من هذه الوحدة فقط
 * دون تعديل بقية النظام.
 */
import { getOwnerWhatsappIntl } from "./settings";
import { toWhatsAppIntl } from "./validate";
import {
  generateOrderWhatsAppMessage as buildOrderMessage,
  generateListingWhatsAppMessage as buildListingMessage,
  generateInquiryMessage as buildInquiryMessage,
  generateContactMessage as buildContactMessage,
  type ListingMessageData,
} from "./whatsapp-message";
import type { OrderWithItems } from "./types";

export {
  generateOrderWhatsAppMessage,
  generateListingWhatsAppMessage,
  generateCustomerMessage,
  generateInquiryMessage,
  generateContactMessage,
} from "./whatsapp-message";
export type { ListingMessageData } from "./whatsapp-message";

/** رابط WhatsApp جاهز لأي رقم بالصيغة الدولية (أرقام فقط) */
export function createWhatsAppOrderLink(phoneIntl: string, message: string): string {
  return `https://wa.me/${phoneIntl}?text=${encodeURIComponent(message)}`;
}

/** رابط محادثة المالك برسالة طلب شراء مُجهزة — يُبنى من الإعدادات المركزية */
export function createOwnerOrderLink(order: OrderWithItems, baseUrl: string): string {
  const firstProduct = order.items[0];
  const link = firstProduct ? `${baseUrl}/products/${firstProduct.productId}` : undefined;
  const message = buildOrderMessage(order, link);
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), message);
}

/**
 * رابط محادثة المالك برسالة «طلب بيع» — تُرسل تلقائيًا عندما يضغط
 * العميل «إرسال الطلب» في معالج البيع.
 */
export function createOwnerListingLink(data: ListingMessageData): string {
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), buildListingMessage(data));
}

/** رسالة استفسار العميل عن طلبه (تُفتح على رقم المالك) */
export function createOwnerInquiryLink(order: OrderWithItems, baseUrl: string): string {
  const message = buildInquiryMessage(order, `${baseUrl}/orders/${order.orderCode}`);
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), message);
}

/** رابط تواصل عام مع المالك (زر واتساب العائم) */
export function createOwnerContactLink(pageUrl?: string): string {
  return createWhatsAppOrderLink(getOwnerWhatsappIntl(), buildContactMessage(pageUrl));
}

/** تحويل أي صيغة رقم إلى الصيغة الدولية لروابط wa.me */
export { toWhatsAppIntl };
