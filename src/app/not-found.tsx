import Link from "next/link";
import { Home, Search } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <Logo size={90} withText={false} />
      <div>
        <h1 className="text-5xl font-black text-planet-950">404</h1>
        <p className="mt-3 text-base font-extrabold text-planet-800">الصفحة غير موجودة على هذا الكوكب</p>
        <p className="mt-1.5 text-sm text-planet-500">ربما انتقلت أو حُذفت — جرّب البحث أو تصفح الكراكيب</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-6 py-3 text-sm"><Home size={16} /> الرئيسية</Link>
        <Link href="/products" className="btn-outline px-6 py-3 text-sm"><Search size={16} /> تصفح الكراكيب</Link>
      </div>
    </div>
  );
}
