"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search, Bell, ShoppingCart, User as UserIcon, LayoutDashboard, LogOut,
  Store, PackageCheck, ChevronDown, Menu, X, Home, Package, LayoutGrid,
  MapPinned, LogIn, Camera,
} from "lucide-react";
import Logo from "./Logo";
import SellButton from "./SellButton";
import type { CurrentUser } from "@/lib/types";

const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/products", label: "الكراكيب", icon: Package },
  { href: "/categories", label: "التصنيفات", icon: LayoutGrid },
  { href: "/map", label: "الخريطة", icon: MapPinned },
];

export default function Header({ user, cartCount: initialCart }: { user: CurrentUser | null; cartCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [unread, setUnread] = useState(user?.unreadNotifications ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // تحديث عدادات السلة والإشعارات عند الأحداث
  useEffect(() => {
    const onCart = () => {
      fetch("/api/cart").then((r) => r.json()).then((d) => setCart(d.count ?? 0)).catch(() => {});
    };
    const onNotif = () => {
      fetch("/api/notifications?count=1").then((r) => r.json()).then((d) => setUnread(d.unread ?? 0)).catch(() => {});
    };
    window.addEventListener("kk:cart-changed", onCart);
    window.addEventListener("kk:notification", onNotif);
    onNotif();
    return () => {
      window.removeEventListener("kk:cart-changed", onCart);
      window.removeEventListener("kk:notification", onNotif);
    };
  }, []);

  // إغلاق القوائم عند تغيير الصفحة
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ظل خفيف للشريط العلوي عند التمرير (يفصله عن المحتوى على الهاتف)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // منع تمرير الصفحة خلف قائمة الهاتف المفتوحة
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (pathname?.startsWith("/admin")) return null; // لوحة الإدارة لها تخطيطها الخاص

  return (
    <>
      {/* طبقة تعتيم خلف قائمة الهاتف */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-planet-950/35 backdrop-blur-[2px] animate-fade-in lg:hidden"
        />
      )}

      <header className={`kk-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="kk-header-row">
          {/* زر قائمة الهاتف */}
          <button
            className="icon-btn lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" aria-label="كوكب كراكيب — الرئيسية" className="flex min-w-0 shrink items-center">
            <Logo
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
              textClassName="text-[15px] sm:text-base md:text-lg"
              taglineClassName="hidden sm:block"
            />
          </Link>

          {/* روابط سطح المكتب */}
          <nav className="ms-3 hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                    active ? "bg-planet-100/80 text-planet-800" : "text-planet-700/80 hover:bg-planet-50 hover:text-planet-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* بحث سطح المكتب */}
          <form
            action="/products"
            className="hidden w-56 items-center gap-2 rounded-2xl border border-planet-200/70 bg-white/85 px-3 py-2 shadow-sm outline-none transition-all focus-within:ring-4 focus-within:ring-planet-100 xl:flex 2xl:w-64"
          >
            <Search size={17} className="shrink-0 text-planet-500" />
            <input
              name="q"
              placeholder="ابحث عن كراكيب... نحاس، كرتون، غسالة"
              className="w-full bg-transparent text-sm outline-none placeholder:text-planet-400/80"
            />
          </form>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            {/* زر البيع — الأجهزة اللوحية (نص مختصر) ثم سطح المكتب */}
            <div className="hidden md:block lg:hidden">
              <SellButton size="sm" label="بيع" />
            </div>
            <div className="hidden lg:block">
              <SellButton size="sm" />
            </div>

            {/* الإشعارات */}
            <Link href={user ? "/notifications" : "/login"} className="icon-btn" aria-label="الإشعارات">
              <Bell size={20} />
              {unread > 0 && (
                <span className="icon-badge bg-gold-500">{unread > 9 ? "9+" : unread}</span>
              )}
            </Link>

            {/* السلة */}
            <Link href="/cart" className="icon-btn" aria-label="سلة المشتريات">
              <ShoppingCart size={20} />
              {cart > 0 && (
                <span className="icon-badge bg-planet-500">{cart > 9 ? "9+" : cart}</span>
              )}
            </Link>

            {/* الحساب */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-10 items-center gap-1 rounded-2xl px-1 transition-colors hover:bg-planet-50 active:scale-95 md:h-11 md:gap-2 md:px-1.5"
                  aria-label="حسابي"
                  aria-expanded={menuOpen}
                >
                  {user.profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profile.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full border-2 border-planet-200 object-cover md:h-9 md:w-9" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 text-sm font-extrabold text-white md:h-9 md:w-9">
                      {user.name.charAt(0)}
                    </span>
                  )}
                  <ChevronDown size={15} className="hidden text-planet-600 md:block" />
                </button>

                {menuOpen && (
                  <div className="absolute end-0 mt-2 w-56 overflow-hidden rounded-2xl border border-planet-100 bg-white shadow-lift animate-fade-in">
                    <div className="border-b border-planet-50 bg-planet-50/60 px-4 py-3">
                      <p className="truncate text-sm font-extrabold text-planet-900">{user.name}</p>
                      <p className="truncate text-xs text-planet-600">{user.phone}</p>
                    </div>
                    <div className="p-1.5 text-sm">
                      <Link href="/account" className="flex items-center gap-2.5 rounded-xl px-3 py-3 font-bold text-planet-800 hover:bg-planet-50">
                        <UserIcon size={17} /> حسابي
                      </Link>
                      <Link href="/seller" className="flex items-center gap-2.5 rounded-xl px-3 py-3 font-bold text-planet-800 hover:bg-planet-50">
                        <Store size={17} /> لوحة البائع
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2.5 rounded-xl px-3 py-3 font-bold text-planet-800 hover:bg-planet-50">
                        <PackageCheck size={17} /> طلباتي
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-3 font-bold text-gold-600 hover:bg-gold-500/10">
                          <LayoutDashboard size={17} /> لوحة الإدارة
                        </Link>
                      )}
                      <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-right font-bold text-rose-600 hover:bg-rose-50">
                        <LogOut size={17} /> تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* الهاتف: أيقونة فقط — سطح المكتب: زر بنص */}
                <Link href="/login" className="icon-btn sm:hidden" aria-label="تسجيل الدخول">
                  <LogIn size={20} />
                </Link>
                <Link href="/login" className="btn-outline hidden h-10 px-4 text-sm sm:inline-flex md:h-11">
                  دخول
                </Link>
              </>
            )}
          </div>
        </div>

        {/* قائمة الهاتف */}
        {mobileOpen && (
          <div className="max-h-[calc(100dvh_-_var(--kk-header-h)_-_var(--kk-safe-top))] overflow-y-auto overscroll-contain border-t border-planet-100 bg-white/95 px-3 pb-5 pt-3 backdrop-blur-xl animate-fade-in lg:hidden">
            <form action="/products" className="flex items-center gap-2 rounded-2xl border border-planet-200 bg-white px-3.5 py-3">
              <Search size={18} className="shrink-0 text-planet-500" />
              <input name="q" placeholder="ابحث عن كراكيب..." className="w-full bg-transparent text-sm outline-none" />
            </form>

            <nav className="mt-3 grid grid-cols-2 gap-2">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-[3rem] items-center gap-2.5 rounded-2xl px-3.5 text-sm font-bold transition-colors ${
                      active ? "bg-planet-500 text-white shadow-glow" : "bg-planet-50 text-planet-800"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/orders" className="flex min-h-[3rem] items-center gap-2.5 rounded-2xl bg-planet-50 px-3.5 text-sm font-bold text-planet-800">
                <PackageCheck size={18} className="shrink-0" /> <span className="truncate">طلباتي</span>
              </Link>
              <Link href="/seller" className="flex min-h-[3rem] items-center gap-2.5 rounded-2xl bg-planet-50 px-3.5 text-sm font-bold text-planet-800">
                <Store size={18} className="shrink-0" /> <span className="truncate">لوحة البائع</span>
              </Link>
            </div>

            <Link href="/sell" className="btn-sell mt-3 flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm">
              <Camera size={18} strokeWidth={2.4} /> اعرض شيئًا للبيع
            </Link>

            {user ? (
              <button
                onClick={logout}
                className="mt-2 flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 text-sm font-bold text-rose-600"
              >
                <LogOut size={17} /> تسجيل الخروج
              </button>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-outline min-h-[3rem] text-sm">دخول</Link>
                <Link href="/register" className="btn-primary min-h-[3rem] text-sm">حساب جديد</Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
