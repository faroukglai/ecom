"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/catalog";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function moneyValue(form: FormData, key: string) {
  const value = Number(text(form, key));
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

function galleryFrom(form: FormData) {
  const main = text(form, "image");
  const extra = text(form, "gallery")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return { image: main, gallery: Array.from(new Set([main, ...extra].filter(Boolean))) };
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const currentId = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const price = moneyValue(formData, "price");
  const { image, gallery } = galleryFrom(formData);
  if (!name || price == null || !image) throw new Error("Name, price and image are required.");
  const payload = {
    id: currentId || slug,
    slug,
    name,
    brand: text(formData, "brand") || "Hearth & Hue",
    category_id: text(formData, "category_id") || null,
    price,
    old_price: moneyValue(formData, "old_price"),
    image,
    gallery,
    color: text(formData, "color"),
    material: text(formData, "material"),
    description: text(formData, "description"),
    page_title: text(formData, "page_title") || name,
    meta_description: text(formData, "meta_description"),
    is_new: formData.get("is_new") === "on",
    visibility: text(formData, "visibility") || "published",
    publish_date: text(formData, "publish_date") || null,
  };
  const { error } = currentId
    ? await supabase.from("products").update(payload).eq("id", currentId)
    : await supabase.from("products").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function duplicateProduct(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Product not found.");
  const copyId = `${data.id}-copy-${Date.now().toString(36)}`;
  const { created_at: _created, updated_at: _updated, ...rest } = data;
  const { error: insertError } = await supabase.from("products").insert({
    ...rest,
    id: copyId,
    slug: `${data.slug}-copy`,
    name: `${data.name} (copy)`,
    visibility: "hidden",
  });
  if (insertError) throw new Error(insertError.message);
  revalidatePath("/dashboard/products");
  redirect(`/dashboard/products/${copyId}`);
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const currentId = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name) throw new Error("Category name is required.");
  const payload = {
    id: currentId || slug,
    name,
    slug,
    description: text(formData, "description"),
    parent_id: text(formData, "parent_id") || null,
    visible: formData.get("visible") === "on",
    sort_order: Number(text(formData, "sort_order") || 0),
  };
  const { error } = currentId
    ? await supabase.from("categories").update(payload).eq("id", currentId)
    : await supabase.from("categories").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/dashboard/categories");
}

export async function updateOrderStatus(id: string, status: string) {
  const { supabase } = await requireAdmin();
  const allowed = ["new", "confirmed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid status.");
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}
