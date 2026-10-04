import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { listCategories } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-planet-950">التصنيفات</h1>
        <p className="mt-1 text-sm text-planet-600">كل ما يمكن بيعه وشراؤه على كوكب كراكيب — 16 تصنيفًا</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={`glass card-hover group relative overflow-hidden rounded-3xl p-5 fade-up fade-up-${(i % 4) + 1}`}
          >
            <div
              className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full opacity-15 transition-transform duration-500 group-hover:scale-150"
              style={{ backgroundColor: cat.color }}
            />
            <span
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{ backgroundColor: `${cat.color}1c`, color: cat.color }}
            >
              <CategoryIcon icon={cat.icon} size={30} />
            </span>
            <h2 className="text-base font-extrabold text-planet-950">{cat.name}</h2>
            <p className="mt-1 text-xs font-bold text-planet-500">
              {cat.productsCount ? `${formatNumber(cat.productsCount)} إعلان` : "لا إعلانات بعد"}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-planet-600">
              تصفح <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
