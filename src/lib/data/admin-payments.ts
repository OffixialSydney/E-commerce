import { createClient } from "@/lib/supabase/server";
import type { Order, PaymentProof } from "@/types/database";

export interface PendingVerification {
  order: Order;
  proof: PaymentProof | null;
  signedUrl: string | null;
}

export async function listPendingBankTransferVerifications(): Promise<PendingVerification[]> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_method", "bank_transfer")
    .in("payment_status", ["awaiting_verification", "pending"])
    .order("created_at", { ascending: true });

  if (error || !orders) {
    if (error) console.error("listPendingBankTransferVerifications error:", error.message);
    return [];
  }

  const results: PendingVerification[] = [];

  for (const order of orders) {
    const { data: proof } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", order.id)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let signedUrl: string | null = null;
    if (proof) {
      const { data: signed } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(proof.storage_path, 60 * 10);
      signedUrl = signed?.signedUrl ?? null;
    }

    results.push({ order, proof: proof ?? null, signedUrl });
  }

  return results;
}
