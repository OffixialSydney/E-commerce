"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ContactForm() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.message.trim()) return;

    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      message: form.message,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("sent");
    setForm({ full_name: "", phone: "", email: "", message: "" });
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-navy/10 bg-navy/[0.03] p-6 text-center">
        <p className="font-medium text-navy">Message sent</p>
        <p className="mt-1 text-sm text-navy/60">
          Thanks for reaching out — we&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          placeholder="Full name"
          className="input"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Phone (optional)"
          className="input"
          type="tel"
        />
      </div>
      <input
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="Email (optional)"
        className="input"
        type="email"
      />
      <textarea
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        placeholder="How can we help?"
        className="input min-h-[120px] resize-none"
        required
      />
      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Something went wrong sending your message. Please try again or
          reach us on WhatsApp instead.
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn-primary w-full disabled:opacity-60">
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
