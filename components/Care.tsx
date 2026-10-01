"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { RevealText } from "./RevealText";

const RITUALS = [
  {
    title: "Wash",
    body: "Every ten to fourteen wears. Cool water, a sulphate-free cleanser, fingers — never fists. Pat it dry; don't rub.",
  },
  {
    title: "Rest",
    body: "Air-dry on a stand, out of direct sun. Keep heat at 180°C or below and the cuticle stays sealed, the colour stays honest.",
  },
  {
    title: "Keep",
    body: "Stored in its silk bag, a unit lasts two to three years. Bring it back for a wash, reset and restyle — free for the first year.",
  },
];

export function Care() {
  return (
    <section id="care" className="scroll-mt-14 border-t border-rule md:scroll-mt-[72px]">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-32">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow text-gold md:col-span-3 md:pt-4">Care</p>
          <RevealText
            inView
            lines={[["Treat", "it", "like"], ["it", "grew", { text: "there.", className: "italic" }]]}
            className="font-display text-[clamp(2.75rem,11vw,3.5rem)] leading-[0.95] tracking-[-0.03em] md:col-span-9 md:text-[clamp(3.5rem,5.6vw,5.5rem)]"
          />
        </div>

        <ol className="mt-14 grid border-t border-rule md:mt-24 md:grid-cols-3">
          {RITUALS.map((ritual, i) => (
            <motion.li
              key={ritual.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1, ease: EASE, delay: i * 0.12 }}
              className={`border-b border-rule py-8 md:border-b-0 md:py-10 ${i > 0 ? "md:border-l md:pl-10" : ""} ${i < 2 ? "md:pr-10" : ""}`}
            >
              <span className="eyebrow tnum text-ink/40">0{i + 1}</span>
              <h3 className="mt-5 font-display text-[34px] leading-none tracking-[-0.02em]">{ritual.title}</h3>
              <p className="mt-4 max-w-[22rem] text-[14px] leading-relaxed text-ink/65">{ritual.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
