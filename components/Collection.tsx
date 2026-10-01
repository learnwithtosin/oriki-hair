"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getProduct, products } from "@/data/products";
import { useShop } from "@/store/shop";
import { Configurator } from "./Configurator";
import { RevealText } from "./RevealText";
import { StandCard } from "./StandCard";

/** A leaving row must never sit invisibly over the configurator and swallow clicks. */
const rowVariants = {
  away: { pointerEvents: "none" as const },
  offstage: { pointerEvents: "auto" as const },
  shown: { pointerEvents: "auto" as const },
};

/** The heading gets out of the way quickly so it never overlaps the configurator. */
const headingVariants = {
  offstage: { opacity: 1 },
  away: { opacity: 0, transition: { duration: 0.3 } },
  shown: { opacity: 1, transition: { duration: 0.7, delay: 0.3 } },
};

/**
 * The collection row and the configurator share this section. Switching
 * between them hands the chosen wig across with a shared layout animation
 * while the other stands step aside.
 */
export function Collection() {
  const activeId = useShop((s) => s.activeId);
  const bootKey = useShop((s) => s.bootKey);
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const active = activeId ? getProduct(activeId) : undefined;

  // Frame the right part of the page whenever the view switches.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const intent = useShop.getState().scrollIntent;
    const el = sectionRef.current;
    if (!el || intent === "none") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce || intent === "collection-instant" ? "instant" : "smooth";
    if (intent === "top") {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const navOffset = window.innerWidth >= 768 ? 72 : 56;
    const top = el.getBoundingClientRect().top - navOffset;
    if (Math.abs(top) > 8) window.scrollTo({ top: window.scrollY + top, behavior });
  }, [activeId]);

  return (
    <section
      id="collection"
      ref={sectionRef}
      aria-label="The collection"
      className="relative min-h-[calc(100svh-56px)] scroll-mt-14 border-t border-rule md:min-h-[calc(100svh-72px)] md:scroll-mt-[72px]"
    >
      <LayoutGroup id="collection">
        <AnimatePresence key={bootKey} mode="popLayout">
          {active ? (
            <motion.div key={`detail-${active.id}`} className="w-full">
              <Configurator product={active} />
            </motion.div>
          ) : (
            <motion.div
              key="row"
              className="w-full"
              initial={revealed ? "away" : "offstage"}
              animate={revealed ? "shown" : undefined}
              whileInView={revealed ? undefined : "shown"}
              viewport={{ once: true, amount: 0.35 }}
              onViewportEnter={() => setRevealed(true)}
              exit="away"
              variants={rowVariants}
            >
              <motion.div variants={headingVariants} className="mx-auto w-full max-w-[1440px] px-5 pt-14 md:px-10 md:pt-20">
                <div className="grid gap-6 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-7">
                    <p className="eyebrow text-gold">
                      The Collection <span className="tnum text-ink/40">— 06 units</span>
                    </p>
                    <RevealText
                      inView
                      lines={[["Six", "units,", "each", "named"], ["for", "a", { text: "praise.", className: "italic" }]]}
                      className="mt-4 font-display text-[clamp(2.75rem,11vw,3.5rem)] leading-[0.95] tracking-[-0.03em] md:text-[clamp(3.5rem,5.6vw,5.5rem)]"
                    />
                  </div>
                  <p className="max-w-[24rem] text-[14px] leading-relaxed text-ink/65 md:col-span-4 md:col-start-9 md:pb-2">
                    An oriki is a Yoruba praise name, sung over a child to tell them who they are.
                    Choose a unit, then make it yours — length, texture, colour and fit.
                  </p>
                </div>
              </motion.div>

              <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-14 md:mx-auto md:mt-16 md:grid md:max-w-[1440px] md:grid-cols-6 md:gap-6 md:overflow-visible md:px-10 md:pb-24 lg:gap-8">
                {products.map((product, index) => (
                  <StandCard key={product.id} product={product} index={index} />
                ))}
                <li aria-hidden className="w-px shrink-0 md:hidden" />
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </section>
  );
}
