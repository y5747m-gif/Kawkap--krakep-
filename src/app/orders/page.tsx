import Link from "next/link";
import { PackageCheck, ChevronLeft, ShoppingBag } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { listBuyerOrders } from "@/lib/models/orders";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "طلباتي" };

/** طلباتي كمشترٍ */
export default async function OrdersPage() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={PackageCheck}
        title="طلباتك تنتظرك"
        subtitle="سجل الدخول لمتابعة طلباتك ومعرفة حالتها أولًا بأول"
        action={<Link href="/login?next=/orders" className="btn-primary px-6 py-3 text-sm">تسجيل الدخول</Link>}
      />
    );
  }

  const orders = listBuyerOrders(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-planet-950">طلباتي</h1>
          <p className="mt-1 text-sm text-planet-600">كل طلباتك كمشترٍ وحالتها الحالية</p>
        </div>
        <Link href="/seller" className="btn-outline px-4 py-2.5 text-xs">
          <ShoppingBag size={14} /> الطلبات على منتجاتي (لوحة البائع)
        </Link>
      </div>

      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderCode}`}
              className="glass card-hover flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-xl bg-planet-50 px-3 py-1.5 text-sm font-black text-planet-700">
                    #{order.orderCode}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2.5 line-clamp-1 text-sm font-bold text-planet-800">
                  {order.items.map((i) => i.title).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-planet-500">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                <span className="text-lg font-black text-planet-600">{formatMoney(order.total)}</span>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-planet-600">
                  متابعة الطلب <ChevronLeft size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageCheck}
          title="لا توجد طلبات بعد"
          subtitle="ابدأ بتصفح الكراكيب واطلب ما يناسبك"
          action={<Link href="/products" className="btn-primary px-6 py-3 text-sm">تصفح الكراكيب</Link>}
        />
      )}
    </div>
  );
}
