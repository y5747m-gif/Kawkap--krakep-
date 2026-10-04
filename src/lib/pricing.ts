/**
 * حسابات التسعير — وحدة نقية تُستخدم في الواجهة والخادم معًا.
 * أنواع التسعير: سعر ثابت · لكل كيلو · لكل قطعة · سعر للمجموعة
 */
export function computeLineTotal(pricingType: string, price: number, quantity: number): number {
  if (pricingType === "PER_KG" || pricingType === "PER_PIECE") {
    return Math.round(price * quantity * 100) / 100;
  }
  // سعر ثابت أو سعر للمجموعة — السعر للدفعة كلها
  return price;
}

/** هل الكمية قابلة للتخصيص حسب نوع التسعير؟ */
export function isPerUnitPricing(pricingType: string): boolean {
  return pricingType === "PER_KG" || pricingType === "PER_PIECE";
}
