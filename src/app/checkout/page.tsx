import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import OrderForm from "@/components/OrderForm";
import { getCurrentUser } from "@/lib/auth";
import { getCartItems } from "@/lib/models/products";
import { listAddresses } from "@/lib/models/users";
import { formatMoney, formatUnitPrice } from "@/lib/format";
import { computeLineTotal } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata = { title: "إتمام الطلب" };

/** إتمام طلب السلة — طلب رئيسي واحد مع طلبات فرعية لكل بائع */
export default async function CheckoutPage() {
  const user = await getCurrentUser();
  // الحساب اختياري: الزائر يطلب مباشرة من صفحة المنتج، والسلة لأصحاب الحسابات
  if (!user) redirect("/cart");

  const items = getCartItems(user.id);
  if (!items.length) redirect("/cart");

  const addresses = listAddresses(user.id);
  const total = items.reduce(
    (s, i) => s + computeLineTotal(i.product.pricingType, i.product.price, i.quantity), 0
  );

  // تجميع حسب البائع
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const g = groups.get(item.product.sellerId) ?? [];
    g.push(item);
    groups.set(item.product.sellerId, g);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-planet-950">إتمام الطلب</h1>
        <p className="mt-1 text-sm text-planet-600">
          راجع طلبك وأدخل بيانات الاستلام — سيصل الطلب لإدارة المنصة فورًا
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* بنود الطلب */}
        <div className="space-y-4">
          {[...groups.entries()].map(([sellerId, g]) => (
            <div key={sellerId} className="glass overflow-hidden rounded-3xl">
              <div className="flex items-center gap-2 border-b border-planet-50 bg-planet-50/50 px-5 py-3">
                <Store size={15} className="text-planet-600" />
                <span className="text-sm font-extrabold text-planet-800">بائع: {g[0].product.sellerName}</span>
              </div>
              <div className="divide-y divide-planet-50">
                {g.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 p-4">
                    {item.product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.image} alt="" className="h-14 w-16 rounded-xl object-cover" />
                    ) : (
                      <span className="h-14 w-16 rounded-xl bg-planet-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-extrabold text-planet-950">{item.product.title}</p>
                      <p className="text-xs text-planet-500">
                        {formatUnitPrice(item.product.price, item.product.pricingType, item.product.unit)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-black text-planet-600">
                      {formatMoney(computeLineTotal(item.product.pricingType, item.product.price, item.quantity))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* نموذج الطلب */}
        <div className="glass h-fit rounded-3xl p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-extrabold text-planet-950">بيانات الاستلام</h2>
          <OrderForm
            source="CART"
            cartTotal={total}
            viewer={{
              name: user.name,
              phone: user.phone,
              gov: user.profile?.gov ?? null,
              area: user.profile?.area ?? null,
            }}
            addresses={addresses}
          />
        </div>
      </div>
    </div>
  );
}
