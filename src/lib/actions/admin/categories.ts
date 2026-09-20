"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";
import type { ActionResult } from "@/lib/actions/admin/products";

export interface CategoryFormValues {
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export async function createCategory(values: CategoryFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const slug = slugify(values.name) || `category-${Date.now()}`;

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...values, slug })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Could not create category." };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: true, id: data.id };
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase.from("categories").select("name, slug").eq("id", id).single();
  const slug =
    existing && existing.name !== values.name ? slugify(values.name) || existing.slug : existing?.slug;

  const { error } = await supabase
    .from("categories")
    .update({ ...values, slug })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: true, id };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  // Products referencing this category have category_id set to NULL
  // automatically (see schema.sql's ON DELETE SET NULL) — they aren't
  // deleted, just uncategorized.
  if (error) return { success: false, error: "Could not delete this category. Please try again." };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: true };
}
