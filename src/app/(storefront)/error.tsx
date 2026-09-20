"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl text-navy">Something went wrong</h1>
      <p className="mt-2 text-navy/60">
        We hit a snag loading this page. Please try again, or head back to
        the shop.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <Link href="/shop" className="btn-secondary">
          Back to Shop
        </Link>
      </div>
    </main>
  );
}
