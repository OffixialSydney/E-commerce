"use client";

import { useState } from "react";
import { lookupOrderStatus, type OrderWithItems } from "@/lib/actions/order-lookup";
import { formatNaira } from "@/lib/utils/currency";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status-labels";

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderWithItems | null | "not_found">(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    const order = await lookupOrderStatus(orderNumber, phone);
    setResult(order ?? "not_found");
    setIsLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. SID-20260919-4821)"
          className="input"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number used at checkout"
          className="input"
          type="tel"
          required
        />
        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-60">
          {isLoading ? "Searching…" : "Track Order"}
        </button>
      </form>

      {result === "not_found" && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t find an order matching that order number and phone
          number. Please double-check and try again.
        </p>
      )}

      {result && result !== "not_found" && (
        <div className="mt-6 rounded-2xl border border-navy/10 p-6">
          <div className="flex items-center justify-between border-b border-navy/10 pb-4">
            <div>
              <p className="text-xs text-navy/50">Order number</p>
              <p className="font-medium text-navy">{result.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-navy/50">Order status</p>
              <p className="font-medium text-navy">{ORDER_STATUS_LABELS[result.order_status]}</p>
            </div>
          </div>

          <div className="space-y-2 py-4 text-sm">
            {result.items.map((item) => (
              <div key={item.id} className="flex justify-between text-navy/70">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatNaira(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-navy/10 pt-3 text-sm text-navy/70">
            <span>Payment status</span>
            <span>{PAYMENT_STATUS_LABELS[result.payment_status]}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold text-navy">
            <span>Total</span>
            <span>{formatNaira(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
