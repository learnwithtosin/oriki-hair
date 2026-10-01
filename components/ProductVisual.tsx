"use client";

import Image from "next/image";
import type { Product, WigConfig } from "@/data/products";
import { WigArt } from "./WigArt";

interface ProductVisualProps {
  product: Product;
  config: WigConfig;
  className?: string;
  sheen?: boolean;
  sizes?: string;
  priority?: boolean;
}

/**
 * The single place that decides how a wig is shown. If the product has an
 * `image`, the photo is used; otherwise the wig is drawn procedurally.
 */
export function ProductVisual({
  product,
  config,
  className,
  sheen,
  sizes = "(max-width: 768px) 60vw, 420px",
  priority,
}: ProductVisualProps) {
  if (product.image) {
    return (
      <div className={`relative aspect-[400/520] ${className ?? ""}`}>
        <Image
          src={product.image}
          alt={`${product.name} — ${product.tagline}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain"
        />
      </div>
    );
  }
  return (
    <WigArt
      length={config.length}
      texture={config.texture}
      colour={config.colour}
      seed={product.seed}
      parting={product.parting}
      sheen={sheen}
      className={`block aspect-[400/520] w-full ${className ?? ""}`}
    />
  );
}
