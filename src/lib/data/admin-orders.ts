import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Payment, PaymentProof, OrderStatus } from "@/types/database";

export async function listOrdersAdmin(status?: OrderStatus): Promise<Order[]> {
  const supabase = await createClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (status) query = query.eq("order_status", status);

  const { data, error } = await query;
  if (error) {
    console.error("listOrdersAdmin error:", error.message);
    return [];
  }
  return data ?? [];
}

export interface OrderDetailAdmin extends Order {
  items: OrderItem[];
  payments: Payment[];
  proofs: PaymentProof[];
  proofSignedUrls: Record<string, string>;
}

export async function getOrderDetailAdmin(id: string): Promise<OrderDetailAdmin | null> {
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: payments }, { data: proofs }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("payment_proofs").select("*").eq("order_id", id).order("uploaded_at", { ascending: false }),
  ]);

  const proofSignedUrls: Record<string, string> = {};
  for (const proof of proofs ?? []) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(proof.storage_path, 60 * 10);
    if (signed) proofSignedUrls[proof.id] = signed.signedUrl;
  }

  return {
    ...order,
    items: items ?? [],
    payments: payments ?? [],
    proofs: proofs ?? [],
    proofSignedUrls,
  };
}
