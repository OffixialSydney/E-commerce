"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/lib/supabase/get-admin-profile";
import type { ActionResult } from "@/lib/actions/admin/products";
import type { OrderStatus } from "@/types/database";

/**
 * Updates an order's status. If moving to "cancelled", restores the stock
 * that was reserved when the order was created — this is the only place
 * (besides checkout itself) that touches product stock via a full
 * cancellation, so it's kept symmetric with `reserve_stock`.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_status")
    .eq("id", orderId)
    .single();

  if (!order) return { success: false, error: "Order not found." };

  const isNewlyCancelled = newStatus === "cancelled" && order.order_status !== "cancelled";

  const { error } = await supabase.from("orders").update({ order_status: newStatus }).eq("id", orderId);
  if (error) return { success: false, error: error.message };

  if (isNewlyCancelled) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    const restorable = (items ?? []).filter((i) => i.product_id) as {
      product_id: string;
      quantity: number;
    }[];

    if (restorable.length > 0) {
      await supabase.rpc("restore_stock", {
        items: restorable.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Confirms a bank-transfer payment: marks the latest screenshot as
 * reviewed/confirmed, and moves the order to payment_confirmed.
 */
export async function confirmBankTransferPayment(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const admin = await getCurrentAdminProfile();
  if (!admin) return { success: false, error: "Not signed in as an admin." };

  const { data: latestProof } = await supabase
    .from("payment_proofs")
    .select("id")
    .eq("order_id", orderId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestProof) {
    await supabase
      .from("payment_proofs")
      .update({
        reviewed: true,
        decision: "confirmed",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", latestProof.id);
  }

  await supabase
    .from("payments")
    .update({ status: "confirmed", paid_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("method", "bank_transfer");

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "confirmed", order_status: "payment_confirmed" })
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Rejects a bank-transfer payment (e.g. an unclear or incorrect
 * screenshot). The order stays open so the customer can re-upload from
 * their confirmation page — it isn't cancelled here.
 */
export async function rejectBankTransferPayment(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const admin = await getCurrentAdminProfile();
  if (!admin) return { success: false, error: "Not signed in as an admin." };

  const { data: latestProof } = await supabase
    .from("payment_proofs")
    .select("id")
    .eq("order_id", orderId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestProof) {
    await supabase
      .from("payment_proofs")
      .update({
        reviewed: true,
        decision: "rejected",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", latestProof.id);
  }

  await supabase.from("payments").update({ status: "rejected" }).eq("order_id", orderId).eq("method", "bank_transfer");

  const { error } = await supabase.from("orders").update({ payment_status: "rejected" }).eq("id", orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
