"use client";

import { usePathname } from "next/navigation";
import WhatsAppIcon from "./WhatsAppIcon";

/**
 * زر واتساب عائم للتواصل المباشر مع إدارة كوكب كراكيب.
 * الرابط يُبنى في الخادم من الإعداد المركزي (رقم المالك لا يظهر في الواجهة).
 */
export default function FloatingWhatsApp({ url }: { url: string }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="kk-wa-fab glow-pulse"
      aria-label="تواصل مع إدارة كوكب كراكيب على واتساب"
      title="تواصل معنا على واتساب"
    >
      <WhatsAppIcon size={22} />
      <span className="kk-wa-label">تواصل معنا</span>
    </a>
  );
}
