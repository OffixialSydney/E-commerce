"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import { useCart } from "@/lib/cart/cart-context";
import { formatNaira } from "@/lib/utils/currency";
import { productImageUrl } from "@/lib/utils/image-url";

export function WishlistView() {
  const { items, removeItem, isLoaded } = useWishlist();

  if (!isLoaded) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 py-20 text-center">
        <p className="text-lg font-medium text-navy">Your wishlist is empty</p>
        <p className="mt-2 text-sm text-navy/60">
          Save items you love while you browse — tap the heart on any product.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <WishlistCard key={item.product_id} item={item} onRemove={() => removeItem(item.product_id)} />
      ))}
    </div>
  );
}

function WishlistCard({
  item,
  onRemove,
}: {
  item: { product_id: string; name: string; slug: string; price: number; image_path: string | null };
  onRemove: () => void;
}) {
  const { addItem } = useCart();

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-navy/5">
        <Link href={`/product/${item.slug}`}>
          <Image
            src={productImageUrl(item.image_path)}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        </Link>
        <button
          onClick={onRemove}
          aria-label="Remove from wishlist"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
        >
          <X className="h-4 w-4 text-navy/60" />
        </button>
      </div>

      <div className="p-4">
        <Link href={`/product/${item.slug}`} className="text-sm font-medium text-navy hover:underline">
          {item.name}
        </Link>
        <p className="mt-1 text-sm font-semibold text-navy">{formatNaira(item.price)}</p>
        <Link
          href={`/product/${item.slug}`}
          className="btn-secondary mt-3 block w-full text-center text-xs"
        >
          View & Add to Cart
        </Link>
      </div>
    </div>
  );
}
