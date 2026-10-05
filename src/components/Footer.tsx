import Link from "next/link";
import { Recycle, ShieldCheck, MapPinned, BadgeCheck } from "lucide-react";
import Logo from "./Logo";
import ReplayIntroButton from "./ReplayIntroButton";
import { CATEGORIES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="kk-footer relative mt-16 overflow-hidden bg-planet-950 text-white">
      {/* زخارف ضوئية */}
      <div className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-tealx-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 end-10 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-9 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="float-slower [&_span]:!text-white [&_.text-planet-500]:!text-tealx-400">
            <Logo size={46} />
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
            كوكب كراكيب منصة بيئية يعرض فيها الناس الأشياء التي لا يحتاجونها للبيع،
            ويجد فيها الآخرون ما يفيدهم — العملاء هم البائعون والمشترون، والمنصة تدير
            الطلبات وتوصلها بمنظومة متابعة منظمة.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-white/80">
            <span className="glass-dark rounded-full px-3 py-1.5"><Recycle size={13} className="inline text-tealx-400" /> صديق للبيئة</span>
            <span className="glass-dark rounded-full px-3 py-1.5"><ShieldCheck size={13} className="inline text-tealx-400" /> مراجعة الإعلانات</span>
            <span className="glass-dark rounded-full px-3 py-1.5"><MapPinned size={13} className="inline text-tealx-400" /> كراكيب قريبة منك</span>
            <span className="glass-dark rounded-full px-3 py-1.5"><BadgeCheck size={13} className="inline text-tealx-400" /> بائعون موثوقون</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold text-tealx-400">استكشف</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/products" className="hover:text-white">تصفح الكراكيب</Link></li>
            <li><Link href="/categories" className="hover:text-white">التصنيفات</Link></li>
            <li><Link href="/map" className="hover:text-white">خريطة الكراكيب القريبة</Link></li>
            <li><Link href="/sell" className="hover:text-white">اعرض شيئًا للبيع</Link></li>
            <li><Link href="/orders" className="hover:text-white">طلباتي</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold text-tealx-400">تصنيفات شائعة</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="hover:text-white">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-2 border-t border-white/10 px-4 py-5 text-center text-[11px] leading-6 text-white/50 sm:flex-row sm:gap-4 sm:text-xs">
        <span>كوكب كراكيب © {new Date().getFullYear()} — حوّل الكراكيب إلى قيمة، وحماية كوكبنا مسؤوليتنا جميعًا</span>
        <ReplayIntroButton />
      </div>
    </footer>
  );
}
