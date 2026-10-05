import Link from "next/link";
import {
  CheckCircle2, ClipboardList, LockKeyhole, LogIn, PackageCheck, Plus, ShieldCheck,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SaleDetailsCard from "@/components/SaleDetailsCard";
import { getCurrentUser, getGuestToken } from "@/lib/auth";
import { guestProducts, getProductDetail, myProducts } from "@/lib/models/products";
import { formatNumber } from "@/lib/format";
import type { ProductDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "طلبات البيع الخاصة بي",
  robots: { index: false, follow: false },
};

/**
 * سجل طلبات البيع للعميل المسجل أو للضيف من نفس المتصفح.
 * الصفحة للعرض فقط؛ التعديل والحذف وإدارة الحالة متاحة للإدارة وحدها.
 */
export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; item?: string }>;
}) {
  const sp = await searchParams;
  const [user, guestToken] = await Promise.all([getCurrentUser(), getGuestToken()]);
  const cards = user
    ? myProducts(user.id)
    : guestToken
      ? guestProducts(guestToken)
      : [];
  const sales = cards
    .map((card) => getProductDetail(card.id, user?.id))
    .filter((sale): sale is ProductDetail => sale !== null);

  const highlightedId = sp.submitted || sp.item || "";
  const justSubmitted = !!sp.submitted && sales.some((sale) => sale.id === sp.submitted);
  const soldCount = sales.filter((sale) => sale.status === "SOLD").length;
  const pendingCount = sales.filter((sale) => sale.status === "PENDING").length;
  const activeCount = sales.filter((sale) => sale.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {justSubmitted && (
        <section className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-planet-700 via-planet-800 to-planet-950 p-6 text-white shadow-lift sm:p-8">
          <div className="pointer-events-none absolute -top-20 end-8 h-56 w-56 rounded-full bg-tealx-400/25 blur-3xl" />
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-tealx-300 ring-1 ring-white/15">
              <CheckCircle2 size={32} />
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-black sm:text-2xl">تم استلام طلب البيع وحفظه</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-7 text-white/75">
                ستجد أدناه الشيء الذي عرضته وكل البيانات التي أرسلتها. الصفحة للعرض والمتابعة فقط،
                وأي تحديث للحالة يتم بواسطة إدارة كوكب كراكيب.
              </p>
            </div>
          </div>
        </section>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-planet-500">
            <ClipboardList size={14} /> سجل محفوظ وآمن
          </p>
          <h1 className="text-2xl font-black text-planet-950 sm:text-3xl">طلبات البيع الخاصة بي</h1>
          <p className="mt-1.5 text-sm leading-7 text-planet-600">
            الأشياء التي عرضتها للبيع، وحالة كل طلب، وجميع التفاصيل كما أرسلتها.
          </p>
        </div>
        <Link href="/sell" className="btn-sell px-5 py-3 text-sm">
          <Plus size={16} /> عرض شيء آخر للبيع
        </Link>
      </header>

      {sales.length > 0 && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="كل طلبات البيع" value={sales.length} tone="planet" />
            <SummaryCard label="بانتظار المراجعة" value={pendingCount} tone="gold" />
            <SummaryCard label="العروض المنشورة" value={activeCount} tone="teal" />
            <SummaryCard label="تم بيعها" value={soldCount} tone="sky" />
          </section>

          <div className="flex items-start gap-3 rounded-2xl border border-tealx-300/35 bg-tealx-500/10 px-4 py-3.5 text-xs font-bold leading-6 text-tealx-800">
            <LockKeyhole size={17} className="mt-0.5 shrink-0" />
            <p>
              هذه الصفحة للعرض فقط: لا توجد بها أدوات تعديل أو حذف أو تغيير للحالة، حفاظًا على
              تطابق البيانات التي استلمتها الإدارة مع طلبك الأصلي.
            </p>
          </div>

          <section className="space-y-5" aria-label="طلبات البيع">
            {sales.map((sale, index) => (
              <SaleDetailsCard
                key={sale.id}
                sale={sale}
                highlighted={sale.id === highlightedId}
                defaultOpen={sales.length === 1 || (index === 0 && !highlightedId)}
              />
            ))}
          </section>

          {!user && (
            <section className="flex flex-col items-start gap-3 rounded-3xl border border-planet-100 bg-planet-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2.5 text-sm font-bold leading-7 text-planet-700">
                <ShieldCheck size={18} className="mt-1 shrink-0 text-planet-500" />
                <span>
                  هذه الطلبات مرتبطة بهذا المتصفح فقط.
                  <span className="block text-xs text-planet-500">سجّل الدخول في المرات القادمة لمتابعة طلباتك من أي جهاز.</span>
                </span>
              </p>
              <Link href="/login?next=/sales" className="btn-outline shrink-0 px-5 py-3 text-sm">
                <LogIn size={15} /> تسجيل الدخول
              </Link>
            </section>
          )}
        </>
      )}

      {sales.length === 0 && (
        <EmptyState
          icon={PackageCheck}
          title="لا توجد طلبات بيع محفوظة"
          subtitle={
            user
              ? "عندما تعرض شيئًا للبيع ستظهر هنا بياناته وحالته بالتفصيل"
              : "طلبات الضيف تظهر هنا من نفس المتصفح الذي أرسلها، أو يمكنك تسجيل الدخول لمتابعة طلبات حسابك"
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/sell" className="btn-sell px-6 py-3 text-sm">اعرض شيئًا للبيع</Link>
              {!user && <Link href="/login?next=/sales" className="btn-outline px-6 py-3 text-sm">تسجيل الدخول</Link>}
            </div>
          }
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "planet" | "gold" | "teal" | "sky";
}) {
  const tones = {
    planet: "from-planet-500/15 to-planet-500/5 text-planet-700",
    gold: "from-gold-500/15 to-gold-500/5 text-gold-700",
    teal: "from-tealx-500/15 to-tealx-500/5 text-tealx-700",
    sky: "from-sky-500/15 to-sky-500/5 text-sky-700",
  };

  return (
    <div className={`rounded-3xl border border-white/70 bg-gradient-to-br p-4 shadow-soft sm:p-5 ${tones[tone]}`}>
      <p className="text-2xl font-black">{formatNumber(value)}</p>
      <p className="mt-0.5 text-[11px] font-extrabold opacity-75">{label}</p>
    </div>
  );
}
