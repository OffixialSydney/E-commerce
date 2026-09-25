"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { formatNaira } from "@/lib/utils/currency";
import { productImageUrl } from "@/lib/utils/image-url";

export function CartView({ deliveryFee }: { deliveryFee: number }) {
  const { items, subtotal, updateQuantity, removeItem, isLoaded } = useCart();

  if (!isLoaded) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 py-20 text-center">
        <p className="text-lg font-medium text-navy">Your cart is empty</p>
        <p className="mt-2 text-sm text-navy/60">
          Browse the shop and add something you like.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  const effectiveDeliveryFee = deliveryFee;
  const total = subtotal + effectiveDeliveryFee;

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <div
            key={`${item.product_id}-${item.size ?? "nosize"}`}
            className="flex gap-4 rounded-2xl border border-navy/10 p-4"
          >
            <Link
              href={`/product/${item.slug}`}
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-navy/5"
            >
              <Image
                src={productImageUrl(item.image_path)}
                alt={item.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </Link>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/product/${item.slug}`} className="text-sm font-medium text-navy hover:underline">
                    {item.name}
                  </Link>
                  {item.size && (
                    <p className="mt-0.5 text-xs text-navy/50">Size: {item.size}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.product_id, item.size)}
                  className="text-navy/40 hover:text-navy"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex items-center rounded-lg border border-navy/15">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}
                    className="p-2 text-navy/60 hover:text-navy"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}
                    className="p-2 text-navy/60 hover:text-navy"
                    aria-label="Increase quantity"
                    disabled={item.quantity >= item.stock_quantity}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-navy">
                  {formatNaira(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-navy/10 p-6">
        <h2 className="font-display text-lg text-navy">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-navy/70">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-navy/70">
            <span>Delivery fee</span>
            <span>{effectiveDeliveryFee === 0 ? "FREE DELIVERY" : formatNaira(effectiveDeliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-navy/10 pt-2 text-base font-semibold text-navy">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 w-full">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}