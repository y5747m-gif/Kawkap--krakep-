import { NextRequest } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { updateUser, updateUserPassword, updateProfile, getUserByPhone, getUserByEmail } from "@/lib/models/users";
import { sanitizeText, normalizeEgyptianPhone, isValidEmail } from "@/lib/validate";

/** PATCH — تحديث بيانات الحساب (الاسم، الصورة، الهاتف، البريد، الموقع، كلمة المرور) */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);

  try {
    const body = await req.json();

    // ---- تغيير كلمة المرور ----
    if (body.newPassword) {
      const { getUserPasswordHash } = await import("@/lib/models/users");
      const currentHash = getUserPasswordHash(user.id);
      if (!currentHash || !verifyPassword(String(body.currentPassword ?? ""), currentHash)) {
        return jsonError("كلمة المرور الحالية غير صحيحة");
      }
      if (String(body.newPassword).length < 6) {
        return jsonError("كلمة المرور الجديدة قصيرة جدًا (6 أحرف على الأقل)");
      }
      updateUserPassword(user.id, hashPassword(String(body.newPassword)));
    }

    // ---- البيانات الأساسية ----
    if (body.name !== undefined) {
      const name = sanitizeText(body.name, 60);
      if (name.length < 2) return jsonError("الاسم قصير جدًا");
      updateUser(user.id, { name });
    }

    if (body.phone !== undefined) {
      const phone = normalizeEgyptianPhone(String(body.phone));
      if (!phone) return jsonError("رقم هاتف غير صحيح");
      const existing = getUserByPhone(phone);
      if (existing && existing.id !== user.id) return jsonError("رقم الهاتف مستخدم بحساب آخر");
      updateUser(user.id, { phone });
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (email && !isValidEmail(email)) return jsonError("بريد إلكتروني غير صحيح");
      const existing = email ? getUserByEmail(email) : null;
      if (existing && existing.id !== user.id) return jsonError("البريد مستخدم بحساب آخر");
      updateUser(user.id, { email: email || null });
    }

    // ---- الملف الشخصي ----
    const profileChanges: Parameters<typeof updateProfile>[1] = {};
    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl === null) profileChanges.avatarUrl = null;
      else if (typeof body.avatarUrl === "string" && body.avatarUrl.startsWith("/uploads/")) {
        profileChanges.avatarUrl = body.avatarUrl;
      }
    }
    if (body.bio !== undefined) profileChanges.bio = sanitizeText(body.bio, 300) || null;
    if (body.gov !== undefined) profileChanges.gov = sanitizeText(body.gov, 40) || null;
    if (body.area !== undefined) profileChanges.area = sanitizeText(body.area, 60) || null;
    if (Object.keys(profileChanges).length) {
      updateProfile(user.id, profileChanges);
    }

    return jsonOk({ done: true });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر تحديث البيانات", 500);
  }
}
