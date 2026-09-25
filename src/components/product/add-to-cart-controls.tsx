"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ProductWithRelations } from "@/types/database";

export function AddToCartControls({
  product,
  whatsappNumber,
}: {
  product: ProductWithRelations;
  whatsappNumber: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  const inStock = product.stock_quantity > 0;
  const isLowStock = inStock && product.stock_quantity <= product.low_stock_threshold;
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];

  function handleAddToCart() {
    if (!inStock) return;
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_path: primaryImage?.storage_path ?? null,
      quantity,
      stock_quantity: product.stock_quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!inStock) return;
    handleAddToCart();
    router.push("/checkout");
  }

  if (!inStock) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full cursor-not-allowed rounded-xl bg-navy/10 px-6 py-3 text-sm font-medium text-navy/40"
        >
          Out of Stock
        </button>
        <a
          href={buildWhatsAppLink(whatsappNumber, {
            productName: product.name,
            price: product.price,
            note: `Hi, I'd like to ask when ${product.name} will be back in stock.`,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp w-full"
        >
          Ask about restock on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-navy/70">Quantity</span>
        <div className="flex items-center rounded-xl border border-navy/15">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 text-navy/60 hover:text-navy"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium text-navy">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
            className="p-2.5 text-navy/60 hover:text-navy"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span
          className={`text-xs ${
            isLowStock ? "font-medium text-red-600" : "text-navy/40"
          }`}
        >
          {isLowStock ? `Only ${product.stock_quantity} left` : `${product.stock_quantity} available`}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAddToCart} className="btn-secondary flex-1">
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        <button
          onClick={handleBuyNow}
          className="btn-primary flex-1 bg-gold text-navy hover:bg-gold-light"
        >
          Buy Now
        </button>
      </div>

      <a
        href={buildWhatsAppLink(whatsappNumber, {
          productName: product.name,
          quantity,
          price: product.price,
        })}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp w-full"
      >
        Ask about this product
      </a>
    </div>
  );
}
