"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { productImageUrl } from "@/lib/utils/image-url";
import type { ProductWithRelations } from "@/types/database";

export function HeroSlideshow({
  products,
}: {
  products: ProductWithRelations[];
}) {
  const images = products
    .map((product) => {
      const primaryImage =
        product.images?.find((img) => img.is_primary) ?? product.images?.[0];
      return primaryImage ? productImageUrl(primaryImage.storage_path) : null;
    })
    .filter((url): url is string => Boolean(url));

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy-light md:aspect-[3/4]">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-navy-light to-navy" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy-light md:aspect-[3/4]">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          className={`object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          priority={i === 0}
        />
      ))}
    </div>
  );
}

