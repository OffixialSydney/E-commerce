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
            
