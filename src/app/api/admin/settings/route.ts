import { NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import {
  setSetting, getAllSettings, getOwnerWhatsappIntl,
  getCustomListingFields, setCustomListingFields,
} from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { normalizeEgyptianPhone } from "@/lib/validate";

async function guard() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function GET() {
  if (!(await guard())) return jsonError("صلاحيات غير كافية", 403);
  return jsonOk({
    settings: getAllSettings(),
    ownerWhatsappIntl: getOwnerWhatsappIntl(),
    customFields: getCustomListingFields(),
  });
}

/**
 * PUT — تحديث إعدادات المنصة:
 *  - رقم واتساب المالك (OWNER_WHATSAPP_NUMBER)
 *  - وضع المراجعة قبل النشر (REQUIRE_APPROVAL)
 *  - وضع البيانات التجريبية (DEMO_MODE)
 *  - الخانات الإضافية التي يضيفها المالك (CUSTOM_LISTING_FIELDS)
 */
export async function PUT(req: NextRequest) {
  if (!(await guard())) return jsonError("صلاحيات غير كافية", 403);
  try {
    const body = await req.json();

    if (body[SETTING_KEYS.OWNER_WHATSAPP] !== undefined) {
      const phone = normalizeEgyptianPhone(String(body[SETTING_KEYS.OWNER_WHATSAPP]));
      if (!phone) return jsonError("رقم واتساب غير صحيح — أدخل رقمًا مصريًا مثل 01013178718");
      setSetting(SETTING_KEYS.OWNER_WHATSAPP, phone);
    }
    if (body[SETTING_KEYS.REQUIRE_APPROVAL] !== undefined) {
      setSetting(SETTING_KEYS.REQUIRE_APPROVAL, body[SETTING_KEYS.REQUIRE_APPROVAL] ? "true" : "false");
    }
    if (body[SETTING_KEYS.DEMO_MODE] !== undefined) {
      setSetting(SETTING_KEYS.DEMO_MODE, body[SETTING_KEYS.DEMO_MODE] ? "true" : "false");
    }
    if (body[SETTING_KEYS.CUSTOM_FIELDS] !== undefined) {
      const raw = body[SETTING_KEYS.CUSTOM_FIELDS];
      if (!Array.isArray(raw)) return jsonError("صيغة الخانات الإضافية غير صحيحة");
      setCustomListingFields(raw.map((f) => String(f ?? "")));
    }

    return jsonOk({
      settings: getAllSettings(),
      ownerWhatsappIntl: getOwnerWhatsappIntl(),
      customFields: getCustomListingFields(),
    });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر حفظ الإعدادات", 500);
  }
}
