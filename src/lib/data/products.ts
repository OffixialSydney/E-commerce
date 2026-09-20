import { createClient } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/types/database";

export interface ProductQueryOptions {
  search?: string;
  categorySlug?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  includeOutOfStock?: boolean;
}

/**
 * Fetch the active product catalogue for the Shop page, with
 * optional search/filter/sort. Uses the request-scoped server client,
 * which is subject to RLS (public read of active products only).
 */
export async function getProducts(
  options: ProductQueryOptions = {}
): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("is_active", true);

  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  if (options.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();

    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  switch (options.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("getProducts error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return data as unknown as ProductWithRelations;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getNewArrivals(limit = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("is_active", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getBestSellers(limit = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("is_active", true)
    .eq("is_best_seller", true)
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as ProductWithRelations[];
}
