"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Star, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "./Toast";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";

export interface UploadedImage {
  id: string;
  url: string;
}

/**
 * رافع صور المنتج — حتى 8 صور:
 * رفع من المعرض أو كاميرا الهاتف مباشرة، معاينة، حذف، إعادة ترتيب، وتحديد الرئيسية.
 */
export default function ImageUploader({
  images, onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const remaining = MAX_PRODUCT_IMAGES - images.length - uploading;

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, Math.max(0, remaining));
    if (!list.length) return toast(`الحد الأقصى ${MAX_PRODUCT_IMAGES} صور`, "error");

    for (const file of list) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast("صيغة غير مدعومة — استخدم JPG أو PNG أو WebP", "error");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast("حجم الصورة أكبر من 5 ميجابايت", "error");
        continue;
      }

      setUploading((u) => u + 1);
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "تعذر رفع الصورة");
        onChange([...imagesRef.current, { id: crypto.randomUUID(), url: data.url }]);
      } catch (e) {
        toast(e instanceof Error ? e.message : "تعذر رفع الصورة", "error");
      } finally {
        setUploading((u) => u - 1);
      }
    }
  }

  // مرجع لأحدث نسخة من الصور داخل الحلقة المتسلسلة
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  function remove(id: string) {
    onChange(images.filter((i) => i.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function makeMain(index: number) {
    const next = [...images];
    const [img] = next.splice(index, 1);
    onChange([img, ...next]);
    toast("أصبحت الصورة الرئيسية لإعلانك", "success");
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="group relative overflow-hidden rounded-2xl border-2 border-planet-100 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`صورة ${i + 1}`} className="aspect-square w-full object-cover" />
            {i === 0 && (
              <span className="absolute start-2 top-2 rounded-full bg-gradient-to-l from-planet-500 to-tealx-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow">
                <Star size={10} className="inline fill-white" /> الرئيسية
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-planet-950/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded-lg bg-white/90 p-1.5 text-planet-800"
                aria-label="تقديم"
                disabled={i === 0}
              >
                <ChevronRight size={14} />
              </button>
              <div className="flex gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => makeMain(i)} className="rounded-lg bg-white/90 p-1.5 text-gold-600" aria-label="اجعل رئيسية" title="اجعلها الرئيسية">
                    <Star size={14} />
                  </button>
                )}
                <button type="button" onClick={() => remove(img.id)} className="rounded-lg bg-white/90 p-1.5 text-rose-600" aria-label="حذف">
                  <Trash2 size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded-lg bg-white/90 p-1.5 text-planet-800"
                aria-label="تأخير"
                disabled={i === images.length - 1}
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* مؤشرات الرفع الجاري */}
        {[...Array(uploading)].map((_, i) => (
          <div key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-planet-200 bg-planet-50/50">
            <Loader2 size={22} className="animate-spin text-planet-400" />
          </div>
        ))}

        {/* أزرار الإضافة */}
        {remaining > 0 && (
          <>
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-planet-300 bg-white/60 text-planet-500 transition-colors hover:border-planet-500 hover:bg-planet-50 hover:text-planet-600"
            >
              <ImagePlus size={26} />
              <span className="text-[11px] font-extrabold">من المعرض</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              className="btn-sell flex aspect-square flex-col items-center justify-center gap-2 !rounded-2xl"
            >
              <Camera size={26} />
              <span className="text-[11px] font-extrabold">الكاميرا</span>
            </button>
          </>
        )}
      </div>

      <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />

      <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
        <span className="text-planet-500">
          {images.length} / {MAX_PRODUCT_IMAGES} صور — الصورة الأولى هي الرئيسية
        </span>
      </div>

      <p className="mt-2 rounded-2xl border border-tealx-300/50 bg-tealx-500/10 px-4 py-3 text-xs font-bold leading-6 text-tealx-700">
        <Camera size={13} className="inline" /> التقط صورًا واضحة لشيئك حتى يحصل المشتري على فكرة دقيقة عنه.
      </p>
    </div>
  );
}
