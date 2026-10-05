import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import SellWizard from "@/components/SellWizard";
import { getCurrentUser } from "@/lib/auth";
import { getCustomListingFields } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "إضافة منتج جديد" };

/**
 * إضافة منتج من لوحة الإدارة — المالك ينشر مباشرة على الموقع
 * بنفس معالج البيع (بالمواصفات الكاملة والخانات التي أضافها بنفسه)،
 * بدون مراجعة وبدون فتح واتساب.
 */
export default async function AdminNewProductPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-planet-950 sm:text-2xl">إضافة منتج جديد</h1>
          <p className="mt-1 text-sm text-planet-600">
            يُنشر فورًا على الموقع باسمك كإدارة — بدون مراجعة وبدون رسالة واتساب
          </p>
        </div>
        <Link href="/admin/products" className="btn-outline shrink-0 px-5 py-2.5 text-sm">
          <ChevronRight size={16} /> كل المنتجات
        </Link>
      </div>

      <p className="flex items-start gap-2.5 rounded-3xl border border-gold-300/50 bg-gold-50/70 px-4 py-3 text-xs font-bold leading-6 text-planet-700">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-gold-600" />
        <span>
          تظهر هنا أيضًا الخانات الإضافية التي تضيفها من{" "}
          <Link href="/admin/settings" className="underline">الإعدادات</Link> — ويمكنك تعديل السعر لاحقًا
          مباشرة من جدول المنتجات.
        </span>
      </p>

      <SellWizard
        adminMode
        ownerFields={getCustomListingFields()}
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
      />
    </div>
  );
}
