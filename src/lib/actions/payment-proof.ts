"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface UploadProofResult {
  success: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Uploads a bank-transfer payment screenshot for an order the caller has
 * proven ownership of (via order_number + access_code — same guard as the
 * order confirmation page). The file goes to the private `payment-proofs`
 * bucket using the service-role client, since guests have no Supabase Auth
 * session and the bucket intentionally has no public insert policy.
 */
export async function uploadPaymentProof(
  orderNumber: string,
  accessCode: string,
  formData: FormData
): Promise<UploadProofResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose an image to upload." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File is too large. Please upload an image under 5MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Please upload a JPG, PNG, WEBP or HEIC image." };
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_method")
    .eq("order_number", orderNumber)
    .eq("access_code", accessCode)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "We couldn't find that order." };
  }

  if (order.payment_method !== "bank_transfer") {
    return { success: false, error: "This order isn't set up for bank transfer." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", order.id)
    .eq("method", "bank_transfer")
    .maybeSingle();

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${orderNumber}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: "Could not upload your screenshot. Please try again." };
  }

  const { error: insertError } = await supabase.from("payment_proofs").insert({
    order_id: order.id,
    payment_id: payment?.id ?? null,
    storage_path: storagePath,
  });

  if (insertError) {
    return { success: false, error: "Screenshot uploaded but could not be saved. Please contact us." };
  }

  return { success: true };
}
