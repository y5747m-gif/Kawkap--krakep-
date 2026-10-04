"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Package, Expand } from "lucide-react";
import type { ProductImage } from "@/lib/types";

/** معرض صور المنتج — صور كبيرة + تنقل بينها */
export default function Gallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [];
  const current = list[index];

  function next() { setIndex((i) => (i + 1) % list.length); }
  function prev() { setIndex((i) => (i - 1 + list.length) % list.length); }

  if (!list.length) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-planet-100 to-tealx-500/20 text-planet-400">
        <Package size={56} strokeWidth={1.2} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-planet-50 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`${title} — صورة ${index + 1}`}
          className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500"
          onClick={() => window.open(current.url, "_blank")}
        />
        <span className="absolute bottom-3 start-3 rounded-full bg-planet-950/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {index + 1} / {list.length}
        </span>
        {list.length > 1 && (
          <>
            <button
              onClick={next}
              aria-label="الصورة التالية"
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-planet-800 shadow-soft backdrop-blur transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={prev}
              aria-label="الصورة السابقة"
              className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-planet-800 shadow-soft backdrop-blur transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <span className="pointer-events-none absolute top-3 end-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-planet-600 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Expand size={11} /> اضغط لتكبير الصورة
        </span>
      </div>

      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              aria-label={`صورة ${i + 1}`}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                i === index ? "border-planet-500 shadow-glow" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
