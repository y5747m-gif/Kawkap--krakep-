import AdminOrdersTable from "@/components/admin/OrdersTable";
import { listOrdersForAdmin } from "@/lib/models/orders";
import { ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "إدارة الطلبات" };

/** لوحة الطلبات — كل التفاصيل + واتساب العميل + نسخ التفاصيل + تحديث الحالة */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = searchParams.status && ORDER_STATUSES.some((s) => s.key === searchParams.status)
    ? searchParams.status
    : undefined;
  const q = searchParams.q?.trim() || undefined;

  const { orders, total } = listOrdersForAdmin({ status, q, limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-planet-950 sm:text-2xl">إدارة الطلبات</h1>
        <p className="mt-1 text-sm text-planet-600">
          كل الطلبات محفوظة في النظام — تواصل مع العميل عبر واتساب وحدّث حالة الطلب
        </p>
      </div>
      <AdminOrdersTable initialOrders={orders} total={total} initialStatus={status ?? "ALL"} initialQ={q ?? ""} />
    </div>
  );
}
