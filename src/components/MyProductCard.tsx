import Link from "next/link";
import { Eye, FileText, PackageSearch } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatQuantity, formatUnitPrice, formatNumber, timeAgo } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

/** كرت طلب بيع للعميل — عرض فقط، بلا تعديل أو إيقاف أو حذف. */
export default function MyProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="flex gap-4 p-4">
        <Link href={`/sales?item=${product.id}#sale-${product.id}`} className="relative shrink-0">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.title} className="h-24 w-28 rounded-2xl object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="flex h-24 w-28 items-center justify-center rounded-2xl bg-planet-100 text-planet-300">
              <PackageSearch size={26} />
            </span>
          )}
          {product.featured && (
            <span className="absolute start-1.5 top-1.5 rounded-full bg-gold-500 px-2 py-0.5 text-[9px] font-black text-white">
              مميز
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sales?item=${product.id}#sale-${product.id}`}
              className="line-clamp-1 text-sm font-extrabold text-planet-950 hover:text-planet-600"
            >
              {product.title}
            </Link>
            <StatusBadge status={product.status} type="product" />
          </div>
          <p className="mt-1 text-sm font-black text-planet-600">
            {formatUnitPrice(product.price, product.pricingType, product.unit)}
            <span className="ms-2 text-[11px] font-bold text-planet-400">
              {formatQuantity(product.quantity, product.unit)}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-3 text-[11px] font-bold text-planet-500">
            <span className="inline-flex items-center gap-1"><Eye size={12} /> {formatNumber(product.views)} مشاهدة</span>
            <span>{timeAgo(product.createdAt)}</span>
          </p>

          <div className="mt-3">
            <Link href={`/sales?item=${product.id}#sale-${product.id}`} className="btn-outline px-3 py-2.5 text-xs sm:py-1.5">
              <FileText size={12} /> عرض تفاصيل البيع
            </Link>
          </div>
        </div>
      </div>
      <p className="border-t border-planet-100 bg-planet-50/55 px-4 py-2.5 text-[10px] font-bold text-planet-500">
        تفاصيل طلب البيع محفوظة للعرض فقط، وتحدّث الإدارة حالته.
      </p>
    </div>
  );
}
