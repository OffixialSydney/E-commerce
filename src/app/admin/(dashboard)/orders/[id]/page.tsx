import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrderDetailAdmin } from "@/lib/data/admin-orders";
import { formatNaira } from "@/lib/utils/currency";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-status-labels";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getStoreSettings } from "@/lib/data/settings";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { PaymentVerificationActions } from "@/components/admin/payment-verification-actions";

export const metadata: Metadata = { title: "Order Detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderDetailAdmin(id), getStoreSettings()]);

  if (!order) notFound();

  const latestProof = order.proofs[0];
  const needsVerification =
    order.payment_method === "bank_transfer" && order.payment_status !== "confirmed" && latestProof;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-navy/50 hover:text-navy">
        ← Back to Orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-navy">{order.order_number}</h1>
        <OrderStatusSelect orderId={order.id} currentStatus={order.order_status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="text-sm font-medium text-navy">Items</p>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-navy/70">
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>{formatNaira(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-navy/10 pt-3 text-sm">
              <div className="flex justify-between text-navy/70">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-navy/70">
                <span>Delivery fee</span>
                <span>{order.delivery_fee === 0 ? "FREE" : formatNaira(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-navy">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>
            </div>
          </div>

          {needsVerification && (
            <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6">
              <p className="text-sm font-medium text-navy">Payment screenshot</p>
              {order.proofSignedUrls[latestProof.id] ? (
                <div className="relative mt-3 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl bg-navy/5">
                  <Image
                    src={order.proofSignedUrls[latestProof.id]}
                    alt="Payment screenshot"
                    fill
                    sizes="400px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm text-navy/60">Could not load screenshot.</p>
              )}
              <p className="mt-2 text-xs text-navy/50">
                Uploaded {new Date(latestProof.uploaded_at).toLocaleString("en-NG")}
              </p>
              <div className="mt-4">
                <PaymentVerificationActions orderId={order.id} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm">
            <p className="font-medium text-navy">Customer</p>
            <p className="mt-2 text-navy/70">{order.full_name}</p>
            <p className="text-navy/70">{order.phone}</p>
            {order.email && <p className="text-navy/70">{order.email}</p>}
            <a
              href={buildWhatsAppLink(order.whatsapp_number || order.phone, {
                orderNumber: order.order_number,
                note: `Hi ${order.full_name}, this is Sid Bespoke regarding your order ${order.order_number}.`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-3 w-full"
            >
              Contact on WhatsApp
            </a>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm">
            <p className="font-medium text-navy">Delivery</p>
            <p className="mt-2 text-navy/70">{order.delivery_address}</p>
            <p className="text-navy/70">
              {order.city}, {order.state}
            </p>
            {order.delivery_instructions && (
              <p className="mt-2 text-navy/60">{order.delivery_instructions}</p>
            )}
            <p className="mt-2 text-xs text-navy/50">{settings.delivery_timeframe}</p>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm">
            <p className="font-medium text-navy">Payment</p>
            <p className="mt-2 text-navy/70">
              Method: {order.payment_method === "card" ? "Card" : "Bank Transfer"}
            </p>
            <p className="text-navy/70">Status: {PAYMENT_STATUS_LABELS[order.payment_status]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
