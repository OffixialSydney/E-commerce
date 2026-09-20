import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPendingBankTransferVerifications } from "@/lib/data/admin-payments";
import { formatNaira } from "@/lib/utils/currency";
import { PaymentVerificationActions } from "@/components/admin/payment-verification-actions";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const pending = await listPendingBankTransferVerifications();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Payments</h1>
      <p className="mt-1 text-sm text-navy/60">
        {pending.length} bank transfer {pending.length === 1 ? "payment" : "payments"} awaiting verification
      </p>

      {pending.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy/15 py-16 text-center text-navy/50">
          Nothing to verify right now.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pending.map(({ order, proof, signedUrl }) => (
            <div key={order.id} className="rounded-2xl border border-navy/10 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-navy/50">{order.full_name}</p>
                </div>
                <p className="text-sm font-semibold text-navy">{formatNaira(order.total)}</p>
              </div>

              {signedUrl ? (
                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-navy/5">
                  <Image src={signedUrl} alt="Payment screenshot" fill sizes="300px" className="object-contain" />
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-navy/5 px-3 py-6 text-center text-xs text-navy/50">
                  No screenshot uploaded yet
                </p>
              )}

              {proof && (
                <p className="mt-2 text-xs text-navy/40">
                  Uploaded {new Date(proof.uploaded_at).toLocaleString("en-NG")}
                </p>
              )}

              <div className="mt-4">
                <PaymentVerificationActions orderId={order.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
