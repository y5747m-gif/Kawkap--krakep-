/**
 * ============================================================
 * سكربت البيانات التجريبية — كوكب كراكيب (للتطوير فقط)
 * ============================================================
 *npm run db:seed
 *
 * تحذير: هذا السكربت يمسح البيانات الحالية ويزرع بيانات تجريبية كاملة.
 * في الإنتاج لا تُشغّله — المنتجات الحقيقية تأتي من المستخدمين.
 * في الإنتاج أيضًا اضبط DEMO_MODE=false من لوحة الإدارة لإخفاء هذه البيانات.
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db, run } from "./lib/db";
import { newId } from "./lib/ids";
import { ensureCategories, createProduct } from "./lib/models/products";
import { ensureLocations } from "./lib/models/misc";
import { createUser } from "./lib/models/users";
import { createOrderRecord, updateOrderStatus, insertReview } from "./lib/models/orders";
import { setSetting } from "./lib/settings";
import { CATEGORIES, SETTING_KEYS } from "./lib/constants";
import type { PricingType, ProductCondition, DeliveryMethod } from "./lib/types";

function banner(msg: string) {
  console.log("\n" + "=".repeat(50));
  console.log(msg);
  console.log("=".repeat(50));
}

async function main() {
  banner("🪐 كوكب كراكيب — زرع البيانات التجريبية (للتطوير)");

  // ---------- مسح البيانات الحالية ----------
  const tables = [
    "conversations", "reports", "notifications", "reviews", "seller_orders",
    "order_items", "orders", "cart_items", "carts", "favorites",
    "product_images", "products", "addresses", "sessions", "profiles",
    "users", "admin_settings",
  ];
  db.exec("PRAGMA foreign_keys = OFF;");
  for (const t of tables) run(`DELETE FROM ${t}`);
  db.exec("PRAGMA foreign_keys = ON;");
  console.log("✔ تم مسح البيانات القديمة");

  // ---------- التصنيفات والمحافظات والإعدادات ----------
  ensureCategories();
  ensureLocations();
  setSetting(SETTING_KEYS.OWNER_WHATSAPP, "01013178718"); // الافتراضي — قابل للتعديل من لوحة الإدارة
  setSetting(SETTING_KEYS.REQUIRE_APPROVAL, "false"); // نشر فوري (يمكن تفعيل المراجعة من الإعدادات)
  setSetting(SETTING_KEYS.DEMO_MODE, "true"); // بيانات تجريبية — أوقفها في الإنتاج
  console.log("✔ التصنيفات (16) + المحافظات (27) + الإعدادات المركزية");

  const catId = (slug: string) =>
    (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug) as { id: string }).id;

  // ---------- الصور الرمزية للمستخدمين التجريبيين ----------
  const avatarDir = path.join(process.cwd(), "public", "uploads", "demo", "avatars");
  fs.mkdirSync(avatarDir, { recursive: true });
  function makeAvatar(name: string, from: string, to: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="128" height="128" rx="32" fill="url(#g)"/>
  <text x="64" y="82" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">${name.charAt(0)}</text>
</svg>`;
    const file = path.join(avatarDir, `${name}.svg`);
    fs.writeFileSync(file, svg);
    return `/uploads/demo/avatars/${name}.svg`;
  }

  // ---------- صور placeholder للمنتجات بدون صور ----------
  const placeholderDir = path.join(process.cwd(), "public", "uploads", "demo");
  function makePlaceholder(title: string, color: string, icon: string) {
    const file = `ph-${icon}.svg`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${color}22"/><stop offset="1" stop-color="${color}44"/>
  </linearGradient></defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="400" cy="270" r="130" fill="${color}33"/>
  <text x="400" y="320" font-family="Arial" font-size="120" text-anchor="middle" fill="${color}">${icon === "spare-parts" ? "⚙" : "🔧"}</text>
  <text x="400" y="480" font-family="Arial" font-size="34" font-weight="bold" text-anchor="middle" fill="${color}">${title}</text>
</svg>`;
    fs.writeFileSync(path.join(placeholderDir, file), svg);
    return `/uploads/demo/${file}`;
  }

  // ---------- المستخدمون ----------
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  // حساب المالك / الإدارة
  const admin = createUser({
    name: "مالك كوكب كراكيب",
    phone: "01013178718",
    email: "owner@kawkap.krakeb",
    passwordHash: hash("Owner@2026"),
    role: "ADMIN",
    gov: "القاهرة",
    area: "مدينة نصر",
  });

  const demoUsers = [
    { name: "أحمد سمير", phone: "01000000001", gov: "القاهرة", area: "مدينة نصر", colors: ["#1fa27c", "#14b8a6"] },
    { name: "محمد فؤاد", phone: "01000000002", gov: "الجيزة", area: "الهرم", colors: ["#0d9488", "#2dd4bf"] },
    { name: "سارة عبد الله", phone: "01000000003", gov: "القاهرة", area: "المعادي", colors: ["#f59e0b", "#ea580c"] },
    { name: "مصطفى كامل", phone: "01000000004", gov: "الإسكندرية", area: "سموحة", colors: ["#8b5cf6", "#6366f1"] },
    { name: "هدى إبراهيم", phone: "01000000005", gov: "الشرقية", area: "الزقازيق", colors: ["#be185d", "#db2777"] },
  ].map((u) => {
    const user = createUser({
      name: u.name,
      phone: u.phone,
      email: null,
      passwordHash: hash("Demo@1234"),
      gov: u.gov,
      area: u.area,
    });
    const avatar = makeAvatar(u.name, u.colors[0], u.colors[1]);
    run("UPDATE profiles SET avatar_url = ? WHERE user_id = ?", avatar, user.id);
    return user;
  });
  const [ahmed, mohamed, sara, mostafa, houda] = demoUsers;
  console.log(`✔ المستخدمون: حساب المالك + ${demoUsers.length} مستخدمين تجريبيين`);
  console.log("   → المالك: 01013178718 / Owner@2026 (لوحة الإدارة: /admin)");
  console.log("   → التجريبيون: 0100000000X / Demo@1234");

  // ---------- المنتجات ----------
  const P = (
    sellerId: string, slug: string, title: string, description: string,
    price: number, pricingType: PricingType, quantity: number, unit: string,
    condition: ProductCondition, gov: string, area: string,
    opts: Partial<{ image: string; images: string[]; negotiable: boolean; delivery: boolean; featured: boolean; status: "ACTIVE" | "PENDING"; views: number; lat: number; lng: number; notes: string; keywords: string }> = {}
  ) => {
    const images = opts.images ?? (opts.image ? [opts.image] : [makePlaceholder(title, "#1fa27c", slug)]);
    return createProduct({
      sellerId,
      categoryId: catId(slug),
      title,
      description,
      price,
      pricingType,
      quantity,
      unit,
      condition,
      gov,
      area,
      latitude: opts.lat ?? null,
      longitude: opts.lng ?? null,
      hasDelivery: opts.delivery ?? false,
      negotiable: opts.negotiable ?? false,
      contactPhone: null,
      notes: opts.notes ?? null,
      keywords: opts.keywords ?? null,
      status: opts.status ?? "ACTIVE",
      images,
    });
  };

  const products = [
    P(ahmed.id, "copper", "خردة نحاس نظيفة — سلك ومواسير",
      "نحاس نظيف مفروز ومجرد من العوازل — سلك نحاس ومواسير صغيرة. متوفر لدي 25 كجم جاهزة للتسليم الفوري من مدينة نصر. السعر لكل كيلو والكمية قابلة للتفاوض عند شراء الكمية كاملة.",
      34, "PER_KG", 25, "كجم", "SCRAP", "القاهرة", "مدينة نصر",
      { image: "/uploads/demo/copper-scrap.jpg", featured: true, negotiable: true, delivery: true, views: 342, lat: 30.056, lng: 31.331, keywords: "نحاس خردة معادن سلك" }),
    P(mohamed.id, "iron", "حديد خردة — كمية كبيرة بالطن",
      "حديد خردة متنوع: مواسير وزوايا وألواح. الكمية المتاحة 500 كجم ويمكن تفريغ أطنان أكبر باتفاق مسبق. الاستلام من منطقة الهرم أو التوصيل بمنطقة الجيزة فقط.",
      12, "PER_KG", 500, "كجم", "SCRAP", "الجيزة", "الهرم",
      { image: "/uploads/demo/iron-scrap.jpg", views: 518, lat: 29.979, lng: 31.166, keywords: "حديد خردة معادن مواسير" }),
    P(sara.id, "cardboard", "بالرات كرتون مضغوط جاهزة للبيع",
      "كرتون مضغوط بالات منظمة ومربوطة — كمية 300 كجم متوفرة الآن. مناسب لمصانع تدوير الورق. التسليم من شبرا الخيمة ويفضل الشراء بالكمية.",
      4.5, "PER_KG", 300, "كجم", "SCRAP", "القليوبية", "شبرا الخيمة",
      { image: "/uploads/demo/cardboard-bales.jpg", views: 203, lat: 30.129, lng: 31.244, keywords: "كرتون بلات تدوير" }),
    P(mostafa.id, "plastic", "بلاستيك PET مفروز ومغسول",
      "بلاستيك بتر خفيف مفروز بالألوان ومغسول — جودة عالية جاهزة للطحن. الكمية 200 كجم من سموحة. السعر قابل للتفاوض للكميات الكبيرة.",
      6, "PER_KG", 200, "كجم", "SCRAP", "الإسكندرية", "سموحة",
      { image: "/uploads/demo/plastic-bottles.jpg", negotiable: true, views: 156, lat: 31.213, lng: 29.949, keywords: "بلاستيك بتر تدوير" }),
    P(houda.id, "appliances", "غسالة توشيبا 7 كجم مستعملة — حالة ممتازة",
      "غسالة أوتوماتيك توشيبا 7 كجم مستعملة لمدة سنتين فقط — تعمل بكفاءة والحالة ممتازة. سبب البيع: سفر. متاح فحصها قبل الشراء من الزقازيق، ويوجد توصيل داخل المدينة.",
      2800, "FIXED", 1, "قطعة", "LIKE_NEW", "الشرقية", "الزقازيق",
      { image: "/uploads/demo/washing-machine.jpg", featured: true, delivery: true, views: 421, lat: 30.587, lng: 31.502, notes: "متاح الفحص قبل الشراء", keywords: "غسالة توشيبا مستعملة أجهزة كهربائية" }),
    P(ahmed.id, "electronics", "شاشة كمبيوتر قديمة + كيسة ألعاب — للمهتمين بالقدم",
      "شاشة CRT قديمة بحالة تشغيل ممتازة مع كيسة ألعاب موديل قديم — قطع كوليكتور نادرة. تصلح للعرض أو لقطع الغيار. الاستلام من مدينة نصر.",
      850, "FIXED", 1, "قطعة", "OLD", "القاهرة", "مدينة نصر",
      { image: "/uploads/demo/old-electronics.jpg", views: 98, lat: 30.06, lng: 31.34, keywords: "شاشة قديمة كيسة إلكترونيات ريترو" }),
    P(mohamed.id, "wood", "أخشاب موسكيتش نظيفة — مقاسات متعددة",
      "أخشاب موسكيتش مستعملة نظيفة ومفروزة — عوارض وألواح بمقاسات متعددة. مناسبة للمشاريع الصغيرة والدِيكور. الكمية 150 كجم من الزقازيق.",
      8, "PER_KG", 150, "كجم", "USED", "الشرقية", "الزقازيق",
      { image: "/uploads/demo/wood-planks.jpg", views: 134, lat: 30.585, lng: 31.495, keywords: "أخشاب موسكيتش عوارض" }),
    P(sara.id, "furniture", "كنبة خضراء موديل قديم — قطعة مميزة",
      "كنبة قماش أخضر موديل قديم بحالة جيدة — نظيفة ومرتبة، تحتاج فقط تجديد بسيط للمخدات. قطعة مميزة لمحبي الأنتيكات. من المعادي.",
      1500, "FIXED", 1, "قطعة", "USED", "القاهرة", "المعادي",
      { image: "/uploads/demo/old-sofa.jpg", negotiable: true, views: 267, lat: 29.96, lng: 31.26, keywords: "كنبة أثاث قديم أنتيكة" }),
    P(mostafa.id, "electronics", "موبايلات قديمة للبيع بالقطعة — للتفكيك",
      "مجموعة 15 موبايل قديم (نوكيا وسوني إريكسون وغيرها) — بحالات متفاوتة، مناسبة للتفكيك وقطع الغيار. البيع بالقطعة فقط.",
      120, "PER_PIECE", 15, "قطعة", "OLD", "الإسكندرية", "سموحة",
      { image: "/uploads/demo/old-electronics.jpg", views: 87, lat: 31.21, lng: 29.95, keywords: "موبايلات قديمة تفكيك نوكيا" }),
    P(houda.id, "used-oil", "زيت محرك مستعمل — مفروز في تنكات",
      "زيت محرك مستعمل مفروز ومخزن في تنكات 200 لتر — كمية 60 لتر متوفرة. مناسب لمصانع الصابون والتشحيم الصناعي.",
      12, "PER_KG", 60, "لتر", "USED", "الدقهلية", "المنصورة",
      { image: "/uploads/demo/used-oil.jpg", views: 45, lat: 31.041, lng: 31.38, keywords: "زيت مستعمل زيوت محرك" }),
    P(ahmed.id, "paper", "ورق أبيض مكتب — كمية للتدوير",
      "ورق أبيض مكتب مفروز بدون مشابك أو أشرطة — كمية 100 كجم جاهزة من شبين الكوم. السعر لكل كيلو.",
      3, "PER_KG", 100, "كجم", "USED", "المنوفية", "شبين الكوم",
      { image: "/uploads/demo/office-paper.jpg", views: 61, lat: 30.597, lng: 30.988, keywords: "ورق أبيض تدوير مكتب" }),
    P(mohamed.id, "spare-parts", "قطع غيار سيارات قديمة — المجموعة كاملة",
      "مجموعة قطع غيار سيارات قديمة: دينامو وردياتور ومرايات وقطع معدنية متنوعة. البيع للمجموعة كاملة بسعر واحد — فرصة لتجار قطع الغيار.",
      2000, "BULK", 1, "مجموعة", "OLD", "الجيزة", "فيصل",
      { views: 112, lat: 30.01, lng: 31.2, keywords: "قطع غيار سيارات دينامو ردياتور" }),
    P(sara.id, "tools", "عدة أدوات كهربائية مستعملة — كيس كامل",
      "عدة أدوات كهربائية مستعملة بحالة جيدة: دريل ومفاتيح وكماشات ومفكات في كيس أدوات متين. مناسبة للورش والاستخدام المنزلي.",
      1200, "FIXED", 1, "قطعة", "USED", "القاهرة", "مدينة نصر",
      { status: "PENDING", views: 12, lat: 30.057, lng: 31.33, keywords: "أدوات كهربائية دريل مفكات" }),
  ];

  // تعيين featured عبر التحديث المباشر
  run("UPDATE products SET featured = 1 WHERE id IN (?, ?)", products[0].id, products[4].id);
  // مشاهدات عشوائية إضافية
  for (const p of products) {
    run("UPDATE products SET views = views + ? WHERE id = ?", Math.floor(Math.random() * 50), p.id);
  }
  console.log(`✔ ${products.length} منتجًا تجريبيًا (1 بانتظار المراجعة)`);

  // ---------- مفضلة ----------
  run("INSERT INTO favorites (id, user_id, product_id, price_at_save, created_at) VALUES (?, ?, ?, ?, ?)",
    newId(), mohamed.id, products[4].id, 3200, new Date(Date.now() - 5 * 86400000).toISOString());
  run("INSERT INTO favorites (id, user_id, product_id, price_at_save, created_at) VALUES (?, ?, ?, ?, ?)",
    newId(), mostafa.id, products[0].id, 34, new Date(Date.now() - 2 * 86400000).toISOString());
  console.log("✔ مفضلة تجريبية (لاحظ: سعر الغسالة انخفض من 3200 إلى 2800)");

  // ---------- طلبات ----------
  const day = 86400000;
  const order1 = createOrderRecord({
    orderCode: "KK-20261001-0001",
    buyerId: mohamed.id,
    customerName: "محمد فؤاد",
    customerPhone: "01000000002",
    gov: "الجيزة", area: "الهرم", address: "شارع الهرم، أمام محطة المترو",
    deliveryMethod: "PICKUP",
    notes: "أفضل الاستلام صباحًا",
    items: [{
      productId: products[0].id, sellerId: ahmed.id, sellerName: "أحمد سمير",
      title: products[0].title, unit: "كجم", price: 34, pricingType: "PER_KG",
      quantity: 25, lineTotal: 850,
    }],
  });
  updateOrderStatus(order1.id, "PROCESSING");

  const order2 = createOrderRecord({
    orderCode: "KK-20261002-0001",
    buyerId: null,
    customerName: "سلمى محمود",
    customerPhone: "01012345678",
    gov: "القاهرة", area: "المعادي", address: "شارع 9، المعادي",
    deliveryMethod: "DELIVERY",
    notes: "الرجاء الاتصال قبل التوصيل",
    items: [{
      productId: products[4].id, sellerId: houda.id, sellerName: "هدى إبراهيم",
      title: products[4].title, unit: "قطعة", price: 2800, pricingType: "FIXED",
      quantity: 1, lineTotal: 2800,
    }],
  });

  const order3 = createOrderRecord({
    orderCode: "KK-20260928-0001",
    buyerId: mostafa.id,
    customerName: "مصطفى كامل",
    customerPhone: "01000000004",
    gov: "الإسكندرية", area: "سموحة",
    deliveryMethod: "MEETUP",
    notes: null,
    items: [{
      productId: products[2].id, sellerId: sara.id, sellerName: "سارة عبد الله",
      title: products[2].title, unit: "كجم", price: 4.5, pricingType: "PER_KG",
      quantity: 300, lineTotal: 1350,
    }],
  });
  updateOrderStatus(order3.id, "COMPLETED");
  insertReview({
    orderId: order3.id, productId: products[2].id, sellerId: sara.id, buyerId: mostafa.id,
    rating: 5, comment: "تعامل ممتاز والكرتون نظيف ومفروز — أنصح بالشراء منها",
  });
  console.log("✔ 3 طلبات (جديد + قيد التنفيذ + مكتمل مع تقييم)");

  // ---------- إشعارات ----------
  const notif = (userId: string, type: string, title: string, body: string, link: string) =>
    run("INSERT INTO notifications (id, user_id, type, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
      newId(), userId, type, title, body, link, new Date(Date.now() - Math.random() * 3 * day).toISOString());
  notif(ahmed.id, "NEW_ORDER", "لديك طلب جديد", `طلب رقم #KK-20261001-0001 على «خردة نحاس نظيفة — سلك ومواسير» بقيمة 850 جنيه`, "/seller");
  notif(houda.id, "NEW_ORDER", "لديك طلب جديد", "طلب رقم #KK-20261002-0001 على «غسالة توشيبا 7 كجم مستعملة — حالة ممتازة» بقيمة 2800 جنيه", "/seller");
  notif(mohamed.id, "ORDER_STATUS", "تم تحديث حالة طلبك: قيد التنفيذ", "الطلب رقم #KK-20261001-0001 — قيد التنفيذ", "/orders/KK-20261001-0001");
  notif(mostafa.id, "ORDER_COMPLETED", "تم إتمام طلبك", "الطلب رقم #KK-20260928-0001 — يمكنك الآن تقييم البائع", "/orders/KK-20260928-0001");
  notif(mohamed.id, "PRICE_DROP", "انخفض سعر منتج في مفضلتك", "«غسالة توشيبا 7 كجم مستعملة — حالة ممتازة» انخفض السعر إلى 2800 جنيه (كان 3200 جنيه)", `/products/${products[4].id}`);
  notif(sara.id, "LISTING_PUBLISHED", "تم نشر إعلانك", "إعلانك «كنبة خضراء موديل قديم — قطعة مميزة» منشور الآن", `/products/${products[7].id}`);
  console.log("✔ إشعارات تجريبية");

  banner("✅ اكتملت الزراعة — كوكب كراكيب جاهز للتطوير");
  console.log(`
   لوحة الإدارة:  /admin  →  01013178718 / Owner@2026
   مستخدم تجريبي: 01000000001 / Demo@1234 (بائع ومشترٍ)
   الخادم:        npm run dev  →  http://localhost:3000
   رقم المالك لواتساب: 01013178718 (+201013178718)
`);
}

main().catch((e) => {
  console.error("فشل الزراعة:", e);
  process.exit(1);
});
