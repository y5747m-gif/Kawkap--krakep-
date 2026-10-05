/** المصادقة والجلسات — حساب واحد للعميل يكون مشتريًا وبائعًا في نفس الوقت */
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as usersModel from "./models/users";
import { unreadNotificationsCount } from "./models/misc";
import type { CurrentUser } from "./types";
import { normalizeEgyptianPhone } from "./validate";

export const SESSION_COOKIE = "kk_session";
/**
 * رمز الزائر — يسمح لمن ينشر إعلانًا بدون حساب أن يعود لتعديله أو حذفه
 * من نفس المتصفح. لا يمنح أي صلاحية أخرى (ولا يرى به إعلانات غيره).
 */
export const GUEST_COOKIE = "kk_guest";
const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // سنة

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/** المستخدم الحالي من كوكي الجلسة (يعمل في Server Components و Route Handlers) */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = usersModel.getUserIdBySessionToken(token);
  if (!userId) return null;
  const user = usersModel.getUserById(userId);
  if (!user) return null;
  return {
    ...user,
    profile: usersModel.getProfile(userId),
    unreadNotifications: unreadNotificationsCount(userId),
  };
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === "ADMIN";
}

/** رمز الزائر الحالي إن وُجد (للقراءة فقط — يعمل في أي مكان) */
export async function getGuestToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value || null;
}

/** رمز الزائر مع إنشائه إن لم يوجد — تُستدعى داخل Route Handlers فقط */
export async function ensureGuestToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const token = `g_${randomUUID()}`;
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return token;
}

/** هل يملك هذا الزائر/المستخدم صلاحية التحكم في الإعلان؟ */
export function canManageListing(
  product: { sellerId: string; guestToken: string | null },
  user: CurrentUser | null,
  guestToken: string | null
): boolean {
  if (user && (product.sellerId === user.id || isAdmin(user))) return true;
  return !!guestToken && !!product.guestToken && product.guestToken === guestToken;
}

/** إنشاء جلسة وضبط الكوكي — تُستدعى داخل Route Handlers فقط */
export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = usersModel.createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) usersModel.deleteSession(token);
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ------------------------- تسجيل ودخول -------------------------

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: CurrentUser;
}

export function registerUser(data: {
  name: string; phone: string; email?: string; password: string; gov?: string; area?: string;
}): AuthResult {
  const name = data.name.trim();
  if (name.length < 2) return { ok: false, error: "من فضلك أدخل الاسم بشكل صحيح" };

  if (data.password.length < 6) return { ok: false, error: "كلمة المرور يجب ألا تقل عن 6 أحرف" };

  if (usersModel.getUserByPhone(data.phone)) {
    return { ok: false, error: "رقم الهاتف مسجل بالفعل — يمكنك تسجيل الدخول" };
  }
  if (data.email && usersModel.getUserByEmail(data.email)) {
    return { ok: false, error: "البريد الإلكتروني مسجل بالفعل" };
  }

  const user = usersModel.createUser({
    name,
    phone: data.phone,
    email: data.email || null,
    passwordHash: hashPassword(data.password),
    gov: data.gov || null,
    area: data.area || null,
  });
  return { ok: true, user: { ...user, profile: usersModel.getProfile(user.id), unreadNotifications: 0 } };
}

export function loginUser(identifier: string, password: string): AuthResult {
  const id = identifier.trim();
  // التسجيل يحفظ الرقم بصيغة مصرية موحدة؛ طبّع الإدخال هنا أيضًا حتى يقبل
  // الأرقام العربية والصيغة الدولية ولا يعيد العميل إلى التسجيل بلا داعٍ.
  const normalizedPhone = normalizeEgyptianPhone(id);
  const user = (normalizedPhone ? usersModel.getUserByPhone(normalizedPhone) : null)
    || usersModel.getUserByEmail(id.toLowerCase());
  if (!user) return { ok: false, error: "بيانات الدخول غير صحيحة" };
  const hash = usersModel.getUserPasswordHash(user.id);
  if (!hash || !verifyPassword(password, hash)) {
    return { ok: false, error: "بيانات الدخول غير صحيحة" };
  }
  return {
    ok: true,
    user: { ...user, profile: usersModel.getProfile(user.id), unreadNotifications: unreadNotificationsCount(user.id) },
  };
}
