"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X, TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface Suggestion {
  products: { id: string; title: string; price: number; image: string | null; gov: string; area: string | null }[];
  categories: { slug: string; name: string }[];
}

const POPULAR = ["نحاس", "كرتون", "حديد خردة", "غسالة قديمة", "بلاستيك", "أثاث مستعمل"];

/** شريط البحث الرئيسي مع اقتراحات فورية (منتجات + تصنيفات + مواقع + بائعون) */
export default function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggestion>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData({ products: [], categories: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setData({ products: json.products ?? [], categories: json.categories ?? [] });
        setOpen(true);
      } catch { /* تجاهل */ }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  const hasResults = data.products.length > 0 || data.categories.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-full border border-white/60 bg-white/90 py-2 pe-2 ps-4 shadow-lift backdrop-blur-xl transition-shadow focus-within:shadow-glow sm:gap-2.5 sm:ps-5"
      >
        <Search size={20} className="hidden shrink-0 text-planet-500 sm:block" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="ابحث: نحاس، كرتون، غسالة، حديد خردة..."
          className="w-full bg-transparent text-[15px] font-semibold text-planet-950 outline-none placeholder:font-normal placeholder:text-planet-400/80"
          autoFocus={autoFocus}
          aria-label="البحث في الكراكيب"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="btn-ghost grid h-9 w-9 shrink-0 place-items-center rounded-full" aria-label="مسح">
            <X size={16} />
          </button>
        )}
        <button type="submit" className="btn-primary h-11 shrink-0 rounded-full px-5 text-sm">
          ابحث
        </button>
      </form>

      {/* الاقتراحات */}
      {open && (hasResults || loading) && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-planet-100 bg-white shadow-lift animate-fade-in">
          {loading && <p className="px-5 py-3 text-sm text-planet-400">جارٍ البحث...</p>}
          {data.categories.length > 0 && (
            <div className="border-b border-planet-50 px-3 py-2">
              {data.categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => { setOpen(false); router.push(`/categories/${c.slug}`); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-planet-700 hover:bg-planet-50"
                >
                  <TrendingUp size={15} className="text-gold-500" /> تصنيف: {c.name}
                </button>
              ))}
            </div>
          )}
          {data.products.map((p) => (
            <button
              key={p.id}
              onClick={() => { setOpen(false); router.push(`/products/${p.id}`); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-planet-50"
            >
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <span className="h-11 w-11 rounded-xl bg-planet-100" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-planet-900">{p.title}</span>
                <span className="flex items-center gap-1 text-xs text-planet-500">
                  <MapPin size={11} /> {p.gov}
                </span>
              </span>
              <span className="text-sm font-black text-planet-600">{formatMoney(p.price)}</span>
            </button>
          ))}
          {!loading && !hasResults && q.trim().length >= 2 && (
            <p className="px-5 py-4 text-sm text-planet-500">لا توجد نتائج مطابقة — جرّب كلمة أخرى</p>
          )}
        </div>
      )}

      {/* كلمات شائعة */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold text-planet-500">شائع:</span>
        {POPULAR.map((word) => (
          <button
            key={word}
            onClick={() => router.push(`/products?q=${encodeURIComponent(word)}`)}
            className="chip border-white/60 bg-white/80 text-planet-700 shadow-sm backdrop-blur transition-colors hover:border-planet-300 hover:text-planet-700"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
