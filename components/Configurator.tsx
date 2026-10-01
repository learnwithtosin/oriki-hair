"use client";

import { motion } from "framer-motion";
import {
  CAP_SIZES,
  COLOURS,
  LENGTHS,
  TEXTURES,
  getCap,
  getColour,
  getLength,
  getTexture,
  priceFor,
  products,
  type Product,
} from "@/data/products";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { useShop } from "@/store/shop";
import { AddToCartButton } from "./AddToCartButton";
import { OptionGroup } from "./OptionGroup";
import { ProductFigure } from "./ProductFigure";
import { RollingPrice } from "./RollingPrice";

const panel = {
  hidden: { opacity: 0, x: 48 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.9, ease: EASE, delay: 0.35, staggerChildren: 0.05, delayChildren: 0.4 } },
  exit: { opacity: 0, x: 48, transition: { duration: 0.5, ease: EASE } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0 },
};

export function Configurator({ product }: { product: Product }) {
  const config = useShop((s) => s.config);
  const setOption = useShop((s) => s.setOption);
  const close = useShop((s) => s.close);
  const index = products.findIndex((p) => p.id === product.id) + 1;

  const length = getLength(config.length);
  const texture = getTexture(config.texture);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        className="flex items-center justify-between border-b border-rule py-3 md:py-4"
      >
        <button
          type="button"
          onClick={close}
          className="group flex items-center gap-2.5 text-[13px] text-ink/75 transition-colors hover:text-ink"
        >
          <span aria-hidden className="transition-transform duration-500 ease-house group-hover:-translate-x-1">
            ←
          </span>
          Back to collection
        </button>
        <span className="eyebrow tnum text-ink/50">
          No. {String(index).padStart(2, "0")} <span className="text-ink/25">/</span> {String(products.length).padStart(2, "0")}
        </span>
      </motion.div>

      <div className="grid gap-4 pb-10 pt-4 md:grid-cols-12 md:gap-10 md:pb-16 md:pt-6">
        <div className="flex items-start justify-center md:col-span-6 md:items-center lg:col-span-7">
          <div className="w-[44vw] max-w-[200px] md:w-[min(30vw,46vh)] md:max-w-[440px]">
            <ProductFigure product={product} config={config} sheen priority />
          </div>
        </div>

        <motion.div
          variants={panel}
          initial="hidden"
          animate="shown"
          exit="exit"
          className="flex flex-col md:col-span-6 md:justify-center lg:col-span-5"
        >
          <motion.p variants={item} className="eyebrow hidden text-gold md:block">
            {product.construction}
          </motion.p>
          <motion.div variants={item} className="flex items-end justify-between gap-4 md:block">
            <h2 className="font-display text-[44px] leading-[0.95] tracking-[-0.03em] md:mt-3 md:text-[clamp(3.5rem,5vw,4.75rem)]">
              {product.name}
            </h2>
            <RollingPrice
              value={priceFor(product, config)}
              className="pb-1 text-[22px] font-light tracking-[-0.01em] md:hidden"
            />
          </motion.div>
          <motion.p variants={item} className="mt-1 font-display text-[19px] italic text-ink/70 md:mt-2 md:text-[22px]">
            {product.tagline}
          </motion.p>
          <motion.p variants={item} className="mt-4 hidden max-w-[34rem] text-[14px] leading-relaxed text-ink/65 lg:block">
            {product.description}
          </motion.p>

          <motion.div variants={item} className="mt-4 space-y-3 md:mt-7 md:space-y-4">
            <OptionGroup
              name="length"
              label="Length"
              readout={`${config.length} inches`}
              options={LENGTHS.map((l) => ({ value: l.value, label: l.label }))}
              value={config.length}
              onChange={(v) => setOption("length", v)}
            />
            <OptionGroup
              name="texture"
              label="Texture"
              readout={texture.addOn ? `+${formatNaira(texture.addOn)}` : "Included"}
              options={TEXTURES.map((t) => ({ value: t.value, label: t.label }))}
              value={config.texture}
              onChange={(v) => setOption("texture", v)}
            />
            <OptionGroup
              name="colour"
              label="Colour"
              readout={getColour(config.colour).label}
              variant="swatch"
              options={COLOURS.map((c) => ({ value: c.value, label: c.label, swatch: c.swatch }))}
              value={config.colour}
              onChange={(v) => setOption("colour", v)}
            />
            <OptionGroup
              name="cap"
              label="Cap size"
              readout={`${getCap(config.cap).circumference} circumference`}
              options={CAP_SIZES.map((c) => ({ value: c.value, label: c.label }))}
              value={config.cap}
              onChange={(v) => setOption("cap", v)}
            />
          </motion.div>

          <motion.div variants={item} className="mt-5 border-t border-rule pt-4 md:mt-7 md:pt-6">
            <div className="hidden items-end justify-between gap-6 md:flex">
              <RollingPrice
                value={priceFor(product, config)}
                className="text-[clamp(2.25rem,3.2vw,3rem)] font-light tracking-[-0.02em]"
              />
              <dl className="pb-2 text-right text-[12px] leading-[1.7] text-ink/55 tnum">
                <div className="flex justify-end gap-3">
                  <dt>Unit</dt>
                  <dd>{formatNaira(product.basePrice)}</dd>
                </div>
                <div className="flex justify-end gap-3">
                  <dt>Length</dt>
                  <dd>+{formatNaira(length.addOn)}</dd>
                </div>
                <div className="flex justify-end gap-3">
                  <dt>Texture</dt>
                  <dd>+{formatNaira(texture.addOn)}</dd>
                </div>
              </dl>
            </div>
            <div className="md:mt-5">
              <AddToCartButton product={product} />
            </div>
            <p className="mt-3 text-center text-[12px] text-ink/50 md:text-left">
              Made to order in 5–7 days · Free fitting consultation
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
