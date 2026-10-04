import Link from "next/link";
import {
  Store, Eye, PackageCheck, Package, BadgeDollarSign, Star, TrendingUp,
  Plus, ArrowLeftRight, ShoppingBag,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  myProducts, mostViewedProducts, getSellerProductStats,
} from "@/lib/models/products";
import { listSellerOrders, sellerOrdersCount, listSellerReviews } from "@/lib/models/orders";
import { getProfile } from "@/lib/models/users";
import StatusBadge from "@/components/StatusBadge";
import MyProductCard from "@/components/MyProductCard";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";
import { formatMoney, formatQuantity, formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة البائع" };

/** لوحة البائع — إحصائيات، إعلاناتي، والطلبات على منتجاتي */
export default async function SellerPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={Store}
        title="لوحة البائع"
        subtitle="سجل الدخول لتدير إعلاناتك ومبيعاتك من مكان واحد"
        action={<Link href="/login?next=/seller" className="btn-sell px-6 py-3 text-sm">تسجيل الدخول</Link>}
      />
    );
  }

  const stats = getSellerProductStats(user.id);
  const products = myProducts(user.id);
  const top = mostViewedProducts(user.id, 5);
  const orders = listSellerOrders(user.id);
  const ordersCount = sellerOrdersCount(user.id);
  const profile = getProfile(user.id);
  const reviews = listSellerReviews(user.id, 5);

  const cards = [
    { icon: Eye, label: "إجمالي المشاهدات", value: formatNumber(stats.views), color: "from-sky-500/15 to-sky-500/5 text-sky-600" },
    { icon: PackageCheck, label: "الطلبات على منتجاتي", value: formatNumber(ordersCount), color: "from-gold-500/15 to-gold-500/5 text-gold-600" },
    { icon: Package, label: "إعلاناتي", value: formatNumber(stats.total), color: "from-planet-500/15 to-planet-500/5 text-planet-600" },
    { icon: BadgeDollarSign, label: "منتجات مباعة", value: formatNumber(profile?.salesCount ?? 0), color: "from-tealx-500/15 to-tealx-500/5 text-tealx-600" },
    { icon: Star, label: "تقييمي", value: profile?.ratingCount ? `${profile.ratingAvg.toFixed(1)} (${profile.ratingCount})` : "جديد", color: "from-amber-500/15 to-amber-500/5 text-amber-600" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-planet-950">
            <Store size={25} className="text-planet-600" /> لوحة البائع
          </h1>
          <p className="mt-1 text-sm text-planet-600">كل ما يخص نشاطك في البيع — إعلاناتك وطلباتك وإحصائياتك</p>
        </div>
        <Link href="/sell" className="btn-sell px-5 py-3 text-sm">
          <Plus size={16} /> اعرض شيئًا للبيع
        </Link>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`fade-up fade-up-${(i % 4) + 1} glass card-hover rounded-3xl p-5`}>
              <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color}`}>
                <Icon size={20} />
              </span>
              <p className="text-xl font-black text-planet-950">{c.value}</p>
              <p className="text-[11px] font-bold text-planet-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* الطلبات على منتجاتي */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-planet-950">
              <ArrowLeftRight size={19} className="text-planet-500" /> الطلبات على منتجاتي
            </h2>
            {orders.length ? (
              <div className="glass overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-planet-50 bg-planet-50/60 text-xs font-extrabold text-planet-600">
                        <th className="px-4 py-3 text-start">الطلب</th>
                        <th className="px-4 py-3 text-start">المنتجات</th>
                        <th className="px-4 py-3 text-start">الإجمالي</th>
                        <th className="px-4 py-3 text-start">الحالة</th>
                        <th className="px-4 py-3 text-start">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-planet-50">
                      {orders.slice(0, 12).map((o) => (
                        <tr key={o.id} className="transition-colors hover:bg-planet-50/50">
                          <td className="px-4 py-3">
                            <Link href={`/orders/${o.orderCode}`} className="font-black text-planet-700 hover:underline">#{o.orderCode}</Link>
                          </td>
                          <td className="max-w-52 px-4 py-3">
                            <p className="line-clamp-1 font-bold text-planet-800">
                              {o.items.filter((i) => i.sellerId === user.id).map((i) => i.title).join(" · ")}
                            </p>
                            <p className="text-[11px] text-planet-400">
                              {o.items.filter((i) => i.sellerId === user.id).map((i) => formatQuantity(i.quantity, i.unit)).join(" · ")}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-black text-planet-600">{formatMoney(o.sellerTotal)}</td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3 text-xs text-planet-500">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass rounded-3xl px-6 py-8 text-center text-sm font-bold text-planet-600">
                لا توجد طلبات على منتجاتك بعد — شارك إعلاناتك ليصل لأكبر عدد من المهتمين
              </div>
            )}
          </section>

          {/* إعلاناتي */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-planet-950">
              <ShoppingBag size={19} className="text-planet-500" /> إعلاناتي
              <span className="chip border-planet-200 bg-planet-50 text-planet-600">{formatNumber(stats.total)}</span>
            </h2>
            {products.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {products.map((p) => (
                  <MyProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Store}
                title="لم تنشر أي إعلان بعد"
                subtitle="ابدأ أول بيع لك الآن"
                action={<Link href="/sell" className="btn-sell px-6 py-3 text-sm">اعرض شيئًا للبيع</Link>}
              />
            )}
          </section>
        </div>

        {/* الجانب: الأكثر مشاهدة + التقييمات */}
        <div className="space-y-6">
          <section className="glass rounded-3xl p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-planet-950">
              <TrendingUp size={16} className="text-planet-500" /> أكثر المنتجات مشاهدة
            </h2>
            {top.length ? (
              <div className="space-y-3">
                {top.map((p, i) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-planet-50">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      i === 0 ? "bg-gold-500/15 text-gold-600" : "bg-planet-50 text-planet-600"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-extrabold text-planet-900">{p.title}</p>
                      <p className="text-[10px] font-bold text-planet-400">{formatNumber(p.views)} مشاهدة · {formatMoney(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-planet-500">ستظهر هنا منتجاتك الأكثر مشاهدة</p>
            )}
          </section>

          <section className="glass rounded-3xl p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-planet-950">
              <Star size={16} className="fill-gold-400 text-gold-500" /> آخر تقييمات المشترين
            </h2>
            {reviews.length ? (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-planet-50/70 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-planet-800">{r.buyerName}</span>
                      <RatingStars rating={r.rating} size={12} showValue={false} />
                    </div>
                    {r.comment && <p className="mt-1.5 text-xs leading-6 text-planet-600">«{r.comment}»</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-planet-500">لا تقييمات بعد — تُظهر بعد إتمام طلباتك</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
