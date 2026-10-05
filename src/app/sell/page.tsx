import Link from "next/link";
import { ClipboardList, LogIn, ShieldCheck, Store } from "lucide-react";
import SellWizard from "@/components/SellWizard";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { getCurrentUser, getGuestToken } from "@/lib/auth";
import { guestProducts } from "@/lib/models/products";
import { getCustomListingFields } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "اعرض شيئًا للبيع" };

/**
 * صفحة إضافة منتج للبيع — مفتوحة للجميع.
 * تسجيل الدخول اختياري تمامًا: يمكنك النشر كضيف، والحساب مجرد ميزة
 * إضافية لمتابعة إعلاناتك وطلباتك من أي جهاز.
 */
export default async function SellPage() {
  const user = await getCurrentUser();
  const guestToken = user ? null : await getGuestToken();
  const myGuestListings = guestToken ? guestProducts(guestToken) : [];
  const ownerFields = getCustomListingFields();

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-planet-950 sm:text-3xl">اعرض شيئًا للبيع</h1>
        <p className="mt-1.5 text-sm text-planet-600">
          بدون تسجيل ولا حساب — اكتب مواصفات ما تبيعه كاملة ويظهر إعلانك لآلاف المشترين
        </p>
        <Link href="/sales" className="chip mt-3 border-planet-200 bg-white px-4 py-2 text-xs text-planet-700 shadow-sm">
          <ClipboardList size={14} /> عرض طلبات البيع السابقة
        </Link>
      </div>

      {!user && (
        <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-planet-100 bg-planet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-sm font-bold leading-7 text-planet-700">
            <ShieldCheck size={18} className="mt-1 shrink-0 text-planet-500" />
            <span>
              تقدر تنشر إعلانك فورًا من غير تسجيل دخول.
              <span className="block text-xs font-bold text-planet-500">
                الحساب اختياري — يفيدك فقط لو حبيت تتابع إعلاناتك وطلباتك من أي جهاز.
              </span>
            </span>
          </p>
          <Link href="/login?next=/sell" className="btn-outline shrink-0 px-5 py-3 text-sm">
            <LogIn size={16} /> تسجيل الدخول (اختياري)
          </Link>
        </div>
      )}

      <SellWizard
        seller={
          user
            ? {
                name: user.name,
                phone: user.phone,
                gov: user.profile?.gov ?? null,
                avatarUrl: user.profile?.avatarUrl ?? null,
              }
            : null
        }
        ownerFields={ownerFields}
      />

      {myGuestListings.length > 0 && (
        <section className="mx-auto max-w-3xl pt-4">
          <SectionHeader
            title="طلبات البيع من هذا الجهاز"
            subtitle="محفوظة للعرض والمتابعة فقط — افتح سجل البيع لرؤية كل التفاصيل"
            href="/sales"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {myGuestListings.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-planet-500">
            <Store size={14} /> أنشئ حسابًا مجانيًا لتحتفظ بإعلاناتك حتى لو غيّرت الجهاز أو المتصفح.
          </p>
        </section>
      )}
    </div>
  );
}
