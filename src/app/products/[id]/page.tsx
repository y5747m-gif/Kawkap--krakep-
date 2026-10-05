import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, Truck, HandCoins, Package, Eye, CalendarDays, ChevronLeft, Store,
  BadgeCheck, MessageSquareQuote, Info, ListChecks, UserRound,
} from "lucide-react";
import Gallery from "@/components/Gallery";
import RatingStars from "@/components/RatingStars";
import FavoriteButton from "@/components/FavoriteButton";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { OrderNowButton, ContactSellerButton, ShareButton, ReportButton } from "@/components/ProductActions";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getCurrentUser, getGuestToken } from "@/lib/auth";
import {
  getProductDetail, getProductRow, incrementViews, searchProducts,
} from "@/lib/models/products";
import { listAddresses } from "@/lib/models/users";
import { listSpecRows } from "@/lib/specs";
import { formatQuantity, formatUnitPrice, formatDate, formatNumber } from "@/lib/format";
import { CONDITION_MAP } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import { createOwnerListingLink } from "@/lib/whatsapp";
import { getBaseUrl } from "@/lib/http";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [user, guestToken] = await Promise.all([getCurrentUser(), getGuestToken()]);
  const product = getProductDetail(id, user?.id);

  // صاحب الإعلان: الحساب المسجل، أو الزائر الذي نشره من نفس المتصفح
  const row = product ? getProductRow(product.id) : null;
  const isGuestOwner = !!guestToken && !!row?.guestToken && row.guestToken === guestToken;
  const isOwner = (!product?.isGuestSeller && user?.id === product?.sellerId) || isGuestOwner;

  if (!product || (product.status === "REJECTED" && !isOwner && user?.role !== "ADMIN")) {
    notFound();
  }

  incrementViews(product.id);

  const specRows = listSpecRows(product);
  const isAvailable = product.status === "ACTIVE" && !isOwner;
  const addresses = user ? listAddresses(user.id) : [];
  const related = searchProducts({
    categorySlug: product.categorySlug,
    limit: 4,
    viewerId: user?.id,
    // إعلانات الضيوف كلها تحت حساب واحد، فلا نستبعدها جميعًا من المشابهة
    excludeSellerId: product.isGuestSeller ? undefined : product.sellerId,
  });
  const distance = formatDistance(product.distanceKm ?? null);
  // البائع الضيف لا يملك رقم حساب — نستخدم رقم التواصل إن تركه فقط
  const contactPhone = product.contactPhone || (product.isGuestSeller ? null : product.sellerPhone);

  // بعد إرسال الإعلان من معالج البيع: تأكيد وصول الطلب لواتساب الإدارة
  // (ورابط احتياطي لإعادة الإرسال لو حجب المتصفح النافذة المنبثقة)
  const justSent = sp.sent === "1" && isOwner;
  const resendUrl = justSent
    ? createOwnerListingLink({
        code: product.code,
        title: product.title,
        categoryName: product.categoryName,
        condition: product.condition,
        description: product.description,
        price: product.price,
        pricingType: product.pricingType,
        quantity: product.quantity,
        unit: product.unit,
        negotiable: product.negotiable,
        hasDelivery: product.hasDelivery,
        gov: product.gov,
        area: product.area,
        latitude: product.latitude,
        longitude: product.longitude,
        imagesCount: product.imagesCount,
        notes: product.notes,
        contactPhone: product.contactPhone,
        sellerName: product.sellerName,
        sellerPhone: product.isGuestSeller ? product.contactPhone : product.sellerPhone,
        isGuest: product.isGuestSeller,
        weight: product.weight,
        weightUnit: product.weightUnit,
        itemType: product.itemType,
        brand: product.brand,
        model: product.model,
        material: product.material,
        color: product.color,
        year: product.year,
        dimensions: product.dimensions,
        specs: product.specs,
        status: product.status,
        createdAt: product.createdAt,
        productLink: `${getBaseUrl()}/products/${product.id}`,
      })
    : null;

  const orderProduct = {
    id: product.id,
    title: product.title,
    price: product.price,
    pricingType: product.pricingType,
    unit: product.unit,
    quantity: product.quantity,
    gov: product.gov,
    area: product.area,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
  };

  return (
    <div className="space-y-10">
      {/* تأكيد إرسال طلب البيع إلى واتساب الإدارة */}
      {justSent && resendUrl && (
        <div className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#128c7e] via-planet-700 to-planet-900 p-6 text-center text-white shadow-lift">
          <div className="pointer-events-none absolute -top-16 start-1/4 h-48 w-48 rounded-full bg-tealx-400/30 blur-3xl" />
          <span className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <WhatsAppIcon size={34} />
          </span>
          <h2 className="relative text-xl font-black">تم إرسال طلبك إلى إدارة كوكب كراكيب</h2>
          <p className="relative mx-auto mt-2 max-w-lg text-sm leading-7 text-white/80">
            إعلانك محفوظ في النظام، ووصلت تفاصيله كاملة على واتساب الإدارة لمتابعته معك.
            لو لم يفتح واتساب تلقائيًا، أعد الإرسال من الزر بالأسفل.
          </p>
          <a
            href={resendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp relative mt-5 px-6 py-3.5 text-sm"
          >
            <WhatsAppIcon size={17} /> إعادة إرسال الطلب على واتساب
          </a>
        </div>
      )}

      {/* مسار التنقل */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-planet-500">
        <Link href="/" className="hover:text-planet-700">الرئيسية</Link>
        <ChevronLeft size={13} />
        <Link href="/products" className="hover:text-planet-700">الكراكيب</Link>
        <ChevronLeft size={13} />
        <Link href={`/categories/${product.categorySlug}`} className="hover:text-planet-700">{product.categoryName}</Link>
        <ChevronLeft size={13} />
        <span className="text-planet-800">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* الصور */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery images={product.images} title={product.title} />
        </div>

        {/* التفاصيل */}
        <div className="space-y-5">
          <div className="glass rounded-3xl p-4 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/categories/${product.categorySlug}`}
                className="chip border-white/60 bg-white text-white shadow-sm"
                style={{ backgroundColor: `${product.categoryColor}18`, color: product.categoryColor }}
              >
                <CategoryIcon icon={product.categoryIcon} size={13} /> {product.categoryName}
              </Link>
              <span className="chip border-planet-200 bg-planet-50 text-planet-700">{CONDITION_MAP[product.condition]}</span>
              {product.featured && (
                <span className="chip border-gold-400/50 bg-gold-500/15 text-gold-600">إعلان مميز</span>
              )}
              {product.isDemo && (
                <span className="chip border-sky-200 bg-sky-50 text-sky-600">بيانات تجريبية</span>
              )}
            </div>

            <h1 className="text-2xl font-black leading-snug text-planet-950 sm:text-3xl">{product.title}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-3xl font-black text-planet-600">
                {formatUnitPrice(product.price, product.pricingType, product.unit)}
              </span>
              {product.negotiable && (
                <span className="chip border-tealx-400/40 bg-tealx-500/10 text-tealx-600">
                  <HandCoins size={13} /> قابل للتفاوض
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-2xl bg-planet-50/70 px-3.5 py-2.5">
                <Package size={16} className="shrink-0 text-planet-500" />
                <span className="font-bold text-planet-800">{formatQuantity(product.quantity, product.unit)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-planet-50/70 px-3.5 py-2.5">
                <MapPin size={16} className="shrink-0 text-tealx-500" />
                <span className="truncate font-bold text-planet-800">
                  {product.gov}{product.area ? ` — ${product.area}` : ""}
                  {distance ? ` (${distance})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-planet-50/70 px-3.5 py-2.5">
                <Truck size={16} className="shrink-0 text-planet-500" />
                <span className="font-bold text-planet-800">{product.hasDelivery ? "يوجد توصيل" : "بدون توصيل"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-planet-50/70 px-3.5 py-2.5">
                <Eye size={16} className="shrink-0 text-planet-500" />
                <span className="font-bold text-planet-800">{formatNumber(product.views)} مشاهدة</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-planet-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} /> نُشر {formatDate(product.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Info size={13} /> كود الإعلان: {product.code}
              </span>
              {isOwner && (
                <Link href={`/sell/${product.id}`} className="chip border-planet-300 bg-planet-50 text-planet-700">
                  تعديل الإعلان
                </Link>
              )}
            </div>
          </div>

          {/* أزرار الطلب */}
          <div className="space-y-3">
            {isAvailable ? (
              <OrderNowButton
                product={orderProduct}
                viewer={user ? { name: user.name, phone: user.phone, gov: user.profile?.gov ?? null, area: user.profile?.area ?? null } : null}
                addresses={addresses}
              />
            ) : (
              <div className="rounded-2xl border border-planet-100 bg-planet-50/70 px-5 py-4 text-center text-sm font-bold text-planet-700">
                {isOwner ? "هذا إعلانك — يمكنك تعديله أو إيقافه من لوحة البائع" : "هذا الإعلان غير متاح للطلب حاليًا"}
              </div>
            )}

            {isAvailable && !!contactPhone && (
              <ContactSellerButton
                sellerId={product.sellerId}
                sellerName={product.sellerName}
                sellerPhone={contactPhone || ""}
                productTitle={product.title}
                productId={product.id}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FavoriteButton productId={product.id} initial={product.isFavorite} />
              <ShareButton title={product.title} url={`/products/${product.id}`} />
            </div>
          </div>

          {/* المواصفات الكاملة كما أدخلها البائع */}
          {specRows.length > 0 && (
            <div className="glass rounded-3xl p-4 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-planet-950">
                <ListChecks size={18} className="text-planet-500" /> المواصفات
              </h2>
              <dl className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                {specRows.map((s) => (
                  <div
                    key={`${s.label}-${s.value}`}
                    className="flex items-baseline justify-between gap-3 border-b border-planet-50 py-2.5 text-sm last:border-0"
                  >
                    <dt className="shrink-0 font-bold text-planet-500">{s.label}</dt>
                    <dd className="text-end font-extrabold text-planet-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* البائع */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-4">
              {product.sellerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.sellerAvatar} alt={product.sellerName} className="h-14 w-14 rounded-2xl border-2 border-planet-100 object-cover" loading="lazy" decoding="async" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-planet-500 to-tealx-500 text-xl font-black text-white">
                  {product.isGuestSeller ? <UserRound size={24} /> : product.sellerName.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-base font-extrabold text-planet-950">
                  {product.sellerName}
                  {!product.isGuestSeller && product.sellerRatingCount > 0 && (
                    <BadgeCheck size={16} className="text-tealx-500" />
                  )}
                </p>
                {product.isGuestSeller ? (
                  <p className="mt-0.5 text-xs text-planet-500">
                    نشر هذا الإعلان بدون حساب · المتابعة عبر إدارة كوكب كراكيب
                  </p>
                ) : (
                  <>
                    <RatingStars rating={product.sellerRating} count={product.sellerRatingCount} size={13} />
                    <p className="mt-0.5 text-xs text-planet-500">
                      عضو منذ {formatDate(product.sellerSince)} · {formatNumber(product.sellerProductsCount)} إعلان منشور
                    </p>
                  </>
                )}
              </div>
              {!product.isGuestSeller && (
                <Link href={`/products?seller=${product.sellerId}`} className="btn-outline shrink-0 px-4 py-2.5 text-xs">
                  <Store size={14} /> إعلانات البائع
                </Link>
              )}
            </div>
          </div>

          {/* الوصف */}
          <div className="glass rounded-3xl p-4 sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-planet-950">
              <MessageSquareQuote size={18} className="text-planet-500" /> وصف المنتج
            </h2>
            <p className="whitespace-pre-line text-sm leading-8 text-planet-800">{product.description}</p>
            {product.notes && (
              <div className="mt-4 rounded-2xl border border-gold-400/30 bg-gold-500/10 p-4">
                <p className="text-xs font-extrabold text-gold-600">ملاحظات البائع</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-7 text-planet-800">{product.notes}</p>
              </div>
            )}
            <div className="mt-4">
              <ReportButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>

      {/* منتجات مشابهة */}
      {related.items.length > 0 && (
        <section>
          <SectionHeader
            title="كراكيب مشابهة"
            subtitle={`المزيد من تصنيف ${product.categoryName}`}
            href={`/categories/${product.categorySlug}`}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
