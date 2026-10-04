/** أنواع الكيانات الأساسية في كوكب كراكيب */

export type Role = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  gov: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

/** المستخدم الحالي مع بياناته الإضافية للعرض في الواجهة */
export interface CurrentUser extends User {
  profile: Profile | null;
  unreadNotifications: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  productsCount?: number;
}

export type PricingType = "FIXED" | "PER_KG" | "PER_PIECE" | "BULK";
export type ProductCondition = "NEW" | "LIKE_NEW" | "USED" | "OLD" | "SCRAP";
export type ProductStatus = "PENDING" | "ACTIVE" | "PAUSED" | "REJECTED" | "HIDDEN" | "SOLD";

export interface Product {
  id: string;
  code: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  pricingType: PricingType;
  quantity: number;
  unit: string;
  condition: ProductCondition;
  gov: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  hasDelivery: boolean;
  negotiable: boolean;
  contactPhone: string | null;
  notes: string | null;
  keywords: string | null;
  status: ProductStatus;
  featured: boolean;
  isDemo: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
  isMain: boolean;
}

/** بيانات المنتج كما تُعرض في كرت المنتج */
export interface ProductCardData {
  id: string;
  code: string;
  title: string;
  description: string;
  price: number;
  pricingType: PricingType;
  quantity: number;
  unit: string;
  condition: ProductCondition;
  gov: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  hasDelivery: boolean;
  negotiable: boolean;
  status: ProductStatus;
  featured: boolean;
  isDemo: boolean;
  views: number;
  createdAt: string;
  categorySlug: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  sellerRating: number;
  sellerRatingCount: number;
  image: string | null;
  imagesCount: number;
  isFavorite?: boolean;
  favoritePriceAtSave?: number | null;
  distanceKm?: number | null;
}

export interface ProductDetail extends ProductCardData {
  sellerPhone: string | null;
  sellerSince: string;
  sellerProductsCount: number;
  contactPhone: string | null;
  notes: string | null;
  updatedAt: string;
  images: ProductImage[];
}

export interface FavoriteRow {
  id: string;
  userId: string;
  productId: string;
  priceAtSave: number;
  createdAt: string;
}

export interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  priceAtAdd: number;
  product: ProductCardData;
}

export type OrderStatus =
  | "NEW"
  | "REVIEWED"
  | "CONTACTED"
  | "PROCESSING"
  | "READY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type DeliveryMethod = "PICKUP" | "DELIVERY" | "MEETUP";

export interface Order {
  id: string;
  orderCode: string;
  buyerId: string | null;
  customerName: string;
  customerPhone: string;
  gov: string | null;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryMethod: DeliveryMethod;
  notes: string | null;
  itemsPrice: number;
  total: number;
  status: OrderStatus;
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unit: string;
  price: number;
  pricingType: PricingType;
  quantity: number;
  lineTotal: number;
  /** بيانات إضافية اختيارية للعرض */
  productImage?: string | null;
  productGov?: string | null;
  productArea?: string | null;
}

export interface SellerOrder {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string | null;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  review?: ReviewRow | null;
}

export interface ReviewRow {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyerName?: string;
}

export type NotificationType =
  | "LISTING_PUBLISHED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "NEW_ORDER"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_STATUS"
  | "ORDER_COMPLETED"
  | "PRICE_DROP"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  gov: string;
  area: string | null;
  details: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface LocationRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sortOrder: number;
}

export interface Report {
  id: string;
  reporterId: string | null;
  productId: string | null;
  reason: string;
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  productTitle?: string | null;
  reporterName?: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  sellerId: string;
  productId: string | null;
  productTitle: string | null;
  lastMessageAt: string;
  createdAt: string;
  sellerName?: string;
  sellerAvatar?: string | null;
  sellerPhone?: string | null;
}

/** نتيجة إنشاء طلب — تشمل رابط واتساب المالك المجهز مسبقًا */
export interface CreateOrderResult {
  order: OrderWithItems;
  whatsappUrl: string;
}
