import Link from "next/link";
import {
  ClipboardList, Users, Package, Store, Star, TrendingUp, Flag, Clock,
  PackageCheck, CheckCircle2, RefreshCcw, ChevronLeft, Inbox,
} from "lucide-react";
import { getAdminStats } from "@/lib/models/misc";
import { listOrdersForAdmin } from "@/lib/models/orders";
import StatusBadge from "@/components/StatusBadge";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة الإدارة" };

/** نظرة عامة — الإحصائيات الكاملة للمنصة */
export default async function AdminDashboard() {
  const stats = getAdminStats();
  const { orders: recentOrders } = listOrdersForAdmin({ limit: 8 });

  const cards = [
    { icon: ClipboardList, label: "إجمالي الطلبات", value: stats.totalOrders, color: "bg-sky-500/15 text-sky-600", href: "/admin/orders" },
    { icon: Inbox, label: "طلبات جديدة", value: stats.newOrders, color: "bg-planet-500/15 text-planet-600", href: "/admin/orders?status=NEW" },
    { icon: RefreshCcw, label: "قيد التنفيذ", value: stats.processingOrders, color: "bg-amber-500/15 text-amber-600", href: "/admin/orders?status=PROCESSING" },
    { icon: CheckCircle2, label: "طلبات مكتملة", value: stats.completedOrders, color: "bg-tealx-500/15 text-tealx-600", href: "/admin/orders?status=COMPLETED" },
    { icon: Users, label: "إجمالي المستخدمين", value: stats.totalUsers, color: "bg-violet-500/15 text-violet-600", href: "/admin/users" },
    { icon: Store, label: "عدد البائعين", value: stats.sellersCount, color: "bg-gold-500/15 text-gold-600", href: "/admin/users" },
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
      <div>
        <h1 className="text-xl font-black text-planet-950 sm:text-2xl">لوحة إدارة كوكب كراكيب</h1>
        <p className="mt-1 text-sm text-planet-600">نظرة شاملة على المنصة — الطلبات، المستخدمون، والإعلانات</p>
      </div>

      {/* بطاقات الإحصائيات */}
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
                        <p className="font-bold text-planet-800">{o.customerName}</p>
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
