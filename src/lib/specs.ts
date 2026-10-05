/**
 * مواصفات ما يُباع — وحدة واحدة لقراءة المواصفات من الطلبات وعرضها.
 *
 * كل المواصفات اختيارية تمامًا: البائع يملأ ما يعرفه عن شيئه
 * (الوزن، النوع، الخامة، الماركة، الموديل، اللون، سنة الصنع، المقاسات)
 * ويضيف أي مواصفات أخرى يريدها بنفسه (مفتاح + قيمة).
 */
import { MAX_CUSTOM_SPECS } from "./constants";
import { optionalNumber, optionalText, sanitizeText } from "./validate";
import type { ProductSpec, ProductSpecs } from "./types";

const CURRENT_YEAR = new Date().getFullYear();

/** قراءة المواصفات من جسم الطلب (API) مع تنظيفها والتحقق منها */
export function parseSpecsPayload(body: Record<string, unknown>): ProductSpecs {
  const rawSpecs = Array.isArray(body.specs) ? body.specs : [];
  const specs: ProductSpec[] = rawSpecs
    .map((s) => {
      const item = (s ?? {}) as { label?: unknown; value?: unknown };
      return {
        label: sanitizeText(item.label, 40),
        value: sanitizeText(item.value, 120),
      };
    })
    .filter((s) => s.label && s.value)
    .slice(0, MAX_CUSTOM_SPECS);

  const year = optionalNumber(body.year, CURRENT_YEAR + 1);

  return {
    weight: optionalNumber(body.weight, 10_000_000),
    weightUnit: optionalText(body.weightUnit, 10),
    itemType: optionalText(body.itemType, 60),
    brand: optionalText(body.brand, 60),
    model: optionalText(body.model, 60),
    material: optionalText(body.material, 60),
    color: optionalText(body.color, 40),
    year: year && year >= 1900 ? Math.round(year) : null,
    dimensions: optionalText(body.dimensions, 80),
    specs,
  };
}

/** هل أدخل البائع أي مواصفة؟ */
export function hasAnySpec(data: Partial<ProductSpecs> | null | undefined): boolean {
  if (!data) return false;
  return listSpecRows(data).length > 0;
}

/** صفوف العرض (اسم المواصفة + قيمتها) — تتجاهل كل ما لم يدخله البائع */
export function listSpecRows(data: Partial<ProductSpecs> | null | undefined): ProductSpec[] {
  if (!data) return [];
  const rows: ProductSpec[] = [];
  const push = (label: string, value: string | number | null | undefined) => {
    const v = value === null || value === undefined ? "" : String(value).trim();
    if (v) rows.push({ label, value: v });
  };

  push("الوزن", data.weight != null ? `${formatSpecNumber(data.weight)} ${data.weightUnit || "كجم"}` : null);
  push("النوع", data.itemType);
  push("الخامة", data.material);
  push("الماركة", data.brand);
  push("الموديل", data.model);
  push("اللون", data.color);
  push("سنة الصنع", data.year != null ? String(data.year) : null);
  push("المقاسات", data.dimensions);

  for (const s of data.specs ?? []) {
    push(s.label, s.value);
  }
  return rows;
}

function formatSpecNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}
