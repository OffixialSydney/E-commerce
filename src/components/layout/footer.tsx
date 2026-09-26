import Link from "next/link";
import type { StoreSettings } from "@/types/database";
import { NewsletterSignup } from "@/components/newsletter-signup";

export function Footer({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="border-t border-navy/10 bg-navy text-white/80">
      <div className="mx-auto max-w-7xl border-b border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg text-white">Be first to know</p>
            <p className="mt-1 text-sm text-white/60">
              New drops and promotions, straight to your inbox.
            </p>
          </div>
          <NewsletterSignup />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-xl text-white">Sid Bespoke</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
            Style made personal — carefully selected clothing, shoes, bags and
            accessories, delivered across Nigeria.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-white">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link href="/shop" className="hover:text-gold-light">All products</Link></li>
            <li><Link href="/shop?filter=new" className="hover:text-gold-light">New arrivals</Link></li>
            <li><Link href="/shop?filter=best" className="hover:text-gold-light">Best sellers</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-white">Support</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link href="/track-order" className="hover:text-gold-light">Track your order</Link></li>
            <li><Link href="/contact" className="hover:text-gold-light">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-white">Get in touch</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            {settings.contact_phone && <li>{settings.contact_phone}</li>}
            {settings.contact_email && <li>{settings.contact_email}</li>}
            {settings.whatsapp_number && <li>WhatsApp: +{settings.whatsapp_number}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/40 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Sid Bespoke. All rights reserved.
      </div>
    </footer>
  );
}