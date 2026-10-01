/**
 * Oriki Hair — product catalogue and pricing.
 *
 * Everything the storefront knows about a wig lives here. Real photography
 * is wired through each product's `images` map (colour → path under /public).
 * When the selected colour has a photo, <ProductVisual> shows it; otherwise
 * it falls back to the procedural <WigArt>. No other code changes are needed.
 * Photos are produced by scripts/process_photos.py.
 */

export type LengthInches = 12 | 16 | 20 | 22 | 24 | 26 | 28 | 30;
export type TextureId = "straight" | "body-wave" | "deep-wave" | "water-wave" | "kinky-curly";
export type ColourId =
  | "natural-black"
  | "dark-brown"
  | "honey-blonde"
  | "burgundy"
  | "copper"
  | "ash-grey";
export type CapSizeId = "small" | "medium" | "large";

export type Parting = "middle" | "side";

export interface WigConfig {
  length: LengthInches;
  texture: TextureId;
  colour: ColourId;
  cap: CapSizeId;
}

export interface Product {
  id: string;
  name: string;
  /** Short line shown under the name. */
  tagline: string;
  /** Lace / cap construction, shown in the configurator. */
  construction: string;
  description: string;
  /** Price in naira for the shortest length in straight texture. */
  basePrice: number;
  /** Seed for the procedural wig drawing — keeps each unit's look stable. */
  seed: number;
  parting: Parting;
  defaults: WigConfig;
  /** Product photos by colour. A missing colour falls back to the drawn wig. */
  images?: Partial<Record<ColourId, string>>;
  /** The texture the photos show — the configurator says so when another is chosen. */
  photoTexture?: TextureId;
}

export interface LengthOption {
  value: LengthInches;
  label: string;
  addOn: number;
}

export interface TextureOption {
  value: TextureId;
  label: string;
  addOn: number;
}

export interface ColourOption {
  value: ColourId;
  label: string;
  /** Root → mid → tip, used for strand gradients. */
  shades: [string, string, string];
  /** Flat colour used for the swatch. */
  swatch: string;
}

export interface CapOption {
  value: CapSizeId;
  label: string;
  short: string;
  circumference: string;
}

export const LENGTHS: LengthOption[] = [
  { value: 12, label: '12"', addOn: 0 },
  { value: 16, label: '16"', addOn: 35_000 },
  { value: 20, label: '20"', addOn: 75_000 },
  { value: 22, label: '22"', addOn: 95_000 },
  { value: 24, label: '24"', addOn: 120_000 },
  { value: 26, label: '26"', addOn: 145_000 },
  { value: 28, label: '28"', addOn: 175_000 },
  { value: 30, label: '30"', addOn: 210_000 },
];

export const TEXTURES: TextureOption[] = [
  { value: "straight", label: "Straight", addOn: 0 },
  { value: "body-wave", label: "Body wave", addOn: 15_000 },
  { value: "deep-wave", label: "Deep wave", addOn: 25_000 },
  { value: "water-wave", label: "Water wave", addOn: 30_000 },
  { value: "kinky-curly", label: "Kinky curly", addOn: 35_000 },
];

export const COLOURS: ColourOption[] = [
  {
    value: "natural-black",
    label: "Natural black",
    shades: ["#0c0908", "#1d1612", "#3b2d24"],
    swatch: "#1a1411",
  },
  {
    value: "dark-brown",
    label: "Dark brown",
    shades: ["#1c110b", "#3d2619", "#6e4a33"],
    swatch: "#3d2619",
  },
  {
    value: "honey-blonde",
    label: "Honey blonde",
    shades: ["#4a2f17", "#a06c34", "#dcb071"],
    swatch: "#b98244",
  },
  {
    value: "burgundy",
    label: "Burgundy",
    shades: ["#22080d", "#5a1420", "#913242"],
    swatch: "#62182a",
  },
  {
    value: "copper",
    label: "Copper",
    shades: ["#3e1a0b", "#94461f", "#cf7c43"],
    swatch: "#a8542a",
  },
  {
    value: "ash-grey",
    label: "Ash grey",
    shades: ["#36332f", "#7d7770", "#c4beb5"],
    swatch: "#8f8982",
  },
];

export const CAP_SIZES: CapOption[] = [
  { value: "small", label: "Small", short: "S", circumference: '21–21.5"' },
  { value: "medium", label: "Medium", short: "M", circumference: '22–22.5"' },
  { value: "large", label: "Large", short: "L", circumference: '23–23.5"' },
];

const COLOUR_IDS: ColourId[] = [
  "natural-black",
  "dark-brown",
  "honey-blonde",
  "burgundy",
  "copper",
  "ash-grey",
];

/** All six colourways exported by scripts/process_photos.py for a product. */
function photoSet(slug: string): Record<ColourId, string> {
  return Object.fromEntries(COLOUR_IDS.map((c) => [c, `/wigs/${slug}-${c}.webp`])) as Record<ColourId, string>;
}

