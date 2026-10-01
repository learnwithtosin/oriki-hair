"use client";

import { motion } from "framer-motion";
import { describeConfig, getProduct } from "@/data/products";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { useCart, type CartItem } from "@/store/cart";
import { CARD_ZOOM } from "./ProductPhoto";
import { ProductVisual } from "./ProductVisual";

export function CartLine({ item, index }: { item: CartItem; index: number }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const product = getProduct(item.productId);
  if (!product) return null;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE, delay: 0.25 + index * 0.07 } }}
      exit={{ opacity: 0, x: 32, transition: { duration: 0.4, ease: EASE } }}
      className="flex gap-4 border-b border-rule py-5"
    >
      <div className="w-[72px] shrink-0 bg-ink/[0.035] px-1 pt-1">
        <ProductVisual product={product} config={item.config} sheen={false} sizes="72px" zoom={CARD_ZOOM} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[24px] leading-none tracking-[-0.02em]">{product.name}</p>
          <p className="text-[14px] tnum">{formatNaira(item.unitPrice * item.quantity)}</p>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-ink/60">{describeConfig(item.config)}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center rounded-full border border-rule">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              onClick={() => setQuantity(item.key, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 transition-colors hover:text-ink"
            >
              −
            </button>
            <span className="w-5 text-center text-[13px] tnum" aria-label={`Quantity ${item.quantity}`}>
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              onClick={() => setQuantity(item.key, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 transition-colors hover:text-ink"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => remove(item.key)}
            className="text-[12px] text-ink/50 underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            Remove
          </button>
        </div>
      </div>
    </motion.li>
  );
}
