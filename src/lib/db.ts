/**
 * طبقة قاعدة البيانات — كوكب كراكيب
 * تعتمد على وحدة node:sqlite المدمجة (Node >= 22.13) دون أي خدمات خارجية.
 * الملف: data/app.db (يُنشأ تلقائيًا مع الجداول عند أول تشغيل).
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BUNDLED_DB_PATH = path.join(process.cwd(), "data", "app.db");
const IS_VERCEL = process.env.VERCEL === "1";

/**
 * نظام ملفات Vercel للـ Serverless للقراءة فقط، باستثناء /tmp. فتح قاعدة
 * البيانات المرفقة مباشرة ثم تفعيل WAL كان يرمي:
 *   ERR_SQLITE_ERROR: attempt to write a readonly database
 * فينهار Root Layout وتعود كل الصفحات بخطأ 500.
 *
 * عند وجود KK_DB_PATH نستخدمه دائمًا (المسار الدائم الموصى به في الإنتاج).
 * على Vercel ننسخ قاعدة البيانات المرفقة إلى /tmp عند الـ cold start. هذا
 * يعيد الموقع للعمل، لكن /tmp مؤقت وغير مشترك بين نسخ الدوال؛ راجع README.
 */
export type DatabaseStorageMode = "persistent" | "vercel-temporary";

function prepareDatabasePath(): { path: string; mode: DatabaseStorageMode } {
  if (process.env.KK_DB_PATH) {
    const configuredPath = path.resolve(process.env.KK_DB_PATH);
    fs.mkdirSync(path.dirname(configuredPath), { recursive: true });
    return { path: configuredPath, mode: "persistent" };
  }

  if (!IS_VERCEL) {
    fs.mkdirSync(path.dirname(BUNDLED_DB_PATH), { recursive: true });
    return { path: BUNDLED_DB_PATH, mode: "persistent" };
  }

  const tempDir = path.join(os.tmpdir(), "kawkap-krakep");
  const tempPath = path.join(tempDir, "app.db");
  fs.mkdirSync(tempDir, { recursive: true });

  if (!fs.existsSync(tempPath)) {
    if (fs.existsSync(BUNDLED_DB_PATH)) {
      // كتابة ذرية حتى لا تفتح قاعدة منسوخة جزئيًا عند تزامن أول طلبين.
      const stagingPath = `${tempPath}.${process.pid}.tmp`;
      fs.copyFileSync(BUNDLED_DB_PATH, stagingPath);
      try {
        // link لا يستبدل ملفًا موجودًا، بخلاف rename في Linux.
        fs.linkSync(stagingPath, tempPath);
      } catch (error) {
        // قد تكون عملية متزامنة سبقتنا بإنشاء الملف؛ نحتفظ بنسختها السليمة.
        if (!fs.existsSync(tempPath)) throw error;
      } finally {
        fs.rmSync(stagingPath, { force: true });
      }
    }
    // إن لم توجد النسخة المرفقة، ينشئ DatabaseSync ملفًا جديدًا ثم ينشئ SCHEMA.
  }

  return { path: tempPath, mode: "vercel-temporary" };
}

const databaseConfig = prepareDatabasePath();
export const databaseStorageMode = databaseConfig.mode;

// منع تكرار فتح الاتصال عند إعادة تحميل الوحدات في وضع التطوير
const g = globalThis as unknown as {
  __kkDb?: DatabaseSync;
  __kkDbPath?: string;
};

export const db: DatabaseSync =
  g.__kkDb && g.__kkDbPath === databaseConfig.path
    ? g.__kkDb
    : new DatabaseSync(databaseConfig.path);
g.__kkDb = db;
g.__kkDbPath = databaseConfig.path;

// مهلة قصيرة بدل فشل الطلب فورًا عند تزامن عمليتي كتابة.
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio TEXT,
  gov TEXT,
  area TEXT,
  latitude REAL,
  longitude REAL,
  rating_avg REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#1fa27c',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'FIXED',
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'قطعة',
  condition TEXT NOT NULL DEFAULT 'USED',
  gov TEXT NOT NULL,
  area TEXT,
  latitude REAL,
  longitude REAL,
  has_delivery INTEGER NOT NULL DEFAULT 0,
  negotiable INTEGER NOT NULL DEFAULT 0,
  contact_phone TEXT,
  notes TEXT,
  keywords TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  featured INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  -- البيع بدون حساب: اسم البائع الضيف ورمز متصفحه لإدارة إعلانه لاحقًا
  guest_name TEXT,
  guest_token TEXT,
  -- المواصفات الكاملة لما يُباع (كلها اختيارية)
  weight REAL,
  weight_unit TEXT,
  item_type TEXT,
  brand TEXT,
  model TEXT,
  material TEXT,
  color TEXT,
  item_year INTEGER,
  dimensions TEXT,
  specs TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_main INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_at_save REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity REAL NOT NULL,
  price_at_add REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  buyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  gov TEXT,
  area TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  delivery_method TEXT NOT NULL DEFAULT 'PICKUP',
  notes TEXT,
  items_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEW',
  whatsapp_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'FIXED',
  quantity REAL NOT NULL,
  line_total REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

CREATE TABLE IF NOT EXISTS seller_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seller_orders_order ON seller_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller ON seller_orders(seller_id);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'عنواني',
  gov TEXT NOT NULL,
  area TEXT,
  details TEXT,
  latitude REAL,
  longitude REAL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT,
  product_title TEXT,
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, seller_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
`;

db.exec(SCHEMA);

/* ------------------------------------------------------------------
 * ترحيلات بسيطة (Migrations)
 * CREATE TABLE IF NOT EXISTS لا يضيف الأعمدة الجديدة لقاعدة بيانات
 * موجودة بالفعل، فنضيفها هنا مرة واحدة وبشكل آمن للتكرار.
 * ------------------------------------------------------------------ */
function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

const PRODUCT_COLUMN_MIGRATIONS: [string, string][] = [
  ["guest_name", "TEXT"],
  ["guest_token", "TEXT"],
  ["weight", "REAL"],
  ["weight_unit", "TEXT"],
  ["item_type", "TEXT"],
  ["brand", "TEXT"],
  ["model", "TEXT"],
  ["material", "TEXT"],
  ["color", "TEXT"],
  ["item_year", "INTEGER"],
  ["dimensions", "TEXT"],
  ["specs", "TEXT"],
];

for (const [column, definition] of PRODUCT_COLUMN_MIGRATIONS) {
  ensureColumn("products", column, definition);
}

db.exec("CREATE INDEX IF NOT EXISTS idx_products_guest_token ON products(guest_token);");

/** helpers مختصرة للاستعلامات — تمرير undefined يُحوَّل تلقائيًا إلى NULL */
type Param = string | number | null | undefined;

function normalize(params: Param[]): (string | number | null)[] {
  return params.map((p) => (p === undefined ? null : p));
}

export function all<T = Record<string, unknown>>(sql: string, ...params: Param[]): T[] {
  return db.prepare(sql).all(...normalize(params)) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...params: Param[]): T | undefined {
  return db.prepare(sql).get(...normalize(params)) as T | undefined;
}

export function run(sql: string, ...params: Param[]) {
  return db.prepare(sql).run(...normalize(params));
}

/** تنفيذ عدة عمليات داخل معاملة واحدة */
export function tx<T>(fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
