import { NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import {
  getProductRow, updateProduct, deleteProduct, getProductDetail,
} from "@/lib/models/products";
import { notify } from "@/lib/models/misc";
import { all } from "@/lib/db";
import { sanitizeText, isValidPrice, isValidQuantity } from "@/lib/validate";
import { parseSpecsPayload } from "@/lib/specs";
import { PRICING_TYPE_MAP, CONDITION_MAP, MAX_PRODUCT_IMAGES } from "@/lib/constants";
import { isGuestSellerId } from "@/lib/models/users";
import type { PricingType, ProductCondition, ProductStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** GET — تفاصيل منتج */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const product = getProductDetail(id, viewer?.id);
  if (!product) return jsonError("المنتج غير موجود", 404);
  return jsonOk({ product });
}

/**
 * PATCH — تعديل الإعلان وإدارة حالته للإدارة فقط.
 * طلب العميل يصبح سجلًا ثابتًا للعرض بعد الإرسال حتى تظل البيانات مطابقة
 * للنسخة التي استلمتها الإدارة عبر النظام وواتساب.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();

  const product = getProductRow(id);
  if (!product) return jsonError("المنتج غير موجود", 404);

  const admin = isAdmin(user);
  if (!admin) {
    return jsonError("طلب البيع محفوظ للعرض فقط ولا يمكن تعديله بعد الإرسال", 403);
  }

  try {
    const body = await req.json();
    const changes: Parameters<typeof updateProduct>[1] = {};

    // ---- صلاحيات الإدارة ----
    if (admin) {
      if (body.status && ["PENDING", "ACTIVE", "PAUSED", "REJECTED", "HIDDEN", "SOLD"].includes(body.status)) {
        changes.status = body.status as ProductStatus;
      }
      if (typeof body.featured === "boolean") changes.featured = body.featured;
    }

    // ---- بيانات الإعلان — لا يصل إلى هذا المسار إلا المالك/الإدارة ----
    if (admin) {
      if (body.title !== undefined) {
        const title = sanitizeText(body.title, 120);
        if (title.length < 3) return jsonError("اسم المنتج قصير جدًا");
        changes.title = title;
      }
      if (body.description !== undefined) {
        const description = sanitizeText(body.description, 3000);
        if (description.length < 10) return jsonError("الوصف قصير جدًا");
        changes.description = description;
      }
      if (body.price !== undefined) {
        const price = Number(body.price);
        if (!isValidPrice(price) || price <= 0) return jsonError("سعر غير صحيح");
        changes.price = price;
      }
      if (body.pricingType !== undefined && PRICING_TYPE_MAP[body.pricingType]) {
        changes.pricingType = body.pricingType as PricingType;
      }
      if (body.quantity !== undefined) {
        const quantity = Number(body.quantity);
        if (!isValidQuantity(quantity)) return jsonError("كمية غير صحيحة");
        changes.quantity = quantity;
      }
      if (body.unit !== undefined) changes.unit = sanitizeText(body.unit, 20) || "قطعة";
      if (body.condition !== undefined && CONDITION_MAP[body.condition]) {
        changes.condition = body.condition as ProductCondition;
      }
      if (body.gov !== undefined) {
        const gov = sanitizeText(body.gov, 40);
        if (!gov) return jsonError("حدد المحافظة");
        changes.gov = gov;
      }
      if (body.area !== undefined) changes.area = sanitizeText(body.area, 60) || null;
      if (body.area === null) changes.area = null;
      if (body.latitude !== undefined) changes.latitude = Number(body.latitude) || null;
      if (body.longitude !== undefined) changes.longitude = Number(body.longitude) || null;
      if (body.hasDelivery !== undefined) changes.hasDelivery = !!body.hasDelivery;
      if (body.negotiable !== undefined) changes.negotiable = !!body.negotiable;
      if (body.contactPhone !== undefined) changes.contactPhone = sanitizeText(body.contactPhone, 20) || null;
      if (body.notes !== undefined) changes.notes = sanitizeText(body.notes, 600) || null;
      if (body.keywords !== undefined) changes.keywords = sanitizeText(body.keywords, 200) || null;
      if (body.sellerName !== undefined && isGuestSellerId(product.sellerId)) {
        changes.guestName = sanitizeText(body.sellerName, 60) || null;
      }
      // ---- المواصفات الكاملة (اختيارية) ----
      // نحدّث فقط المواصفات المُرسلة فعلًا حتى لا يمسح تعديل جزئي باقي المواصفات
      const specKeys = [
        "weight", "weightUnit", "itemType", "brand", "model",
        "material", "color", "year", "dimensions", "specs",
      ] as const;
      if (specKeys.some((k) => body[k] !== undefined)) {
        const parsedSpecs = parseSpecsPayload(body);
        const target = changes as Record<string, unknown>;
        for (const key of specKeys) {
          if (body[key] !== undefined) target[key] = parsedSpecs[key];
        }
      }
      // دعم أمر الإيقاف القديم داخل لوحة الإدارة فقط
      if (body.pause === true) changes.status = "PAUSED";
      if (body.pause === false) changes.status = "ACTIVE";
      if (Array.isArray(body.images)) {
        const images = body.images
          .filter((u: unknown) => typeof u === "string" && String(u).startsWith("/uploads/"))
          .slice(0, MAX_PRODUCT_IMAGES);
        if (images.length === 0) return jsonError("أضف صورة واحدة على الأقل");
        changes.images = images;
      }
    }

    const oldPrice = product.price;
    updateProduct(product.id, changes);
    const updated = getProductRow(product.id)!;

    // ---- إشعار انخفاض السعر لمن أضاف المنتج للمفضلة ----
    if (changes.price !== undefined && changes.price < oldPrice) {
      const favoriters = all<{ user_id: string }>(
        "SELECT user_id FROM favorites WHERE product_id = ?", product.id
      ) as { user_id: string }[];
      for (const f of favoriters) {
        notify({
          userId: f.user_id,
          type: "PRICE_DROP",
          title: "انخفض سعر منتج في مفضلتك",
          body: `«${updated.title}» انخفض السعر إلى ${changes.price} جنيه (كان ${oldPrice} جنيه)`,
          link: `/products/${product.id}`,
        });
      }
    }

    // ---- إشعار البائع بقرارات الإدارة (الضيف بلا حساب فلا إشعارات له) ----
    if (admin && product.sellerId !== user?.id && !isGuestSellerId(product.sellerId)) {
      if (changes.status === "ACTIVE") {
        notify({
          userId: product.sellerId, type: "LISTING_APPROVED",
          title: "تم قبول إعلانك", body: `إعلانك «${product.title}» منشور الآن`,
          link: `/sales?item=${product.id}#sale-${product.id}`,
        });
      } else if (changes.status === "REJECTED") {
        notify({
          userId: product.sellerId, type: "LISTING_REJECTED",
          title: "تم رفض إعلانك", body: `إعلانك «${product.title}» لم يستوفِ شروط النشر — راجع حالة الطلب من سجل مبيعاتك`,
          link: `/sales?item=${product.id}#sale-${product.id}`,
        });
      }
    }

    return jsonOk({ product: updated });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر تعديل الإعلان", 500);
  }
}

/** DELETE — حذف الإعلان متاح للإدارة فقط؛ سجل العميل للعرض فقط. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();

  const product = getProductRow(id);
  if (!product) return jsonError("المنتج غير موجود", 404);

  if (!isAdmin(user)) {
    return jsonError("طلب البيع محفوظ للعرض فقط ولا يمكن حذفه بعد الإرسال", 403);
  }

  deleteProduct(product.id);
  return jsonOk({ deleted: true });
}
