"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBankTransferPayment, rejectBankTransferPayment } from "@/lib/actions/admin/orders";

export function PaymentVerificationActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    await confirmBankTransferPayment(orderId);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleReject() {
    if (!confirm("Reject this payment screenshot? The customer will be asked to re-upload.")) return;
    setIsSubmitting(true);
    await rejectBankTransferPayment(orderId);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="btn-primary flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60"
      >
        Confirm Payment
      </button>
      <button
        onClick={handleReject}
        disabled={isSubmitting}
        className="flex-1 rounded-xl border border-red-200 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        Reject Payment
      </button>
    </div>
  );
}
