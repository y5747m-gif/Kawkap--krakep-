import Link from "next/link";
import { MapPin, Eye, Star, Package, Truck } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import RatingStars from "./RatingStars";
import { formatQuantity, formatUnitPrice, timeAgo } from "@/lib/format";
import { CONDITION_MAP } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { ProductCardData } from "@/lib/types";

/**
 * كرت المنتج (الإعلان):
 * الصورة · الاسم · السعر · الكمية · الموقع · المسافة · البائع · التقييم · المفضلة · التفاصيل
 */
export default function ProductCard({ product }: { product: ProductCardData }) {
  const distance = formatDistance(product.distanceKm ?? null);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group spot sheen relative flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-planet-200 hover:shadow-glowLg"
    >
      {/* الصورة */}
      <div className="relative aspect-[4/3] overflow-hidden bg-planet-50">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-planet-100 to-tealx-500/20 text-planet-400">
            <Package size={40} strokeWidth={1.4} />
          </div>
        )}

        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {product.featured && (
              <span className="chip border-gold-400/50 bg-gold-500/95 text-white shadow">
                <Star size={12} className="fill-white" /> إعلان مميز
              </span>
            )}
            {product.status !== "ACTIVE" && (
              <span className="chip border-white/60 bg-planet-950/80 text-white backdrop-blur">
                {product.status === "SOLD" ? "مباع" : product.status === "PAUSED" ? "موقوف مؤقتًا" : "غير متاح"}
              </span>
            )}
          </div>
        </div>
        <FavoriteButton productId={product.id} initial={product.isFavorite} floating />
      </div>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-[15px] font-extrabold text-planet-950 transition-colors group-hover:text-planet-600">
          {product.title}
        </h3>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-black text-planet-600">
            {formatUnitPrice(product.price, product.pricingType, product.unit)}
          </span>
          {product.negotiable && (
            <span className="chip border-tealx-400/40 bg-tealx-500/10 text-tealx-600">قابل للتفاوض</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-planet-600">
          <span className="font-bold">{formatQuantity(product.quantity, product.unit)}</span>
          <span className="text-planet-300">•</span>
          <span className="font-bold">{CONDITION_MAP[product.condition]}</span>
          {product.hasDelivery && (
            <>
              <span className="text-planet-300">•</span>
              <span className="inline-flex items-center gap-1 text-tealx-600"><Truck size={12} /> توصيل</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1.5 text-xs text-planet-600">
          <MapPin size={13} className="shrink-0 text-tealx-500" />
          <span className="truncate font-bold">
            {product.gov}{product.area ? ` — ${product.area}` : ""}
          </span>
          {distance && (
            <span className="chip ms-auto border-planet-200 bg-planet-50 text-planet-700">{distance}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-planet-50 pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {product.sellerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.sellerAvatar} alt={product.sellerName} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-planet-400 to-tealx-500 text-[10px] font-extrabold text-white">
                {product.sellerName.charAt(0)}
              </span>
            )}
            <span className="truncate text-xs font-bold text-planet-700">{product.sellerName}</span>
          </div>
          <RatingStars rating={product.sellerRating} count={product.sellerRatingCount} size={11} showValue={false} />
        </div>

        <div className="flex items-center justify-between text-[10px] text-planet-400">
          <span className="inline-flex items-center gap-1"><Eye size={11} /> {product.views} مشاهدة</span>
          <span>{timeAgo(product.createdAt)}</span>
        </div>

        <span className="btn-primary w-full px-3 py-2.5 text-sm transition-transform duration-300 group-hover:scale-[1.02]">التفاصيل</span>
      </div>
    </Link>
  );
}
