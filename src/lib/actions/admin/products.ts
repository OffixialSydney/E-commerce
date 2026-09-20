"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string
): Promise<string> {
  let slug = slugify(base) || "product";
  let attempt = 0;

  while (true) {
    let query = supabase.from("products").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();

    if (!data) return slug;
    attempt += 1;
    slug = `${slugify(base)}-${attempt + 1}`;
  }
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  previous_price: number | null;
  category_id: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_active: boolean;
}

export async function createProduct(values: ProductFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, values.name);

  const { data, error } = await supabase
    .from("products")
    .insert({ ...values, slug })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Could not create product." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, id: data.id };
}

export async function updateProduct(id: string, values: ProductFormValues): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase.from("products").select("name, slug").eq("id", id).single();
  const slug = existing && existing.name !== values.name ? await uniqueSlug(supabase, values.name, id) : existing?.slug;

  const { error } = await supabase
    .from("products")
    .update({ ...values, slug })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  if (slug) revalidatePath(`/product/${slug}`);
  return { success: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Pull image paths first so we can clean up storage after the row goes.
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  if (images && images.length > 0) {
    await supabase.storage.from("product-images").remove(images.map((i) => i.storage_path));
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function adjustStock(id: string, newQuantity: number): Promise<ActionResult> {
  if (newQuantity < 0) return { success: false, error: "Stock cannot be negative." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: newQuantity })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { success: true };
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(productId: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose an image." };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { success: false, error: "Image must be under 5MB." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Please upload a JPG, PNG or WEBP image." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${productId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { success: false, error: "Could not upload image." };

  const isFirstImage = (count ?? 0) === 0;

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    display_order: count ?? 0,
    is_primary: isFirstImage,
  });

  if (insertError) return { success: false, error: "Image uploaded but could not be saved." };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteProductImage(imageId: string, productId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path, is_primary")
    .eq("id", imageId)
    .single();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { success: false, error: error.message };

  if (image) {
    await supabase.storage.from("product-images").remove([image.storage_path]);

    // If we just removed the primary image, promote the next one so the
    // shop grid and product card never end up with no primary image set.
    if (image.is_primary) {
      const { data: nextImage } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextImage) {
        await supabase.from("product_images").update({ is_primary: true }).eq("id", nextImage.id);
      }
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  return { success: true };
}

export async function setPrimaryImage(imageId: string, productId: string): Promise<ActionResult> {
  const supabase = await createClient();

  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  return { success: true };
}
