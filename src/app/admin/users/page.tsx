import { Users, ShieldCheck, Store } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import { listUsersForAdmin } from "@/lib/models/misc";
import { formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "المستخدمون" };

export default async function AdminUsersPage() {
  const users = listUsersForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-black text-planet-950 sm:text-2xl">
          <Users size={24} className="text-planet-600" /> المستخدمون
        </h1>
        <p className="mt-1 text-sm text-planet-600">
          {formatNumber(users.length)} مستخدم — كل مستخدم يمكنه الشراء والبيع بنفس الحساب
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-planet-100/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-planet-50 bg-planet-50/60 text-xs font-extrabold text-planet-600">
                <th className="px-4 py-3 text-start">المستخدم</th>
                <th className="px-4 py-3 text-start">التواصل</th>
                <th className="px-4 py-3 text-start">الدور</th>
                <th className="px-4 py-3 text-start">إعلاناته</th>
                <th className="px-4 py-3 text-start">طلباته</th>
                <th className="px-4 py-3 text-start">مبيعاته</th>
                <th className="px-4 py-3 text-start">تقييمه</th>
                <th className="px-4 py-3 text-start">الانضمام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-planet-50 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-planet-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-planet-500 to-tealx-500 text-xs font-black text-white">
                        {u.name.charAt(0)}
                      </span>
                      <span className="font-extrabold text-planet-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-planet-600" dir="ltr">{u.phone}</p>
                    {u.email && <p className="text-[11px] text-planet-400" dir="ltr">{u.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "ADMIN" ? (
                      <span className="chip border-gold-400/40 bg-gold-500/15 text-gold-600"><ShieldCheck size={12} /> مالك</span>
                    ) : (
                      <span className="chip border-planet-200 bg-planet-50 text-planet-600"><Store size={12} /> عميل / بائع</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-black text-planet-700">{formatNumber(u.productsCount)}</td>
                  <td className="px-4 py-3 font-black text-planet-700">{formatNumber(u.ordersCount)}</td>
                  <td className="px-4 py-3 font-black text-planet-700">{formatNumber(u.salesCount)}</td>
                  <td className="px-4 py-3"><RatingStars rating={u.ratingAvg} size={12} showValue={false} /></td>
                  <td className="px-4 py-3 text-xs text-planet-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
