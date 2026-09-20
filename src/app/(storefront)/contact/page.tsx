import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { ContactForm } from "@/components/contact/contact-form";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-navy">Contact Us</h1>
      <p className="mt-2 text-navy/60">
        Send us a message and we&apos;ll get back to you, or reach us
        directly on WhatsApp.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <div className="mt-6 text-center">
        <a
          href={buildWhatsAppLink(settings.whatsapp_number)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          Chat on WhatsApp instead
        </a>
      </div>
    </main>
  );
}
