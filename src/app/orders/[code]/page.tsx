import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CircleCheckBig, PackageSearch, ChevronLeft, MapPin, Truck, NotebookPen,
  CalendarDays, Hash, MessageSquareQuote,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import CopyButton from "@/components/CopyButton";
import { OpenOwnerWhatsAppButton, ReviewForm } from "@/components/OrderBits";
import RatingStars from "@/components/RatingStars";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByCode } from "@/lib/models/orders";
import { createOwnerOrderLink, createOwnerInquiryLink } from "@/lib/whatsapp";
import { getBaseUrl } from "@/lib/http";
import { formatMoney, formatQuantity, formatDateTime, formatNumber } from "@/lib/format";
import { ORDER_TIMELINE, DELIVERY_METHOD_MAP, ORDER_STATUS_MAP } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** صفحة الطلب — تعرض حالة النجاح بعد الإنشاء + تتبع الحالة + التقييم */
export default async function OrderPage({
  params, searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const order = getOrderByCode(code);
  if (!order) notFound();

  const user = await getCurrentUser();
  const baseUrl = getBaseUrl();
  const whatsappUrl = createOwnerOrderLink(order, baseUrl);
  const inquiryUrl = createOwnerInquiryLink(order, baseUrl);
  const isNew = sp.new === "1";
  const isBuyer = user?.id === order.buyerId;
  const canReview = isBuyer && order.status === "COMPLETED" && !order.review;

  const timelineIndex = ORDER_TIMELINE.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REJECTED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ============ حالة النجاح ============ */}
      {isNew && (
        <div className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-planet-600 via-planet-700 to-planet-900 p-5 text-center text-white shadow-lift sm:p-8">
          <div className="pointer-events-none absolute -top-16 start-1/4 h-48 w-48 rounded-full bg-tealx-400/30 blur-3xl" />
          <span className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <CircleCheckBig size={42} className="text-tealx-300" />
          </span>
          <h1 className="relative text-2xl font-black">تم إنشاء طلبك بنجاح.</h1>
          <p className="relative mt-2 text-sm text-white/80">سيتم التواصل معك لتأكيد التفاصيل.</p>
          <div className="relative mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 backdrop-blur">
            <span className="text-xs font-bold text-white/70">رقم الطلب:</span>
            <span className="text-lg font-black tracking-wide">#{order.orderCode}</span>
          </div>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            <a href="#order-details" className="btn glass-dark rounded-2xl px-6 py-3.5 text-sm text-white hover:bg-white/20">
              <PackageSearch size={17} /> متابعة الطلب
            </a>
            <OpenOwnerWhatsAppButton url={whatsappUrl} orderCode={order.orderCode} />
          </div>
        </div>
      )}

      {/* ============ رأس الطلب ============ */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5" id="order-details">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-xl bg-planet-50 px-3.5 py-2 text-base font-black text-planet-800">
            <Hash size={15} /> {order.orderCode}
          </span>
          <StatusBadge status={order.status} />
          <CopyButton text={order.orderCode} label="نسخ الرقم" className="chip border-planet-200 bg-white text-planet-600" />
        </div>
        <div className="flex items-center gap-2">
          <OpenOwnerWhatsAppButton url={whatsappUrl} orderCode={order.orderCode} variant="small" />
          <a
            href={inquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chip border-sky-200 bg-sky-50 text-sky-700"
            title="استفسار عن الطلب عبر واتساب"
          >
            <MessageSquareQuote size={13} /> استفسار
          </a>
        </div>
      </div>

      {/* ============ الخط الزمني ============ */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <h2 className="mb-5 text-base font-extrabold text-planet-950">مسار الطلب</h2>
        {isCancelled ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-extrabold text-rose-700">
            {ORDER_STATUS_MAP[order.status]?.label} — {formatDateTime(order.updatedAt)}
          </div>
        ) : (
          <div className="flex items-start justify-between">
            {ORDER_TIMELINE.map((s, i) => {
              const meta = ORDER_STATUS_MAP[s];
              const reached = i <= timelineIndex;
              const current = i === timelineIndex;
              return (
                <div key={s} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : reached ? "bg-planet-500" : "bg-planet-100"}`} />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all ${
                        current
                          ? "scale-125 border-planet-500 bg-planet-500 text-white shadow-glow"
                          : reached
                            ? "border-planet-500 bg-planet-500 text-white"
                            : "border-planet-200 bg-white text-planet-300"
                      }`}
                    >
                      {formatNumber(i + 1)}
                    </span>
                    <div className={`h-1 flex-1 rounded-full ${i === ORDER_TIMELINE.length - 1 ? "opacity-0" : i < timelineIndex ? "bg-planet-500" : "bg-planet-100"}`} />
                  </div>
                  <span className={`mt-2 text-[9px] font-extrabold leading-4 sm:text-[10px] ${reached ? "text-planet-800" : "text-planet-300"}`}>
                    {meta?.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ بنود الطلب ============ */}
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-planet-50 bg-planet-50/50 px-5 py-3.5">
          <h2 className="text-sm font-extrabold text-planet-800">المنتجات ({formatNumber(order.items.length)})</h2>
        </div>
        <div className="divide-y divide-planet-50">
          {order.items.map((item) => (
            <Link key={item.id} href={`/products/${item.productId}`} className="flex items-center gap-3.5 p-4 transition-colors hover:bg-planet-50/50">
              {item.productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.productImage} alt="" className="h-16 w-20 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-20 items-center justify-center rounded-2xl bg-planet-100 text-planet-300">
                  <PackageSearch size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-extrabold text-planet-950">{item.title}</p>
                <p className="text-xs text-planet-500">
                  البائع: {item.sellerName} · {formatQuantity(item.quantity, item.unit)}
                </p>
                {item.productGov && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-planet-400">
                    <MapPin size={11} /> {item.productGov}{item.productArea ? ` — ${item.productArea}` : ""}
                  </p>
                )}
              </div>
              <span className="text-sm font-black text-planet-600">{formatMoney(item.lineTotal)}</span>
            </Link>
          ))}
        </div>
        <div className="space-y-2 border-t border-planet-100 bg-planet-50/40 px-5 py-4 text-sm">
          <div className="flex justify-between text-planet-600">
            <span>إجمالي المنتجات</span>
            <span className="font-bold">{formatMoney(order.itemsPrice)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-extrabold text-planet-900">الإجمالي النهائي</span>
            <span className="font-black text-planet-600">{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      {/* ============ بيانات الطلب ============ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 text-sm font-extrabold text-planet-900">بيانات العميل</h3>
          <ul className="space-y-2 text-sm text-planet-700">
            <li className="font-bold">{order.customerName}</li>
            <li dir="ltr" className="text-start font-bold text-planet-600">{order.customerPhone}</li>
            <li className="flex items-start gap-1.5">
              <MapPin size={14} className="mt-1 shrink-0 text-tealx-500" />
              <span>{[order.gov, order.area, order.address].filter(Boolean).join(" — ") || "—"}</span>
            </li>
          </ul>
        </div>
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 text-sm font-extrabold text-planet-900">تفاصيل التسليم</h3>
          <ul className="space-y-2.5 text-sm text-planet-700">
            <li className="flex items-center gap-2">
              <Truck size={15} className="text-planet-500" />
              {DELIVERY_METHOD_MAP[order.deliveryMethod]}
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays size={15} className="text-planet-500" />
              {formatDateTime(order.createdAt)}
            </li>
            {order.notes && (
              <li className="flex items-start gap-2">
                <NotebookPen size={15} className="mt-0.5 shrink-0 text-planet-500" />
                {order.notes}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ============ التقييم ============ */}
      {canReview && (
        <div className="rounded-3xl border border-gold-400/40 bg-gradient-to-br from-gold-500/10 to-white p-6">
          <h2 className="mb-1.5 text-base font-extrabold text-planet-950">قيّم تجربتك مع البائع</h2>
          <p className="mb-4 text-xs font-bold text-planet-500">
            تقييمك يساعد بقية المشترين — متاح فقط بعد إتمام الطلب
          </p>
          <ReviewForm orderCode={order.orderCode} />
        </div>
      )}

      {order.review && (
        <div className="glass rounded-3xl p-4 sm:p-6">
          <h2 className="mb-3 text-base font-extrabold text-planet-950">تقييمك للطلب</h2>
          <RatingStars rating={order.review.rating} size={17} showValue={false} />
          {order.review.comment && (
            <p className="mt-2.5 rounded-2xl bg-planet-50/70 px-4 py-3 text-sm leading-7 text-planet-700">
              {order.review.comment}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Link href="/orders" className="btn-outline px-5 py-3 text-sm">
          كل طلباتي <ChevronLeft size={15} />
        </Link>
        <Link href="/products" className="btn-ghost px-5 py-3 text-sm">تصفح المزيد</Link>
      </div>
    </div>
  );
}
