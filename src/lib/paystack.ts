import "server-only";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured. Add it to your environment variables."
    );
  }
  return key;
}

export interface InitializeTransactionParams {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Initializes a Paystack transaction (Standard/redirect flow). Returns a
 * hosted authorization_url the browser is redirected to. Amounts must be
 * sent to Paystack in kobo (₦1 = 100 kobo).
 */
export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  return response.json();
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data?: {
    status: "success" | "failed" | "abandoned" | string;
    reference: string;
    amount: number; // kobo
    paid_at: string | null;
    gateway_response: string;
    metadata: Record<string, unknown> | null;
  };
}

/**
 * Verifies a transaction directly against Paystack's servers — the only
 * source of truth for whether a payment actually succeeded. Never infer
 * success from the browser being redirected back; always call this.
 */
export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: "no-store",
    }
  );

  return response.json();
}
