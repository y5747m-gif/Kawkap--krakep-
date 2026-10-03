import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/http";
import { searchProducts, listCategories } from "@/lib/models/products";

/** اقتراحات البحث الفوري (أسماء منتجات + تصنيفات) */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return jsonOk({ products: [], categories: [] });

  const viewer = getCurrentUser();
  const { items } = searchProducts({
    q,
    limit: 6,
    viewerId: viewer?.id,
  });

  const cats = listCategories()
    .filter((c) => c.name.includes(q))
    .slice(0, 4)
    .map((c) => ({ slug: c.slug, name: c.name }));

  return jsonOk({
    products: items.map((p) => ({
      id: p.id, title: p.title, price: p.price, image: p.image, gov: p.gov, area: p.area,
    })),
    categories: cats,
  });
}
