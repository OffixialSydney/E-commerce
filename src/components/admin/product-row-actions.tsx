"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleProductActive, deleteProduct } from "@/lib/actions/admin/products";

export function ProductRowActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    await toggleProductActive(productId, !isActive);
    setIsPending(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This can't be undone.")) return;
    setIsPending(true);
    await deleteProduct(productId);
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-lg border border-navy/15 px-2.5 py-1 text-xs text-navy/70 hover:bg-navy/5 disabled:opacity-50"
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
