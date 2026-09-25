"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/database";

const STORAGE_KEY = "sid-bespoke-cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  clearCart: () => void;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// A cart line is uniquely identified by product + size, since the same
// product in two different sizes must be packaged and tracked separately.
function isSameLine(a: CartItem, b: { product_id: string; size: string | null }) {
  return a.product_id === b.product_id && (a.size ?? null) === (b.size ?? null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage once, on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          // Backfill size for carts saved before this field existed.
          setItems(parsed.map((i) => ({ ...i, size: i.size ?? null })));
        }
      }
    } catch {
      // Corrupt or inaccessible storage — start with an empty cart
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist on every change, after the initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — cart just won't persist this change
    }
  }, [items, isLoaded]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => isSameLine(i, newItem));
      if (existing) {
        const nextQty = Math.min(
          existing.quantity + newItem.quantity,
          existing.stock_quantity
        );
        return prev.map((i) =>
          isSameLine(i, newItem) ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, newItem];
    });
  }

  function removeItem(productId: string, size: string | null) {
    setItems((prev) => prev.filter((i) => !isSameLine(i, { product_id: productId, size })));
  }

  function updateQuantity(productId: string, size: string | null, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          isSameLine(i, { product_id: productId, size })
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock_quantity)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}