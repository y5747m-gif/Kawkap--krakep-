/** نماذج المنتجات والتصنيفات والصور والمفضلة والسلة */
import { all, get, run, tx } from "../db";
import { newId, generateProductCode } from "../ids";
import { CATEGORIES, GUEST_SELLER_NAME, MAX_CUSTOM_SPECS } from "../constants";
import { isDemoMode } from "../settings";
import { GUEST_SELLER_ID } from "./users";
import type {
  Product, ProductImage, ProductCardData, ProductDetail, Category, PricingType,
  ProductCondition, ProductStatus, CartItemData, ProductSpec, ProductSpecs,
} from "../types";
import { haversineKm, type GeoPoint } from "../geo";

// ------------------------- التصنيفات -------------------------

function mapCategory(r: Record<string, unknown>): Category {
  return {
    id: r.id as string, slug: r.slug as string, name: r.name as string,
    icon: r.icon as string, color: r.color as string, sortOrder: r.sort_order as number,
    productsCount: r.products_count !== undefined ? (r.products_count as number) : undefined,
  };
}

/** إنشاء التصنيفات الافتراضية إن لم تكن موجودة */
export function ensureCategories(): void {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    run(
      `INSERT INTO categories (id, slug, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name = excluded.name, icon = excluded.icon, color = excluded.color, sort_order = excluded.sort_order`,
      newId(), c.slug, c.name, c.icon, c.color, i
    );
  }
}

