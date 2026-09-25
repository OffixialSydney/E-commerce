"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-2xl bg-navy/5"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={productImageUrl(active?.storage_path)}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {isZooming && (
          <div
            className="pointer-events-none absolute inset-0 hidden bg-no-repeat sm:block"
            style={{
              backgroundImage: `url(${productImageUrl(active?.storage_path)})`,
              backgroundSize: "200%",
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            }}
          />
        )}
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
