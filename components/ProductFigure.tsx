"use client";

import { motion } from "framer-motion";
import type { Product, WigConfig } from "@/data/products";
import { EASE } from "@/lib/motion";
import { ProductVisual, photoFor } from "./ProductVisual";
import { StandBase } from "./StandBase";

interface ProductFigureProps {
  product: Product;
  config: WigConfig;
  /** Lifts the wig up the pole — used for hover. */
  lifted?: boolean;
  sheen?: boolean;
  priority?: boolean;
}

export const LAYOUT_TRANSITION = { duration: 0.9, ease: EASE };

/**
 * Wig + stand. Both halves carry a layoutId so the figure can travel between
 * the collection row and the configurator as one shared element. Photo
 * products are shown on their own panel — no drawn stand.
 */
export function ProductFigure({ product, config, lifted, sheen, priority }: ProductFigureProps) {
  const photo = !!photoFor(product, config);
  return (
    <div className="relative">
      <motion.div
        layoutId={`wig-${product.id}`}
        transition={LAYOUT_TRANSITION}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: lifted ? (photo ? "-2%" : "-3.5%") : "0%" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <ProductVisual product={product} config={config} sheen={sheen} priority={priority} />
        </motion.div>
      </motion.div>
      {!photo && (
        <motion.div
          layoutId={`stand-${product.id}`}
          transition={LAYOUT_TRANSITION}
          className="relative -mt-[6%]"
        >
          <StandBase className="block w-full" />
        </motion.div>
      )}
    </div>
  );
}
