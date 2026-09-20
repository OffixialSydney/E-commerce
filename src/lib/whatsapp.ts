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
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");

  return `https://wa.me/${cleanNumber}?text=${text}`;
}
