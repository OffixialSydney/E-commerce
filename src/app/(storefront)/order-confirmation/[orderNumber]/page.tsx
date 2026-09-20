import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrderForConfirmation } from "@/lib/actions/order-lookup";
import { getStoreSettings } from "@/lib/data/settings";
import { formatNaira } from "@/lib/utils/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-status-labels";
import { PaymentProofUpload } from "@/components/order/payment-proof-upload";

export const metadata: Metadata = { title: "Order Received" };

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { orderNumber } = await params;
  const { code } = await searchParams;
  const [order, settings] = await Promise.all([
    getOrderForConfirmation(orderNumber, code ?? ""),
    getStoreSettings(),
  ]);

  if (!order) notFound();

  const isBankTransfer = order.payment_method === "bank_transfer";
  const latestProof = order.proofs[0];

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-12 w-12 text-gold-dark" />
        <h1 className="mt-4 font-display text-3xl text-navy">Order received!</h1>
        <p className="mt-2 text-navy/60">
          Your order has been received. We&apos;ll contact you with your
          delivery time shortly.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-navy/10 p-6">
        <div className="flex items-center justify-between border-b border-navy/10 pb-4">
          <div>
            <p className="text-xs text-navy/50">Order number</p>
            <p className="font-medium text-navy">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-navy/50">Payment status</p>
            <p className="font-medium text-navy">{PAYMENT_STATUS_LABELS[order.payment_status]}</p>
          </div>
        </div>

        <div className="space-y-2 py-4 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-navy/70">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatNaira(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-navy/10 pt-4 text-sm">
          <div className="flex justify-between text-navy/70">
            <span>Subtotal</span>
            <span>{formatNaira(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-navy/70">
            <span>Delivery fee</span>
            <span>{order.delivery_fee === 0 ? "FREE DELIVERY" : formatNaira(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-navy/10 pt-2 text-base font-semibold text-navy">
            <span>Total</span>
            <span>{formatNaira(order.total)}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-navy/[0.03] p-4 text-sm text-navy/70">
          <p className="font-medium text-navy">Delivering to</p>
          <p className="mt-1">
            {order.full_name} · {order.phone}
          </p>
          <p>
            {order.delivery_address}, {order.city}, {order.state}
          </p>
          <p className="mt-2 text-navy/60">{settings.delivery_timeframe}</p>
        </div>

        {isBankTransfer && (
          <div className="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
            <p className="font-medium text-navy">Complete your bank transfer</p>
            <p className="mt-1 text-navy/70">
              Transfer {formatNaira(order.total)} to the account below, then
              upload your payment screenshot so we can confirm it quickly.
            </p>
            <div className="mt-3 space-y-1 text-navy/80">
              {settings.bank_name && <p>Bank: {settings.bank_name}</p>}
              {settings.account_name && <p>Account name: {settings.account_name}</p>}
              {settings.account_number && <p>Account number: {settings.account_number}</p>}
            </div>
          </div>
        )}

        {isBankTransfer && order.payment_status === "confirmed" && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Payment confirmed — thank you!
          </div>
        )}

        {isBankTransfer && order.payment_status !== "confirmed" && latestProof?.decision === "rejected" && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Your last screenshot couldn&apos;t be verified. Please upload a
            clearer image, or reach out to us on WhatsApp.
          </p>
        )}

        {isBankTransfer && order.payment_status !== "confirmed" && (!latestProof || latestProof.decision === "rejected") && (
          <PaymentProofUpload orderNumber={order.order_number} accessCode={order.access_code} />
        )}

        {isBankTransfer &&
          order.payment_status !== "confirmed" &&
          latestProof &&
          latestProof.decision !== "rejected" && (
            <div className="mt-5 rounded-xl border border-navy/10 bg-navy/[0.03] p-4 text-sm text-navy/70">
              Screenshot received — we&apos;ll confirm your payment shortly.
            </div>
          )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn-secondary flex-1 text-center">
          Continue Shopping
        </Link>
        <a
          href={buildWhatsAppLink(settings.whatsapp_number, {
            orderNumber: order.order_number,
            note: isBankTransfer
              ? `Hi, I have a question about my bank transfer for order ${order.order_number}.`
              : `Hi, I'd like to ask about order ${order.order_number}.`,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp flex-1"
        >
          Contact Us on WhatsApp
        </a>
      </div>
    </main>
  );
}
