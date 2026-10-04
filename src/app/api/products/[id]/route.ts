import { NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import {
  getProductRow, updateProduct, deleteProduct, getProductDetail,
} from "@/lib/models/products";
import { notify } from "@/lib/models/misc";
import { all } from "@/lib/db";
import { sanitizeText, isValidPrice, isValidQuantity } from "@/lib/validate";
import { PRICING_TYPE_MAP, CONDITION_MAP, MAX_PRODUCT_IMAGES, SITE_NAME } from "@/lib/constants";
import type { PricingType, ProductCondition, ProductStatus } from "@/lib/types";

type Ctx = { params: { id: string } };

/** GET — تفاصيل منتج */
export async function GET(req: NextRequest, { params }: Ctx) {
  const viewer = getCurrentUser();
  const product = getProductDetail(params.id, viewer?.id);
  if (!product) return jsonError("المنتج غير موجود", 404);
  return jsonOk({ product });
}

/**
 * PATCH — تعديل الإعلان:
 *  - البائع: تعديل بياناته (اسم، وصف، سعر، صور، إيقاف/تشغيل)
 *  - الإدارة: قبول / رفض / إخفاء / تمييز / إيقاف
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);

  const product = getProductRow(params.id);
  if (!product) return jsonError("المنتج غير موجود", 404);

  const isOwner = product.sellerId === user.id;
  const admin = isAdmin(user);
  if (!isOwner && !admin) return jsonError("لا تملك صلاحية تعديل هذا الإعلان", 403);

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

    // ---- صلاحيات البائع (والإدارة أيضًا) ----
    if (isOwner || admin) {
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
      // إيقاف/تشغيل خاص بالبائع
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

    // ---- إشعار البائع بقرارات الإدارة ----
    if (admin && !isOwner) {
      if (changes.status === "ACTIVE") {
        notify({
          userId: product.sellerId, type: "LISTING_APPROVED",
          title: "تم قبول إعلانك", body: `إعلانك «${product.title}» منشور الآن`,
          link: `/products/${product.id}`,
        });
      } else if (changes.status === "REJECTED") {
        notify({
          userId: product.sellerId, type: "LISTING_REJECTED",
          title: "تم رفض إعلانك", body: `إعلانك «${product.title}» لم يستوفِ شروط النشر — يمكنك تعديله وإعادة النشر`,
          link: "/account?tab=selling",
        });
      }
    }

    return jsonOk({ product: updated });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر تعديل الإعلان", 500);
  }
}

/** DELETE — حذف الإعلان (البائع أو الإدارة) */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = getCurrentUser();
  if (!user) return jsonError("سجل الدخول أولًا", 401);

  const product = getProductRow(params.id);
  if (!product) return jsonError("المنتج غير موجود", 404);

  if (product.sellerId !== user.id && !isAdmin(user)) {
    return jsonError("لا تملك صلاحية حذف هذا الإعلان", 403);
  }

  deleteProduct(product.id);
  return jsonOk({ deleted: true });
}
