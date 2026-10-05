import Link from "next/link";
import {
  CalendarDays, ChevronDown, CircleDollarSign, Eye, HandCoins, Hash,
  ImageIcon, ListChecks, MapPin, MessageSquareText, Package, Phone, ShieldCheck,
  Tag, Truck,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { CONDITION_MAP, PRICING_TYPE_MAP, PRODUCT_STATUS_MAP } from "@/lib/constants";
import { formatDateTime, formatQuantity, formatUnitPrice } from "@/lib/format";
import { listSpecRows } from "@/lib/specs";
import type { ProductDetail } from "@/lib/types";

const STATUS_EXPLANATION: Record<string, string> = {
  PENDING: "استلمت الإدارة طلب البيع وهو الآن قيد المراجعة.",
  ACTIVE: "تمت الموافقة وأصبح العرض منشورًا للمهتمين.",
  PAUSED: "أوقفت الإدارة عرض هذا المنتج مؤقتًا.",
  REJECTED: "راجعت الإدارة الطلب ولم تتم الموافقة على نشره.",
  HIDDEN: "أخفت الإدارة هذا العرض من واجهة المتجر.",
  SOLD: "اكتملت عملية البيع لهذا المنتج.",
};

/** بطاقة تفاصيل طلب بيع خاصة بصاحبها — عرض فقط بلا أي أدوات تعديل. */
export default function SaleDetailsCard({
  sale,
  highlighted = false,
  defaultOpen = false,
}: {
  sale: ProductDetail;
  highlighted?: boolean;
  defaultOpen?: boolean;
}) {
  const specs = listSpecRows(sale);
  const status = PRODUCT_STATUS_MAP[sale.status];

  return (
    <article
      id={`sale-${sale.id}`}
      className={`scroll-mt-28 overflow-hidden rounded-3xl border bg-white shadow-soft transition-shadow ${
        highlighted
          ? "border-tealx-400 shadow-[0_0_0_5px_rgba(20,184,166,.10)]"
          : "border-planet-100/80"
      }`}
    >
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative min-h-52 bg-planet-50 md:min-h-full">
          {sale.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sale.image}
              alt={sale.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-planet-300">
              <ImageIcon size={40} />
            </span>
          )}
          <span className="absolute start-3 top-3 rounded-full bg-planet-950/75 px-3 py-1 text-[11px] font-extrabold text-white backdrop-blur">
            {sale.imagesCount} {sale.imagesCount === 1 ? "صورة" : "صور"}
          </span>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={sale.status} type="product" />
                <span
                  className="chip border-transparent text-[11px]"
                  style={{ backgroundColor: `${sale.categoryColor}16`, color: sale.categoryColor }}
                >
                  <Tag size={11} /> {sale.categoryName}
                </span>
              </div>
              <h2 className="text-xl font-black leading-snug text-planet-950">{sale.title}</h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-planet-500">
                <span className="inline-flex items-center gap-1"><Hash size={12} /> {sale.code}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDateTime(sale.createdAt)}</span>
              </p>
            </div>
            <p className="shrink-0 text-xl font-black text-planet-600">
              {formatUnitPrice(sale.price, sale.pricingType, sale.unit)}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-planet-100 bg-planet-50/70 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-extrabold text-planet-800">
              <ShieldCheck size={15} className="text-planet-500" />
              {status?.label ?? "حالة العرض"}
            </p>
            <p className="mt-1 text-xs leading-6 text-planet-600">
              {STATUS_EXPLANATION[sale.status] ?? "تتابع الإدارة حالة طلب البيع."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
            <InfoCell icon={Package} label="الكمية" value={formatQuantity(sale.quantity, sale.unit)} />
            <InfoCell icon={CircleDollarSign} label="نوع السعر" value={PRICING_TYPE_MAP[sale.pricingType]?.label ?? "سعر"} />
            <InfoCell icon={MapPin} label="الموقع" value={`${sale.gov}${sale.area ? ` — ${sale.area}` : ""}`} />
            <InfoCell icon={Truck} label="التوصيل" value={sale.hasDelivery ? "متاح" : "غير متاح"} />
          </div>
        </div>
      </div>

      <details className="group border-t border-planet-100" open={defaultOpen || highlighted}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-planet-50/45 px-5 py-4 text-sm font-extrabold text-planet-800 marker:content-none sm:px-6">
          <span className="flex items-center gap-2">
            <Eye size={17} className="text-planet-500" /> كل تفاصيل طلب البيع
          </span>
          <ChevronDown size={17} className="text-planet-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-5 p-5 sm:p-6">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-planet-900">
              <MessageSquareText size={16} className="text-planet-500" /> الوصف المسجل
            </h3>
            <p className="whitespace-pre-line rounded-2xl bg-planet-50/65 p-4 text-sm leading-8 text-planet-700">
              {sale.description}
            </p>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-planet-900">
              <ListChecks size={16} className="text-planet-500" /> بيانات البيع
            </h3>
            <dl className="grid gap-x-6 rounded-2xl border border-planet-100 px-4 sm:grid-cols-2">
              <DetailRow label="حالة المنتج" value={CONDITION_MAP[sale.condition] ?? sale.condition} />
              <DetailRow label="السعر" value={formatUnitPrice(sale.price, sale.pricingType, sale.unit)} />
              <DetailRow label="الكمية" value={formatQuantity(sale.quantity, sale.unit)} />
              <DetailRow label="السعر قابل للتفاوض" value={sale.negotiable ? "نعم" : "لا"} icon={HandCoins} />
              <DetailRow label="التوصيل" value={sale.hasDelivery ? "متاح" : "غير متاح"} />
              <DetailRow label="الموقع" value={`${sale.gov}${sale.area ? ` — ${sale.area}` : ""}`} />
              {sale.contactPhone && <DetailRow label="رقم التواصل المسجل" value={sale.contactPhone} icon={Phone} dir="ltr" />}
              <DetailRow label="آخر تحديث من الإدارة" value={formatDateTime(sale.updatedAt)} />
            </dl>
          </section>

          {specs.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-planet-900">
                <ListChecks size={16} className="text-planet-500" /> المواصفات التي أرسلتها
              </h3>
              <dl className="grid gap-x-6 rounded-2xl border border-planet-100 px-4 sm:grid-cols-2">
                {specs.map((spec) => (
                  <DetailRow key={`${spec.label}-${spec.value}`} label={spec.label} value={spec.value} />
                ))}
              </dl>
            </section>
          )}

          {sale.notes && (
            <section className="rounded-2xl border border-gold-300/45 bg-gold-50/60 p-4">
              <h3 className="text-xs font-extrabold text-gold-700">ملاحظاتك للإدارة</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-7 text-planet-700">{sale.notes}</p>
            </section>
          )}

          {sale.images.length > 1 && (
            <section>
              <h3 className="mb-3 text-sm font-extrabold text-planet-900">الصور المرسلة</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {sale.images.map((image, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`${sale.title} — صورة ${index + 1}`}
                    className="aspect-square w-full rounded-2xl border border-planet-100 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-planet-100 pt-4">
            <p className="flex items-start gap-2 text-xs font-bold leading-6 text-planet-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-tealx-500" />
              هذه البيانات للعرض فقط؛ لا يمكن تغيير طلب البيع بعد إرساله.
            </p>
            {sale.status === "ACTIVE" || sale.status === "SOLD" ? (
              <Link href={`/products/${sale.id}`} className="btn-outline px-4 py-2.5 text-xs">
                <Eye size={14} /> معاينة صفحة العرض
              </Link>
            ) : null}
          </div>
        </div>
      </details>
    </article>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-planet-50/75 p-3">
      <span className="mb-1 flex items-center gap-1 text-[10px] font-bold text-planet-400">
        <Icon size={12} /> {label}
      </span>
      <p className="truncate font-extrabold text-planet-800" title={value}>{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  dir,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-planet-50 py-3 text-sm last:border-0">
      <dt className="flex shrink-0 items-center gap-1.5 font-bold text-planet-500">
        {Icon ? <Icon size={13} /> : null}{label}
      </dt>
      <dd className="text-end font-extrabold text-planet-900" dir={dir}>{value}</dd>
    </div>
  );
}
