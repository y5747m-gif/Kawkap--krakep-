/** نماذج المستخدمين والجلسات والعناوين والمحادثات */
import { all, get, run } from "../db";
import { newId } from "../ids";
import type { User, Profile, Address, Conversation } from "../types";

interface UserRow {
  id: string; name: string; phone: string; email: string | null;
  role: string; created_at: string; updated_at: string;
}

interface ProfileRow {
  user_id: string; avatar_url: string | null; bio: string | null; gov: string | null;
  area: string | null; latitude: number | null; longitude: number | null;
  rating_avg: number; rating_count: number; sales_count: number;
  created_at: string; updated_at: string;
}

export function mapUser(r: UserRow): User {
  return {
    id: r.id, name: r.name, phone: r.phone, email: r.email,
    role: r.role as User["role"], createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function mapProfile(r: ProfileRow | undefined | null): Profile | null {
  if (!r) return null;
  return {
    userId: r.user_id, avatarUrl: r.avatar_url, bio: r.bio, gov: r.gov, area: r.area,
    latitude: r.latitude, longitude: r.longitude,
    ratingAvg: r.rating_avg, ratingCount: r.rating_count, salesCount: r.sales_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// ------------------------- إنشاء وبحث المستخدمين -------------------------

export function createUser(data: {
  name: string; phone: string; email?: string | null; passwordHash: string;
  role?: "CUSTOMER" | "ADMIN"; gov?: string | null; area?: string | null;
}): User {
  const id = newId();
  const now = new Date().toISOString();
  run(
    `INSERT INTO users (id, name, phone, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.phone, data.email ?? null, data.passwordHash, data.role ?? "CUSTOMER", now, now
  );
  run(
    `INSERT INTO profiles (user_id, gov, area, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    id, data.gov ?? null, data.area ?? null, now, now
  );
  return { id, name: data.name, phone: data.phone, email: data.email ?? null, role: data.role ?? "CUSTOMER", createdAt: now, updatedAt: now };
}

export function getUserByPhone(phone: string): User | null {
  const r = get<UserRow>("SELECT * FROM users WHERE phone = ?", phone);
  return r ? mapUser(r) : null;
}

export function getUserByEmail(email: string): User | null {
  const r = get<UserRow>("SELECT * FROM users WHERE email = ?", email);
  return r ? mapUser(r) : null;
}

export function getUserById(id: string): User | null {
  const r = get<UserRow>("SELECT * FROM users WHERE id = ?", id);
  return r ? mapUser(r) : null;
}

export function getUserPasswordHash(id: string): string | null {
  const r = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", id);
  return r?.password_hash ?? null;
}

export function updateUser(id: string, data: { name?: string; email?: string | null; phone?: string }): void {
  const now = new Date().toISOString();
  if (data.name !== undefined) run("UPDATE users SET name = ?, updated_at = ? WHERE id = ?", data.name, now, id);
  if (data.email !== undefined) run("UPDATE users SET email = ?, updated_at = ? WHERE id = ?", data.email, now, id);
  if (data.phone !== undefined) run("UPDATE users SET phone = ?, updated_at = ? WHERE id = ?", data.phone, now, id);
}

export function updateUserPassword(id: string, hash: string): void {
  run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", hash, new Date().toISOString(), id);
}

export function getProfile(userId: string): Profile | null {
  return mapProfile(get<ProfileRow>("SELECT * FROM profiles WHERE user_id = ?", userId));
}

export function updateProfile(
  userId: string,
  data: { avatarUrl?: string | null; bio?: string | null; gov?: string | null; area?: string | null; latitude?: number | null; longitude?: number | null }
): void {
  const now = new Date().toISOString();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  const map: Record<string, unknown> = {
    avatarUrl: "avatar_url", bio: "bio", gov: "gov", area: "area",
    latitude: "latitude", longitude: "longitude",
  };
  for (const [k, col] of Object.entries(map)) {
    if (data[k as keyof typeof data] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(data[k as keyof typeof data] as string | number | null);
    }
  }
  if (!sets.length) return;
  run(`UPDATE profiles SET ${sets.join(", ")}, updated_at = ? WHERE user_id = ?`, ...params, now, userId);
}

// ------------------------- الجلسات -------------------------

const SESSION_DAYS = 30;

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = newId() + newId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  run("INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    newId(), token, userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}

export function getUserIdBySessionToken(token: string): string | null {
  const r = get<{ user_id: string; expires_at: string }>(
    "SELECT user_id, expires_at FROM sessions WHERE token = ?", token
  );
  if (!r) return null;
  if (new Date(r.expires_at).getTime() < Date.now()) {
    run("DELETE FROM sessions WHERE token = ?", token);
    return null;
  }
  return r.user_id;
}

export function deleteSession(token: string): void {
  run("DELETE FROM sessions WHERE token = ?", token);
}

// ------------------------- العناوين -------------------------

function mapAddress(r: Record<string, unknown>): Address {
  return {
    id: r.id as string, userId: r.user_id as string, label: r.label as string,
    gov: r.gov as string, area: (r.area as string) ?? null, details: (r.details as string) ?? null,
    latitude: (r.latitude as number) ?? null, longitude: (r.longitude as number) ?? null,
    isDefault: !!r.is_default, createdAt: r.created_at as string,
  };
}

export function listAddresses(userId: string): Address[] {
  return all("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", userId).map(mapAddress);
}

export function addAddress(userId: string, data: { label?: string; gov: string; area?: string | null; details?: string | null; latitude?: number | null; longitude?: number | null; isDefault?: boolean }): Address {
  const id = newId();
  if (data.isDefault) run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", userId);
  run(
    `INSERT INTO addresses (id, user_id, label, gov, area, details, latitude, longitude, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, data.label || "عنواني", data.gov, data.area ?? null, data.details ?? null,
    data.latitude ?? null, data.longitude ?? null, data.isDefault ? 1 : 0, new Date().toISOString()
  );
  return mapAddress(get("SELECT * FROM addresses WHERE id = ?", id) as Record<string, unknown>);
}

export function deleteAddress(userId: string, addressId: string): void {
  run("DELETE FROM addresses WHERE id = ? AND user_id = ?", addressId, userId);
}

// ------------------------- المحادثات (تواصل عبر واتساب) -------------------------

interface ConversationJoinRow {
  id: string; user_id: string; seller_id: string; product_id: string | null;
  product_title: string | null; last_message_at: string; created_at: string;
  seller_name: string; seller_avatar: string | null; seller_phone: string;
}

export function upsertConversation(userId: string, sellerId: string, productId: string | null, productTitle: string | null): void {
  const now = new Date().toISOString();
  run(
    `INSERT INTO conversations (id, user_id, seller_id, product_id, product_title, last_message_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, seller_id, product_id) DO UPDATE SET last_message_at = excluded.last_message_at`,
    newId(), userId, sellerId, productId, productTitle, now, now
  );
}

export function listConversations(userId: string): Conversation[] {
  const rows = all<ConversationJoinRow>(
    `SELECT cv.*, u.name AS seller_name, pf.avatar_url AS seller_avatar, u.phone AS seller_phone
     FROM conversations cv
     JOIN users u ON u.id = cv.seller_id
     LEFT JOIN profiles pf ON pf.user_id = u.id
     WHERE cv.user_id = ?
     ORDER BY cv.last_message_at DESC
     LIMIT 50`,
    userId
  );
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, sellerId: r.seller_id, productId: r.product_id,
    productTitle: r.product_title, lastMessageAt: r.last_message_at, createdAt: r.created_at,
    sellerName: r.seller_name, sellerAvatar: r.seller_avatar, sellerPhone: r.seller_phone,
  }));
}
