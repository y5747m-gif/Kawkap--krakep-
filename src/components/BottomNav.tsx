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
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-1.5 pt-1">
        {items.map((item) => {
          if (!item) {
            // الزر الأوسط — بيع
            return (
              <div key="sell" className="relative flex justify-center">
                <span className="absolute -top-8 h-16 w-16 rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 blur-xl opacity-50 animate-pulse-glow" />
                <Link
                  href="/sell"
                  aria-label="اعرض شيئًا للبيع"
                  className="btn-sell relative -mt-8 flex h-14 w-14 flex-col items-center justify-center rounded-full animate-pulse-glow"
                >
                  <Plus size={24} strokeWidth={3} />
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
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition-colors ${
                active ? "text-planet-600" : "text-planet-900/50"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.6 : 2} />
              {item.label}
              <span className={`h-1 w-1 rounded-full ${active ? "bg-planet-500" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
