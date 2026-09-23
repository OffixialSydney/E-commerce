"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const images = ["/hero/1.JPG", "/hero/2.JPG", "/hero/3.JPG", "/hero/4.JPG"];

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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
