import { NextRequest, after } from "next/server";
import { getCurrentUser, ensureGuestToken, isAdmin } from "@/lib/auth";
import { jsonOk, jsonError, getBaseUrl } from "@/lib/http";
import {
  searchProducts, createProduct, getCategoryBySlug, type ProductQuery,
} from "@/lib/models/products";
import { ensureGuestSeller } from "@/lib/models/users";
import { requiresApproval } from "@/lib/settings";
import { notify } from "@/lib/models/misc";
import { createOwnerListingLink, generateListingWhatsAppMessage, type ListingMessageData } from "@/lib/whatsapp";
import { sendOwnerWhatsAppMessage, isAutoSendEnabled } from "@/lib/whatsapp-send";
import { sanitizeText, isValidPrice, isValidQuantity, normalizeEgyptianPhone } from "@/lib/validate";
import { parseSpecsPayload } from "@/lib/specs";
import {
  PRICING_TYPE_MAP, CONDITION_MAP, MAX_PRODUCT_IMAGES, GUEST_SELLER_NAME,
} from "@/lib/constants";
import type { PricingType, ProductCondition, ProductStatus } from "@/lib/types";

/** GET /api/products — بحث وتصفية المنتجات */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const viewer = await getCurrentUser();

  const query: ProductQuery = {
    q: sp.get("q") || undefined,
    categorySlug: sp.get("category") || undefined,
    gov: sp.get("gov") || undefined,
    minPrice: sp.get("min") ? Number(sp.get("min")) : undefined,
    maxPrice: sp.get("max") ? Number(sp.get("max")) : undefined,
    featuredOnly: sp.get("featured") === "1",
    withCoordsOnly: sp.get("coords") === "1",
    sort: (sp.get("sort") as ProductQuery["sort"]) || "newest",
    limit: Math.min(Number(sp.get("limit")) || 24, 60),
    offset: Number(sp.get("offset")) || 0,
    viewerId: viewer?.id,
  };

  // إعلاناتي (كل الحالات)
  if (sp.get("mine") === "1") {
    if (!viewer) return jsonError("سجل الدخول أولًا", 401);
    query.sellerId = viewer.id;
    query.statuses = ["PENDING", "ACTIVE", "PAUSED", "REJECTED", "HIDDEN", "SOLD"];
  }

  // موقع المستخدم لحساب المسافة
  const lat = sp.get("lat");
  const lng = sp.get("lng");
  if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    query.userPoint = { lat: Number(lat), lng: Number(lng) };
    if (sp.get("sort") === "distance") query.sort = "distance";
  }

  const { items, total } = searchProducts(query);
  return jsonOk({ products: items, total });
}

