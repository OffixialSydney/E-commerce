"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/admin/products";

export async function markMessageRead(id: string, isRead: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("messages").update({ is_read: isRead }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/messages");
  return { success: true };
}
