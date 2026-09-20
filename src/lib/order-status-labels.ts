import type { OrderStatus, PaymentStatus } from "@/types/database";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  payment_pending: "Payment Pending",
  payment_verification: "Payment Verification",
  payment_confirmed: "Payment Confirmed",
  processing: "Processing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  awaiting_verification: "Awaiting Verification",
  confirmed: "Confirmed",
  failed: "Failed",
  rejected: "Rejected",
};
