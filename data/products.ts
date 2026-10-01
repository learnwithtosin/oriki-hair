/**
 * Oriki Hair — product catalogue and pricing.
 *
 * Everything the storefront knows about a wig lives here. To use real
 * photography for a unit, set its `image` field to a path under /public
 * (e.g. "/products/adunni.jpg") and <ProductVisual> will render the photo
 * instead of the procedural <WigArt>. No other code changes are needed.
 */

export type LengthInches = 12 | 16 | 20 | 24 | 30;
export type TextureId = "straight" | "body-wave" | "deep-wave" | "curly";
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
  /** Optional product photo. When present it replaces the drawn wig. */
  image?: string;
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
  { value: 24, label: '24"', addOn: 120_000 },
  { value: 30, label: '30"', addOn: 210_000 },
];

export const TEXTURES: TextureOption[] = [
  { value: "straight", label: "Straight", addOn: 0 },
  { value: "body-wave", label: "Body wave", addOn: 15_000 },
  { value: "deep-wave", label: "Deep wave", addOn: 25_000 },
  { value: "curly", label: "Curly", addOn: 30_000 },
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

export const products: Product[] = [
  {
    id: "ewa",
    name: "Ewa",
    tagline: "The everyday body wave",
    construction: "4×4 lace closure",
    description:
      "Soft movement that settles the moment you shake it out. Ewa is the unit our clients reach for on a Tuesday — easy to install, forgiving in humidity.",
    basePrice: 85_000,
    seed: 7,
    parting: "middle",
    defaults: { length: 16, texture: "body-wave", colour: "dark-brown", cap: "medium" },
  },
  {
    id: "ayomide",
    name: "Ayomide",
    tagline: "Raw full lace, cut blunt",
    construction: "Full lace, raw Vietnamese hair",
    description:
      "A sharp jaw-length bob in raw, single-donor hair. Every strand is hand-tied to Swiss lace, so it parts anywhere and lies flat everywhere.",
    basePrice: 450_000,
    seed: 23,
    parting: "side",
    defaults: { length: 12, texture: "straight", colour: "ash-grey", cap: "small" },
  },
  {
    id: "adunni",
    name: "Adunni",
    tagline: "Bone straight, glass finish",
    construction: "13×4 HD lace frontal",
    description:
      "Our signature. Long, weighty, and so straight it catches light like lacquer. The HD frontal melts into every skin tone without tinting.",
    basePrice: 165_000,
    seed: 41,
    parting: "middle",
    defaults: { length: 24, texture: "straight", colour: "natural-black", cap: "medium" },
  },
  {
    id: "morenike",
    name: "Morenike",
    tagline: "Deep wave in wine",
    construction: "5×5 HD lace closure",
    description:
      "Defined, glossy waves dyed by hand in a deep wine that turns almost black indoors and ripe plum in the sun.",
    basePrice: 210_000,
    seed: 58,
    parting: "side",
    defaults: { length: 20, texture: "deep-wave", colour: "burgundy", cap: "medium" },
  },
  {
    id: "folake",
    name: "Folake",
    tagline: "Copper curls, glueless",
    construction: "Glueless 6×6 lace closure",
    description:
      "Springy, full-bodied curls in a warm copper. Pre-plucked, pre-bleached and fitted with an elastic band, so it goes on in minutes without adhesive.",
    basePrice: 245_000,
    seed: 77,
    parting: "middle",
    defaults: { length: 16, texture: "curly", colour: "copper", cap: "medium" },
  },
  {
    id: "titilayo",
    name: "Titilayo",
    tagline: "Honey, worn long",
    construction: "13×6 HD lace frontal",
    description:
      "Thirty inches of honey-blonde body wave, lifted at the root and toned to stay warm. The unit for the wedding, the shoot, the entrance.",
    basePrice: 320_000,
    seed: 93,
    parting: "middle",
    defaults: { length: 30, texture: "body-wave", colour: "honey-blonde", cap: "large" },
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
