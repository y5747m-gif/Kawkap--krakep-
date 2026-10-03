"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, ChevronDown } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import CopyButton from "@/components/CopyButton";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "@/components/Toast";
import { openCustomerWhatsApp } from "@/lib/whatsapp-link";
import { generateOrderWhatsAppMessage, generateCustomerMessage } from "@/lib/whatsapp-message";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatMoney, formatDateTime, formatNumber } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";

/**
 * جدول طلبات الإدارة:
 * رقم الطلب · العميل · الهاتف · المنتج · البائع · الكمية · السعر · الإجمالي · الموقع · التاريخ · الحالة
 * + فتح WhatsApp للعميل + نسخ تفاصيل الطلب + تحديث الحالة
 */
export default function AdminOrdersTable({
  initialOrders, total, initialStatus, initialQ,
}: {
  initialOrders: OrderWithItems[];
  total: number;
  initialStatus: string;
  initialQ: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  function filter(newStatus?: string, newQ?: string) {
    const s = newStatus ?? status;
    const query = newQ ?? q;
    setLoading(true);
    const params = new URLSearchParams();
    if (s && s !== "ALL") params.set("status", s);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/admin/orders?${params.toString()}`);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      toast(`تم تحديث حالة الطلب إلى: ${ORDER_STATUSES.find((s) => s.key === newStatus)?.label}`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "حدث خطأ", "error");
    } finally {
      setUpdating(null);
    }
  }

  const statusOptions = useMemo(() => ORDER_STATUSES, []);

  return (
    <div className="space-y-4">
      {/* أدوات التصفية */}
      <div className="flex flex-col gap-3 rounded-3xl border border-planet-100/60 bg-white p-4 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); filter(); }}
          className="flex flex-1 items-center gap-2 rounded-2xl border border-planet-200 bg-planet-50/50 px-4 py-2.5"
        >
          <Search size={16} className="text-planet-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>
        <select className="field w-full py-2.5 text-sm sm:w-48" value={status} onChange={(e) => { setStatus(e.target.value); filter(e.target.value); }}>
          <option value="ALL">كل الحالات</option>
          {statusOptions.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <span className="chip shrink-0 border-planet-200 bg-planet-50 text-planet-700">{formatNumber(total)} طلب</span>
      </div>

      {/* الجدول — سطح المكتب */}
      <div className="hidden overflow-hidden rounded-3xl border border-planet-100/60 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-planet-50 bg-planet-50/60 text-xs font-extrabold text-planet-600">
                <th className="px-3 py-3 text-start">رقم الطلب</th>
                <th className="px-3 py-3 text-start">العميل</th>
                <th className="px-3 py-3 text-start">المنتجات</th>
                <th className="px-3 py-3 text-start">الإجمالي</th>
                <th className="px-3 py-3 text-start">الموقع</th>
                <th className="px-3 py-3 text-start">التاريخ</th>
                <th className="px-3 py-3 text-start">الحالة</th>
                <th className="px-3 py-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-planet-50 bg-white">
              {orders.map((o) => (
                <tr key={o.id} className="align-top hover:bg-planet-50/40">
                  <td className="px-3 py-3.5 font-black text-planet-700">#{o.orderCode}</td>
                  <td className="px-3 py-3.5">
                    <p className="font-bold text-planet-900">{o.customerName}</p>
                    <p className="text-[11px] text-planet-500" dir="ltr">{o.customerPhone}</p>
                  </td>
                  <td className="max-w-64 px-3 py-3.5">
                    {o.items.map((item) => (
                      <p key={item.id} className="line-clamp-1 text-xs text-planet-700">
                        <span className="font-bold">{item.title}</span>
                        <span className="text-planet-400"> — {item.sellerName} · {formatNumber(item.quantity)} {item.unit} × {formatMoney(item.price)}</span>
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-3.5 font-black text-planet-600">{formatMoney(o.total)}</td>
                  <td className="max-w-36 px-3 py-3.5 text-xs text-planet-600">
                    {[o.gov, o.area].filter(Boolean).join(" — ") || "—"}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-planet-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-3 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => openCustomerWhatsApp(o.customerPhone, generateCustomerMessage(o))}
                        className="btn-whatsapp px-3 py-1.5 text-[11px]"
                      >
                        <WhatsAppIcon size={12} /> فتح WhatsApp
                      </button>
                      <CopyButton
                        text={generateOrderWhatsAppMessage(o)}
                        label="نسخ التفاصيل"
                        className="btn-outline px-3 py-1.5 text-[11px]"
                      />
                      <div className="relative">
                        <select
                          value=""
                          disabled={updating === o.id}
                          onChange={(e) => e.target.value && updateStatus(o.id, e.target.value)}
                          className="field cursor-pointer py-1.5 pe-7 text-[11px] font-bold"
                        >
                          <option value="">{updating === o.id ? "جارٍ التحديث..." : "تحديث الحالة"}</option>
                          {statusOptions.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={8} className="bg-white px-4 py-10 text-center text-sm text-planet-400">
                    {loading ? "جارٍ التحميل..." : "لا توجد طلبات مطابقة"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* بطاقات — الموبايل */}
      <div className="space-y-3 lg:hidden">
        {orders.map((o) => (
          <div key={o.id} className="rounded-3xl border border-planet-100/60 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-planet-800">#{o.orderCode}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-planet-600">
              <p><span className="font-bold">العميل:</span> {o.customerName}</p>
              <p dir="ltr" className="text-start"><span className="font-bold">الهاتف:</span> {o.customerPhone}</p>
              <p className="col-span-2"><span className="font-bold">الموقع:</span> {[o.gov, o.area].filter(Boolean).join(" — ") || "—"}</p>
              <p className="col-span-2"><span className="font-bold">التاريخ:</span> {formatDateTime(o.createdAt)}</p>
            </div>
            <div className="mt-2.5 space-y-1 rounded-2xl bg-planet-50/60 p-3">
              {o.items.map((item) => (
                <p key={item.id} className="text-xs text-planet-700">
                  <span className="font-bold">{item.title}</span> — {item.sellerName} · {formatNumber(item.quantity)} {item.unit} × {formatMoney(item.price)} = <span className="font-black">{formatMoney(item.lineTotal)}</span>
                </p>
              ))}
              <p className="border-t border-planet-100 pt-1.5 text-sm font-black text-planet-600">
                الإجمالي: {formatMoney(o.total)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => openCustomerWhatsApp(o.customerPhone, generateCustomerMessage(o))} className="btn-whatsapp px-3 py-2 text-[11px]">
                <WhatsAppIcon size={12} /> فتح WhatsApp
              </button>
              <CopyButton text={generateOrderWhatsAppMessage(o)} label="نسخ التفاصيل" className="btn-outline px-3 py-2 text-[11px]" />
              <button
                onClick={() => setOpenRow(openRow === o.id ? null : o.id)}
                className="btn-outline col-span-2 px-3 py-2 text-[11px]"
              >
                {updating === o.id ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                تحديث الحالة
              </button>
              {openRow === o.id && (
                <div className="col-span-2 grid grid-cols-2 gap-1.5 rounded-2xl bg-planet-50/60 p-2 animate-fade-in">
                  {statusOptions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { updateStatus(o.id, s.key); setOpenRow(null); }}
                      className={`chip justify-center ${s.badge} ${o.status === s.key ? "ring-2 ring-planet-300" : ""}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {!orders.length && (
          <p className="rounded-3xl border border-planet-100/60 bg-white px-4 py-10 text-center text-sm text-planet-400">
            لا توجد طلبات مطابقة
          </p>
        )}
      </div>
    </div>
  );
}
