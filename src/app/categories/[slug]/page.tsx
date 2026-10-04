import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import CategoryIcon from "@/components/CategoryIcon";
import SellButton from "@/components/SellButton";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryBySlug, searchProducts } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();

  const user = getCurrentUser();
  const { items, total } = searchProducts({
    categorySlug: category.slug,
    limit: 32,
    viewerId: user?.id,
  });

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6"
        style={{ borderColor: `${category.color}44`, background: `linear-gradient(135deg, ${category.color}14, transparent 70%)` }}
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${category.color}22`, color: category.color }}
          >
            <CategoryIcon icon={category.icon} size={32} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-planet-950">{category.name}</h1>
            <p className="mt-0.5 text-sm text-planet-600">{formatNumber(total)} إعلان في هذا التصنيف</p>
          </div>
        </div>
        <SellButton size="sm" label={`اعرض ${category.name} للبيع`} />
      </div>

      {items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title={`لا توجد إعلانات في «${category.name}» بعد`}
          subtitle="كن أول من يعرض شيئًا في هذا التصنيف!"
          action={<SellButton size="sm" />}
        />
      )}
    </div>
  );
}
