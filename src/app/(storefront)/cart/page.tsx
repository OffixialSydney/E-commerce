import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl text-navy">Your Cart</h1>
      <CartView deliveryFee={settings.delivery_fee} />
    </main>
  );
}
