import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Settings</h1>
      <p className="mt-1 text-sm text-navy/60">
        Changes here apply across the storefront immediately — no code
        changes needed.
      </p>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
