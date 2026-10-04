import { ShoppingCart } from "lucide-react";
import CartView from "@/components/CartView";
import { getCurrentUser } from "@/lib/auth";
import { getCartItems } from "@/lib/models/products";

export const dynamic = "force-dynamic";

export const metadata = { title: "سلة المشتريات" };

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="glass mx-auto max-w-md rounded-3xl px-6 py-12 text-center">
        <ShoppingCart size={44} className="mx-auto mb-4 text-planet-300" />
        <h1 className="text-lg font-extrabold text-planet-900">سلة المشتريات</h1>
        <p className="mt-1.5 text-sm leading-7 text-planet-600">
          سجل الدخول لحفظ منتجاتك في السلة وإتمام الطلب بسهولة
        </p>
        <a href="/login?next=/cart" className="btn-primary mt-5 px-6 py-3 text-sm">تسجيل الدخول</a>
      </div>
    );
  }

  const items = getCartItems(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-planet-950">سلة المشتريات</h1>
      <CartView initialItems={items} />
    </div>
  );
}
