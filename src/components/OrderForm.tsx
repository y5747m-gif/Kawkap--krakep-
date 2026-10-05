"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, MapPin, LocateFixed, NotebookPen, Truck, Store, Handshake,
} from "lucide-react";
import { toast } from "./Toast";
import WhatsAppIcon from "./WhatsAppIcon";
import { formatMoney, formatQuantity, formatUnitPrice } from "@/lib/format";
import { computeLineTotal } from "@/lib/pricing";
import { GOVERNORATES, DELIVERY_METHODS } from "@/lib/constants";
import type { Address, DeliveryMethod, PricingType } from "@/lib/types";

export interface OrderFormProduct {
  id: string;
  title: string;
  price: number;
  pricingType: PricingType;
  unit: string;
  quantity: number;
  gov: string;
  area: string | null;
  sellerId: string;
  sellerName: string;
}

/**
 * نموذج الطلب — يُستخدم لطلب منتج واحد أو إتمام طلب السلة.
 * عند التأكيد: يُحفظ الطلب في قاعدة البيانات أولًا ثم يُفتح واتساب المالك
 * برسالة الطلب الديناميكية المجهزة.
 */
export default function OrderForm({
  source,
  product,
  initialQuantity = 1,
  viewer,
  addresses,
  cartTotal,
  className = "",
}: {
  source: "PRODUCT" | "CART";
  product?: OrderFormProduct;
  initialQuantity?: number;
  viewer: { name: string; phone: string; gov: string | null; area: string | null } | null;
  addresses: Address[];
  cartTotal?: number;
  className?: string;
}) {
  const router = useRouter();
  const perUnit = product?.pricingType === "PER_KG" || product?.pricingType === "PER_PIECE";
  const [quantity, setQuantity] = useState(
    perUnit ? initialQuantity : (product?.quantity ?? 1)
  );
  const [name, setName] = useState(viewer?.name ?? "");
  const [phone, setPhone] = useState(viewer?.phone ?? "");
  const [gov, setGov] = useState(viewer?.gov ?? "");
  const [area, setArea] = useState(viewer?.area ?? "");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const waWindow = useRef<Window | null>(null);

  const total = useMemo(() => {
    if (source === "CART") return cartTotal ?? 0;
    if (!product) return 0;
    return computeLineTotal(product.pricingType, product.price, quantity);
  }, [source, product, quantity, cartTotal]);

  function locateMe() {
    if (!("geolocation" in navigator)) return toast("المتصفح لا يدعم تحديد الموقع", "error");
    toast("جارٍ تحديد موقعك...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast("تم تحديد موقعك بنجاح", "success");
      },
      () => toast("تعذر تحديد الموقع — يمكنك المتابعة بدونه", "error"),
      { timeout: 8000 }
    );
  }

  function applySavedAddress(a: Address) {
    setGov(a.gov);
    setArea(a.area ?? "");
    setAddress(a.details ?? "");
    if (a.latitude && a.longitude) setCoords({ lat: a.latitude, lng: a.longitude });
    if (a.isDefault && a.gov) return;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // تحقق سريع قبل الإرسال
    if (name.trim().length < 2) return toast("أدخل الاسم", "error");
    if (!/^01[0125]\d{8}$/.test(phone.replace(/\D/g, "").replace(/^(20|0020)/, ""))) {
      return toast("أدخل رقم هاتف مصري صحيح مثل 01012345678", "error");
    }
    if (!gov) return toast("اختر المحافظة", "error");
    if (deliveryMethod === "DELIVERY" && !address.trim()) {
      return toast("أدخل عنوان الاستلام", "error");
    }

    // فتح نافذة واتساب مبكرًا (ضمن نقرة المستخدم) لتفادي حاجب النوافذ
    waWindow.current = window.open("", "_blank");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          productId: product?.id,
          quantity: perUnit ? quantity : undefined,
          customerName: name,
          customerPhone: phone,
          gov,
          area: area || null,
          address: address || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          deliveryMethod,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        waWindow.current?.close();
        waWindow.current = null;
        throw new Error(data.error || "تعذر إنشاء الطلب");
      }

      // تسجيل أن واتساب فُتح + توجيه النافذة المفتوحة لرابط المالك
      fetch(`/api/orders/${data.orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappOpened: true }),
      }).catch(() => {});

      if (waWindow.current && !waWindow.current.closed) {
        waWindow.current.location.href = data.whatsappUrl;
      }

      router.push(`/orders/${data.orderCode}?new=1`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={`space-y-5 ${className}`}>
      {/* ملخص المنتج */}
      {product ? (
        <div className="rounded-2xl border border-planet-100 bg-planet-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-planet-950">{product.title}</p>
              <p className="text-xs text-planet-600">
                البائع: {product.sellerName} · {product.gov}{product.area ? ` — ${product.area}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-sm font-black text-planet-600">
              {formatUnitPrice(product.price, product.pricingType, product.unit)}
            </span>
          </div>

          {/* الكمية */}
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-planet-100 pt-3.5">
            <span className="text-xs font-bold text-planet-700">
              الكمية {perUnit ? `(${formatQuantity(product.quantity, product.unit)} متاحة)` : `— ${formatQuantity(product.quantity, product.unit)} كدفعة كاملة`}
            </span>
            {perUnit ? (
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, Math.round((q - 1) * 100) / 100))}
                  className="btn-outline h-10 w-10 rounded-xl p-0 text-lg leading-none sm:h-9 sm:w-9"
                  aria-label="تقليل"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={product.quantity}
                  step={product.pricingType === "PER_PIECE" ? 1 : 0.5}
                  onChange={(e) => setQuantity(Math.min(product.quantity, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-20 rounded-xl border border-planet-200 bg-white px-2 py-1.5 text-center text-sm font-extrabold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.quantity, Math.round((q + 1) * 100) / 100))}
                  className="btn-outline h-10 w-10 rounded-xl p-0 text-lg leading-none sm:h-9 sm:w-9"
                  aria-label="زيادة"
                >
                  +
                </button>
              </div>
            ) : (
              <span className="text-sm font-extrabold text-planet-800">{formatQuantity(product.quantity, product.unit)}</span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-planet-100 pt-3">
            <span className="text-sm font-bold text-planet-700">الإجمالي</span>
            <span className="text-lg font-black text-planet-600">{formatMoney(total)}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-planet-100 bg-planet-50/60 p-4">
          <span className="text-sm font-bold text-planet-700">إجمالي طلب السلة</span>
          <span className="text-lg font-black text-planet-600">{formatMoney(total)}</span>
        </div>
      )}

      {/* طريقة الاستلام */}
      <div>
        <label className="field-label">طريقة الاستلام</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {DELIVERY_METHODS.map((m) => {
            const Icon = m.key === "PICKUP" ? Store : m.key === "DELIVERY" ? Truck : Handshake;
            const active = deliveryMethod === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setDeliveryMethod(m.key as DeliveryMethod)}
                className={`rounded-2xl border-2 p-3 text-center transition-all ${
                  active ? "border-planet-500 bg-planet-50 shadow-glow" : "border-planet-100 bg-white hover:border-planet-300"
                }`}
              >
                <Icon size={20} className={`mx-auto mb-1.5 ${active ? "text-planet-600" : "text-planet-400"}`} />
                <span className={`block text-xs font-extrabold ${active ? "text-planet-800" : "text-planet-600"}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* بيانات التواصل */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">الاسم <span className="text-rose-500">*</span></label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: محمد أحمد" required />
        </div>
        <div>
          <label className="field-label">رقم الهاتف <span className="text-rose-500">*</span></label>
          <input
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            inputMode="tel"
            dir="ltr"
            required
          />
        </div>
      </div>

      {/* العنوان */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">المحافظة <span className="text-rose-500">*</span></label>
          <select className="field" value={gov} onChange={(e) => setGov(e.target.value)} required>
            <option value="">اختر المحافظة</option>
            {GOVERNORATES.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">المنطقة</label>
          <input className="field" value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: مدينة نصر" />
        </div>
      </div>

      {addresses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {addresses.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => applySavedAddress(a)}
              className="chip border-planet-200 bg-planet-50 text-planet-700 hover:border-planet-400"
            >
              <MapPin size={12} /> {a.label}: {a.gov} {a.area ? `— ${a.area}` : ""}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="field-label">
          {deliveryMethod === "DELIVERY" ? "عنوان الاستلام التفصيلي *" : "العنوان (اختياري)"}
        </label>
        <textarea
          className="field min-h-20"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="الشارع، رقم العمارة، علامة مميزة..."
        />
      </div>

      <button
        type="button"
        onClick={locateMe}
        className={`chip ${coords ? "border-planet-400 bg-planet-50 text-planet-700" : "border-tealx-300 bg-tealx-500/10 text-tealx-700"}`}
      >
        <LocateFixed size={13} /> {coords ? "تم تحديد موقعك" : "استخدم موقعي الحالي"}
      </button>

      <div>
        <label className="field-label">ملاحظات (اختياري)</label>
        <textarea
          className="field min-h-16"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل تساعد في تجهيز طلبك..."
        />
      </div>

      {/* زر التأكيد */}
      <button type="submit" disabled={loading} className="btn-whatsapp glow-pulse w-full px-6 py-4 text-base">
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <WhatsAppIcon size={20} />
            إرسال الطلب — {formatMoney(total)}
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-planet-500">
        <NotebookPen size={13} className="shrink-0" />
        بضغطك «إرسال الطلب» يُحفظ الطلب في النظام برقم فريد، ثم يُفتح واتساب تلقائيًا
        برسالة منسّقة بكل التفاصيل تصل مباشرة لإدارة كوكب كراكيب لمتابعتها.
      </p>
    </form>
  );
}
