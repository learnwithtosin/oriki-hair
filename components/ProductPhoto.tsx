"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Product, WigConfig } from "@/data/products";
import { EASE } from "@/lib/motion";

interface ProductPhotoProps {
  product: Product;
  config: WigConfig;
  src: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** 1 shows the whole mannequin and stand; more crops in on the wig. */
  zoom?: number;
  /** Crop to ease from on mount, so a figure flying between views never jumps. */
  fromZoom?: number;
}

/** Cards and thumbnails crop in on the wig; the configurator shows the whole stand. */
export const CARD_ZOOM = 1.32;

/**
 * Length can't be photographed per option, so it reads as a gentle change of
 * scale (anchored at the bottom, like hair falling further) — never a fake crop.
 */
function lengthScale(length: number) {
  return 0.93 + ((length - 12) / 18) * 0.09;
}

/** A product photo on a cream panel. Colour changes cross-fade between shots. */
export function ProductPhoto({
  product,
  config,
  src,
  sizes,
  priority,
  className,
  zoom = 1,
  fromZoom,
}: ProductPhotoProps) {
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#ece4d8] shadow-[0_28px_60px_-34px_rgba(42,27,20,0.45),0_2px_6px_-2px_rgba(42,27,20,0.08)] ${className ?? ""}`}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 6%" }}
        initial={{ scale: fromZoom ?? zoom }}
        animate={{ scale: zoom }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <motion.div
          className="absolute inset-0 origin-bottom"
          initial={false}
          animate={{ scale: lengthScale(config.length) }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={src}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Image
                src={src}
                alt={`${product.name} — ${product.tagline}`}
                fill
                sizes={sizes}
                priority={priority}
                // Already sized and compressed WebP; skips the optimiser so
                // colourways can be preloaded by their plain URL.
                unoptimized
                draggable={false}
                className="object-contain object-bottom"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
