/** الإشعارات والمواقع والبلاغات وإحصائيات الإدارة */
import { all, get, run } from "../db";
import { newId } from "../ids";
import { GOVERNORATES } from "../constants";
import { isDemoMode } from "../settings";
import { GUEST_SELLER_ID } from "./users";
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
  /* ---- متابعة العملاء: المسجّلون + من يتعامل بدون حساب ---- */
  /** كل العملاء بدون تكرار (مسجّل + ضيف) حسب رقم الهاتف */
  totalCustomers: number;
  /** من أنشأ حسابًا فعلًا على الموقع */
  registeredCustomers: number;
  /** من طلب أو عرض للبيع بدون تسجيل دخول */
  guestCustomers: number;
  /** عدد العملاء (مسجّل أو ضيف) الذين أرسلوا طلبًا واحدًا على الأقل */
  orderingCustomers: number;
  /** طلبات وصلت بدون تسجيل دخول */
  guestOrders: number;
  /** طلبات من حسابات مسجّلة */
  registeredOrders: number;
  /** إعلانات نُشرت بدون حساب */
  guestListings: number;
  /** أصحاب الإعلانات بدون حساب (أرقام مختلفة) */
  guestSellers: number;
  ordersToday: number;
  ordersThisWeek: number;
  /** إجمالي قيمة الطلبات غير الملغاة */
  ordersValue: number;
  newCustomersThisWeek: number;
}

export function getAdminStats(): AdminStats {
  const demoFilter = isDemoMode() ? "" : " AND is_demo = 0";
  const one = (sql: string, ...p: (string | number)[]): number =>
    get<{ c: number }>(sql, ...p)?.c ?? 0;

  const ordersByStatus = all<{ status: string; count: number }>(
    "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
  );

  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  // أرقام هواتف وصلتنا بدون تسجيل دخول (طلبات ضيوف + إعلانات ضيوف)
  const GUEST_PHONES_SQL = `
    SELECT DISTINCT TRIM(customer_phone) AS phone FROM orders
      WHERE buyer_id IS NULL AND TRIM(COALESCE(customer_phone, '')) != ''
    UNION
    SELECT DISTINCT TRIM(contact_phone) AS phone FROM products
      WHERE seller_id = '${GUEST_SELLER_ID}' AND TRIM(COALESCE(contact_phone, '')) != ''`;

  // حساب «البائع الضيف» حساب نظامي داخلي ولا يُحسب ضمن العملاء
  const registeredCustomers = one(
    `SELECT COUNT(*) AS c FROM users WHERE id != '${GUEST_SELLER_ID}' AND role != 'ADMIN'`
  );
  // الضيوف غير المسجّلين فقط (حتى لا يُحسب العميل مرتين لو سجّل لاحقًا بنفس الرقم)
  const guestCustomers = one(
    `SELECT COUNT(*) AS c FROM (${GUEST_PHONES_SQL}) g
     WHERE g.phone NOT IN (SELECT TRIM(phone) FROM users)`
  );
  const orderingCustomers = one(
    `SELECT COUNT(*) AS c FROM (
       SELECT DISTINCT 'u:' || buyer_id AS k FROM orders WHERE buyer_id IS NOT NULL
       UNION
       SELECT DISTINCT 'g:' || TRIM(customer_phone) AS k FROM orders
         WHERE buyer_id IS NULL AND TRIM(COALESCE(customer_phone, '')) != ''
     )`
  );

  return {
    totalCustomers: registeredCustomers + guestCustomers,
    registeredCustomers,
    guestCustomers,
    orderingCustomers,
    guestOrders: one("SELECT COUNT(*) AS c FROM orders WHERE buyer_id IS NULL"),
    registeredOrders: one("SELECT COUNT(*) AS c FROM orders WHERE buyer_id IS NOT NULL"),
    guestListings: one(
      `SELECT COUNT(*) AS c FROM products WHERE seller_id = '${GUEST_SELLER_ID}'${demoFilter}`
    ),
    guestSellers: one(
      `SELECT COUNT(DISTINCT TRIM(contact_phone)) AS c FROM products
       WHERE seller_id = '${GUEST_SELLER_ID}' AND TRIM(COALESCE(contact_phone, '')) != ''${demoFilter}`
    ),
    ordersToday: one("SELECT COUNT(*) AS c FROM orders WHERE created_at >= ?", startOfToday),
    ordersThisWeek: one("SELECT COUNT(*) AS c FROM orders WHERE created_at >= ?", weekAgo),
    ordersValue: Math.round(
      get<{ c: number }>(
        "SELECT COALESCE(SUM(total), 0) AS c FROM orders WHERE status NOT IN ('CANCELLED')"
      )?.c ?? 0
    ),
    newCustomersThisWeek:
      one(
        `SELECT COUNT(*) AS c FROM users WHERE id != '${GUEST_SELLER_ID}' AND role != 'ADMIN' AND created_at >= ?`,
        weekAgo
      ) +
      one(
        `SELECT COUNT(*) AS c FROM (
           SELECT DISTINCT TRIM(customer_phone) AS phone FROM orders
             WHERE buyer_id IS NULL AND TRIM(COALESCE(customer_phone, '')) != '' AND created_at >= ?
           UNION
           SELECT DISTINCT TRIM(contact_phone) AS phone FROM products
             WHERE seller_id = '${GUEST_SELLER_ID}' AND TRIM(COALESCE(contact_phone, '')) != '' AND created_at >= ?
         ) g WHERE g.phone NOT IN (SELECT TRIM(phone) FROM users)`,
        weekAgo, weekAgo
      ),
    totalOrders: one("SELECT COUNT(*) AS c FROM orders"),
    newOrders: one("SELECT COUNT(*) AS c FROM orders WHERE status = 'NEW'"),
    processingOrders: one(
      "SELECT COUNT(*) AS c FROM orders WHERE status IN ('REVIEWED','CONTACTED','PROCESSING')"
    ),
    completedOrders: one("SELECT COUNT(*) AS c FROM orders WHERE status = 'COMPLETED'"),
    // حساب «البائع الضيف» حساب نظامي داخلي ولا يُحسب ضمن العملاء
    totalUsers: one(`SELECT COUNT(*) AS c FROM users WHERE id != '${GUEST_SELLER_ID}'`),
    sellersCount: one("SELECT COUNT(DISTINCT seller_id) AS c FROM products"),
    totalProducts: one(`SELECT COUNT(*) AS c FROM products WHERE 1=1${demoFilter}`),
    activeProducts: one(`SELECT COUNT(*) AS c FROM products WHERE status = 'ACTIVE'${demoFilter}`),
    pendingListings: one(`SELECT COUNT(*) AS c FROM products WHERE status = 'PENDING'${demoFilter}`),
    newListingsThisWeek: one(
      `SELECT COUNT(*) AS c FROM products WHERE created_at >= ?${demoFilter}`,
      weekAgo
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
     WHERE u.id != ?
     ORDER BY u.created_at DESC LIMIT 200`,
    GUEST_SELLER_ID
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
