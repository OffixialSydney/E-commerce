import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { verifyAndRecordPayment } from "@/lib/actions/paystack";
import { getOrderForConfirmation } from "@/lib/actions/order-lookup";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getStoreSettings } from "@/lib/data/settings";
import { RetryCardPayment } from "@/components/order/retry-card-payment";

export const metadata: Metadata = { title: "Confirming Payment" };

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  const ref = reference || trxref;

  const settings = await getStoreSettings();

  if (!ref) {
    return (
      <FailureView
        message="We couldn't find your payment reference."
        whatsappNumber={settings.whatsapp_number}
      />
    );
  }

  const result = await verifyAndRecordPayment(ref);

  if (!result.success) {
    return (
      <FailureView
        message={result.error ?? "We couldn't verify your payment."}
        whatsappNumber={settings.whatsapp_number}
      />
    );
  }

  if (result.paymentStatus === "confirmed" && result.orderNumber && result.accessCode) {
    redirect(`/order-confirmation/${result.orderNumber}?code=${result.accessCode}`);
  }

  // Payment failed, abandoned, or amount mismatch — let the customer retry
  // or reach out, without losing their order (stock was already reserved).
  const order =
    result.orderNumber && result.accessCode
      ? await getOrderForConfirmation(result.orderNumber, result.accessCode)
      : null;

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center sm:px-6 lg:px-8">
      <XCircle className="mx-auto h-12 w-12 text-red-500" />
      <h1 className="mt-4 font-display text-2xl text-navy">Payment not completed</h1>
      <p className="mt-2 text-navy/60">
        {result.error ?? "Your card payment wasn't successful. You can try again below."}
      </p>

      {order && result.orderNumber && result.accessCode && (
        <>
          <RetryCardPayment
            orderNumber={result.orderNumber}
            accessCode={result.accessCode}
            defaultEmail={order.email ?? ""}
          />
          <p className="mt-4 text-xs text-navy/50">Order number: {order.order_number}</p>
        </>
      )}

      <div className="mt-6">
        <a
          href={buildWhatsAppLink(settings.whatsapp_number, {
            orderNumber: order?.order_number,
            note: "Hi, I had trouble completing my card payment.",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          Get help on WhatsApp
        </a>
      </div>
    </main>
  );
}

function FailureView({
  message,
  whatsappNumber,
}: {
  message: string;
  whatsappNumber: string;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center sm:px-6 lg:px-8">
      <XCircle className="mx-auto h-12 w-12 text-red-500" />
      <h1 className="mt-4 font-display text-2xl text-navy">Payment not completed</h1>
      <p className="mt-2 text-navy/60">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/cart" className="btn-secondary">
          Back to Cart
        </Link>
        <a
          href={buildWhatsAppLink(whatsappNumber, {
            note: "Hi, I had trouble completing my card payment.",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          Get help on WhatsApp
        </a>
      </div>
    </main>
  );
}
