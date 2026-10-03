/**
 * أدوات واتساب لجهة العميل (المتصفح) — وحدة نقية بدون أي اعتماديات خادم.
 * بناء الروابط يتم هنا، أما فتحها فيتم عبر دوال WhatsApp Utility.
 */
import { createWhatsAppOrderLink } from "./whatsapp-link";

export { createWhatsAppOrderLink, openCustomerWhatsApp, openOwnerWhatsApp } from "./whatsapp-link";
