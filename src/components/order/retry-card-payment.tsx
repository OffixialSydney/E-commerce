"use client";

import { useState } from "react";
import { initializePaystackPayment } from "@/lib/actions/paystack";

export function RetryCardPayment({
  orderNumber,
  accessCode,
  defaultEmail,
}: {
  orderNumber: string;
  accessCode: string;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await initializePaystackPayment(orderNumber, accessCode, email);

    if (!result.success || !result.authorizationUrl) {
      setError(result.error ?? "Could not start payment. Please try again.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = result.authorizationUrl;
  }

  return (
    <form onSubmit={handleRetry} className="mt-6 space-y-3">
      <label className="block text-left">
        <span className="mb-1.5 block text-sm text-navy/70">Email for payment receipt</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
        {isSubmitting ? "Redirecting to payment…" : "Try Payment Again"}
      </button>
    </form>
  );
}
