"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderInputSchema, type CreateOrderInput } from "@/lib/validation/checkout";

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  accessCode?: string;
  error?: string;
  insufficientProductIds?: string[];
}

/**
 * Trusted, server-only order creation.
 *
 * - Prices and stock are re-read from the database — the client's cart
 *   totals are never trusted.
 * - Stock is reserved atomically via the `reserve_stock` Postgres
 *   function so concurrent checkouts can't oversell.
 * - Card payments are recorded as `pending` here; the actual Paystack
 *   initialize/verify flow is wired in Phase 3 on top of this same
 *   order record. Bank transfers are recorded as `awaiting_verification`
 *   and the customer uploads a screenshot afterwards (Phase 3 UI).
 * - Size is customer-selected (S/M/L/etc.) and is not used to validate
 *   stock or price — it is carried through purely so the order record
 *   shows which size to package.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = createOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid order details." };
  }

  const { customer, items } = parsed.data;
  const supabase = createAdminClient();

  // 1. Re-read authoritative product data — never trust client-supplied prices.
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, slug, price, stock_quantity, is_active")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    return { success: false, error: "One or more items in your cart are no longer available." };
  }

  const unavailable = products.filter((p) => !p.is_active);
  if (unavailable.length > 0) {
    return {
      success: false,
      error: "Some items in your cart are no longer available. Please review your cart.",
      insufficientProductIds: unavailable.map((p) => p.id),
    };
  }

  // 2. Atomically reserve stock (locks rows, fails clean if insufficient).
  const { data: reserveResult, error: reserveError } = await supabase.rpc("reserve_stock", {
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
  });

  if (reserveError) {
    return { success: false, error: "We couldn't process your order. Please try again." };
  }

  const reserve = reserveResult as { success: boolean; insufficient?: string[] };
  if (!reserve.success) {
    return {
      success: false,
      error: "Some items no longer have enough stock. Please update the quantities in your cart.",
      insufficientProductIds: reserve.insufficient ?? [],
    };
  }

  try {
    // 3. Compute authoritative totals.
    const { data: settings } = await supabase
      .from("store_settings")
      .select("delivery_fee")
      .eq("id", 1)
      .maybeSingle();

    const deliveryFee = settings?.delivery_fee ?? 0;

    const orderItemsPayload = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        size: item.size ?? null,
        unit_price: product.price,
        quantity: item.quantity,
        line_total: product.price * item.quantity,
      };
    });

    const subtotal = orderItemsPayload.reduce((sum, i) => sum + i.line_total, 0);
    const total = subtotal + deliveryFee;

    // 4. Find or create the guest customer record by phone number.
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", customer.phone)
      .maybeSingle();

    let customerId = existingCustomer?.id as string | undefined;

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          full_name: customer.full_name,
          phone: customer.phone,
          whatsapp_number: customer.whatsapp_number || customer.phone,
          email: customer.email || null,
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) throw new Error("Could not create customer record.");
      customerId = newCustomer.id;
    }

    // 5. Generate the order number and create the order.
    const { data: orderNumberResult, error: orderNumberError } = await supabase.rpc(
      "generate_order_number"
    );
    if (orderNumberError || !orderNumberResult) throw new Error("Could not generate order number.");

    const paymentStatus = customer.payment_method === "bank_transfer" ? "awaiting_verification" : "pending";
    const orderStatus = customer.payment_method === "bank_transfer" ? "payment_verification" : "payment_pending";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumberResult,
        customer_id: customerId,
        full_name: customer.full_name,
        phone: customer.phone,
        whatsapp_number: customer.whatsapp_number || customer.phone,
        email: customer.email || null,
        delivery_address: customer.delivery_address,
        city: customer.city,
        state: customer.state,
        delivery_instructions: customer.delivery_instructions || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: customer.payment_method,
        payment_status: paymentStatus,
        order_status: orderStatus,
      })
      .select("order_number, access_code")
      .single();

    if (orderError || !order) throw new Error("Could not create order.");

    // 6. Fetch the order's internal id (the previous select only returned
    // order_number/access_code) and insert the order line items.
    const { data: orderRow, error: orderRowError } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumberResult)
      .single();

    if (orderRowError || !orderRow) throw new Error("Could not locate created order.");

    const { error: orderItemsInsertError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload.map((item) => ({ ...item, order_id: orderRow.id })));

    if (orderItemsInsertError) throw new Error("Could not save order items.");

    // 7. Create the payment record.
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderRow.id,
      method: customer.payment_method,
      status: paymentStatus,
      amount: total,
      provider: customer.payment_method === "card" ? "paystack" : null,
    });
    if (paymentError) throw new Error("Could not save payment record.");

    return {
      success: true,
      orderNumber: order.order_number,
      accessCode: order.access_code,
    };
  } catch (err) {
    // Compensating action: restore the stock we reserved, since the rest
    // of order creation didn't complete. Not a true DB transaction, but
    // prevents stock from being silently lost on a partial failure.
    await supabase.rpc("restore_stock", {
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    });

    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
