import { redirect } from "next/navigation";
import SellWizard from "@/components/SellWizard";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "اعرض شيئًا للبيع" };

/** صفحة إضافة منتج للبيع — متاحة لأي عميل مسجل (العملاء هم البائعون) */
export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-planet-950 sm:text-3xl">اعرض شيئًا للبيع</h1>
        <p className="mt-1.5 text-sm text-planet-600">
          5 خطوات بسيطة ويظهر إعلانك لآلاف المشترين على كوكب كراكيب
        </p>
      </div>
      <SellWizard
        seller={{
          name: user.name,
          phone: user.phone,
          gov: user.profile?.gov ?? null,
          avatarUrl: user.profile?.avatarUrl ?? null,
        }}
      />
    </div>
  );
}
