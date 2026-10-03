import Link from "next/link";
import {
  Bell, Send, CheckCircle2, XCircle, PackageCheck, RefreshCw, PartyPopper,
  TrendingDown, Megaphone, Inbox, CheckCheck,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import MarkAllReadButton from "@/components/MarkAllReadButton";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/models/misc";
import { timeAgo } from "@/lib/format";
import type { NotificationType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "الإشعارات" };

const TYPE_META: Record<NotificationType, { icon: typeof Bell; classes: string }> = {
  LISTING_PUBLISHED: { icon: Send, classes: "bg-tealx-500/15 text-tealx-600" },
  LISTING_APPROVED: { icon: CheckCircle2, classes: "bg-planet-100 text-planet-600" },
  LISTING_REJECTED: { icon: XCircle, classes: "bg-rose-100 text-rose-600" },
  NEW_ORDER: { icon: PackageCheck, classes: "bg-gold-500/15 text-gold-600" },
  ORDER_CREATED: { icon: CheckCircle2, classes: "bg-planet-100 text-planet-600" },
  ORDER_UPDATED: { icon: RefreshCw, classes: "bg-sky-100 text-sky-600" },
  ORDER_STATUS: { icon: RefreshCw, classes: "bg-sky-100 text-sky-600" },
  ORDER_COMPLETED: { icon: PartyPopper, classes: "bg-gold-500/15 text-gold-600" },
  PRICE_DROP: { icon: TrendingDown, classes: "bg-planet-100 text-planet-600" },
  SYSTEM: { icon: Megaphone, classes: "bg-slate-100 text-slate-600" },
};

export default async function NotificationsPage() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={Inbox}
        title="إشعاراتك تنتظرك"
        subtitle="سجل الدخول لتصلك إشعارات الطلبات وإعلاناتك وتحديثات الأسعار"
        action={<Link href="/login?next=/notifications" className="btn-primary px-6 py-3 text-sm">تسجيل الدخول</Link>}
      />
    );
  }

  const notifications = listNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-planet-950">
            <Bell size={24} className="text-gold-500" /> الإشعارات
          </h1>
          {unread > 0 && (
            <p className="mt-1 text-sm font-bold text-gold-600">لديك {unread} إشعار غير مقروء</p>
          )}
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length ? (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            const content = (
              <div
                className={`glass flex items-start gap-3.5 rounded-2xl p-4 transition-all hover:shadow-lift ${
                  n.read ? "opacity-65" : "border-planet-300/60"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.classes}`}>
                  <Icon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-planet-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs leading-6 text-planet-600">{n.body}</p>}
                  <p className="mt-1 text-[10px] font-bold text-planet-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />}
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Inbox} title="لا توجد إشعارات" subtitle="ستظهر هنا إشعارات الطلبات والإعلانات والأسعار" />
      )}
    </div>
  );
}
