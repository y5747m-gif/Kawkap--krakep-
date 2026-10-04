/** تحقق وتطبيع البيانات — منع الطلبات والبيانات الوهمية */

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** تحويل الأرقام العربية إلى لاتينية وتنظيف الفراغات */
export function normalizeDigits(input: string): string {
  return input
    .split("")
    .map((ch) => ARABIC_DIGITS[ch] ?? ch)
    .join("");
}

/**
 * تطبيع رقم الهاتف المصري إلى الصيغة المحلية 01xxxxxxxxx
 * يقبل: 01013178718 / +201013178718 / 0020... / 201013178718
 */
export function normalizeEgyptianPhone(raw: string): string | null {
  if (!raw) return null;
  let s = normalizeDigits(raw).replace(/[^\d+]/g, "");
  s = s.replace(/^\+/, "");
  if (s.startsWith("0020")) s = s.slice(2); // 0020 -> 20...
  else if (s.startsWith("20") && s.length === 12) s = s.slice(2); // 2010... -> 01...
  if (/^01[0125]\d{8}$/.test(s)) return s;
  return null;
}

/**
 * تحويل الرقم إلى الصيغة الدولية المناسبة لروابط WhatsApp (أرقام فقط بدون +)
 * 01013178718 -> 201013178718
 */
export function toWhatsAppIntl(raw: string): string | null {
  const local = normalizeEgyptianPhone(raw);
  if (local) return `2${local}`;
  // أرقام دولية أخرى كما هي (بدون +)
  const digits = normalizeDigits(raw).replace(/[^\d]/g, "");
  if (digits.length >= 8) return digits;
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidPrice(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100_000_000;
}

export function isValidQuantity(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 1_000_000;
}

/** تحقق نص آمن (بدون وسوم) */
export function sanitizeText(s: unknown, maxLen = 2000): string {
  if (typeof s !== "string") return "";
  return s.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

export function isNonEmpty(s: unknown, minLen = 1): s is string {
  return typeof s === "string" && s.trim().length >= minLen;
}
