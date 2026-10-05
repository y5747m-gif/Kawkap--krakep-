import Link from "next/link";
import {
  Sparkles, Recycle, Camera, ChevronLeft, Leaf, Coins, MapPinned, BadgeCheck,
  PackageSearch, Star, ArrowDown,
} from "lucide-react";
import SellButton from "@/components/SellButton";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import NearbyProducts from "@/components/NearbyProducts";
import HowItWorks from "@/components/HowItWorks";
import CategoryIcon from "@/components/CategoryIcon";
import PlanetMark from "@/components/PlanetMark";
import Reveal from "@/components/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { listCategories, searchProducts } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const categories = listCategories();
  const latest = searchProducts({ limit: 8, viewerId: user?.id });
  const featured = searchProducts({ limit: 4, featuredOnly: true, viewerId: user?.id });
  const totalActive = searchProducts({ limit: 1 }).total;

  return (
    <div className="space-y-14">
      {/* ==================== البطل ==================== */}
      <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-planet-900 via-planet-950 to-[#032018] px-5 py-12 text-white shadow-lift sm:px-10 sm:py-16">
        {/* زخارف الكوكب */}
        <div className="pointer-events-none absolute -start-24 -top-24 h-80 w-80 rounded-full bg-tealx-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -end-16 h-96 w-96 rounded-full bg-planet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute end-6 top-6 hidden float-slow lg:block">
          <PlanetMark size={170} />
        </div>
        <div className="pointer-events-none absolute start-1/3 bottom-8 hidden opacity-40 lg:block">
          <Recycle size={44} className="animate-floaty text-tealx-400/60" />
        </div>
        <div className="pointer-events-none absolute start-10 top-24 hidden opacity-30 xl:block">
          <PlanetMark size={70} />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          {/* تحية المستخدم */}
          <p className="fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-tealx-300">
            <Sparkles size={13} />
            {user ? `أهلًا ${user.name.split(" ")[0]}! جاهز تكسب من كراكيبك؟` : "أهلًا بك في كوكب الكراكيب"}
          </p>

          <h1 className="fade-up fade-up-1 text-3xl font-black leading-[1.25] sm:text-5xl sm:leading-[1.2]">
            عندك كراكيب؟
            <br />
            <span className="gradient-text-anim">حوّلها لقيمة.</span>
          </h1>

          <p className="fade-up fade-up-2 mx-auto mt-5 max-w-xl text-sm leading-8 text-white/75 sm:text-base">
            اعرض الأشياء التي لم تعد تحتاجها، ودع شخصًا آخر يستفيد منها.
            منصة يصنعها الناس — انشر إعلانك بمواصفاته كاملة بدون تسجيل دخول.
          </p>

          <div className="fade-up fade-up-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SellButton size="lg" label="اعرض شيئًا للبيع" />
            <Link href="/products" className="btn glass-dark sheen rounded-3xl px-8 py-4 text-base font-bold text-white hover:bg-white/20">
              <PackageSearch size={20} className="text-tealx-400" />
              تصفح الكراكيب
            </Link>
          </div>

          {/* إحصائيات سريعة */}
          <div className="fade-up fade-up-4 stagger mt-10 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: PackageSearch, label: "إعلان منشور", value: `+${formatNumber(totalActive)}` },
              { icon: Coins, label: "تصنيف للبيع", value: "16" },
              { icon: BadgeCheck, label: "متابعة منظمة", value: "100%" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="glass-dark spot card-hover rounded-2xl px-2 py-3.5">
                  <Icon size={17} className="mx-auto mb-1.5 text-tealx-400" />
                  <p className="text-base font-black sm:text-lg">{s.value}</p>
                  <p className="text-[10px] font-bold text-white/60 sm:text-xs">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== البحث ==================== */}
      <Reveal as="section" variant="zoom" className="mx-auto max-w-2xl">
        <SearchBar />
      </Reveal>

      {/* ==================== شريط تحفيزي ==================== */}
      <Reveal as="section" variant="start" className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-l from-gold-500/15 via-white/90 to-white/90 px-6 py-5 shadow-soft sheen">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-500/20 text-gold-600">
              <Leaf size={22} />
            </span>
            <div>
              <p className="text-base font-extrabold text-planet-950">عندك حاجة مش محتاجها؟ بيعها.</p>
              <p className="text-xs text-planet-600">بدل ما تتراكم… خليها قيمة في جيبك وفائدة لغيرك</p>
            </div>
          </div>
          <Link href="/sell" className="btn-gold glow-pulse shrink-0 px-6 py-3 text-sm">
            <Camera size={17} /> اعرضها للبيع
          </Link>
        </div>
      </Reveal>

      {/* ==================== التصنيفات ==================== */}
      <Reveal as="section">
        <SectionHeader
          title="تصفح حسب التصنيف"
          subtitle="من النحاس والمعادن للأجهزة والأثاث — كل الكراكيب مكان واحد"
          href="/categories"
          icon={<CategoryIcon icon="tags" size={22} className="text-planet-600" />}
        />
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="glass card-hover spot sheen group flex w-28 shrink-0 flex-col items-center gap-2.5 rounded-3xl px-3 py-5 text-center"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${cat.color}1c`, color: cat.color }}
              >
                <CategoryIcon icon={cat.icon} size={26} />
              </span>
              <span className="text-xs font-extrabold text-planet-900">{cat.name}</span>
              <span className="text-[10px] font-bold text-planet-500">
                {cat.productsCount ? `${formatNumber(cat.productsCount)} إعلان` : "قريبًا"}
              </span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* ==================== كراكيب قريبة منك ==================== */}
      <Reveal as="section">
        <SectionHeader
          title="كراكيب قريبة منك"
          subtitle="الأقرب لموقعك مع المسافة التقريبية"
          href="/map"
          icon={<MapPinned size={22} className="text-planet-600" />}
        />
        <NearbyProducts />
      </Reveal>

      {/* ==================== أحدث الإعلانات ==================== */}
      <Reveal as="section">
        <SectionHeader
          title="أحدث الإعلانات"
          subtitle="إعلانات أضافها عملاء المنصة للتو"
          href="/products"
          icon={<Sparkles size={22} className="text-planet-600" />}
        />
        {latest.items.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latest.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
            <p className="text-sm font-bold text-planet-700">لا توجد إعلانات بعد — كن أول من يبيع على الكوكب!</p>
            <SellButton />
          </div>
        )}
      </Reveal>

      {/* ==================== إعلانات مميزة ==================== */}
      {featured.items.length > 0 && (
        <Reveal as="section">
          <SectionHeader
            title="إعلانات مميزة"
            subtitle="اختيارات مميزة من كوكب الكراكيب"
            href="/products?featured=1"
            icon={<Star size={22} className="fill-gold-400 text-gold-500" />}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      )}

      {/* ==================== كيف يعمل ==================== */}
      <Reveal as="section" variant="zoom" className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-planet-900 to-planet-950 px-5 py-12 text-white sm:px-10">
        <div className="pointer-events-none absolute -end-20 -top-20 h-72 w-72 rounded-full bg-tealx-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black sm:text-3xl">كيف يعمل كوكب كراكيب؟</h2>
            <p className="mt-2 text-sm text-white/70">خمس خطوات بسيطة من الصورة حتى استلام القيمة</p>
          </div>
          <HowItWorks dark />
        </div>
      </Reveal>

      {/* ==================== حوّل الكراكيب إلى قيمة ==================== */}
      <Reveal as="section" variant="zoom" className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-gradient-to-l from-tealx-500/15 via-white/95 to-planet-500/10 px-6 py-14 text-center shadow-soft sm:px-12">
        <div className="pointer-events-none absolute -start-16 bottom-0 opacity-20 float-slower">
          <PlanetMark size={220} />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-planet-500/15 px-4 py-1.5 text-xs font-extrabold text-planet-700">
            <Recycle size={14} /> بيئة أنظف · بيوت أخف · جيوب أملأ
          </span>
          <h2 className="text-2xl font-black leading-snug text-planet-950 sm:text-4xl">
            حوّل الكراكيب إلى <span className="gradient-text-anim">قيمة حقيقية</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-planet-700">
            كل شيء عندك له قيمة — الخردة، الأجهزة القديمة، الأثاث، الكرتون والورق.
            انشره في دقيقة واستقبل الطلبات، وفريق المنصة يتابع معك حتى إتمام البيع.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SellButton size="lg" />
            <Link href="/products" className="btn-outline rounded-3xl px-8 py-4 text-base">
              استكشف الكراكيب <ChevronLeft size={18} />
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-planet-500">
            <ArrowDown size={13} className="animate-bounce" /> ابدأ الآن — التسجيل مجاني والدقائق القادمة قد تساوي الكثير
          </p>
        </div>
      </Reveal>
    </div>
  );
}