/**
 * Six units, one per studio photograph in public/wigs/source/. Every photo
 * shows the wig in natural black; the other five colourways are generated.
 * The row order is the order on the page.
 */
export const products: Product[] = [
  {
    id: "ayomide",
    name: "Ayomide",
    tagline: "The blunt bob",
    construction: "5×5 HD lace closure",
    description:
      "A jaw-skimming bob cut to one clean line, with a middle part that stays put. Light on the head, sharp in every photo, and the easiest unit we make to wear every day.",
    basePrice: 85_000,
    images: photoSet("ayomide"),
    photoTexture: "straight",
    seed: 23,
    parting: "middle",
    defaults: { length: 12, texture: "straight", colour: "natural-black", cap: "medium" },
  },
  {
    id: "ewa",
    name: "Ewa",
    tagline: "Soft body wave",
    construction: "13×4 HD lace frontal",
    description:
      "Loose, swinging waves that fall from the cheekbone and settle the moment you shake them out. Twenty-six inches of movement that forgives Lagos humidity.",
    basePrice: 120_000,
    images: photoSet("ewa"),
    photoTexture: "body-wave",
    seed: 7,
    parting: "middle",
    defaults: { length: 26, texture: "body-wave", colour: "natural-black", cap: "medium" },
  },
  {
    id: "adunni",
    name: "Adunni",
    tagline: "Bone straight, glass finish",
    construction: "13×4 HD lace frontal",
    description:
      "Our signature. Twenty-eight inches, weighty and so straight it catches light like lacquer. The HD frontal melts into every skin tone without tinting.",
    basePrice: 165_000,
    images: photoSet("adunni"),
    photoTexture: "straight",
    seed: 41,
    parting: "middle",
    defaults: { length: 28, texture: "straight", colour: "natural-black", cap: "medium" },
  },
  {
    id: "morenike",
    name: "Morenike",
    tagline: "Defined deep wave",
    construction: "13×4 HD lace frontal",
    description:
      "Glossy, rope-like waves set from the crown to the ends, each one the same depth as the last. Holds its pattern for days with nothing but water and a little mousse.",
    basePrice: 175_000,
    images: photoSet("morenike"),
    photoTexture: "deep-wave",
    seed: 58,
    parting: "middle",
    defaults: { length: 24, texture: "deep-wave", colour: "natural-black", cap: "medium" },
  },
  {
    id: "titilayo",
    name: "Titilayo",
    tagline: "Wet-look water wave",
    construction: "13×6 HD lace frontal",
    description:
      "Loose, ribboned curls with a just-out-of-the-sea texture. Spray it damp and the pattern springs straight back; leave it dry for softer volume.",
    basePrice: 195_000,
    images: photoSet("titilayo"),
    photoTexture: "water-wave",
    seed: 93,
    parting: "middle",
    defaults: { length: 22, texture: "water-wave", colour: "natural-black", cap: "medium" },
  },
  {
    id: "folake",
    name: "Folake",
    tagline: "Kinky curly, full volume",
    construction: "13×4 HD lace, kinky edges",
    description:
      "Tight, springy coils with the density of natural 4B hair and kinky baby hairs at the lace, so the hairline reads as your own. Big, round and twenty inches long.",
    basePrice: 210_000,
    images: photoSet("folake"),
    photoTexture: "kinky-curly",
    seed: 77,
    parting: "middle",
    defaults: { length: 20, texture: "kinky-curly", colour: "natural-black", cap: "medium" },
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getLength(value: LengthInches): LengthOption {
  return LENGTHS.find((l) => l.value === value) ?? LENGTHS[0];
}

export function getTexture(value: TextureId): TextureOption {
  return TEXTURES.find((t) => t.value === value) ?? TEXTURES[0];
}

export function getColour(value: ColourId): ColourOption {
  return COLOURS.find((c) => c.value === value) ?? COLOURS[0];
}

export function getCap(value: CapSizeId): CapOption {
  return CAP_SIZES.find((c) => c.value === value) ?? CAP_SIZES[1];
}

/** Unit price in naira for a product in a given configuration. */
export function priceFor(product: Product, config: WigConfig): number {
  return (
    product.basePrice + getLength(config.length).addOn + getTexture(config.texture).addOn
  );
}

/** The lowest price a product can be configured at. */
export function startingPrice(product: Product): number {
  return product.basePrice;
}

/** Human summary of a configuration, e.g. `20" · Body wave · Burgundy · Medium cap`. */
export function describeConfig(config: WigConfig): string {
  return [
    getLength(config.length).label,
    getTexture(config.texture).label,
    getColour(config.colour).label,
    `${getCap(config.cap).label} cap`,
  ].join(" · ");
}
