"use client";

import { useState } from "react";
import { updateStoreSettings, type StoreSettingsFormValues } from "@/lib/actions/admin/settings";
import type { StoreSettings } from "@/types/database";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [values, setValues] = useState<StoreSettingsFormValues>({
    store_name: settings.store_name,
    whatsapp_number: settings.whatsapp_number,
    bank_name: settings.bank_name ?? "",
    account_name: settings.account_name ?? "",
    account_number: settings.account_number ?? "",
    delivery_fee: settings.delivery_fee,
    delivery_timeframe: settings.delivery_timeframe,
    contact_email: settings.contact_email ?? "",
    contact_phone: settings.contact_phone ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof StoreSettingsFormValues>(key: K, value: StoreSettingsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);

    const result = await updateStoreSettings(values);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Could not save settings.");
      return;
    }
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 rounded-2xl border border-navy/10 bg-white p-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-navy/70">Store name</span>
          <input
            value={values.store_name}
            onChange={(e) => update("store_name", e.target.value)}
            className="input"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-navy/70">WhatsApp number</span>
          <input
            value={values.whatsapp_number}
            onChange={(e) => update("whatsapp_number", e.target.value)}
            placeholder="2348012345678"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Contact phone (optional)</span>
          <input
            value={values.contact_phone}
            onChange={(e) => update("contact_phone", e.target.value)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Contact email (optional)</span>
          <input
            value={values.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            className="input"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl border border-navy/10 bg-white p-6 sm:grid-cols-2">
        <p className="text-sm font-medium text-navy sm:col-span-2">Bank transfer details</p>
        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Bank name</span>
          <input
            value={values.bank_name}
            onChange={(e) => update("bank_name", e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Account name</span>
          <input
            value={values.account_name}
            onChange={(e) => update("account_name", e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Account number</span>
          <input
            value={values.account_number}
            onChange={(e) => update("account_number", e.target.value)}
            className="input"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl border border-navy/10 bg-white p-6 sm:grid-cols-2">
        <p className="text-sm font-medium text-navy sm:col-span-2">Delivery</p>
        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Delivery fee (₦, 0 = free)</span>
          <input
            type="number"
            min={0}
            value={values.delivery_fee}
            onChange={(e) => update("delivery_fee", Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-navy/70">Delivery timeframe message</span>
          <input
            value={values.delivery_timeframe}
            onChange={(e) => update("delivery_timeframe", e.target.value)}
            className="input"
          />
        </label>
      </div>

      {status === "error" && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {status === "saved" && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Settings saved.</p>
      )}

      <button type="submit" disabled={status === "saving"} className="btn-primary disabled:opacity-60">
        {status === "saving" ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
