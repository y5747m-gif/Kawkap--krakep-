/** الإشعارات والمواقع والبلاغات وإحصائيات الإدارة */
import { all, get, run } from "../db";
import { newId } from "../ids";
import { GOVERNORATES } from "../constants";
import { isDemoMode } from "../settings";
import type { Notification, NotificationType, LocationRow, Report } from "../types";

// ------------------------- الإشعارات -------------------------

export function notify(data: { userId: string; type: NotificationType; title: string; body?: string | null; link?: string | null }): void {
  run(
    `INSERT INTO notifications (id, user_id, type, title, body, link, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    newId(), data.userId, data.type, data.title, data.body ?? null, data.link ?? null, new Date().toISOString()
  );
}

export function listNotifications(userId: string, limit = 50): Notification[] {
  return all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId, limit
  ).map(mapNotification);
}

export function unreadNotificationsCount(userId: string): number {
  return get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0", userId
  )?.c ?? 0;
}

export function markAllNotificationsRead(userId: string): void {
  run("UPDATE notifications SET read = 1 WHERE user_id = ?", userId);
}

function mapNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string, userId: r.user_id as string, type: r.type as NotificationType,
    title: r.title as string, body: (r.body as string) ?? null, link: (r.link as string) ?? null,
    read: !!r.read, createdAt: r.created_at as string,
  };
}

// ------------------------- المواقع (المحافظات) -------------------------

export function ensureLocations(): void {
  GOVERNORATES.forEach((g, i) => {
    run(
      `INSERT INTO locations (id, name, latitude, longitude, sort_order) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET latitude = excluded.latitude, longitude = excluded.longitude`,
      newId(), g.name, g.lat, g.lng, i
    );
  });
}

export function listLocations(): LocationRow[] {
  return all("SELECT * FROM locations ORDER BY sort_order").map((r) => ({
    id: r.id as string, name: r.name as string, latitude: r.latitude as number,
    longitude: r.longitude as number, sortOrder: r.sort_order as number,
  }));
}

// ------------------------- البلاغات -------------------------

export function createReport(data: { reporterId?: string | null; productId?: string | null; reason: string; details?: string | null }): void {
  run(
    `INSERT INTO reports (id, reporter_id, product_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'OPEN', ?)`,
    newId(), data.reporterId ?? null, data.productId ?? null, data.reason, data.details ?? null, new Date().toISOString()
  );
}

export function listReports(): Report[] {
  return all<Record<string, unknown>>(
    `SELECT r.*, p.title AS product_title, u.name AS reporter_name
     FROM reports r
     LEFT JOIN products p ON p.id = r.product_id
     LEFT JOIN users u ON u.id = r.reporter_id
     ORDER BY r.created_at DESC LIMIT 100`
  ).map((r) => ({
    id: r.id as string, reporterId: (r.reporter_id as string) ?? null,
    productId: (r.product_id as string) ?? null, reason: r.reason as string,
    details: (r.details as string) ?? null, status: r.status as Report["status"],
    createdAt: r.created_at as string, productTitle: (r.product_title as string) ?? null,
    reporterName: (r.reporter_name as string) ?? null,
  }));
}

export function updateReportStatus(id: string, status: Report["status"]): void {
  run("UPDATE reports SET status = ? WHERE id = ?", status, id);
}

export function openReportsCount(): number {
  return get<{ c: number }>("SELECT COUNT(*) AS c FROM reports WHERE status = 'OPEN'")?.c ?? 0;
}

// ------------------------- إحصائيات لوحة الإدارة -------------------------

export interface AdminStats {
  totalOrders: number;
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalUsers: number;
  sellersCount: number;
  totalProducts: number;
  activeProducts: number;
  pendingListings: number;
  newListingsThisWeek: number;
  soldProducts: number;
  openReports: number;
  ordersByStatus: { status: string; count: number }[];
}

export function getAdminStats(): AdminStats {
  const demoFilter = isDemoMode() ? "" : " AND is_demo = 0";
  const one = (sql: string, ...p: (string | number)[]): number =>
    get<{ c: number }>(sql, ...p)?.c ?? 0;

  const ordersByStatus = all<{ status: string; count: number }>(
    "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
  );

  return {
    totalOrders: one("SELECT COUNT(*) AS c FROM orders"),
    newOrders: one("SELECT COUNT(*) AS c FROM orders WHERE status = 'NEW'"),
    processingOrders: one(
      "SELECT COUNT(*) AS c FROM orders WHERE status IN ('REVIEWED','CONTACTED','PROCESSING')"
    ),
    completedOrders: one("SELECT COUNT(*) AS c FROM orders WHERE status = 'COMPLETED'"),
    totalUsers: one("SELECT COUNT(*) AS c FROM users"),
    sellersCount: one("SELECT COUNT(DISTINCT seller_id) AS c FROM products"),
    totalProducts: one(`SELECT COUNT(*) AS c FROM products WHERE 1=1${demoFilter}`),
    activeProducts: one(`SELECT COUNT(*) AS c FROM products WHERE status = 'ACTIVE'${demoFilter}`),
    pendingListings: one(`SELECT COUNT(*) AS c FROM products WHERE status = 'PENDING'${demoFilter}`),
    newListingsThisWeek: one(
      `SELECT COUNT(*) AS c FROM products WHERE created_at >= ?${demoFilter}`,
      new Date(Date.now() - 7 * 86400_000).toISOString()
    ),
    soldProducts: one(`SELECT COUNT(*) AS c FROM products WHERE status = 'SOLD'${demoFilter}`),
    openReports: one("SELECT COUNT(*) AS c FROM reports WHERE status = 'OPEN'"),
    ordersByStatus,
  };
}

// ------------------------- إدارة المستخدمين -------------------------

export interface AdminUserRow {
  id: string; name: string; phone: string; email: string | null; role: string;
  createdAt: string; productsCount: number; ordersCount: number; salesCount: number; ratingAvg: number;
}

export function listUsersForAdmin(): AdminUserRow[] {
  return all<Record<string, unknown>>(
    `SELECT u.id, u.name, u.phone, u.email, u.role, u.created_at,
       (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id) AS products_count,
       (SELECT COUNT(*) FROM orders o WHERE o.buyer_id = u.id) AS orders_count,
       COALESCE(pf.sales_count, 0) AS sales_count,
       COALESCE(pf.rating_avg, 0) AS rating_avg
     FROM users u LEFT JOIN profiles pf ON pf.user_id = u.id
     ORDER BY u.created_at DESC LIMIT 200`
  ).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    email: (r.email as string) ?? null,
    role: r.role as string,
    createdAt: r.created_at as string,
    productsCount: r.products_count as number,
    ordersCount: r.orders_count as number,
    salesCount: r.sales_count as number,
    ratingAvg: r.rating_avg as number,
  }));
}
