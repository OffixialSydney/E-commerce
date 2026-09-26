"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { lookupOrderStatus, type OrderWithItems } from "@/lib/actions/order-lookup";
import { formatNaira } from "@/lib/utils/currency";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status-labels";
import type { OrderStatus } from "@/types/database";

// The main forward-moving stages a customer cares about. "cancelled" is
// handled separately below since it isn't a step on this path.
const PROGRESS_STEPS: OrderStatus[] = [
  "payment_pending",
  "payment_confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
];

function getStepIndex(status: OrderStatus): number {
  // Treat any of the "still getting paid for" statuses as step 0, and
  // anything on/after "ready" as having reached "processing" visually,
  // so the tracker doesn't show empty steps for statuses not in the
  // main list above.
  if (status === "pending" || status === "payment_pending" || status === "payment_verification") {
    return 0;
  }
  if (status === "ready") return 2;
  const index = PROGRESS_STEPS.indexOf(status);
  return index === -1 ? 0 : index;
}

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

          {result.order_status === "cancelled" ? (
            <p className="mt-4 rounded-lg bg-navy/5 px-4 py-3 text-sm text-navy/70">
              This order was cancelled.
            </p>
          ) : (
            <OrderProgressTracker currentStatus={result.order_status} />
          )}

          <div className="space-y-2 border-t border-navy/10 py-4 text-sm">
            {result.items.map((item) => (
              <div key={item.id} className="flex justify-between text-navy/70">
                <span>
                  {item.product_name}
                  {item.size && (
                    <span className="ml-1.5 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
                      Size {item.size}
                    </span>
                  )}
                  {" × "}
                  {item.quantity}
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

const STEP_LABELS = ["Order Placed", "Payment Confirmed", "Processing", "Out for Delivery", "Delivered"];

function OrderProgressTracker({ currentStatus }: { currentStatus: OrderStatus }) {
  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="border-b border-navy/10 py-6">
      <div className="flex items-start">
        {STEP_LABELS.map((label, i) => {
          const isComplete = i <= activeIndex;
          const isLast = i === STEP_LABELS.length - 1;

          return (
            <div key={label} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isComplete ? "bg-gold text-navy" : "bg-navy/10 text-navy/40"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {!isLast && (
                  <div
                    className={`mx-1 h-0.5 flex-1 ${i < activeIndex ? "bg-gold" : "bg-navy/10"}`}
                  />
                )}
              </div>
              <p
                className={`mt-2 max-w-[70px] text-center text-[11px] leading-tight ${
                  isComplete ? "font-medium text-navy" : "text-navy/40"
                }`}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}