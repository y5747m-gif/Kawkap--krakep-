import Link from "next/link";
import { ShoppingCart, Zap, LogIn } from "lucide-react";
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
          مش لازم حساب عشان تطلب — افتح أي منتج واضغط «اطلب الآن» ويصل طلبك للإدارة فورًا.
          <span className="mt-1 block text-xs font-bold text-planet-500">
            السلة ميزة إضافية لأصحاب الحسابات لحفظ أكثر من منتج وطلبهم مرة واحدة.
          </span>
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/products" className="btn-primary px-6 py-3 text-sm">
            <Zap size={16} /> اطلب مباشرة بدون حساب
          </Link>
          <Link href="/login?next=/cart" className="btn-outline px-6 py-3 text-sm">
            <LogIn size={16} /> تسجيل الدخول (اختياري)
          </Link>
        </div>
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
