import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentAdminProfile } from "@/lib/supabase/get-admin-profile";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Sid Bespoke Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentAdminProfile();

  // The middleware already ensures some Supabase Auth session exists for
  // any /admin/** route. This confirms that session actually belongs to
  // an admin (has a row in admin_profiles) — a session with no admin
  // profile gets sent back to login rather than seeing dashboard data.
  if (!profile) redirect("/admin/login");

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
