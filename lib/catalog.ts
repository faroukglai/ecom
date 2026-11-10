import { cacheLife, cacheTag } from "next/cache";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { site } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import type { Catalog, Category, Product } from "@/lib/types";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Public catalogue for the storefront.
 * Uses the anonymous key without cookies, so it can be cached and shared between visitors.
 * Admin changes call updateTag("catalog") (see app/actions/catalog.ts) so edits show up immediately.
 */
export async function getStoreCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag("catalog");
  // Long enough that pages are fully prerendered (short-lived caches turn the page into a streamed "dynamic hole").
  // Admin edits call updateTag("catalog"), so this never makes the owner wait to see a change.
  cacheLife("hours");

  const supabase = createPublicClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [categoryRes, productRes] = await Promise.all([
    supabase.from("categories").select("*").eq("visible", true).order("sort_order"),
    supabase.from("products").select("*, categories(name, slug)").eq("visibility", "published").order("created_at", { ascending: false }),
  ]);
  if (categoryRes.error) throw new Error(categoryRes.error.message);
  if (productRes.error) throw new Error(productRes.error.message);

  const categories: Category[] = (categoryRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    parentId: row.parent_id,
    visible: row.visible,
    sortOrder: row.sort_order,
  }));

  // Row-level security already hides scheduled products until their publish date for anonymous visitors.
  const products: Product[] = (productRes.data ?? [])
    .map((row) => {
      const joined = (Array.isArray(row.categories) ? row.categories[0] : row.categories) as { name?: string; slug?: string } | null;
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: joined?.name ?? "",
        categorySlug: joined?.slug ?? "",
        categoryId: row.category_id,
        brand: row.brand ?? site.name,
        price: Number(row.price),
        oldPrice: row.old_price == null ? undefined : Number(row.old_price),
        image: row.image,
        gallery: Array.isArray(row.gallery) && row.gallery.length ? row.gallery : [row.image],
        color: row.color ?? "",
        material: row.material ?? "",
        description: row.description ?? "",
        isNew: Boolean(row.is_new),
      };
    });

  return { categories, products };
}

export async function getAdminCatalog() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false }),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}
