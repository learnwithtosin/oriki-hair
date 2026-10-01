"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ digit, delay }: { digit: number; delay: number }) {
  return (
    <motion.span
      className="relative inline-block h-[1.1em] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="invisible block leading-[1.1em]">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      >
        {DIGITS.map((n) => (
          <span key={n} className="block h-[1.1em] text-center leading-[1.1em]">
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/** A naira amount whose digits roll like an odometer when it changes. */
export function RollingPrice({ value, className }: { value: number; className?: string }) {
  const text = formatNaira(value);
  const chars = text.split("");

  return (
    <span className={`relative inline-flex items-center tnum ${className ?? ""}`}>
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
      <span aria-hidden="true" className="inline-flex">
        <AnimatePresence initial={false} mode="popLayout">
          {chars.map((ch, i) => {
            // Keyed from the right so units stay units when the number grows.
            const key = chars.length - i;
            return /\d/.test(ch) ? (
              <Digit key={`d${key}`} digit={Number(ch)} delay={(chars.length - i) * 0.035} />
            ) : (
              <motion.span key={`s${key}${ch}`} layout="position" className="inline-block leading-[1.1em]">
                {ch}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </span>
  );
}
