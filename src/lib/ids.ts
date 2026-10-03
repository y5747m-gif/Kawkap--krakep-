import { randomUUID } from "node:crypto";
import { all } from "./db";

/** معرف فريد للكيانات */
export function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 20);
}

/** كود مرجعي للمنتج مثل KKP-8F3K2Q */
export function generateProductCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `KKP-${code}`;
}

/**
 * رقم طلب فريد بالصيغة: KK-YYYYMMDD-NNNN
 * مثال: KK-20261003-0001
 */
export function generateOrderCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `KK-${y}${m}${d}-`;
  const row = all<{ c: number }>(
    "SELECT COUNT(*) AS c FROM orders WHERE order_code LIKE ?",
    `${prefix}%`
  )[0];
  const seq = String((row?.c ?? 0) + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}
