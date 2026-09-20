import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAndRecordPayment } from "@/lib/actions/paystack";

/**
 * Paystack calls this URL server-to-server whenever a transaction event
 * occurs. This is the reliable source of truth for payment confirmation —
 * the redirect callback page (src/app/payment/callback) covers the common
 * case of the customer's browser returning, but a webhook still confirms
 * the order even if they close the tab before that redirect completes.
 *
 * Configure this URL in the Paystack dashboard under
 * Settings → API Keys & Webhooks → Webhook URL:
 *   https://your-domain.com/api/webhooks/paystack
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const expectedSignature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  if (!signature || signature !== expectedSignature) {
    // Never trust a webhook call that doesn't carry a valid signature —
    // this is the only thing standing between this endpoint and anyone
    // on the internet claiming a payment succeeded.
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    await verifyAndRecordPayment(event.data.reference);
  }

  // Always 200 so Paystack doesn't endlessly retry events we've already
  // handled or intentionally ignored (e.g. non-charge events).
  return NextResponse.json({ received: true });
}
