"use client";

import type { Product, WigConfig } from "@/data/products";
import { ProductPhoto } from "./ProductPhoto";
import { WigArt } from "./WigArt";

interface ProductVisualProps {
  product: Product;
  config: WigConfig;
  className?: string;
  sheen?: boolean;
  sizes?: string;
  priority?: boolean;
}

/** The photo for the selected colour, if one exists. */
export function photoFor(product: Product, config: WigConfig): string | undefined {
  return product.images?.[config.colour];
}

/**
 * The single place that decides how a wig is shown: a real photo when the
 * product has one for the selected colour, otherwise the procedural drawing.
 */
export function ProductVisual({
  product,
  config,
  className,
  sheen,
  sizes = "(max-width: 768px) 60vw, 520px",
  priority,
}: ProductVisualProps) {
  const src = photoFor(product, config);
  if (src) {
    return (
      <ProductPhoto
        product={product}
        config={config}
        src={src}
        sizes={sizes}
        priority={priority}
        className={className}
      />
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
      className={`block aspect-[400/446] w-full ${className ?? ""}`}
    />
  );
}
