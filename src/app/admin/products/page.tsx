import AdminProductsTable from "@/components/admin/ProductsTable";
import { searchProducts } from "@/lib/models/products";
import { PRODUCT_STATUS_MAP } from "@/lib/constants";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "إدارة المنتجات" };

const ALL_STATUSES: ProductStatus[] = ["PENDING", "ACTIVE", "PAUSED", "REJECTED", "HIDDEN", "SOLD"];

/** إدارة المنتجات — مراجعة الإعلانات، قبول/رفض/إخفاء/تمييز/حذف */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const validStatus = searchParams.status && PRODUCT_STATUS_MAP[searchParams.status]
    ? (searchParams.status as ProductStatus)
    : undefined;

  const { items, total } = searchProducts({
    statuses: validStatus ? [validStatus] : ALL_STATUSES,
    q: searchParams.q?.trim() || undefined,
    limit: 60,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-planet-950 sm:text-2xl">إدارة المنتجات</h1>
        <p className="mt-1 text-sm text-planet-600">
          مراجعة الإعلانات الجديدة، قبولها أو رفضها، تمييزها أو إخفائها
        </p>
      </div>
      <AdminProductsTable initialProducts={items} total={total} initialStatus={validStatus ?? "ALL"} initialQ={searchParams.q ?? ""} />
    </div>
  );
}
