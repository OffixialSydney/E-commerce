"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/cart-context";

/**
 * Clears the cart once, on mount, when rendered on the order confirmation
 * page. Reaching that page always means the order was genuinely placed
 * (bank transfer) or payment was verified as successful (card) — so this
 * is the correct, safe place to empty the cart, rather than doing it
 * eagerly in the checkout form before payment is confirmed.
 */
export function ClearCartOnMount() {
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (hasCleared.current) return;
    hasCleared.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
