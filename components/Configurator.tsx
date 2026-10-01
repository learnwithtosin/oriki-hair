"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
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
import { closeWig } from "@/lib/navigation";
import { EASE } from "@/lib/motion";
import { useShop } from "@/store/shop";
import { AddToCartButton } from "./AddToCartButton";
import { OptionGroup } from "./OptionGroup";
import { ProductFigure } from "./ProductFigure";
import { CARD_ZOOM } from "./ProductPhoto";
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
  const index = products.findIndex((p) => p.id === product.id) + 1;

  const length = getLength(config.length);
  const texture = getTexture(config.texture);
  // Photos show one texture; say so honestly rather than pretend otherwise.
  const pictured = product.photoTexture && product.images?.[config.colour] ? product.photoTexture : null;
  const textureNote =
    pictured && pictured !== config.texture
      ? `Pictured in ${getTexture(pictured).label.toLowerCase()} — yours is made in ${texture.label.toLowerCase()}.`
      : null;

  // Warm the cache so the first colour change cross-fades instead of flashing.
  useEffect(() => {
    for (const src of Object.values(product.images ?? {})) {
      const img = new window.Image();
      img.src = src;
    }
  }, [product]);

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
          onClick={() => closeWig()}
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

      <div className="grid gap-3 pb-10 pt-3 md:min-h-[calc(100svh-72px-57px)] md:grid-cols-12 md:gap-10 md:py-6">
        <div className="flex min-w-0 items-start justify-center md:col-span-6 md:items-center">
          <div className="w-[46vw] max-w-[196px] md:w-[min(36vw,60vh)] md:max-w-[520px]">
            <ProductFigure product={product} config={config} sheen priority fromZoom={CARD_ZOOM} />
            {/* Fixed height and absolutely placed, so the note never shifts the controls. */}
            <motion.div exit={{ opacity: 0, transition: { duration: 0.2 } }} className="relative mt-2.5 h-4 md:mt-4">
              <AnimatePresence mode="wait" initial={false}>
                {textureNote && (
                  <motion.p
                    key={textureNote}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[11px] leading-4 text-ink/50 md:text-[12px]"
                  >
                    {textureNote}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={panel}
          initial="hidden"
          animate="shown"
          exit="exit"
          className="flex min-w-0 flex-col md:col-span-6 md:justify-center"
        >
          <motion.p variants={item} className="eyebrow hidden text-gold md:block">
            {product.construction}
          </motion.p>
          <motion.div variants={item} className="flex items-end justify-between gap-4 md:block">
            <h2 className="font-display text-[42px] leading-[0.95] tracking-[-0.03em] md:mt-3 md:text-[clamp(3.5rem,4.6vw,4.5rem)]">
              {product.name}
            </h2>
            <RollingPrice
              value={priceFor(product, config)}
              className="pb-1 text-[21px] font-light tracking-[-0.01em] md:hidden"
            />
          </motion.div>
          <motion.p variants={item} className="mt-2 hidden font-display text-[22px] italic text-ink/70 md:block">
            {product.tagline}
          </motion.p>
          <motion.p variants={item} className="mt-3 hidden max-w-[32rem] text-[14px] leading-relaxed text-ink/65 lg:block">
            {product.description}
          </motion.p>

          <motion.div variants={item} className="mt-3 space-y-2.5 md:mt-6 md:space-y-0 md:border-b md:border-rule">
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
              readout={getCap(config.cap).circumference}
              options={CAP_SIZES.map((c) => ({ value: c.value, label: c.label }))}
              value={config.cap}
              onChange={(v) => setOption("cap", v)}
            />
          </motion.div>

          <motion.div variants={item} className="mt-4 border-t border-rule pt-4 md:mt-0 md:border-t-0 md:pt-5">
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
            <div className="md:mt-4">
              <AddToCartButton product={product} />
            </div>
            <p className="mt-2.5 text-center text-[12px] text-ink/50 md:mt-3 md:text-left">
              Made to order in 5–7 days · Free fitting consultation
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