/**
 * POST /api/products — نشر إعلان جديد (العملاء هم البائعون)
 *
 * تسجيل الدخول *اختياري*: من يملك حسابًا يُنسب الإعلان لحسابه،
 * ومن لا يملك ينشر كـ«ضيف» ويُحفظ رمز متصفحه ليعدّل إعلانه لاحقًا.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  try {
    const body = await req.json();

    const title = sanitizeText(body.title, 120);
    if (title.length < 3) return jsonError("اكتب اسم المنتج (3 أحرف على الأقل)");

    const categorySlug = String(body.categorySlug ?? "");
    const category = getCategoryBySlug(categorySlug);
    if (!category) return jsonError("اختر تصنيفًا صحيحًا");

    const description = sanitizeText(body.description, 3000);
    if (description.length < 10) return jsonError("اكتب وصفًا واضحًا للمنتج (10 أحرف على الأقل)");

    const price = Number(body.price);
    if (!isValidPrice(price) || price <= 0) return jsonError("أدخل سعرًا صحيحًا");

    const pricingType = String(body.pricingType ?? "FIXED") as PricingType;
    if (!PRICING_TYPE_MAP[pricingType]) return jsonError("نوع سعر غير صحيح");

    const quantity = Number(body.quantity);
    if (!isValidQuantity(quantity)) return jsonError("أدخل كمية صحيحة");

    const unit = sanitizeText(body.unit, 20) || "قطعة";
    const condition = String(body.condition ?? "USED") as ProductCondition;
    if (!CONDITION_MAP[condition]) return jsonError("حالة منتج غير صحيحة");

    const gov = sanitizeText(body.gov, 40);
    if (!gov) return jsonError("حدد موقع المنتج (المحافظة)");

    const area = body.area ? sanitizeText(body.area, 60) : null;
    const hasDelivery = !!body.hasDelivery;
    const negotiable = !!body.negotiable;

    // رقم التواصل اختياري تمامًا — إن تُرك فارغًا نستخدم رقم الحساب إن وُجد
    const rawPhone = sanitizeText(body.contactPhone, 20);
    const contactPhone = rawPhone
      ? (normalizeEgyptianPhone(rawPhone) ?? rawPhone)
      : (user?.phone ?? null);
    const notes = body.notes ? sanitizeText(body.notes, 600) : null;

    // المواصفات الكاملة (كلها اختيارية)
    const specs = parseSpecsPayload(body);

    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === "string" && String(u).startsWith("/uploads/")).slice(0, MAX_PRODUCT_IMAGES)
      : [];
    if (images.length === 0) return jsonError("أضف صورة واحدة على الأقل للمنتج");

    // المالك عندما يضيف منتجًا من لوحة الإدارة يُنشر فورًا بلا مراجعة
    const status: ProductStatus = user && isAdmin(user)
      ? "ACTIVE"
      : requiresApproval() ? "PENDING" : "ACTIVE";
    const keywords = sanitizeText(body.keywords, 200) || null;

    // ---------- البائع: حساب مسجل أو ضيف بدون حساب ----------
    const isGuest = !user;
    const guestName = isGuest ? (sanitizeText(body.sellerName, 60) || null) : null;
    const sellerId = user ? user.id : ensureGuestSeller();
    const guestToken = isGuest ? await ensureGuestToken() : null;
    const sellerDisplayName = user?.name ?? guestName ?? GUEST_SELLER_NAME;

    const product = createProduct({
      ...specs,
      sellerId,
      guestName,
      guestToken,
      categoryId: category.id,
      title,
      description,
      price,
      pricingType,
      quantity,
      unit,
      condition,
      gov,
      area,
      latitude: Number.isFinite(Number(body.latitude)) && body.latitude !== null ? Number(body.latitude) : null,
      longitude: Number.isFinite(Number(body.longitude)) && body.longitude !== null ? Number(body.longitude) : null,
      hasDelivery,
      negotiable,
      contactPhone,
      notes,
      keywords,
      status,
      images,
    });

    // إشعار للبائع بحالة الإعلان (للحسابات المسجلة فقط — الضيف ليس له حساب)
    if (user) {
      notify({
        userId: user.id,
        type: status === "ACTIVE" ? "LISTING_PUBLISHED" : "SYSTEM",
        title: status === "ACTIVE" ? "تم نشر إعلانك" : "إعلانك قيد المراجعة",
        body:
          status === "ACTIVE"
            ? `إعلانك «${title}» منشور الآن ويمكن للجميع رؤيته`
            : `إعلانك «${title}» في انتظار موافقة الإدارة وسيظهر بعد القبول`,
        link: status === "ACTIVE" ? `/products/${product.id}` : "/account?tab=selling",
      });
    }

    /* ------------------------------------------------------------------
     * طلب البيع يصل تلقائيًا لواتساب المالك:
     * الإعلان يُحفظ أولًا في قاعدة البيانات، ثم يُجهّز رابط واتساب
     * برسالة منسّقة بكل تفاصيل المعروض ليفتحه العميل فورًا.
     * ------------------------------------------------------------------ */
    const baseUrl = getBaseUrl(req);
    const listingMessage: ListingMessageData = {
      ...specs,
      code: product.code,
      title: product.title,
      categoryName: category.name,
      condition: product.condition,
      description: product.description,
      price: product.price,
      pricingType: product.pricingType,
      quantity: product.quantity,
      unit: product.unit,
      negotiable: product.negotiable,
      hasDelivery: product.hasDelivery,
      gov: product.gov,
      area: product.area,
      latitude: product.latitude,
      longitude: product.longitude,
      imagesCount: images.length,
      notes: product.notes,
      contactPhone: product.contactPhone,
      sellerName: sellerDisplayName,
      sellerPhone: user?.phone ?? product.contactPhone,
      isGuest,
      status,
      createdAt: product.createdAt,
      productLink: `${baseUrl}/products/${product.id}`,
      imageLinks: images.map((u) => `${baseUrl}${u}`),
    };
    const whatsappUrl = createOwnerListingLink(listingMessage);

    // نسخة إضافية للمالك عبر WhatsApp Cloud API إن كانت مفعّلة في البيئة
    if (isAutoSendEnabled()) {
      const text = generateListingWhatsAppMessage(listingMessage);
      after(() => sendOwnerWhatsAppMessage(text));
    }

    return jsonOk({ product, status, whatsappUrl, isGuest });
  } catch (e) {
    console.error(e);
    return jsonError("تعذر نشر الإعلان، حاول مرة أخرى", 500);
  }
}
