"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sid-bespoke-wishlist";

export interface WishlistItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_path: string | null;
}

interface WishlistContextValue {
  items: WishlistItem[];
  itemCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WishlistItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Corrupt or inaccessible storage — start with an empty wishlist
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — wishlist just won't persist this change
    }
  }, [items, isLoaded]);

  function isWishlisted(productId: string) {
    return items.some((i) => i.product_id === productId);
  }

  function toggleWishlist(item: WishlistItem) {
    setItems((prev) => {
      const exists = prev.some((i) => i.product_id === item.product_id);
      if (exists) return prev.filter((i) => i.product_id !== item.product_id);
      return [...prev, item];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  const itemCount = useMemo(() => items.length, [items]);

  return (
    <WishlistContext.Provider
      value={{ items, itemCount, isWishlisted, toggleWishlist, removeItem, isLoaded }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}