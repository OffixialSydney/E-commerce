import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types/database";

const FALLBACK_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "Sid Bespoke",
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  bank_name: null,
  account_name: null,
  account_number: null,
  delivery_fee: 0,
  delivery_timeframe: "Orders are usually delivered within 1–3 business days.",
  contact_email: null,
  contact_phone: null,
  updated_at: new Date().toISOString(),
};

/**
 * Store settings power the WhatsApp number, delivery fee, and bank
 * transfer details shown across the site. Falls back to sane defaults
 * if the settings row can't be read yet (e.g. Supabase not configured).
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return FALLBACK_SETTINGS;
    return data;
  } catch {
    return FALLBACK_SETTINGS;
  }
}
