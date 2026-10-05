import Link from "next/link";
import {
  ClipboardList, Users, Package, Store, Star, TrendingUp, Flag, Clock,
  PackageCheck, CheckCircle2, RefreshCcw, ChevronLeft, Inbox, UserCheck,
  UserPlus, UsersRound, ShoppingBag, Banknote, CalendarDays, Plus, Settings,
  Megaphone, Phone,
} from "lucide-react";
import { getAdminStats } from "@/lib/models/misc";
import { listOrdersForAdmin } from "@/lib/models/orders";
import StatusBadge from "@/components/StatusBadge";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة الإدارة" };

/** نظرة عامة — متابعة العملاء والطلبات والإعلانات (المسجّلون + الضيوف) */
export default async function AdminDashboard() {
  const stats = getAdminStats();
  const { orders: recentOrders } = listOrdersForAdmin({ limit: 8 });

  const guestShare = stats.totalCustomers
    ? Math.round((stats.guestCustomers / stats.totalCustomers) * 100)
    : 0;
  const orderShare = stats.totalCustomers
    ? Math.round((stats.orderingCustomers / stats.totalCustomers) * 100)
    : 0;

  /** بطاقات متابعة الناس — الكل وليس المسجّلين فقط */
  const peopleCards = [
    {
      icon: UsersRound,
      label: "كل العملاء",
      hint: "مسجّلون + بدون حساب",
      value: stats.totalCustomers,
      color: "from-planet-500 to-tealx-500",
      href: "/admin/users",
    },
    {
      icon: UserCheck,
      label: "عملاء مسجّلون",
      hint: "أنشأوا حسابًا",
      value: stats.registeredCustomers,
      color: "from-violet-500 to-indigo-500",
      href: "/admin/users",
    },
    {
      icon: Phone,
      label: "عملاء بدون حساب",
      hint: "طلبوا أو عرضوا بالهاتف فقط",
      value: stats.guestCustomers,
      color: "from-gold-500 to-orange-500",
      href: "/admin/orders",
    },
    {
      icon: ShoppingBag,
      label: "أرسلوا طلبًا",
      hint: "عميل أرسل طلبًا واحدًا على الأقل",
      value: stats.orderingCustomers,
      color: "from-emerald-500 to-tealx-600",
      href: "/admin/orders",
    },
  ];

  const cards = [
    { icon: ClipboardList, label: "إجمالي الطلبات", value: stats.totalOrders, color: "bg-sky-500/15 text-sky-600", href: "/admin/orders" },
    { icon: Inbox, label: "طلبات جديدة", value: stats.newOrders, color: "bg-planet-500/15 text-planet-600", href: "/admin/orders?status=NEW" },
    { icon: RefreshCcw, label: "قيد التنفيذ", value: stats.processingOrders, color: "bg-amber-500/15 text-amber-600", href: "/admin/orders?status=PROCESSING" },
    { icon: CheckCircle2, label: "طلبات مكتملة", value: stats.completedOrders, color: "bg-tealx-500/15 text-tealx-600", href: "/admin/orders?status=COMPLETED" },
    { icon: Users, label: "حسابات مسجّلة", value: stats.totalUsers, color: "bg-violet-500/15 text-violet-600", href: "/admin/users" },
    { icon: Store, label: "عدد البائعين", value: stats.sellersCount, color: "bg-gold-500/15 text-gold-600", href: "/admin/users" },
    { icon: Megaphone, label: "إعلانات بدون حساب", value: stats.guestListings, color: "bg-fuchsia-500/15 text-fuchsia-600", href: "/admin/products" },
    { icon: Package, label: "عدد المنتجات", value: stats.totalProducts, color: "bg-planet-600/15 text-planet-700", href: "/admin/products" },
    { icon: PackageCheck, label: "منتجات نشطة", value: stats.activeProducts, color: "bg-emerald-500/15 text-emerald-600", href: "/admin/products?status=ACTIVE" },
    { icon: Clock, label: "إعلانات بانتظار المراجعة", value: stats.pendingListings, color: "bg-orange-500/15 text-orange-600", href: "/admin/products?status=PENDING" },
    { icon: TrendingUp, label: "إعلانات جديدة (7 أيام)", value: stats.newListingsThisWeek, color: "bg-cyan-500/15 text-cyan-600", href: "/admin/products" },
    { icon: Star, label: "منتجات مباعة", value: stats.soldProducts, color: "bg-gold-400/20 text-gold-600", href: "/admin/products?status=SOLD" },
    { icon: Flag, label: "بلاغات مفتوحة", value: stats.openReports, color: "bg-rose-500/15 text-rose-600", href: "/admin/reports" },
  ];

  const maxStatusCount = Math.max(1, ...stats.ordersByStatus.map((s) => s.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-planet-950 sm:text-2xl">لوحة إدارة كوكب كراكيب</h1>
          <p className="mt-1 text-sm text-planet-600">
            متابعة لحظية للطلبات والعملاء — ويُحسب كل من تعامل مع الموقع، بحساب أو بدون حساب
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-primary px-4 py-2.5 text-sm">
            <Plus size={16} /> أضف منتجًا
          </Link>
          <Link href="/admin/settings" className="btn-outline px-4 py-2.5 text-sm">
            <Settings size={16} /> الخانات والإعدادات
          </Link>
        </div>
      </div>

      {/* ------- متابعة العملاء: الكل وليس المسجّلين فقط ------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-planet-950">متابعة العملاء</h2>
          <span className="chip border-planet-200 bg-planet-50 text-[11px] text-planet-600">
            {formatNumber(stats.newCustomersThisWeek)} عميل جديد خلال 7 أيام
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {peopleCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={i}
                href={c.href}
                className={`fade-up fade-up-${(i % 4) + 1} card-hover relative overflow-hidden rounded-3xl bg-gradient-to-br ${c.color} p-4 text-white shadow-lift sm:p-5`}
              >
                <span className="absolute -top-8 -start-6 h-24 w-24 rounded-full bg-white/10" />
                <span className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <Icon size={19} />
                </span>
                <p className="relative text-3xl font-black">{formatNumber(c.value)}</p>
                <p className="relative mt-0.5 text-xs font-extrabold">{c.label}</p>
                <p className="relative mt-0.5 text-[10px] font-bold leading-4 text-white/75">{c.hint}</p>
              </Link>
            );
          })}
        </div>

        {/* شرائط النسب */}
        <div className="grid gap-4 rounded-3xl border border-planet-100/60 bg-white p-5 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
              <span className="text-planet-700">نسبة من يتعامل بدون حساب</span>
              <span className="text-gold-600">{guestShare}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-planet-50">
              <div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-orange-500" style={{ width: `${guestShare}%` }} />
            </div>
            <p className="mt-2 text-[11px] font-bold leading-5 text-planet-500">
              {formatNumber(stats.guestOrders)} طلب بدون تسجيل · {formatNumber(stats.guestListings)} إعلان بدون حساب
              {stats.guestSellers > 0 && <> · {formatNumber(stats.guestSellers)} بائع ضيف</>}
            </p>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
              <span className="text-planet-700">نسبة من أرسل طلبًا فعليًا</span>
              <span className="text-tealx-600">{orderShare}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-planet-50">
              <div className="h-full rounded-full bg-gradient-to-l from-tealx-400 to-planet-600" style={{ width: `${orderShare}%` }} />
            </div>
            <p className="mt-2 text-[11px] font-bold leading-5 text-planet-500">
              {formatNumber(stats.registeredOrders)} طلب من حسابات مسجّلة · {formatNumber(stats.guestOrders)} طلب من ضيوف
            </p>
          </div>
        </div>
      </section>

      {/* ------- نبض الطلبات ------- */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: "طلبات اليوم", value: formatNumber(stats.ordersToday), tone: "text-planet-600 bg-planet-500/10" },
          { icon: TrendingUp, label: "طلبات آخر 7 أيام", value: formatNumber(stats.ordersThisWeek), tone: "text-tealx-600 bg-tealx-500/10" },
          { icon: Banknote, label: "قيمة الطلبات", value: formatMoney(stats.ordersValue), tone: "text-gold-600 bg-gold-500/10" },
          { icon: UserPlus, label: "عملاء جدد (7 أيام)", value: formatNumber(stats.newCustomersThisWeek), tone: "text-violet-600 bg-violet-500/10" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-3 rounded-3xl border border-planet-100/60 bg-white p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-planet-950">{s.value}</p>
                <p className="text-[11px] font-bold text-planet-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* بطاقات الإحصائيات */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-planet-950">الطلبات والإعلانات</h2>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={i}
                href={c.href}
                className={`fade-up fade-up-${(i % 4) + 1} card-hover rounded-3xl border border-planet-100/60 bg-white p-4 sm:p-5`}
              >
                <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${c.color}`}>
                  <Icon size={19} />
                </span>
                <p className="text-2xl font-black text-planet-950">{formatNumber(c.value)}</p>
                <p className="mt-0.5 text-[11px] font-bold leading-5 text-planet-500">{c.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* آخر الطلبات */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-planet-950">آخر الطلبات</h2>
            <Link href="/admin/orders" className="chip border-planet-200 bg-planet-50 text-planet-700">
              كل الطلبات <ChevronLeft size={12} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-3xl border border-planet-100/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-planet-50 bg-planet-50/60 text-xs font-extrabold text-planet-600">
                    <th className="px-4 py-3 text-start">رقم الطلب</th>
                    <th className="px-4 py-3 text-start">العميل</th>
                    <th className="px-4 py-3 text-start">الإجمالي</th>
                    <th className="px-4 py-3 text-start">الحالة</th>
                    <th className="px-4 py-3 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-planet-50 bg-white">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-planet-50/40">
                      <td className="px-4 py-3 font-black text-planet-700">
                        <Link href={`/admin/orders?q=${o.orderCode}`} className="hover:underline">#{o.orderCode}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 font-bold text-planet-800">
                          {o.customerName}
                          {!o.buyerId && (
                            <span className="chip border-gold-300 bg-gold-50 px-1.5 py-0 text-[9px] text-gold-700">بدون حساب</span>
                          )}
                        </p>
                        <p className="text-[11px] text-planet-400" dir="ltr">{o.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-planet-600">{formatMoney(o.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-xs text-planet-500">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                  {!recentOrders.length && (
                    <tr><td colSpan={5} className="bg-white px-4 py-8 text-center text-sm text-planet-400">لا طلبات بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* توزيع حالات الطلبات */}
        <section className="h-fit rounded-3xl border border-planet-100/60 bg-white p-5">
          <h2 className="mb-4 text-base font-extrabold text-planet-950">الطلبات حسب الحالة</h2>
          <div className="space-y-3">
            {ORDER_STATUSES.map((s) => {
              const count = stats.ordersByStatus.find((x) => x.status === s.key)?.count ?? 0;
              return (
                <Link key={s.key} href={`/admin/orders?status=${s.key}`} className="block">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-planet-700">{s.label}</span>
                    <span className="text-planet-500">{formatNumber(count)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-planet-50">
                    <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
