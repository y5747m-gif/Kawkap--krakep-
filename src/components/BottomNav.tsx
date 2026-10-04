"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PackageCheck, User as UserIcon, Plus } from "lucide-react";

/** التنقل السفلي للهاتف — زر البيع في المنتصف أكبر ومضيء */
export default function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/categories", label: "التصنيفات", icon: LayoutGrid },
    null, // زر البيع الأوسط
    { href: "/orders", label: "الطلبات", icon: PackageCheck },
    { href: "/account", label: "حسابي", icon: UserIcon },
  ];

  return (
    <nav className="kk-bottom-nav" aria-label="التنقل السريع">
      <div className="kk-bottom-row">
        {items.map((item) => {
          if (!item) {
            // الزر الأوسط — بيع
            return (
              <div key="sell" className="relative h-full">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-4 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 opacity-40 blur-xl"
                />
                <Link
                  href="/sell"
                  aria-label="اعرض شيئًا للبيع"
                  aria-current={pathname?.startsWith("/sell") ? "page" : undefined}
                  className="btn-sell kk-sell-fab animate-pulse-glow"
                >
                  <Plus size={22} strokeWidth={3} />
                  <span className="text-[10px] font-extrabold leading-none">بيع</span>
                </Link>
              </div>
            );
          }
          const active =
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active ? "true" : "false"}
              aria-current={active ? "page" : undefined}
              className="kk-nav-item"
            >
              <span className="kk-nav-icon">
                <Icon size={21} strokeWidth={active ? 2.6 : 2} />
              </span>
              <span className="kk-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
