/** المصادقة والجلسات — حساب واحد للعميل يكون مشتريًا وبائعًا في نفس الوقت */
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as usersModel from "./models/users";
import { unreadNotificationsCount } from "./models/misc";
import type { CurrentUser } from "./types";

export const SESSION_COOKIE = "kk_session";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/** المستخدم الحالي من كوكي الجلسة (يعمل في Server Components و Route Handlers) */
export function getCurrentUser(): CurrentUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
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

/** إنشاء جلسة وضبط الكوكي — تُستدعى داخل Route Handlers فقط */
export function startSession(userId: string): void {
  const { token, expiresAt } = usersModel.createSession(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function endSession(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) usersModel.deleteSession(token);
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
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
  const user = usersModel.getUserByPhone(id) || usersModel.getUserByEmail(id.toLowerCase());
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
