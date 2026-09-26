"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatNaira, discountPercent } from "@/lib/utils/currency";
import { productImageUrl } from "@/lib/utils/image-url";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import type { ProductWithRelations } from "@/types/database";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const discount = discountPercent(product.price, product.previous_price);
  const inStock = product.stock_quantity > 0;
  const isLowStock = inStock && product.stock_quantity <= product.low_stock_threshold;
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_path: primaryImage?.storage_path ?? null,
    });
  }

  return (
    <Link href={`/product/${product.slug}`} className="card group block overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-navy/5">
        <Image
          src={productImageUrl(primaryImage?.storage_path)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-navy px-2.5 py-1 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        <button
          onClick={handleWishlistClick}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 ${wishlisted ? "fill-gold text-gold" : "text-navy/60"}`}
          />
        </button>
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-white">
              Out of stock
            </span>
          </div>
        )}
        {isLowStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white">
            Only {product.stock_quantity} left
          </span>
        )}
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs text-navy/45">{product.category.name}</p>
        )}
        <h3 className="mt-1 truncate text-sm font-medium text-navy">{product.name}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-navy">
            {formatNaira(product.price)}
          </span>
          {product.previous_price && product.previous_price > product.price && (
            <span className="text-xs text-navy/40 line-through">
              {formatNaira(product.previous_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}