/** نماذج الطلبات والتقييمات */
import { all, get, run, tx } from "../db";
import { newId } from "../ids";
import type {
  Order, OrderItem, OrderStatus, OrderWithItems, DeliveryMethod, PricingType,
  ReviewRow,
} from "../types";

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    orderCode: r.order_code as string,
    buyerId: (r.buyer_id as string) ?? null,
    customerName: r.customer_name as string,
    customerPhone: r.customer_phone as string,
    gov: (r.gov as string) ?? null,
    area: (r.area as string) ?? null,
    address: (r.address as string) ?? null,
    latitude: (r.latitude as number) ?? null,
    longitude: (r.longitude as number) ?? null,
    deliveryMethod: r.delivery_method as DeliveryMethod,
    notes: (r.notes as string) ?? null,
    itemsPrice: r.items_price as number,
    total: r.total as number,
    status: r.status as OrderStatus,
    whatsappSent: !!r.whatsapp_sent,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapOrderItem(r: Record<string, unknown>): OrderItem {
  return {
    id: r.id as string,
    orderId: r.order_id as string,
    productId: r.product_id as string,
    sellerId: r.seller_id as string,
    sellerName: r.seller_name as string,
    title: r.title as string,
    unit: r.unit as string,
    price: r.price as number,
    pricingType: r.pricing_type as PricingType,
    quantity: r.quantity as number,
    lineTotal: r.line_total as number,
    productImage: (r.product_image as string) ?? null,
    productGov: (r.product_gov as string) ?? null,
    productArea: (r.product_area as string) ?? null,
  };
}

// ------------------------- إنشاء الطلب -------------------------

export interface NewOrderItem {
  productId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unit: string;
  price: number;
  pricingType: PricingType;
  quantity: number;
  lineTotal: number;
}

export interface NewOrderInput {
  orderCode: string;
  buyerId: string | null;
  customerName: string;
  customerPhone: string;
  gov?: string | null;
  area?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryMethod: DeliveryMethod;
  notes?: string | null;
  items: NewOrderItem[];
}

