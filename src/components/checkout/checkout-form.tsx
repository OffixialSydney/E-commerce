"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrder } from "@/lib/actions/orders";
import { initializePaystackPayment } from "@/lib/actions/paystack";
import { formatNaira } from "@/lib/utils/currency";
import type { StoreSettings } from "@/types/database";

type FormState = {
  full_name: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  delivery_address: string;
  city: string;
  state: string;
  delivery_instructions: string;
  payment_method: "card" | "bank_transfer";
};

const initialState: FormState = {
  full_name: "",
  phone: "",
  whatsapp_number: "",
  email: "",
  delivery_address: "",
  city: "",
  state: "",
  delivery_instructions: "",
  payment_method: "bank_transfer",
};

export function CheckoutForm({ settings }: { settings: StoreSettings }) {
  const { items, subtotal, clearCart, isLoaded } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set once an order has been created for a card payment, so a retry
  // after a failed Paystack initialize doesn't create a second order.
  const [pendingOrder, setPendingOrder] = useState<{ orderNumber: string; accessCode: string } | null>(
    null
  );

  const total = subtotal + settings.delivery_fee;

  if (isLoaded && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 py-20 text-center">
        <p className="text-lg font-medium text-navy">Your cart is empty</p>
        <p className="mt-2 text-sm text-navy/60">Add something to your cart before checking out.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "payment_method" && value !== "card") {
      setPendingOrder(null);
    }
  }

  async function goToPaystack(orderNumber: string, accessCode: string, email: string) {
    const payment = await initializePaystackPayment(orderNumber, accessCode, email);

    if (!payment.success || !payment.authorizationUrl) {
      setPendingOrder({ orderNumber, accessCode });
      setSubmitError(
        payment.error ??
          "Your order was created but we couldn't start the card payment. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    window.location.href = payment.authorizationUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (form.payment_method === "card" && !form.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required for card payments" }));
      return;
    }

    setIsSubmitting(true);

    // A previous attempt already created the order — just retry starting
    // the Paystack payment rather than creating a duplicate order.
    if (pendingOrder && form.payment_method === "card") {
      await goToPaystack(pendingOrder.orderNumber, pendingOrder.accessCode, form.email);
      return;
    }

    try {
      const response = await createOrder({
        customer: result.data,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });

      if (!response.success || !response.orderNumber || !response.accessCode) {
        setSubmitError(response.error ?? "Something went wrong placing your order.");
        setIsSubmitting(false);
        return;
      }

      clearCart();

      if (form.payment_method === "card") {
        await goToPaystack(response.orderNumber, response.accessCode, form.email);
        return;
      }

      router.push(`/order-confirmation/${response.orderNumber}?code=${response.accessCode}`);
    } catch {
      setSubmitError("Something went wrong placing your order. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section>
          <h2 className="font-display text-lg text-navy">Customer Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.full_name}>
              <input
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="input"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="input"
                placeholder="080X XXX XXXX"
                type="tel"
              />
            </Field>
            <Field label="WhatsApp number (optional)" error={errors.whatsapp_number}>
              <input
                value={form.whatsapp_number}
                onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                className="input"
                placeholder="Same as phone if left blank"
                type="tel"
              />
            </Field>
            <Field label={form.payment_method === "card" ? "Email" : "Email (optional)"} error={errors.email}>
              <input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="input"
                placeholder="you@example.com"
                type="email"
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg text-navy">Delivery Address</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Delivery address" error={errors.delivery_address}>
              <input
                value={form.delivery_address}
                onChange={(e) => handleChange("delivery_address", e.target.value)}
                className="input"
                placeholder="Street address"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" error={errors.city}>
                <input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="State" error={errors.state}>
                <input
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Additional delivery instructions (optional)">
              <textarea
                value={form.delivery_instructions}
                onChange={(e) => handleChange("delivery_instructions", e.target.value)}
                className="input min-h-[80px] resize-none"
                placeholder="e.g. Gate code, landmark, preferred time"
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg text-navy">Payment Method</h2>
          <div className="mt-4 space-y-3">
            <PaymentOption
              label="Bank Transfer"
              description="Transfer to our account and upload your receipt"
              value="bank_transfer"
              selected={form.payment_method === "bank_transfer"}
              onSelect={() => handleChange("payment_method", "bank_transfer")}
            />
            <PaymentOption
              label="Card Payment"
              description="Pay securely by card via Paystack"
              value="card"
              selected={form.payment_method === "card"}
              onSelect={() => handleChange("payment_method", "card")}
            />
          </div>
        </section>
      </div>

      <div className="h-fit space-y-4 rounded-2xl border border-navy/10 p-6">
        <h2 className="font-display text-lg text-navy">Order Summary</h2>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.product_id} className="flex justify-between text-navy/70">
              <span className="truncate pr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">{formatNaira(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-navy/10 pt-3 text-sm">
          <div className="flex justify-between text-navy/70">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-navy/70">
            <span>Delivery fee</span>
            <span>
              {settings.delivery_fee === 0 ? "FREE DELIVERY" : formatNaira(settings.delivery_fee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-navy/10 pt-2 text-base font-semibold text-navy">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
        </div>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting
            ? "Placing your order…"
            : pendingOrder
            ? "Try Payment Again"
            : "Place Order"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-navy/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function PaymentOption({
  label,
  description,
  value,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-gold bg-gold/5" : "border-navy/15 hover:border-navy/30"
      }`}
    >
      <span
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
          selected ? "border-gold bg-gold" : "border-navy/30"
        }`}
      />
      <span>
        <span className="block text-sm font-medium text-navy">{label}</span>
        <span className="block text-xs text-navy/60">{description}</span>
      </span>
      <input type="radio" className="sr-only" checked={selected} onChange={onSelect} value={value} />
    </button>
  );
}
