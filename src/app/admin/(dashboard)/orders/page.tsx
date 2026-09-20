import type { Metadata } from "next";
import Link from "next/link";
import { listOrdersAdmin } from "@/lib/data/admin-orders";
import { formatNaira } from "@/lib/utils/currency";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status-labels";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Orders" };

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orders = await listOrdersAdmin(status as OrderStatus | undefined);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Orders</h1>
      <p className="mt-1 text-sm text-navy/60">{orders.length} total</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !status ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          }`}
        >
          All
        </Link>
        {STATUS_OPTIONS.map((option) => (
          <Link
            key={option}
            href={`/admin/orders?status=${option}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === option ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            }`}
          >
            {ORDER_STATUS_LABELS[option]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs text-navy/50">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {order.full_name}
                  <br />
                  <span className="text-xs text-navy/40">{order.phone}</span>
                </td>
                <td className="px-4 py-3 text-navy/70">{formatNaira(order.total)}</td>
                <td className="px-4 py-3 text-navy/60">{PAYMENT_STATUS_LABELS[order.payment_status]}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy/70">
                    {ORDER_STATUS_LABELS[order.order_status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-navy/50">
                  {new Date(order.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy/50">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
