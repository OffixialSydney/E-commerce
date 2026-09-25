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
        
}
