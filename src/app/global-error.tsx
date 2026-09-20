"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-sans">
        <h1 className="text-2xl font-semibold text-[#0B1B33]">Something went wrong</h1>
        <p className="mt-2 text-[#0B1B33]/60">
          Please refresh the page. If this keeps happening, contact us on
          WhatsApp.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-[#0B1B33] px-6 py-3 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
