"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { HairField } from "./HairField";
import { MagneticButton } from "./MagneticButton";
import { RevealText } from "./RevealText";

const FACTS = ["Hand-ventilated HD lace", "Cut & coloured to order", "Dispatched within 48 hours"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-svh flex-col overflow-hidden pt-14 md:pt-[72px]"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] [mask-image:linear-gradient(to_bottom,transparent,black_22%)] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[60%] md:[mask-image:linear-gradient(to_bottom,transparent_4%,black_26%)]">
        <HairField className="h-full w-full" />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="flex items-center justify-between border-b border-rule py-4 text-muted md:py-5"
        >
          <span className="eyebrow">The Harmattan Edit</span>
          <span className="eyebrow tnum">Lagos · 2026</span>
        </motion.div>

        <div className="flex flex-1 flex-col justify-start pt-10 md:justify-center md:pt-0 md:pb-16">
          <RevealText
            as="h1"
            delay={0.35}
            lines={[
              ["Hair", "that", { text: "arrives", className: "italic" }],
              ["before", "you", "do."],
            ]}
            className="font-display text-[clamp(3.4rem,15vw,5rem)] leading-[0.92] tracking-[-0.035em] md:text-[clamp(5rem,9.6vw,9.75rem)] md:leading-[0.88]"
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 1.05 }}
            className="mt-7 max-w-[25rem] md:mt-10"
          >
            <p className="text-[15px] leading-relaxed text-ink/75 md:text-base">
              Luxury units, hand-finished in our Lagos atelier — cut to your length, coloured
              to your mood, and at your door before the occasion is.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <MagneticButton
                href="#collection"
                className="group inline-flex h-12 items-center rounded-full bg-espresso px-7 text-[13px] tracking-[0.04em] text-paper transition-colors duration-500 hover:bg-ink"
              >
                Explore the collection
                <span aria-hidden className="transition-transform duration-500 ease-house group-hover:translate-x-1">
                  →
                </span>
              </MagneticButton>
              <a href="#care" className="text-[13px] text-ink/70 underline decoration-rule underline-offset-[6px] transition-colors hover:text-ink hover:decoration-ink">
                How we care
              </a>
            </div>
          </motion.div>
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="hidden grid-cols-3 border-t border-rule md:grid"
        >
          {FACTS.map((fact, i) => (
            <li key={fact} className="flex items-baseline gap-3 py-5 text-[13px] text-ink/70">
              <span className="eyebrow tnum text-gold">0{i + 1}</span>
              {fact}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
