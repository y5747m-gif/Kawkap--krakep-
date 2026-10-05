/** المصادقة والجلسات — حساب واحد للعميل يكون مشتريًا وبائعًا في نفس الوقت */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as usersModel from "./models/users";
import { unreadNotificationsCount } from "./models/misc";
import { databaseStorageMode } from "./db";
import type { CurrentUser } from "./types";
import { normalizeEgyptianPhone } from "./validate";

export const SESSION_COOKIE = "kk_session";
/**
 * رمز الزائر — يسمح لمن يرسل طلب بيع بدون حساب أن يعود لعرض سجله
 * من نفس المتصفح. لا يمنحه صلاحية تعديل الطلب أو رؤية طلبات غيره.
 */
export const GUEST_COOKIE = "kk_guest";
const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // سنة

/**
 * سر توقيع الجلسات (KK_SESSION_SECRET).
 *
 * على الاستضافات المؤقتة التخزين (Vercel) لا تُشارك دوال الخادم نفس قاعدة
 * البيانات: دالة تسجيل الدخول تكتب الجلسة في نسختها من /tmp، بينما دالة
 * صفحة /admin تقرأ نسخة أخرى — فيظهر أن «المالك يسجّل الدخول ولا تفتح أي
 * واجهة». الحل: كوكي موقّعة بـ HMAC تُتحقق أي دالة منها ذاتيًا دون قاعدة
 * البيانات. بدون السر تبقى الجلسات مرتبطة بقاعدة البيانات (الوضع السابق
 * الآمن على الاستضافات ذات القرص الدائم).
 */
const SESSION_SIGNING_SECRET = process.env.KK_SESSION_SECRET || null;

/**
 * الجلسات الموقّعة ذاتيًا مطلوبة فقط عندما لا تكون قاعدة البيانات مشتركة
 * بين الطلبات (وضع vercel-temporary). على القرص الدائم تبقى قاعدة البيانات
 * هي المرجع الوحيد فتعمل ميزات مثل إبطال الجلسة بدقة.
 */
export function signedSessionsEnabled(): boolean {
  return Boolean(SESSION_SIGNING_SECRET) && databaseStorageMode !== "persistent";
}

function signSessionPayload(payload: string): string {
  return createHmac("sha256", SESSION_SIGNING_SECRET!).update(payload).digest("base64url");
}

/** كوكي موقّعة: v1.<userId>.<expiresAtMs>.<dbToken>.<signature> */
function createSignedSessionValue(userId: string, dbToken: string, expiresAtMs: number): string {
  const payload = `v1.${userId}.${expiresAtMs}.${dbToken}`;
  return `${payload}.${signSessionPayload(payload)}`;
}

/** يتحقق من الكوكي الموقّعة ويعيد userId — أو null لأي عبث أو انتهاء */
function verifySignedSessionValue(value: string): string | null {
  if (!SESSION_SIGNING_SECRET) return null;
  const parts = value.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return null;
  const payload = parts.slice(0, 4).join(".");
  const expected = signSessionPayload(payload);
  const received = parts[4];
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expiresAt = Number(parts[2]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return parts[1] || null;
}

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
  // المسار المعتاد: جلسة مخزنة في قاعدة البيانات (يبطّلها تسجيل الخروج).
  // المسار الاحتياطي: كوكي موقّعة ذاتية التحقق — لا يُفعَّل إلا عند حاجته
  // الفعلية (تخزين مؤقت غير مشترك بين دوال الخادم) ومع توفر سر التوقيع.
  const userId =
    usersModel.getUserIdBySessionToken(token) ??
    (signedSessionsEnabled() ? verifySignedSessionValue(token) : null);
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
export async function ensureGuestToken(secure?: boolean): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const token = `g_${randomUUID()}`;
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: defaultCookieSecure(secure),
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return token;
}

/** هل هذا الزائر/المستخدم هو صاحب الطلب؟ (للعرض والتحويل إلى سجله فقط) */
export function isListingOwner(
  product: { sellerId: string; guestToken: string | null },
  user: CurrentUser | null,
  guestToken: string | null
): boolean {
  if (user && (product.sellerId === user.id || isAdmin(user))) return true;
  return !!guestToken && !!product.guestToken && product.guestToken === guestToken;
}

/**
 * علم Secure للكوكي: الأفضل أن ينبع من بروتوكول الطلب الفعلي (يمرّره الـ
 * Route Handler عبر isSecureRequest). الاعتماد على NODE_ENV وحده كان يرسل
 * كوكي Secure دائمًا في الإنتاج، فيرفضها المتصفح على الاستضافات العاملة
 * بـ HTTP عادي — فلا تُحفظ الجلسة ويعود المالك لصفحة الدخول بلا أي واجهة.
 */
function defaultCookieSecure(secure: boolean | undefined): boolean {
  return secure ?? process.env.NODE_ENV === "production";
}

/** إنشاء جلسة وضبط الكوكي — تُستدعى داخل Route Handlers فقط */
export async function startSession(userId: string, secure?: boolean): Promise<void> {
  const { token, expiresAt } = usersModel.createSession(userId);
  const expiresAtMs = new Date(expiresAt).getTime();
  // على التخزين المؤقت غير المشترك تُخزَّن قيمة موقّعة داخل الكوكي نفسها
  // لتتحقق منها أي دالة خادم حتى لو لم ترَ صف الجلسة في قاعدة البيانات.
  const cookieValue = signedSessionsEnabled()
    ? createSignedSessionValue(userId, token, expiresAtMs)
    : token;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: defaultCookieSecure(secure),
    path: "/",
    expires: new Date(expiresAt),
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    usersModel.deleteSession(token);
    // الكوكي الموقّعة تحمل رمز الجلسة في جزئها الرابع — احذف الصف أيضًا.
    const parts = token.split(".");
    if (parts.length === 5 && parts[0] === "v1") usersModel.deleteSession(parts[3]);
  }
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
