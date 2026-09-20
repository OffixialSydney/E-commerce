import { createClient } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/types/database";

export async function getAllProductsAdmin(search?: string): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAllProductsAdmin error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getProductByIdAdmin(id: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)")
    .eq("id", id)
    .maybeSingle();

  return data as unknown as ProductWithRelations | null;
}
