"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";

export interface InitializePaymentResult {
  success: boolean;
  authorizationUrl?: string;
  error?: string;
}

/**
 * Starts a Paystack payment for an order that already exists (created via
 * createOrder in Phase 2). Requires the order's access_code as proof the
 * caller actually owns this order — never trust order_number alone, since
 * it's a predictable, sequential-looking string.
 */
export async function initializePaystackPayment(
  orderNumber: string,
  accessCode: string,
  email: string
): Promise<InitializePaymentResult> {
  if (!orderNumber || !accessCode || !email) {
    return { success: false, error: "Missing order or contact details." };
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_method, payment_status")
    .eq("order_number", orderNumber)
    .eq("access_code", accessCode)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "We couldn't find that order." };
  }

  if (order.payment_method !== "card") {
    return { success: false, error: "This order isn't set up for card payment." };
  }

  if (order.payment_status === "confirmed") {
    return { success: false, error: "This order has already been paid for." };
  }

  // Paystack requires a unique reference per attempt — a customer retrying
  // a failed payment gets a fresh reference rather than reusing a dead one.
  const reference = `${order.order_number}-${Date.now()}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let result;
  try {
    result = await initializeTransaction({
      email,
      amountNaira: order.total,
      reference,
      callbackUrl: `${siteUrl}/payment/callback`,
      metadata: { order_number: order.order_number, access_code: accessCode },
    });
  } catch {
    return { success: false, error: "Could not reach the payment provider. Please try again." };
  }

  if (!result.status || !result.data) {
    return { success: false, error: result.message || "Could not start payment." };
  }

  // Record this attempt's reference on the payment row so verification
  // (callback or webhook) can find its way back to this order.
  await supabase
    .from("payments")
    .update({ reference, status: "pending" })
    .eq("order_id", order.id)
    .eq("method", "card");

  return { success: true, authorizationUrl: result.data.authorization_url };
}

export interface VerifyPaymentResult {
  success: boolean;
  orderNumber?: string;
  accessCode?: string;
  paymentStatus?: "confirmed" | "failed" | "pending";
  error?: string;
}

/**
 * Verifies a transaction reference against Paystack's API and records the
 * outcome. Idempotent — safe to call more than once for the same
 * reference (e.g. both the redirect callback and the webhook firing for
 * the same payment), and never marks a payment confirmed based on
 * anything the browser or a request body claims — only on what Paystack's
 * own /verify endpoint returns.
 */
export async function verifyAndRecordPayment(reference: string): Promise<VerifyPaymentResult> {
  if (!reference) return { success: false, error: "Missing payment reference." };

  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, order_id, amount, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) {
    return { success: false, error: "We couldn't find a payment matching that reference." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, access_code, total, payment_status")
    .eq("id", payment.order_id)
    .single();

  if (!order) return { success: false, error: "We couldn't find the matching order." };

  // Already confirmed — return success without re-verifying or re-writing.
  if (order.payment_status === "confirmed") {
    return {
      success: true,
      orderNumber: order.order_number,
      accessCode: order.access_code,
      paymentStatus: "confirmed",
    };
  }

  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch {
    return { success: false, error: "Could not verify payment with the payment provider." };
  }

  if (!verification.status || !verification.data) {
    return { success: false, error: verification.message || "Verification failed." };
  }

  const { status, amount, paid_at, gateway_response, metadata } = verification.data;
  const expectedAmountKobo = Math.round(order.total * 100);
  const amountMatches = amount === expectedAmountKobo;

  if (status === "success" && amountMatches) {
    await supabase
      .from("payments")
      .update({
        status: "confirmed",
        paid_at: paid_at ?? new Date().toISOString(),
        raw_response: { status, amount, gateway_response, metadata },
      })
      .eq("id", payment.id);

    await supabase
      .from("orders")
      .update({ payment_status: "confirmed", order_status: "payment_confirmed" })
      .eq("id", order.id);

    return {
      success: true,
      orderNumber: order.order_number,
      accessCode: order.access_code,
      paymentStatus: "confirmed",
    };
  }

  if (status === "success" && !amountMatches) {
    // Paid, but not the right amount — flag for manual review rather than
    // silently confirming or silently rejecting.
    await supabase
      .from("payments")
      .update({
        status: "failed",
        raw_response: { status, amount, gateway_response, metadata, note: "amount_mismatch" },
      })
      .eq("id", payment.id);

    return {
      success: true,
      orderNumber: order.order_number,
      accessCode: order.access_code,
      paymentStatus: "failed",
      error: "The amount paid didn't match the order total. Please contact us on WhatsApp.",
    };
  }

  // failed / abandoned / anything else
  await supabase
    .from("payments")
    .update({
      status: "failed",
      raw_response: { status, amount, gateway_response, metadata },
    })
    .eq("id", payment.id);

  return {
    success: true,
    orderNumber: order.order_number,
    accessCode: order.access_code,
    paymentStatus: "failed",
  };
}
