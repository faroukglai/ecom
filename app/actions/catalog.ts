"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/catalog";
import { removeProductImages, uploadProductImages } from "@/lib/storage";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function moneyValue(form: FormData, key: string) {
  const raw = text(form, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

type ImagePlanItem = { kind: "url"; src: string } | { kind: "file" };

function parseImagePlan(form: FormData): ImagePlanItem[] {
  try {
    const parsed = JSON.parse(text(form, "image_list") || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    const plan: ImagePlanItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const kind = "kind" in item ? String((item as { kind?: string }).kind) : "";
      if (kind === "url") {
        const src = "src" in item ? String((item as { src?: string }).src) : "";
        if (src.startsWith("http://") || src.startsWith("https://")) plan.push({ kind: "url", src });
        continue;
      }
      if (kind === "file") plan.push({ kind: "file" });
    }
    return plan;
  } catch {
    return [];
  }
}

export async function saveProduct(_prev: { error?: string } | undefined, formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const currentId = text(formData, "id");
    const name = text(formData, "name");
    const slug = slugify(text(formData, "slug") || name);
    const price = moneyValue(formData, "price");
    if (!name || price == null) return { error: "name_price" };

    const folder = currentId || slug || "products";
    const plan = parseImagePlan(formData);
    const files = formData.getAll("image_files");
    let fileIndex = 0;
    const urls: string[] = [];
    for (const item of plan) {
      if (item.kind === "url") {
        urls.push(item.src);
        continue;
      }
      const uploaded = await uploadProductImages(supabase, files[fileIndex++] ?? null, folder);
      if (uploaded[0]) urls.push(uploaded[0]);
    }
    const image = urls[0];
    if (!image) return { error: "photo_required" };
    const gallery = [...new Set(urls)];

    let previousUrls: string[] = [];
    if (currentId) {
      const { data: previous } = await supabase.from("products").select("image, gallery").eq("id", currentId).maybeSingle();
      previousUrls = [previous?.image, ...(Array.isArray(previous?.gallery) ? previous.gallery : [])].filter((src): src is string => typeof src === "string" && src.length > 0);
    }
    const payload = {
      id: currentId || slug,
      slug,
      name,
      brand: text(formData, "brand") || "Darivo",
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
    };
    // New products go live; editing never changes whether an existing product is published or hidden.
    const { error } = currentId
      ? await supabase.from("products").update(payload).eq("id", currentId)
      : await supabase.from("products").insert({ ...payload, visibility: "published", publish_date: null });
    if (error) return { error: error.code === "23505" ? "slug_taken" : "save_failed" };

    // Only delete replaced photos after the row is safely saved.
    if (previousUrls.length) {
      try {
        await removeProductImages(supabase, previousUrls.filter((src) => !gallery.includes(src)));
      } catch {
        // Keep the product save even if a leftover file cannot be removed.
      }
    }
  } catch {
    return { error: "save_failed" };
  }

  updateTag("catalog");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  return { redirectTo: "/dashboard/products" };
}

export async function duplicateProduct(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error || !data) return { error: "action_failed" };
    const copyId = `${data.id}-copy-${crypto.randomUUID().slice(0, 8)}`;
    const { created_at: _created, updated_at: _updated, ...rest } = data;
    const { error: insertError } = await supabase.from("products").insert({
      ...rest,
      id: copyId,
      slug: `${data.slug}-copy-${copyId.slice(-8)}`,
      name: `${data.name} (copy)`,
      visibility: "hidden",
    });
    if (insertError) return { error: "action_failed" };
    revalidatePath("/dashboard/products");
    return { redirectTo: `/dashboard/products/${copyId}` };
  } catch {
    return { error: "action_failed" };
  }
}

export async function setProductVisibility(id: string, visibility: "published" | "hidden") {
  try {
    const { supabase } = await requireAdmin();
    if (visibility !== "published" && visibility !== "hidden") return { error: "action_failed" };
    const { error } = await supabase.from("products").update({ visibility, publish_date: null }).eq("id", id);
    if (error) return { error: "action_failed" };
    updateTag("catalog");
    revalidatePath("/dashboard/products");
    return {};
  } catch {
    return { error: "action_failed" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { data } = await supabase.from("products").select("image, gallery").eq("id", id).maybeSingle();
    const urls = [data?.image, ...(Array.isArray(data?.gallery) ? data.gallery : [])].filter((src): src is string => typeof src === "string" && src.length > 0);
    try {
      await removeProductImages(supabase, urls);
    } catch {
      // Product rows should still be removed if storage cleanup fails.
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: "action_failed" };
    updateTag("catalog");
    revalidatePath("/dashboard/products");
    return { redirectTo: "/dashboard/products" };
  } catch {
    return { error: "action_failed" };
  }
}

export async function saveCategory(formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const currentId = text(formData, "id");
    const name = text(formData, "name");
    const slug = slugify(text(formData, "slug") || name);
    if (!name) return { error: "category_name" };
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
    if (error) return { error: "save_failed" };
    updateTag("catalog");
    revalidatePath("/dashboard/categories");
    return {};
  } catch {
    return { error: "save_failed" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { error: "action_failed" };
    updateTag("catalog");
    revalidatePath("/dashboard/categories");
    return {};
  } catch {
    return { error: "action_failed" };
  }
}

export async function updateOrderNote(id: string, formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
    const { error } = await supabase.from("orders").update({ note }).eq("id", id);
    if (error) return { error: "action_failed" };
    revalidatePath(`/dashboard/orders/${id}`);
    return {};
  } catch {
    return { error: "action_failed" };
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const { supabase } = await requireAdmin();
    const allowed = ["new", "confirmed", "shipped", "delivered", "cancelled", "refused", "returned"];
    if (!allowed.includes(status)) return { error: "invalid_status" };
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return { error: "action_failed" };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
    return {};
  } catch {
    return { error: "action_failed" };
  }
}
