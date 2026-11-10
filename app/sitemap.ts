import type { MetadataRoute } from "next";
import { getStoreCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";
import { localePath } from "@/lib/store-i18n";

const pages = ["/", "/shop", "/help", "/legal"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = [];
  try {
    const { products } = await getStoreCatalog();
    slugs = products.map((product) => product.slug).filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
  } catch {
    // A catalogue outage should not take the sitemap down; list the fixed pages only.
  }
  const paths = [...pages, ...slugs.map((slug) => `/products/${slug}`)];
  return paths.map((path) => ({
    url: absoluteUrl(localePath("fr", path)),
    changeFrequency: path.startsWith("/products/") ? "weekly" : "daily",
    priority: path === "/" ? 1 : path.startsWith("/products/") ? 0.8 : 0.5,
    alternates: { languages: { fr: absoluteUrl(localePath("fr", path)), ar: absoluteUrl(localePath("ar", path)) } },
  }));
}
