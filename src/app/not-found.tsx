import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl text-navy/20">404</p>
      <h1 className="mt-4 font-display text-2xl text-navy">Page not found</h1>
      <p className="mt-2 max-w-sm text-navy/60">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </main>
  );
}
