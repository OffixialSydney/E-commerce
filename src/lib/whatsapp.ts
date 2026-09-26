interface WhatsAppMessageParts {
  productName?: string;
  quantity?: number;
  price?: number;
  orderNumber?: string;
  note?: string;
}

/**
 * Builds a wa.me link with a pre-filled message. Never exposes any
 * credentials — the WhatsApp number itself is public contact info,
 * configured via store_settings and read server-side.
 */
export function buildWhatsAppLink(
  whatsappNumber: string,
  parts: WhatsAppMessageParts = {}
): string {
  const lines: string[] = [];

  if (parts.note) {
    lines.push(parts.note);
  } else {
    lines.push("Hi Sid Bespoke, I'd like to ask about:");
  }

  if (parts.productName) lines.push(`Product: ${parts.productName}`);
  if (parts.quantity) lines.push(`Quantity: ${parts.quantity}`);
  if (parts.price) lines.push(`Price: ₦${parts.price.toLocaleString("en-NG")}`);
  if (parts.orderNumber) lines.push(`Order number: ${parts.orderNumber}`);

  const text = encodeURIComponent(lines.join("\n"));
  let cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");

  // Normalize Nigerian local format (e.g. 0803xxxxxxx) to international
  // format wa.me requires (234803xxxxxxx) — no leading zero, no plus.
  if (cleanNumber.startsWith("0")) {
    cleanNumber = "234" + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith("234")) {
    cleanNumber = "234" + cleanNumber;
  }

  return `https://wa.me/${cleanNumber}?text=${text}`;
}