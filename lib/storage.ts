import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_BYTES = 8 * 1024 * 1024;

function filesFrom(value: FormDataEntryValue | FormDataEntryValue[] | null) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function extension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace("jpeg", "jpg");
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadProductImages(supabase: SupabaseClient, incoming: FormDataEntryValue | FormDataEntryValue[] | null, folder: string) {
  const uploaded: string[] = [];
  for (const file of filesFrom(incoming)) {
    if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 8 MB.`);
    if (file.type && !file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
    const path = `${folder}/${randomUUID()}.${extension(file)}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    uploaded.push(supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return uploaded;
}