export function listCategories(): Category[] {
  return all(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'ACTIVE' AND (p.is_demo = 0 OR ?)) AS products_count
     FROM categories c ORDER BY c.sort_order`,
    isDemoMode() ? 1 : 0
  ).map(mapCategory);
}

export function getCategoryBySlug(slug: string): Category | null {
  const r = get("SELECT * FROM categories WHERE slug = ?", slug);
  return r ? mapCategory(r) : null;
}

export function getCategoryById(id: string): Category | null {
  const r = get("SELECT * FROM categories WHERE id = ?", id);
  return r ? mapCategory(r) : null;
}

// ------------------------- الاستعلام الأساسي -------------------------

const CARD_SELECT = `
SELECT
  p.id, p.code, p.title, p.description, p.price, p.pricing_type, p.quantity, p.unit,
  p.condition, p.gov, p.area, p.latitude, p.longitude, p.has_delivery, p.negotiable,
  p.contact_phone, p.notes, p.status, p.featured, p.is_demo, p.views,
  p.guest_name, p.weight, p.weight_unit, p.item_type, p.brand, p.model, p.material,
  p.color, p.item_year, p.dimensions, p.specs,
  p.created_at, p.updated_at,
  c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
  u.id AS seller_id, u.name AS seller_name, u.phone AS seller_phone, u.created_at AS seller_since,
  pf.avatar_url AS seller_avatar, pf.rating_avg AS seller_rating, pf.rating_count AS seller_rating_count,
  (SELECT COUNT(*) FROM products p2 WHERE p2.seller_id = p.seller_id AND p2.status = 'ACTIVE') AS seller_products_count,
  (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
  (SELECT COUNT(*) FROM product_images pi3 WHERE pi3.product_id = p.id) AS images_count
`;

const CARD_FROM = `
FROM products p
JOIN categories c ON c.id = p.category_id
JOIN users u ON u.id = p.seller_id
LEFT JOIN profiles pf ON pf.user_id = u.id
`;

function mapCardRow(r: Record<string, unknown>, viewerFavorites?: Map<string, number>): ProductCardData {
  const card: ProductCardData = {
    id: r.id as string,
    code: r.code as string,
    title: r.title as string,
    description: r.description as string,
    price: r.price as number,
    pricingType: r.pricing_type as PricingType,
    quantity: r.quantity as number,
    unit: r.unit as string,
    condition: r.condition as ProductCondition,
    gov: r.gov as string,
    area: (r.area as string) ?? null,
    latitude: (r.latitude as number) ?? null,
    longitude: (r.longitude as number) ?? null,
    hasDelivery: !!r.has_delivery,
    negotiable: !!r.negotiable,
    status: r.status as ProductStatus,
    featured: !!r.featured,
    isDemo: !!r.is_demo,
    views: r.views as number,
    createdAt: r.created_at as string,
    categorySlug: r.category_slug as string,
    categoryName: r.category_name as string,
    categoryIcon: r.category_icon as string,
    categoryColor: r.category_color as string,
    sellerId: r.seller_id as string,
    // إعلانات الضيوف تحمل اسم صاحبها المكتوب في المعالج (إن كتبه)
    sellerName: ((r.guest_name as string) || (r.seller_name as string)) ?? GUEST_SELLER_NAME,
    sellerAvatar: (r.seller_avatar as string) ?? null,
    sellerRating: (r.seller_rating as number) ?? 0,
    sellerRatingCount: (r.seller_rating_count as number) ?? 0,
    isGuestSeller: r.seller_id === GUEST_SELLER_ID,
    image: (r.image as string) ?? null,
    imagesCount: (r.images_count as number) ?? 0,
  };
  if (viewerFavorites) {
    const saved = viewerFavorites.get(card.id);
    card.isFavorite = saved !== undefined;
    card.favoritePriceAtSave = saved ?? null;
  }
  return card;
}

export interface ProductQuery {
  q?: string;
  categorySlug?: string;
  gov?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  statuses?: ProductStatus[];
  featuredOnly?: boolean;
  withCoordsOnly?: boolean;
  excludeSellerId?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "views" | "distance";
  limit?: number;
  offset?: number;
  viewerId?: string;
  userPoint?: GeoPoint | null;
}

export function searchProducts(query: ProductQuery): { items: ProductCardData[]; total: number } {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  const statuses = query.statuses ?? (["ACTIVE"] as ProductStatus[]);
  const placeholders = statuses.map(() => "?").join(",");
  conditions.push(`p.status IN (${placeholders})`);
  params.push(...statuses);

  // البيانات التجريبية تظهر في وضع التطوير فقط
  if (!isDemoMode()) conditions.push("p.is_demo = 0");

  if (query.q) {
    const like = `%${query.q}%`;
    conditions.push(
      `(p.title LIKE ? OR p.description LIKE ? OR p.keywords LIKE ? OR p.gov LIKE ? OR p.area LIKE ?
        OR p.brand LIKE ? OR p.model LIKE ? OR p.item_type LIKE ? OR p.material LIKE ? OR p.specs LIKE ?
        OR c.name LIKE ? OR u.name LIKE ? OR p.guest_name LIKE ?)`
    );
    params.push(like, like, like, like, like, like, like, like, like, like, like, like, like);
  }
  if (query.categorySlug) { conditions.push("c.slug = ?"); params.push(query.categorySlug); }
  if (query.gov) { conditions.push("p.gov = ?"); params.push(query.gov); }
  if (query.minPrice !== undefined) { conditions.push("p.price >= ?"); params.push(query.minPrice); }
  if (query.maxPrice !== undefined) { conditions.push("p.price <= ?"); params.push(query.maxPrice); }
  if (query.sellerId) { conditions.push("p.seller_id = ?"); params.push(query.sellerId); }
  if (query.excludeSellerId) { conditions.push("p.seller_id != ?"); params.push(query.excludeSellerId); }
  if (query.featuredOnly) { conditions.push("p.featured = 1"); }
  if (query.withCoordsOnly) { conditions.push("p.latitude IS NOT NULL AND p.longitude IS NOT NULL"); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = query.limit ?? 24;
  const offset = query.offset ?? 0;

  let orderBy = "p.created_at DESC";
  if (query.sort === "price_asc") orderBy = "p.price ASC";
  else if (query.sort === "price_desc") orderBy = "p.price DESC";
  else if (query.sort === "views") orderBy = "p.views DESC";

  const rows = all(`${CARD_SELECT} ${CARD_FROM} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, ...params, limit, offset);
  const countRow = get<{ c: number }>(`SELECT COUNT(*) AS c ${CARD_FROM} ${where}`, ...params);

  const favMap = query.viewerId ? getFavoritesMap(query.viewerId) : undefined;
  const items = rows.map((r) => mapCardRow(r as Record<string, unknown>, favMap));

  if (query.userPoint) {
    for (const it of items) {
      it.distanceKm =
        it.latitude != null && it.longitude != null
          ? haversineKm(query.userPoint, { lat: it.latitude, lng: it.longitude })
          : null;
    }
    if (query.sort === "distance") {
      items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
  }
  return { items, total: countRow?.c ?? 0 };
}

function getFavoritesMap(userId: string): Map<string, number> {
  const rows = all<{ product_id: string; price_at_save: number }>(
    "SELECT product_id, price_at_save FROM favorites WHERE user_id = ?", userId
  );
  return new Map(rows.map((r) => [r.product_id, r.price_at_save]));
}

// ------------------------- منتج واحد -------------------------

/** قراءة المواصفات الحرة المخزنة كـ JSON — تتجاهل أي بيانات تالفة */
export function parseSpecsJson(raw: unknown): ProductSpec[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s === "object")
      .map((s) => ({ label: String((s as ProductSpec).label ?? ""), value: String((s as ProductSpec).value ?? "") }))
      .filter((s) => s.label.trim() && s.value.trim())
      .slice(0, MAX_CUSTOM_SPECS);
  } catch {
    return [];
  }
}

