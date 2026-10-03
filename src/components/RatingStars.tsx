import { Star } from "lucide-react";

/** عرض التقييم بالنجوم (SVG — بدون Emojis) */
export default function RatingStars({
  rating, count, size = 13, showValue = true,
}: { rating: number; count?: number; size?: number; showValue?: boolean }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1" dir="ltr" title={`التقييم ${rating} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= rounded
              ? "fill-gold-400 text-gold-400"
              : i - 0.5 === rounded
                ? "fill-gold-400/50 text-gold-400"
                : "fill-planet-100 text-planet-200"
          }
        />
      ))}
      {showValue && (
        <span className="text-xs font-bold text-planet-700">
          {rating > 0 ? rating.toFixed(1) : "جديد"}
          {count !== undefined && count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}
