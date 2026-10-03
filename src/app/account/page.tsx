import Link from "next/link";
import {
  User as UserIcon, Store, PackageCheck, Heart, MessagesSquare, Bell, Settings,
  ChevronLeft, Star, TrendingDown, MapPin, MessagesSquare as ChatIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { myProducts, listFavorites, getSellerProductStats } from "@/lib/models/products";
import { listBuyerOrders } from "@/lib/models/orders";
import { listConversations, getProfile } from "@/lib/models/users";
import { listNotifications } from "@/lib/models/misc";
import MyProductCard from "@/components/MyProductCard";
import ProductCard from "@/components/ProductCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { ProfileEditForm, PasswordChangeForm } from "@/components/ProfileForm";
import { formatMoney, formatNumber, timeAgo } from "@/lib/format";
import { createWhatsAppOrderLink } from "@/lib/whatsapp-link";

export const dynamic = "force-dynamic";

export const metadata = { title: "حسابي" };

const TABS = [
  { key: "overview", label: "نظرة عامة", icon: UserIcon },
  { key: "profile", label: "بياناتي", icon: UserIcon },
  { key: "selling", label: "أنا أبيع", icon: Store },
  { key: "orders", label: "طلباتي", icon: PackageCheck },
  { key: "favorites", label: "المفضلة", icon: Heart },
  { key: "chats", label: "المحادثات", icon: MessagesSquare },
  { key: "settings", label: "الإعدادات", icon: Settings },
];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const user = getCurrentUser();
  if (!user) {
    return (
      <EmptyState
        icon={UserIcon}
        title="حسابك على كوكب كراكيب"
        subtitle="حساب واحد يكفي للبيع والشراء — إعلاناتك، طلباتك، مفضلتك ومحادثاتك في مكان واحد"
        action={<Link href="/login?next=/account" className="btn-sell px-6 py-3 text-sm">تسجيل الدخول / إنشاء حساب</Link>}
      />
    );
  }

  const tab = searchParams.tab && TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab : "overview";
  const profile = getProfile(user.id);
  const products = myProducts(user.id);
  const stats = getSellerProductStats(user.id);
  const orders = listBuyerOrders(user.id);
  const favorites = listFavorites(user.id);
  const chats = listConversations(user.id);
  const notifications = listNotifications(user.id, 8);

  return (
    <div className="space-y-6">
      {/* رأس الحساب */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-planet-800 via-planet-900 to-planet-950 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -top-16 end-10 h-48 w-48 rounded-full bg-tealx-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={user.name} className="h-20 w-20 rounded-3xl border-2 border-white/25 object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-tealx-400 to-planet-500 text-3xl font-black">
              {user.name.charAt(0)}
            </span>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black">{user.name}</h1>
            <p className="mt-0.5 text-xs text-white/60" dir="ltr">{user.phone}{user.email ? ` · ${user.email}` : ""}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="glass-dark rounded-full px-3 py-1 text-[11px] font-bold text-tealx-300">
                <MapPin size={11} className="inline" /> {profile?.gov ?? "لم تحدد الموقع"}
              </span>
              <RatingStars rating={profile?.ratingAvg ?? 0} count={profile?.ratingCount ?? 0} size={12} />
              {user.role === "ADMIN" && (
                <Link href="/admin" className="chip border-gold-400/40 bg-gold-500/20 text-gold-300">لوحة الإدارة</Link>
              )}
            </div>
          </div>
          <div className="hidden gap-3 sm:flex">
            {[
              { label: "إعلاناتي", value: stats.total },
              { label: "مبيعاتي", value: profile?.salesCount ?? 0 },
              { label: "طلباتي", value: orders.length },
            ].map((s, i) => (
              <div key={i} className="glass-dark rounded-2xl px-5 py-3 text-center">
                <p className="text-xl font-black">{formatNumber(s.value)}</p>
                <p className="text-[10px] font-bold text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/account?tab=${t.key}`}
              className={`chip shrink-0 px-4 py-2.5 text-sm ${
                active
                  ? "border-planet-500 bg-gradient-to-l from-planet-500 to-tealx-500 text-white shadow-glow"
                  : "glass border-white/70 text-planet-700"
              }`}
            >
              <Icon size={15} /> {t.label}
            </Link>
          );
        })}
        <Link href="/notifications" className="chip glass relative shrink-0 border-white/70 px-4 py-2.5 text-sm text-planet-700">
          <Bell size={15} /> الإشعارات
          {user.unreadNotifications > 0 && (
            <span className="absolute -top-1.5 -start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-black text-white">
              {user.unreadNotifications}
            </span>
          )}
        </Link>
      </div>

      {/* ================= نظرة عامة ================= */}
      {tab === "overview" && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="glass rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-planet-950">
              <Store size={18} className="text-planet-500" /> نشاطي كبائع
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "إعلاناتي", value: stats.total },
                { label: "النشطة", value: stats.active },
                { label: "إجمالي المشاهدات", value: stats.views },
                { label: "مبيعات مكتملة", value: profile?.salesCount ?? 0 },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-planet-50/80 px-4 py-3">
                  <p className="text-lg font-black text-planet-700">{formatNumber(s.value)}</p>
                  <p className="text-[11px] font-bold text-planet-500">{s.label}</p>
                </div>
              ))}
            </div>
            <Link href="/account?tab=selling" className="btn-primary mt-4 w-full py-3 text-sm">
              إدارة إعلاناتي <ChevronLeft size={15} />
            </Link>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-planet-950">
              <PackageCheck size={18} className="text-planet-500" /> نشاطي كمشترٍ
            </h2>
            <div className="space-y-2.5">
              {orders.slice(0, 4).map((o) => (
                <Link key={o.id} href={`/orders/${o.orderCode}`} className="flex items-center justify-between gap-3 rounded-2xl bg-planet-50/70 px-4 py-3 text-sm transition-colors hover:bg-planet-50">
                  <span className="font-extrabold text-planet-800">#{o.orderCode}</span>
                  <StatusBadge status={o.status} />
                  <span className="font-black text-planet-600">{formatMoney(o.total)}</span>
                </Link>
              ))}
              {!orders.length && <p className="text-sm text-planet-500">لا طلبات بعد — <Link href="/products" className="font-bold text-planet-600">تصفح الكراكيب</Link></p>}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 md:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-planet-950">
              <Bell size={18} className="text-planet-500" /> آخر الإشعارات
            </h2>
            <div className="space-y-2.5">
              {notifications.length ? (
                notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${n.read ? "bg-planet-50/50" : "bg-planet-50"}`}>
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-planet-200" : "bg-gold-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-planet-900">{n.title}</p>
                      {n.body && <p className="line-clamp-1 text-xs text-planet-600">{n.body}</p>}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-planet-400">{timeAgo(n.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-planet-500">لا إشعارات بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= بياناتي ================= */}
      {tab === "profile" && (
        <ProfileEditForm
          initial={{
            name: user.name,
            phone: user.phone,
            email: user.email,
            gov: profile?.gov ?? null,
            area: profile?.area ?? null,
            bio: profile?.bio ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
          }}
        />
      )}

      {/* ================= أنا أبيع ================= */}
      {tab === "selling" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-planet-600">
              {formatNumber(stats.total)} إعلان — {formatNumber(stats.active)} نشط · {formatNumber(stats.paused)} موقوف · {formatNumber(stats.pending)} بانتظار المراجعة
            </p>
            <div className="flex gap-2">
              <Link href="/seller" className="btn-outline px-4 py-2.5 text-xs">لوحة البائع الكاملة</Link>
              <Link href="/sell" className="btn-sell px-4 py-2.5 text-xs">+ إعلان جديد</Link>
            </div>
          </div>
          {products.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {products.map((p) => (
                <MyProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Store}
              title="لم تنشر أي إعلان بعد"
              subtitle="عندك كراكيب؟ اعرضها للبيع في دقيقة"
              action={<Link href="/sell" className="btn-sell px-6 py-3 text-sm">اعرض شيئًا للبيع</Link>}
            />
          )}
        </div>
      )}

      {/* ================= طلباتي ================= */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length ? (
            orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.orderCode}`} className="glass card-hover flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-black text-planet-800">#{o.orderCode}</span>
                  <p className="mt-0.5 line-clamp-1 text-xs text-planet-600">{o.items.map((i) => i.title).join(" · ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-black text-planet-600">{formatMoney(o.total)}</span>
                  <ChevronLeft size={15} className="text-planet-400" />
                </div>
              </Link>
            ))
          ) : (
            <EmptyState icon={PackageCheck} title="لا توجد طلبات بعد" action={<Link href="/products" className="btn-primary px-6 py-3 text-sm">تصفح الكراكيب</Link>} />
          )}
        </div>
      )}

      {/* ================= المفضلة ================= */}
      {tab === "favorites" && (
        <div>
          {favorites.length ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {favorites.map((p) => (
                <div key={p.id} className="relative">
                  {p.favoritePriceAtSave != null && p.favoritePriceAtSave > p.price && (
                    <span className="absolute -top-2 start-2 z-20 flex items-center gap-1 rounded-full bg-planet-600 px-2.5 py-1 text-[10px] font-black text-white shadow-lift">
                      <TrendingDown size={11} /> انخفض من {formatNumber(p.favoritePriceAtSave)} ج
                    </span>
                  )}
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="مفضلتك فارغة"
              subtitle="اضغط القلب على أي منتج لحفظه ومتابعة سعره"
              action={<Link href="/products" className="btn-primary px-6 py-3 text-sm">تصفح الكراكيب</Link>}
            />
          )}
        </div>
      )}

      {/* ================= المحادثات ================= */}
      {tab === "chats" && (
        <div className="space-y-3">
          {chats.length ? (
            chats.map((c) => (
              <div key={c.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                {c.sellerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.sellerAvatar} alt={c.sellerName ?? ""} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-sm font-black text-white">
                    {(c.sellerName ?? "ب").charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-planet-900">{c.sellerName ?? "بائع"}</p>
                  {c.productTitle && <p className="line-clamp-1 text-xs text-planet-500">بخصوص: {c.productTitle}</p>}
                  <p className="mt-0.5 text-[10px] font-bold text-planet-400">آخر تواصل {timeAgo(c.lastMessageAt)}</p>
                </div>
                <a
                  href={createWhatsAppOrderLink(c.sellerPhone || "", `مرحبًا ${c.sellerName ?? ""}، بخصوص «${c.productTitle ?? ""}» على كوكب كراكيب...`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp shrink-0 px-4 py-2.5 text-xs"
                >
                  <WhatsAppIcon size={14} /> متابعة المحادثة
                </a>
              </div>
            ))
          ) : (
            <EmptyState
              icon={ChatIcon}
              title="لا توجد محادثات بعد"
              subtitle="عند التواصل مع أي بائع عبر واتساب ستظهر المحادثة هنا لتتابعها لاحقًا"
            />
          )}
        </div>
      )}

      {/* ================= الإعدادات ================= */}
      {tab === "settings" && (
        <div className="space-y-5">
          <PasswordChangeForm />
          <div className="glass rounded-3xl p-6 text-sm leading-7 text-planet-600">
            <h3 className="mb-2 text-sm font-extrabold text-planet-900">عن حسابك</h3>
            <p>
              حسابك على كوكب كراكيب يمكّنك من البيع والشراء معًا — لا حاجة لحساب منفصل.
              إعلاناتك تُراجع من إدارة المنصة لضمان الجودة، وكل الطلبات تُتابع مركزيًا
              وتصلك تحديثات حالتها عبر الإشعارات.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
