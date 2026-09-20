import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/track-order/track-order-form";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackOrderPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-navy">Track Your Order</h1>
      <p className="mt-2 text-navy/60">
        Enter your order number and the phone number you used at checkout —
        no account needed.
      </p>
      <div className="mt-8">
        <TrackOrderForm />
      </div>
    </main>
  );
}
