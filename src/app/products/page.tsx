import Link from "next/link";
import { PackageSearch, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductsFilter from "@/components/ProductsFilter";
import EmptyState from "@/components/EmptyState";
import SellButton from "@/components/SellButton";
import { getCurrentUser } from "@/lib/auth";
import { searchProducts, type ProductQuery } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 16;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const page = Math.max(1, Number(sp.page) || 1);

  const query: ProductQuery = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    categorySlug: typeof sp.category === "string" ? sp.category : undefined,
    gov: typeof sp.gov === "string" ? sp.gov : undefined,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    featuredOnly: sp.featured === "1",
    sellerId: typeof sp.seller === "string" ? sp.seller : undefined,
    sort: (sp.sort as ProductQuery["sort"]) || "newest",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    viewerId: user?.id,
  };

  const { items, total } = searchProducts(query);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (typeof v === "string" && k !== "page") params.set(k, v);
    });
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-planet-950">
            {query.featuredOnly ? "إعلانات مميزة" : "تصفح الكراكيب"}
          </h1>
          <p className="mt-1 text-sm text-planet-600">
            {formatNumber(total)} إعلان متاح — أضيفت كلها من عملاء المنصة
          </p>
        </div>
        <div className="hidden sm:block">
          <SellButton size="sm" />
        </div>
      </div>

      <ProductsFilter />

      {items.length ? (
        <>
          <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {page > 1 && (
                <Link href={pageUrl(page - 1)} className="btn-outline px-4 py-2.5 text-sm">
                  <ChevronRight size={16} /> السابق
                </Link>
              )}
              <span className="chip border-planet-200 bg-white text-planet-700">
                صفحة {formatNumber(page)} من {formatNumber(pages)}
              </span>
              {page < pages && (
                <Link href={pageUrl(page + 1)} className="btn-outline px-4 py-2.5 text-sm">
                  التالي <ChevronLeft size={16} />
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="لا توجد نتائج مطابقة"
          subtitle="جرّب تغيير كلمة البحث أو إزالة بعض الفلاتر — أو كن أول من يعرض هذا الشيء للبيع!"
          action={<SellButton size="sm" />}
        />
      )}
    </div>
  );
}
