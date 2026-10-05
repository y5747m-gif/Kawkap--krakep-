import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Package, Users, Flag, Settings, ExternalLink, PlusCircle,
} from "lucide-react";
import Logo from "@/components/Logo";
import AdminLogoutButton from "@/components/admin/LogoutButton";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/products/new", label: "إضافة منتج", icon: PlusCircle },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/reports", label: "البلاغات", icon: Flag },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

/** لوحة الإدارة — للمالك فقط (مدير المنصة والمستلم المركزي للطلبات) */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/owner?next=/admin");
  if (!isAdmin(user)) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-planet-950 via-[#062a21] to-planet-950">
      <div className="kk-admin-shell mx-auto flex w-full max-w-7xl gap-6 py-5">
        {/* الشريط الجانبي */}
        <aside className="sticky top-5 hidden h-fit w-60 shrink-0 flex-col rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:flex">
          <div className="mb-6 px-2 [&_span:first-child]:!text-white [&_.text-planet-900]:!text-white [&_.text-planet-500]:!text-tealx-400">
            <Logo size={40} />
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-tealx-300 hover:bg-white/10">
              <ExternalLink size={15} /> عرض الموقع
            </Link>
            <AdminLogoutButton />
          </div>
        </aside>

        {/* المحتوى */}
        <div className="min-w-0 flex-1">
          {/* شريط علوي للموبايل */}
          <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
            <div className="min-w-0 [&_span:first-child]:!text-white [&_.text-planet-900]:!text-white [&_.text-planet-500]:!text-tealx-400">
              <Logo
                size={34}
                className="h-8 w-8"
                textClassName="text-[15px]"
                taglineClassName="hidden"
              />
            </div>
            <Link href="/" className="chip h-10 shrink-0 border-white/20 bg-white/10 px-3.5 text-white">
              <ExternalLink size={14} /> الموقع
            </Link>
          </div>
          <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="chip h-10 shrink-0 gap-1.5 border-white/15 bg-white/10 px-4 text-xs text-white/80"
                >
                  <Icon size={15} className="shrink-0" /> {item.label}
                </Link>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.98] p-4 shadow-lift sm:p-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
