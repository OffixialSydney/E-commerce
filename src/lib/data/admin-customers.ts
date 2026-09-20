import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/database";

export async function listCustomersAdmin(search?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listCustomersAdmin error:", error.message);
    return [];
  }
  return data ?? [];
}
