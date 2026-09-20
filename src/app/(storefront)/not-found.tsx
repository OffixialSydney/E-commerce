import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl text-navy/20">404</p>
      <h1 className="mt-4 font-display text-2xl text-navy">Page not found</h1>
      <p className="mt-2 max-w-sm text-navy/60">
        We couldn&apos;t find what you were looking for — it may have sold
        out or moved.
      </p>
      <Link href="/shop" className="btn-primary mt-6">
        Back to Shop
      </Link>
    </main>
  );
}
