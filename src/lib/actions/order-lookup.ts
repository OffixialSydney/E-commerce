"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, PaymentProof } from "@/types/database";

export interface OrderWithItems extends Order {
  items: OrderItem[];
  proofs: PaymentProof[];
}

/**
 * Used by the order confirmation page right after checkout. The order
 * number alone is guessable (sequential-looking), so this also requires
 * the random access_code that was generated with the order and passed
 * in the confirmation URL — preventing one customer from viewing another
 * customer's order by guessing order numbers.
 */
export async function getOrderForConfirmation(
  orderNumber: string,
  accessCode: string
): Promise<OrderWithItems | null> {
  if (!orderNumber || !accessCode) return null;

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .eq("access_code", accessCode)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const { data: proofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("order_id", order.id)
    .order("uploaded_at", { ascending: false });

  return { ...order, items: items ?? [], proofs: proofs ?? [] };
}

/**
 * Used by the "track your order" page. Guests authenticate themselves
 * with order number + the phone number they placed the order with —
 * no account needed, and no other order's details are ever returned.
 */
export async function lookupOrderStatus(
  orderNumber: string,
  phone: string
): Promise<OrderWithItems | null> {
  if (!orderNumber || !phone) return null;

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.trim())
    .eq("phone", phone.trim())
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  return { ...order, items: items ?? [], proofs: [] };
}
