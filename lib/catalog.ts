import { connection } from "next/server";
import { categories as seedCategories, products as seedProducts, slugify } from "@/data/catalog";
import { createClient } from "@/lib/supabase/server";
import type { Catalog, Category, Product } from "@/lib/types";

export { slugify };

const fallback: Catalog = {
  categories: seedCategories.map((name, index) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
    description: "",
    parentId: null,
    visible: true,
    sortOrder: index + 1,
  })),
  products: seedProducts.map((product) => ({
    ...product,
    categoryId: slugify(product.category),
    brand: "Hearth & Hue",
    gallery: [product.image],
  })),
};

export async function getStoreCatalog(): Promise<Catalog> {
  try {
    await connection();
    const supabase = await createClient();
    const [{ data: categoryRows, error: categoryError }, { data: productRows, error: productError }] = await Promise.all([
      supabase.from("categories").select("*").eq("visible", true).order("sort_order"),
      supabase.from("products").select("*, categories(name, slug)").eq("visibility", "published").order("created_at"),
    ]);
    if (categoryError || productError || !categoryRows?.length || !productRows?.length) return fallback;

    const categories: Category[] = categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      parentId: row.parent_id,
      visible: row.visible,
      sortOrder: row.sort_order,
    }));

    const products: Product[] = productRows
      .filter((row) => !row.publish_date || new Date(row.publish_date).getTime() <= Date.now())
      .map((row) => {
        const joined = row.categories as { name?: string; slug?: string } | null;
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          brand: row.brand ?? "Hearth & Hue",
          category: joined?.name ?? "Collection",
          categoryId: row.category_id,
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
  } catch {
    return fallback;
  }
}

export async function getAdminCatalog() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false }),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}
