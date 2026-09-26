"use client";

import { useState } from "react";
import { subscribeEmail } from "@/lib/actions/subscribe";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const result = await subscribeEmail(email);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Something went wrong.");
      return;
    }

    setStatus("success");
    setEmail("");
  }

  if (status === "success") {
    return (
      <p className="text-sm font-medium text-gold-light">
        Thanks — you're on the list for new drops and promotions.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:max-w-xs"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {status === "submitting" ? "Joining…" : "Subscribe"}
      </button>
      {status === "error" && <p className="text-xs text-red-400 sm:self-center">{error}</p>}
    </form>
  );
}