"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { GOVERNORATES, CATEGORIES } from "@/lib/constants";

/** شريط تصفية المنتجات: بحث، تصنيف، محافظة، سعر، ترتيب */
export default function ProductsFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);

  const category = sp.get("category") ?? "";
  const gov = sp.get("gov") ?? "";
  const min = sp.get("min") ?? "";
  const max = sp.get("max") ?? "";
  const sort = sp.get("sort") ?? "newest";

  function apply(changes: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(changes).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  const hasFilters = category || gov || min || max || sp.get("q") || sp.get("featured");

  return (
    <div className="glass rounded-3xl p-3.5">
      <form
        onSubmit={(e) => { e.preventDefault(); apply({ q: q.trim() || null }); }}
        className="flex items-center gap-2"
      >
        <Search size={18} className="shrink-0 text-planet-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في الاسم، الوصف، التصنيف، الموقع أو البائع..."
          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-planet-400/80"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`btn-outline shrink-0 gap-1.5 px-3.5 py-2 text-xs ${open ? "border-planet-500" : ""}`}
        >
          <SlidersHorizontal size={14} /> فلاتر
        </button>
        <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-xs">بحث</button>
      </form>

      {open && (
        <div className="mt-3.5 grid gap-3 border-t border-planet-100 pt-3.5 sm:grid-cols-2 lg:grid-cols-5">
          <select className="field py-2.5 text-sm" value={category} onChange={(e) => apply({ category: e.target.value || null })}>
            <option value="">كل التصنيفات</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select className="field py-2.5 text-sm" value={gov} onChange={(e) => apply({ gov: e.target.value || null })}>
            <option value="">كل المحافظات</option>
            {GOVERNORATES.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
          <input
            className="field py-2.5 text-sm"
            type="number"
            min={0}
            placeholder="أقل سعر"
            defaultValue={min}
            onBlur={(e) => apply({ min: e.target.value || null })}
          />
          <input
            className="field py-2.5 text-sm"
            type="number"
            min={0}
            placeholder="أعلى سعر"
            defaultValue={max}
            onBlur={(e) => apply({ max: e.target.value || null })}
          />
          <select className="field py-2.5 text-sm" value={sort} onChange={(e) => apply({ sort: e.target.value })}>
            <option value="newest">الأحدث</option>
            <option value="price_asc">الأرخص سعرًا</option>
            <option value="price_desc">الأغلى سعرًا</option>
            <option value="views">الأكثر مشاهدة</option>
          </select>
        </div>
      )}

      {hasFilters && (
        <div className="mt-3 flex items-center gap-2 border-t border-planet-100 pt-3">
          <span className="text-xs font-bold text-planet-500">فلاتر مطبقة</span>
          {[
            sp.get("q") && `بحث: ${sp.get("q")}`,
            category && CATEGORIES.find((c) => c.slug === category)?.name,
            gov,
            min && `من ${min}`,
            max && `إلى ${max}`,
            sp.get("featured") === "1" && "مميزة",
          ]
            .filter(Boolean)
            .map((label, i) => (
              <span key={i} className="chip border-planet-200 bg-planet-50 text-planet-700">
                {label}
              </span>
            ))}
          <button onClick={() => { setQ(""); router.push("/products"); }} className="chip ms-auto border-rose-200 bg-rose-50 text-rose-600">
            <X size={12} /> مسح الكل
          </button>
        </div>
      )}
    </div>
  );
}
