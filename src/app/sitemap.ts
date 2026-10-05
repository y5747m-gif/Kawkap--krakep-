import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { listCategories, searchProducts } from "@/lib/models/products";

export const dynamic = "force-dynamic";

/**
 * ‎/sitemap.xml‎ — كان يعود بخطأ 404.
 * يضم الصفحات العامة + كل التصنيفات + أحدث الإعلانات المنشورة.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/map`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const categories = listCategories().map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    const products = searchProducts({ limit: 60 }).items.map((p) => ({
      url: `${base}/products/${p.id}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    dynamicPages = [...categories, ...products];
  } catch {
    // قاعدة البيانات غير جاهزة وقت البناء — نكتفي بالصفحات الثابتة
  }

  return [...staticPages, ...dynamicPages];
}
