"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Category } from "@/types/database";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];

export function Navbar({
  categories,
  whatsappNumber,
}: {
  categories: Category[];
  whatsappNumber: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-wide text-navy sm:text-3xl"
        >
          Sid Bespoke
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-gold-dark ${
                pathname === link.href ? "text-navy font-medium" : "text-navy/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="text-sm text-navy/70 transition-colors hover:text-gold-dark">
              Categories
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="rounded-xl border border-navy/10 bg-white p-2 shadow-card-hover">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-navy/80 hover:bg-navy/5"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            aria-label="Search products"
            className="hidden rounded-full p-2 text-navy/70 hover:bg-navy/5 sm:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Link>

          <a
            href={buildWhatsAppLink(whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-[#25D366]/10 p-2 text-[#128C7E] hover:bg-[#25D366]/20 sm:inline-flex"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.87 9.87 0 0 0 4.62 1.18h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24Zm4.53-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14 0-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.24-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.57.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.19.2-.58.2-1.08.14-1.19-.06-.1-.22-.16-.47-.28Z"/>
            </svg>
          </a>

          <Link href="/cart" className="relative rounded-full p-2 text-navy hover:bg-navy/5" aria-label="View cart">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-navy">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="rounded-full p-2 text-navy hover:bg-navy/5 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-navy/10 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base text-navy hover:bg-navy/5"
              >
                {link.label}
              </Link>
            ))}
            <p className="mt-3 border-t border-navy/10 px-3 pt-3 text-sm font-medium text-navy/50">
              Shop by category
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base text-navy/80 hover:bg-navy/5"
              >
                {cat.name}
              </Link>
            ))}
            <a
              href={buildWhatsAppLink(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-3"
            >
              Chat on WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}