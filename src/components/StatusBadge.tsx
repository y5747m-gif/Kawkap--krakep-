import { ORDER_STATUS_MAP, PRODUCT_STATUS_MAP } from "@/lib/constants";

/** شارة حالة الطلب أو الإعلان */
export default function StatusBadge({ status, type = "order" }: { status: string; type?: "order" | "product" }) {
  const meta = type === "order" ? ORDER_STATUS_MAP[status] : PRODUCT_STATUS_MAP[status];
  if (!meta) return null;
  return (
    <span className={`chip ${type === "order" ? meta.badge : meta.badge}`}>
      {meta.label}
    </span>
  );
}
