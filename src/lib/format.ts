/** تنسيقات العرض: العملة، الأرقام، التواريخ العربية */

const numFmt = new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn-ca-gregory", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatNumber(n: number): string {
  return numFmt.format(n);
}

/** تنسيق مبلغ مالي بالجنيه المصري */
export function formatMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${numFmt.format(rounded)} جنيه`;
}

/** سعر الوحدة مع بيان نوع التسعير */
export function formatUnitPrice(price: number, pricingType: string, unit: string): string {
  switch (pricingType) {
    case "PER_KG":
      return `${formatMoney(price)} / كجم`;
    case "PER_PIECE":
      return `${formatMoney(price)} / ${unit || "قطعة"}`;
    default:
      return formatMoney(price);
  }
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${dateFmt.format(d)} - ${timeFmt.format(d)}`;
}

/** قبل X ساعة / دقيقة / يوم */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${formatNumber(mins)} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${formatNumber(hours)} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${formatNumber(days)} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `قبل ${formatNumber(months)} شهر`;
  return formatDate(iso);
}

/** تنسيق الكمية: 25 كجم */
export function formatQuantity(qty: number, unit: string): string {
  const v = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
  return `${numFmt.format(v)} ${unit}`;
}