/** إنشاء الطلب مع بنوده والطلبات الفرعية لكل بائع داخل معاملة واحدة */
export function createOrderRecord(input: NewOrderInput): Order {
  return tx(() => {
    const id = newId();
    const now = new Date().toISOString();
    const itemsPrice = input.items.reduce((s, i) => s + i.lineTotal, 0);
    run(
      `INSERT INTO orders (id, order_code, buyer_id, customer_name, customer_phone, gov, area, address,
        latitude, longitude, delivery_method, notes, items_price, total, status, whatsapp_sent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', 0, ?, ?)`,
      id, input.orderCode, input.buyerId, input.customerName, input.customerPhone,
      input.gov ?? null, input.area ?? null, input.address ?? null,
      input.latitude ?? null, input.longitude ?? null, input.deliveryMethod,
      input.notes ?? null, itemsPrice, itemsPrice, now, now
    );

    // تجميع البائعين (طلب رئيسي + طلبات فرعية)
    const sellersMap = new Map<string, { total: number; productIds: string[] }>();
    for (const item of input.items) {
      run(
        `INSERT INTO order_items (id, order_id, product_id, seller_id, seller_name, title, unit, price, pricing_type, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId(), id, item.productId, item.sellerId, item.sellerName, item.title,
        item.unit, item.price, item.pricingType, item.quantity, item.lineTotal
      );
      const agg = sellersMap.get(item.sellerId) ?? { total: 0, productIds: [] };
      agg.total += item.lineTotal;
      agg.productIds.push(item.productId);
      sellersMap.set(item.sellerId, agg);
    }
    for (const [sellerId, agg] of sellersMap) {
      run(
        `INSERT INTO seller_orders (id, order_id, seller_id, product_id, total, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)`,
        newId(), id, sellerId, agg.productIds.length === 1 ? agg.productIds[0] : null, agg.total, now, now
      );
    }
    return mapOrder(get("SELECT * FROM orders WHERE id = ?", id) as Record<string, unknown>);
  });
}

export function markOrderWhatsappSent(orderId: string): void {
  run("UPDATE orders SET whatsapp_sent = 1, updated_at = ? WHERE id = ?", new Date().toISOString(), orderId);
}

// ------------------------- قراءة الطلبات -------------------------

const ITEMS_SELECT = `
SELECT oi.*, pi.url AS product_image, p.gov AS product_gov, p.area AS product_area
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN (SELECT product_id, MIN(sort_order) AS so, url FROM product_images GROUP BY product_id) pi ON pi.product_id = oi.product_id
`;

export function getOrderByCode(orderCode: string): OrderWithItems | null {
  const o = get<Record<string, unknown>>("SELECT * FROM orders WHERE order_code = ?", orderCode);
  if (!o) return null;
  const order = mapOrder(o);
  const items = all(`${ITEMS_SELECT} WHERE oi.order_id = ?`, order.id).map((r) => mapOrderItem(r as Record<string, unknown>));
  const review = getReviewForOrder(order.id);
  return { ...order, items, review };
}

export function getOrderById(orderId: string): OrderWithItems | null {
  const o = get<Record<string, unknown>>("SELECT * FROM orders WHERE id = ?", orderId);
  if (!o) return null;
  const order = mapOrder(o);
  const items = all(`${ITEMS_SELECT} WHERE oi.order_id = ?`, order.id).map((r) => mapOrderItem(r as Record<string, unknown>));
  const review = getReviewForOrder(order.id);
  return { ...order, items, review };
}

export function listBuyerOrders(buyerId: string): OrderWithItems[] {
  const rows = all<{ id: string }>(
    "SELECT id FROM orders WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 100", buyerId
  );
  return rows.map((r) => getOrderById(r.id)!).filter(Boolean);
}

export interface AdminOrderFilters {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function listOrdersForAdmin(filters: AdminOrderFilters): { orders: OrderWithItems[]; total: number } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters.status && filters.status !== "ALL") { conditions.push("o.status = ?"); params.push(filters.status); }
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push("(o.order_code LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)");
    params.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = get<{ c: number }>(`SELECT COUNT(*) AS c FROM orders o ${where}`, ...params)?.c ?? 0;
  const rows = all<{ id: string }>(
    `SELECT o.id FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    ...params, filters.limit ?? 100, filters.offset ?? 0
  );
  return { orders: rows.map((r) => getOrderById(r.id)!).filter(Boolean), total };
}

export function listSellerOrders(sellerId: string): (OrderWithItems & { sellerTotal: number; sellerStatus: OrderStatus })[] {
  const soRows = all(
    `SELECT so.order_id, so.total AS seller_total, so.status AS seller_status
     FROM seller_orders so WHERE so.seller_id = ?
     ORDER BY so.created_at DESC LIMIT 100`,
    sellerId
  );
  const result: (OrderWithItems & { sellerTotal: number; sellerStatus: OrderStatus })[] = [];
  for (const r of soRows as { order_id: string; seller_total: number; seller_status: OrderStatus }[]) {
    const order = getOrderById(r.order_id);
    if (order) result.push({ ...order, sellerTotal: r.seller_total, sellerStatus: r.seller_status });
  }
  return result;
}

export function sellerOrdersCount(sellerId: string): number {
  return get<{ c: number }>("SELECT COUNT(*) AS c FROM seller_orders WHERE seller_id = ?", sellerId)?.c ?? 0;
}

export function listSellerIdsForOrder(orderId: string): string[] {
  return (all<{ seller_id: string }>("SELECT seller_id FROM seller_orders WHERE order_id = ?", orderId) as { seller_id: string }[]).map((r) => r.seller_id);
}

// ------------------------- تحديث الحالة -------------------------

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const now = new Date().toISOString();
  run("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", status, now, orderId);
  run("UPDATE seller_orders SET status = ?, updated_at = ? WHERE order_id = ?", status, now, orderId);
  return mapOrder(get("SELECT * FROM orders WHERE id = ?", orderId) as Record<string, unknown>);
}

/** إحصائيات المبيعات للبائع عند إتمام الطلب */
export function incrementSalesCount(sellerId: string): void {
  run("UPDATE profiles SET sales_count = sales_count + 1, updated_at = ? WHERE user_id = ?", new Date().toISOString(), sellerId);
}

// ------------------------- التقييمات -------------------------

export function getReviewForOrder(orderId: string): ReviewRow | null {
  const r = get<Record<string, unknown>>(
    `SELECT r.*, u.name AS buyer_name FROM reviews r JOIN users u ON u.id = r.buyer_id WHERE r.order_id = ?`,
    orderId
  );
  if (!r) return null;
  return {
    id: r.id as string, orderId: r.order_id as string, productId: r.product_id as string,
    sellerId: r.seller_id as string, buyerId: r.buyer_id as string,
    rating: r.rating as number, comment: (r.comment as string) ?? null,
    createdAt: r.created_at as string, buyerName: (r.buyer_name as string) ?? undefined,
  };
}

export function hasReview(orderId: string): boolean {
  return !!get("SELECT 1 FROM reviews WHERE order_id = ?", orderId);
}

export function insertReview(data: { orderId: string; productId: string; sellerId: string; buyerId: string; rating: number; comment?: string | null }): void {
  run(
    `INSERT INTO reviews (id, order_id, product_id, seller_id, buyer_id, rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(), data.orderId, data.productId, data.sellerId, data.buyerId,
    data.rating, data.comment ?? null, new Date().toISOString()
  );
  // تحديث متوسط تقييم البائع
  const agg = get<{ avg: number; c: number }>(
    "SELECT AVG(rating) AS avg, COUNT(*) AS c FROM reviews WHERE seller_id = ?", data.sellerId
  );
  run(
    "UPDATE profiles SET rating_avg = ?, rating_count = ?, updated_at = ? WHERE user_id = ?",
    Math.round((agg?.avg ?? 0) * 10) / 10, agg?.c ?? 0, new Date().toISOString(), data.sellerId
  );
}

export function listSellerReviews(sellerId: string, limit = 10): ReviewRow[] {
  return all<Record<string, unknown>>(
    `SELECT r.*, u.name AS buyer_name FROM reviews r JOIN users u ON u.id = r.buyer_id
     WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT ?`,
    sellerId, limit
  ).map((r) => ({
    id: r.id as string, orderId: r.order_id as string, productId: r.product_id as string,
    sellerId: r.seller_id as string, buyerId: r.buyer_id as string,
    rating: r.rating as number, comment: (r.comment as string) ?? null,
    createdAt: r.created_at as string, buyerName: (r.buyer_name as string) ?? undefined,
  }));
}
