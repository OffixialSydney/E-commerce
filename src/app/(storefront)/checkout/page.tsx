import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl text-navy">Checkout</h1>
      <CheckoutForm settings={settings} />
    </main>
  );
}
