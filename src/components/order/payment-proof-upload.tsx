"use client";

import { useState } from "react";
import { uploadPaymentProof } from "@/lib/actions/payment-proof";

export function PaymentProofUpload({
  orderNumber,
  accessCode,
}: {
  orderNumber: string;
  accessCode: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a screenshot to upload.");
      return;
    }

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadPaymentProof(orderNumber, accessCode, formData);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Upload failed. Please try again.");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Screenshot received — we&apos;ll confirm your payment shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-4">
      <p className="text-sm font-medium text-navy">Upload your payment screenshot</p>
      <p className="mt-1 text-xs text-navy/60">JPG, PNG or WEBP, up to 5MB.</p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm text-navy/70 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-light"
      />

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === "uploading" || !file}
        className="btn-primary mt-3 w-full disabled:opacity-60"
      >
        {status === "uploading" ? "Uploading…" : "Upload Screenshot"}
      </button>
    </form>
  );
}
