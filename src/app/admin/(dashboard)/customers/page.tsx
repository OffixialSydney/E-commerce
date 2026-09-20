import type { Metadata } from "next";
import { listCustomersAdmin } from "@/lib/data/admin-customers";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await listCustomersAdmin(q);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Customers</h1>
      <p className="mt-1 text-sm text-navy/60">{customers.length} total</p>

      <form className="mt-6 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone"
          className="input"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs text-navy/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{customer.full_name}</td>
                <td className="px-4 py-3 text-navy/70">{customer.phone}</td>
                <td className="px-4 py-3 text-navy/60">{customer.email ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-navy/50">
                  {new Date(customer.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={buildWhatsAppLink(customer.whatsapp_number || customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#128C7E] hover:underline"
                  >
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-navy/50">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
