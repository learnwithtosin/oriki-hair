"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { priceFor, type Product } from "@/data/products";
import { addToCart } from "@/lib/actions";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { useShop } from "@/store/shop";
import { MagneticButton } from "./MagneticButton";

const HOLD = { duration: 1.9, times: [0, 0.18, 0.8, 1], ease: EASE };

export function AddToCartButton({ product }: { product: Product }) {
  const config = useShop((s) => s.config);
  const addedTick = useShop((s) => s.addedTick);
  // Only confirm adds that happen while this button is on screen.
  const [mountTick] = useState(addedTick);
  const flashing = addedTick > mountTick;

  return (
    <MagneticButton
      strength={0.12}
      onClick={() => addToCart(product, config)}
      className="group relative flex h-13 w-full items-center justify-center overflow-hidden rounded-full bg-espresso text-[14px] tracking-[0.03em] text-paper transition-colors duration-500 hover:bg-ink md:h-14"
    >
      {/* Keyed on every add so the confirmation replays, whether a person or demo mode added it. */}
      <motion.span
        key={`label-${addedTick}`}
        className="flex items-center gap-3"
        initial={false}
        animate={flashing ? { y: ["0%", "-160%", "-160%", "0%"] } : undefined}
        transition={HOLD}
      >
        Add to cart
        <span aria-hidden className="h-px w-6 bg-paper/40" />
        <span className="tnum text-paper/75">{formatNaira(priceFor(product, config))}</span>
      </motion.span>
      {flashing && (
        <motion.span
          key={`added-${addedTick}`}
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center gap-2 text-gold"
          initial={{ y: "120%" }}
          animate={{ y: ["120%", "0%", "0%", "-120%"] }}
          transition={HOLD}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          Added to cart
        </motion.span>
      )}
    </MagneticButton>
  );
}
