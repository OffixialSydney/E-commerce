"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/admin/products";

export interface StoreSettingsFormValues {
  store_name: string;
  whatsapp_number: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  delivery_fee: number;
  delivery_timeframe: string;
  contact_email: string;
  contact_phone: string;
}

export async function updateStoreSettings(values: StoreSettingsFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update(values).eq("id", 1);

  if (error) return { success: false, error: error.message };

  // Settings are read on nearly every storefront page (WhatsApp number,
  // delivery fee/timeframe, bank details), so revalidate broadly.
  revalidatePath("/", "layout");
  return { success: true };
}
