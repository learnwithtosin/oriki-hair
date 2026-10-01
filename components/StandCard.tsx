"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { products, startingPrice, type Product } from "@/data/products";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { openWig } from "@/lib/navigation";
import { useShop } from "@/store/shop";
import { ProductFigure } from "./ProductFigure";

export interface StandCustom {
  index: number;
  /** Index of the wig that is opening/closing, or -1. */
  focus: number;
}

/** Stand choreography: first reveal, step aside for the chosen wig, return. */
export const standVariants: Variants = {
  offstage: { opacity: 0, y: 70, x: 0 },
  away: ({ index, focus }: StandCustom) =>
    index === focus
      ? { opacity: 1, x: 0, y: 0 }
      : {
          opacity: 0,
          x: (index < focus ? -1 : 1) * (90 + Math.abs(index - focus) * 30),
          y: 0,
          transition: { duration: 0.75, ease: EASE },
        },
  shown: ({ index, focus }: StandCustom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 1.1,
      ease: EASE,
      delay: focus >= 0 ? 0.25 + Math.abs(index - focus) * 0.07 : 0.1 + index * 0.09,
    },
  }),
};

const captionVariants: Variants = {
  offstage: { opacity: 0 },
  away: { opacity: 0, transition: { duration: 0.3 } },
  shown: { opacity: 1, transition: { duration: 0.8, delay: 0.5 } },
};

interface StandCardProps {
  product: Product;
  index: number;
}

export function StandCard({ product, index }: StandCardProps) {
  const [hovered, setHovered] = useState(false);
  // Read from the store rather than props: while the row animates out it is a
  // retained element, and only subscribed components see the new focus.
  const lastActiveId = useShop((s) => s.lastActiveId);
  const custom: StandCustom = { index, focus: products.findIndex((p) => p.id === lastActiveId) };
  const number = String(custom.index + 1).padStart(2, "0");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Coming back from the configurator: centre this stand in the mobile
  // scroller before the shared layout animation measures where to land.
  useLayoutEffect(() => {
    const { lastActiveId: last, activeId } = useShop.getState();
    const li = buttonRef.current?.parentElement;
    const row = li?.parentElement;
    if (last !== product.id || activeId || !li || !row) return;
    if (row.scrollWidth > row.clientWidth) {
      row.scrollLeft = li.offsetLeft - row.offsetLeft - (row.clientWidth - li.offsetWidth) / 2;
    }
  }, [product.id]);

  // …and return focus to it.
  useEffect(() => {
    const { lastActiveId: last, activeId, demo } = useShop.getState();
    if (last === product.id && !activeId && !demo) buttonRef.current?.focus({ preventScroll: true });
  }, [product.id]);

  return (
    <motion.li
      variants={standVariants}
      custom={custom}
      className="w-[58vw] max-w-[260px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => openWig(product.id)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group block w-full text-left"
        aria-label={`${product.name}, ${product.tagline}, from ${formatNaira(startingPrice(product))}. Open configurator.`}
      >
        <ProductFigure product={product} config={product.defaults} lifted={hovered} />

        <motion.div variants={captionVariants} custom={custom} className="relative mt-4 border-t border-rule pt-3">
          <span className="eyebrow tnum text-ink/45">No. {number}</span>
          <div
            className={`mt-1.5 transition-all duration-700 ease-house md:translate-y-2 md:opacity-0 ${
              hovered ? "md:translate-y-0 md:opacity-100" : ""
            }`}
          >
            <p className="font-display text-[26px] leading-none tracking-[-0.02em] md:text-[28px]">{product.name}</p>
            <p className="mt-1.5 text-[12px] text-ink/60">
              from <span className="tnum text-ink">{formatNaira(startingPrice(product))}</span>
            </p>
          </div>
        </motion.div>
      </button>
    </motion.li>
  );
}
