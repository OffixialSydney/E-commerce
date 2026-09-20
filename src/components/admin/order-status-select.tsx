"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/admin/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status-labels";
import type { OrderStatus } from "@/types/database";

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChange(newStatus: OrderStatus) {
    if (newStatus === "cancelled" && !confirm("Cancel this order? Reserved stock will be restored.")) {
      return;
    }
    setStatus(newStatus);
    setIsSubmitting(true);
    await updateOrderStatus(orderId, newStatus);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      disabled={isSubmitting}
      className="input w-auto"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {ORDER_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
