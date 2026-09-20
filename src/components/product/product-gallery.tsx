"use client";

import Image from "next/image";
import { useState } from "react";
import { productImageUrl } from "@/lib/utils/image-url";
import type { ProductImage } from "@/types/database";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy/5">
        <Image
          src={productImageUrl(active?.storage_path)}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {sorted.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-navy/5 ring-2 transition-all ${
                i === activeIndex ? "ring-gold" : "ring-transparent"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={productImageUrl(img.storage_path)}
                alt=""
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
