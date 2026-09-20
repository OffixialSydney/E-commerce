"use client";

import { useEffect } from "react";

export default function AdminError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-xl text-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-navy/60">
        This screen couldn&apos;t load. Try again, or refresh the page.
      </p>
      <button onClick={reset} className="btn-primary mt-5">
        Try Again
      </button>
    </div>
  );
}
