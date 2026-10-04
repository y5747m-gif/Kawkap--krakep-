import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { listNotifications, markAllNotificationsRead, unreadNotificationsCount } from "@/lib/models/misc";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ notifications: [], unread: 0 });
  const countOnly = req.nextUrl.searchParams.get("count") === "1";
  if (countOnly) return jsonOk({ unread: unreadNotificationsCount(user.id) });
  return jsonOk({
    notifications: listNotifications(user.id),
    unread: unreadNotificationsCount(user.id),
  });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);
  markAllNotificationsRead(user.id);
  return jsonOk({ done: true });
}