/** استخراج كل حقول المواصفات من صف قاعدة البيانات */
function mapSpecs(r: Record<string, unknown>): ProductSpecs {
  return {
    weight: (r.weight as number) ?? null,
    weightUnit: (r.weight_unit as string) ?? null,
    itemType: (r.item_type as string) ?? null,
    brand: (r.brand as string) ?? null,
    model: (r.model as string) ?? null,
    material: (r.material as string) ?? null,
    color: (r.color as string) ?? null,
    year: (r.item_year as number) ?? null,
    dimensions: (r.dimensions as string) ?? null,
    specs: parseSpecsJson(r.specs),
  };
}

export function mapProduct(r: Record<string, unknown>): Product {
  return {
    ...mapSpecs(r),
    id: r.id as string,
    code: r.code as string,
    sellerId: r.seller_id as string,
    guestName: (r.guest_name as string) ?? null,
    guestToken: (r.guest_token as string) ?? null,
    categoryId: r.category_id as string,
    title: r.title as string,
    description: r.description as string,
    price: r.price as number,
    pricingType: r.pricing_type as PricingType,
    quantity: r.quantity as number,
    unit: r.unit as string,
    condition: r.condition as ProductCondition,
    gov: r.gov as string,
    area: (r.area as string) ?? null,
    latitude: (r.latitude as number) ?? null,
    longitude: (r.longitude as number) ?? null,
    hasDelivery: !!r.has_delivery,
    negotiable: !!r.negotiable,
    contactPhone: (r.contact_phone as string) ?? null,
    notes: (r.notes as string) ?? null,
    keywords: (r.keywords as string) ?? null,
    status: r.status as ProductStatus,
    featured: !!r.featured,
    isDemo: !!r.is_demo,
    views: r.views as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function getProductRow(id: string): Product | null {
  const r = get<Record<string, unknown>>("SELECT * FROM products WHERE id = ?", id);
  return r ? mapProduct(r) : null;
}

export function getProductDetail(id: string, viewerId?: string): ProductDetail | null {
  const r = get(`${CARD_SELECT} ${CARD_FROM} WHERE p.id = ?`, id);
  if (!r) return null;
  const images = listProductImages(id);
  const base = mapCardRow(r as Record<string, unknown>, viewerId ? getFavoritesMap(viewerId) : undefined);
  const d: ProductDetail = {
    ...base,
    ...mapSpecs(r as Record<string, unknown>),
    sellerPhone: ((r as Record<string, unknown>).seller_phone as string) ?? null,
    sellerSince: (r as Record<string, unknown>).seller_since as string,
    sellerProductsCount: ((r as Record<string, unknown>).seller_products_count as number) ?? 0,
    contactPhone: ((r as Record<string, unknown>).contact_phone as string) ?? null,
    notes: ((r as Record<string, unknown>).notes as string) ?? null,
    updatedAt: (r as Record<string, unknown>).updated_at as string,
    images,
  };
  if (images.length && !d.image) d.image = images[0].url;
  return d;
}

export function listProductImages(productId: string): ProductImage[] {
  return all(
    "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order",
    productId
  ).map((r) => ({
    id: r.id as string, productId: r.product_id as string, url: r.url as string,
    sortOrder: r.sort_order as number, isMain: !!r.is_main,
  }));
}

export function incrementViews(id: string): void {
  run("UPDATE products SET views = views + 1 WHERE id = ?", id);
}

// ------------------------- إنشاء وتحديث -------------------------

export interface ProductInput extends Partial<ProductSpecs> {
  sellerId: string;
  /** اسم البائع الضيف ورمز متصفحه (النشر بدون حساب) */
  guestName?: string | null;
  guestToken?: string | null;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  pricingType: PricingType;
  quantity: number;
  unit: string;
  condition: ProductCondition;
  gov: string;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasDelivery: boolean;
  negotiable: boolean;
  contactPhone?: string | null;
  notes?: string | null;
  keywords?: string | null;
  status: ProductStatus;
  images: string[]; // روابط الصور بالترتيب (الأولى هي الرئيسية)
}

/** تحويل المواصفات الحرة إلى JSON للتخزين (null إذا لم توجد) */
function serializeSpecs(specs?: ProductSpec[] | null): string | null {
  if (!specs || !specs.length) return null;
  const clean = specs
    .map((s) => ({ label: String(s.label ?? "").trim(), value: String(s.value ?? "").trim() }))
    .filter((s) => s.label && s.value)
    .slice(0, MAX_CUSTOM_SPECS);
  return clean.length ? JSON.stringify(clean) : null;
}

export function createProduct(input: ProductInput): Product {
  return tx(() => {
    const id = newId();
    const now = new Date().toISOString();
    let code = generateProductCode();
    while (get("SELECT 1 FROM products WHERE code = ?", code)) code = generateProductCode();
    run(
      `INSERT INTO products (id, code, seller_id, category_id, title, description, price, pricing_type,
        quantity, unit, condition, gov, area, latitude, longitude, has_delivery, negotiable,
        contact_phone, notes, keywords, status, featured, is_demo, views,
        guest_name, guest_token, weight, weight_unit, item_type, brand, model, material, color,
        item_year, dimensions, specs, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, code, input.sellerId, input.categoryId, input.title, input.description, input.price,
      input.pricingType, input.quantity, input.unit, input.condition, input.gov, input.area ?? null,
      input.latitude ?? null, input.longitude ?? null, input.hasDelivery ? 1 : 0, input.negotiable ? 1 : 0,
      input.contactPhone ?? null, input.notes ?? null, input.keywords ?? null, input.status,
      input.guestName ?? null, input.guestToken ?? null,
      input.weight ?? null, input.weightUnit ?? null, input.itemType ?? null, input.brand ?? null,
      input.model ?? null, input.material ?? null, input.color ?? null, input.year ?? null,
      input.dimensions ?? null, serializeSpecs(input.specs), now, now
    );
    insertImages(id, input.images);
    return getProductRow(id)!;
  });
}

function insertImages(productId: string, urls: string[]): void {
  urls.slice(0, 8).forEach((url, i) => {
    run(
      "INSERT INTO product_images (id, product_id, url, sort_order, is_main) VALUES (?, ?, ?, ?, ?)",
      newId(), productId, url, i, i === 0 ? 1 : 0
    );
  });
}

export function updateProduct(
  id: string,
  changes: Partial<ProductInput> & { featured?: boolean; status?: ProductStatus }
): void {
  tx(() => {
    const cols: string[] = [];
    const params: (string | number | null)[] = [];
    const map: [keyof typeof changes, string][] = [
      ["categoryId", "category_id"], ["title", "title"], ["description", "description"],
      ["price", "price"], ["pricingType", "pricing_type"], ["quantity", "quantity"],
      ["unit", "unit"], ["condition", "condition"], ["gov", "gov"], ["area", "area"],
      ["latitude", "latitude"], ["longitude", "longitude"], ["notes", "notes"],
      ["keywords", "keywords"], ["status", "status"], ["contactPhone", "contact_phone"],
      ["guestName", "guest_name"],
      // المواصفات الكاملة
      ["weight", "weight"], ["weightUnit", "weight_unit"], ["itemType", "item_type"],
      ["brand", "brand"], ["model", "model"], ["material", "material"], ["color", "color"],
      ["year", "item_year"], ["dimensions", "dimensions"],
    ];
    for (const [key, col] of map) {
      if (changes[key] !== undefined) {
        cols.push(`${col} = ?`);
        params.push(changes[key] as string | number | null);
      }
    }
    if (changes.specs !== undefined) { cols.push("specs = ?"); params.push(serializeSpecs(changes.specs)); }
    if (changes.hasDelivery !== undefined) { cols.push("has_delivery = ?"); params.push(changes.hasDelivery ? 1 : 0); }
    if (changes.negotiable !== undefined) { cols.push("negotiable = ?"); params.push(changes.negotiable ? 1 : 0); }
    if (changes.featured !== undefined) { cols.push("featured = ?"); params.push(changes.featured ? 1 : 0); }
    if (cols.length) {
      run(`UPDATE products SET ${cols.join(", ")}, updated_at = ? WHERE id = ?`, ...params, new Date().toISOString(), id);
    }
    if (changes.images) {
      run("DELETE FROM product_images WHERE product_id = ?", id);
      insertImages(id, changes.images);
    }
  });
}

export function deleteProduct(id: string): void {
  run("DELETE FROM products WHERE id = ?", id);
}

export function setProductStatus(id: string, status: ProductStatus): void {
  run("UPDATE products SET status = ?, updated_at = ? WHERE id = ?", status, new Date().toISOString(), id);
}

export function setProductFeatured(id: string, featured: boolean): void {
  run("UPDATE products SET featured = ?, updated_at = ? WHERE id = ?", featured ? 1 : 0, new Date().toISOString(), id);
}

// ------------------------- إعلاناتي -------------------------

export function myProducts(sellerId: string): ProductCardData[] {
  const rows = all(
    `${CARD_SELECT} ${CARD_FROM} WHERE p.seller_id = ? ORDER BY p.created_at DESC`,
    sellerId
  );
  return rows.map((r) => mapCardRow(r as Record<string, unknown>));
}

/** إعلانات الزائر الذي نشر بدون حساب (من نفس المتصفح فقط) */
export function guestProducts(guestToken: string): ProductCardData[] {
  if (!guestToken) return [];
  const rows = all(
    `${CARD_SELECT} ${CARD_FROM} WHERE p.guest_token = ? ORDER BY p.created_at DESC LIMIT 50`,
    guestToken
  );
  return rows.map((r) => mapCardRow(r as Record<string, unknown>));
}

// ------------------------- المفضلة -------------------------

export function toggleFavorite(userId: string, productId: string): { favorited: boolean } {
  const existing = get<{ id: string; price_at_save: number }>(
    "SELECT id, price_at_save FROM favorites WHERE user_id = ? AND product_id = ?", userId, productId
  );
  if (existing) {
    run("DELETE FROM favorites WHERE id = ?", existing.id);
    return { favorited: false };
  }
  const p = get<{ price: number }>("SELECT price FROM products WHERE id = ?", productId);
  run(
    "INSERT INTO favorites (id, user_id, product_id, price_at_save, created_at) VALUES (?, ?, ?, ?, ?)",
    newId(), userId, productId, p?.price ?? 0, new Date().toISOString()
  );
  return { favorited: true };
}

export function listFavorites(userId: string): ProductCardData[] {
  const rows = all(
    `${CARD_SELECT} ${CARD_FROM}
     JOIN favorites f ON f.product_id = p.id AND f.user_id = ?
     WHERE p.status IN ('ACTIVE','PAUSED','SOLD')
     ORDER BY f.created_at DESC`,
    userId
  );
  const favMap = getFavoritesMap(userId);
  return rows.map((r) => mapCardRow(r as Record<string, unknown>, favMap));
}

// ------------------------- السلة -------------------------

function getOrCreateCart(userId: string): string {
  const c = get<{ id: string }>("SELECT id FROM carts WHERE user_id = ?", userId);
  if (c) return c.id;
  const id = newId();
  const now = new Date().toISOString();
  run("INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)", id, userId, now, now);
  return id;
}

export function getCartItems(userId: string): CartItemData[] {
  const cartId = getOrCreateCart(userId);
  const rows = all<Record<string, unknown>>(
    `SELECT ci.id AS ci_id, ci.product_id AS ci_product_id, ci.quantity AS ci_quantity, ci.price_at_add AS ci_price_at_add,
       p.id, p.code, p.title, p.description, p.price, p.pricing_type, p.quantity, p.unit,
       p.condition, p.gov, p.area, p.latitude, p.longitude, p.has_delivery, p.negotiable,
       p.contact_phone, p.notes, p.status, p.featured, p.is_demo, p.views, p.created_at, p.updated_at,
       c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
       u.id AS seller_id, u.name AS seller_name, u.phone AS seller_phone, u.created_at AS seller_since,
       pf.avatar_url AS seller_avatar, pf.rating_avg AS seller_rating, pf.rating_count AS seller_rating_count,
       (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
       (SELECT COUNT(*) FROM product_images pi3 WHERE pi3.product_id = p.id) AS images_count
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN profiles pf ON pf.user_id = u.id
     WHERE ci.cart_id = ? AND p.status = 'ACTIVE'
     ORDER BY ci.created_at DESC`,
    cartId
  );
  return rows.map((r) => ({
    id: r.ci_id as string,
    productId: r.ci_product_id as string,
    quantity: r.ci_quantity as number,
    priceAtAdd: r.ci_price_at_add as number,
    product: mapCardRow(r),
  }));
}

export function addToCart(userId: string, productId: string, quantity: number): void {
  const cartId = getOrCreateCart(userId);
  const p = get<{ price: number; pricing_type: string; quantity: number }>(
    "SELECT price, pricing_type, quantity FROM products WHERE id = ? AND status = 'ACTIVE'", productId
  );
  if (!p) throw new Error("المنتج غير متاح");
  const existing = get<{ id: string; quantity: number }>(
    "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?", cartId, productId
  );
  if (existing) {
    run("UPDATE cart_items SET quantity = ? WHERE id = ?", existing.quantity + quantity, existing.id);
  } else {
    run(
      "INSERT INTO cart_items (id, cart_id, product_id, quantity, price_at_add, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      newId(), cartId, productId, quantity, p.price, new Date().toISOString()
    );
  }
  run("UPDATE carts SET updated_at = ? WHERE id = ?", new Date().toISOString(), cartId);
}

export function updateCartItem(userId: string, itemId: string, quantity: number): void {
  const cartId = getOrCreateCart(userId);
  if (quantity <= 0) {
    run("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemId, cartId);
  } else {
    run("UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?", quantity, itemId, cartId);
  }
}

export function removeCartItem(userId: string, itemId: string): void {
  const cartId = getOrCreateCart(userId);
  run("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemId, cartId);
}

export function clearCart(userId: string): void {
  const cartId = getOrCreateCart(userId);
  run("DELETE FROM cart_items WHERE cart_id = ?", cartId);
}

export function cartCount(userId: string): number {
  const cartId = getOrCreateCart(userId);
  const r = get<{ c: number }>("SELECT COUNT(*) AS c FROM cart_items WHERE cart_id = ?", cartId);
  return r?.c ?? 0;
}

// ------------------------- إحصائيات البائع -------------------------

export function getSellerProductStats(sellerId: string): {
  total: number; active: number; paused: number; pending: number; sold: number; views: number;
} {
  const r = get<{
    total: number; active: number; paused: number; pending: number; sold: number; views: number;
  }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN status = 'PAUSED' THEN 1 ELSE 0 END) AS paused,
       SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold,
       COALESCE(SUM(views), 0) AS views
     FROM products WHERE seller_id = ?`,
    sellerId
  );
  return {
    total: r?.total ?? 0, active: r?.active ?? 0, paused: r?.paused ?? 0,
    pending: r?.pending ?? 0, sold: r?.sold ?? 0, views: r?.views ?? 0,
  };
}

export function mostViewedProducts(sellerId: string, limit = 5): ProductCardData[] {
  const rows = all(
    `${CARD_SELECT} ${CARD_FROM} WHERE p.seller_id = ? ORDER BY p.views DESC LIMIT ?`,
    sellerId, limit
  );
  return rows.map((r) => mapCardRow(r as Record<string, unknown>));
}
