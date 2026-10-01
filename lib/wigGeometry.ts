/**
 * Procedural wig geometry.
 *
 * A wig is drawn on a 400×520 canvas over a faceless head form. Every strand
 * has a fixed number of points regardless of length or texture, so any two
 * configurations can be morphed into each other by interpolating point arrays.
 *
 * Each strand has two parts:
 *   1. an arc from the parting over the dome of the head, following an
 *      ellipse between the outer silhouette (depth 0) and the hairline (depth 1);
 *   2. a fall from the side of the head, where texture (waves, curls) is applied.
 */
import type { LengthInches, Parting, TextureId } from "@/data/products";
import { createRandom, range } from "./random";

export const VIEW_W = 400;
export const VIEW_H = 520;
export const HEAD = { cx: 200, cy: 172, rx: 64, ry: 82 } as const;

const ARC_POINTS = 12;
const FALL_POINTS = 60;
export const POINTS_PER_STRAND = ARC_POINTS + FALL_POINTS;
const CAP_POINTS = 48;

export type Layer = "nape" | "back" | "front";
/** 0 = base gradient, 1 = lowlight, 2 = highlight. */
export type Tone = 0 | 1 | 2;

export interface StrandSeed {
  layer: Layer;
  side: -1 | 1;
  depth: number;
  width: number;
  opacity: number;
  tone: Tone;
  lengthJitter: number;
  ampJitter: number;
  phase: number;
  gap: number;
  napeX: number;
  /** Highlight copies are drawn for a subset of front strands. */
  sheen: boolean;
}

interface TextureParams {
  amp: number;
  wavelength: number;
  /** 1 = all strands wave in unison, 0 = every strand on its own phase. */
  coherence: number;
  /** Vertical coil amplitude — makes curls loop back on themselves. */
  coil: number;
  shrink: number;
  volume: number;
  flare: number;
  arcNoise: number;
}

const TEXTURES: Record<TextureId, TextureParams> = {
  straight: { amp: 1.2, wavelength: 260, coherence: 1, coil: 0, shrink: 1, volume: 0, flare: 1, arcNoise: 0 },
  "body-wave": { amp: 10, wavelength: 118, coherence: 0.88, coil: 0, shrink: 0.97, volume: 5, flare: 1.3, arcNoise: 0.8 },
  "deep-wave": { amp: 8, wavelength: 56, coherence: 0.62, coil: 1.2, shrink: 0.92, volume: 9, flare: 1.6, arcNoise: 1.6 },
  curly: { amp: 7.5, wavelength: 34, coherence: 0.08, coil: 4.6, shrink: 0.84, volume: 15, flare: 2.1, arcNoise: 2.6 },
};

/** Visible fall below the widest point of the head for a given length. */
export function fallLength(length: LengthInches) {
  return 78 + ((length - 12) / 18) * 245;
}

export function tipY(length: LengthInches, texture: TextureId) {
  return HEAD.cy + fallLength(length) * TEXTURES[texture].shrink + 14;
}

const COUNTS = { nape: 36, back: 34, front: 36 } as const;

export function createStrandSeeds(seed: number): StrandSeed[] {
  const random = createRandom(seed * 9973 + 17);
  const strands: StrandSeed[] = [];

  const base = (layer: Layer, side: -1 | 1, depth: number): StrandSeed => {
    const toneRoll = random();
    const tone: Tone =
      layer === "nape"
        ? toneRoll < 0.6 ? 1 : 0
        : layer === "back"
          ? toneRoll < 0.25 ? 1 : toneRoll > 0.85 ? 2 : 0
          : toneRoll < 0.15 ? 1 : toneRoll > 0.72 ? 2 : 0;
    return {
      layer,
      side,
      depth,
      width:
        layer === "nape" ? range(random, 2, 3.2)
        : layer === "back" ? range(random, 1.6, 2.8)
        : range(random, 1.1, 2.2),
      opacity: range(random, 0.62, 1),
      tone,
      lengthJitter: range(random, 0.94, 1.04),
      ampJitter: range(random, 0.75, 1.2),
      phase: random(),
      gap: range(random, 0.04, 0.1),
      napeX: range(random, -60, 60),
      sheen: layer === "front" && random() < 0.55,
    };
  };

  for (let i = 0; i < COUNTS.nape; i++) strands.push(base("nape", i % 2 ? 1 : -1, 0));
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < COUNTS.back; i++) {
      strands.push(base("back", side, (i / COUNTS.back) * 0.42 + random() * 0.02));
    }
  }
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < COUNTS.front; i++) {
      strands.push(base("front", side, 0.42 + (i / (COUNTS.front - 1)) * 0.58));
    }
  }
  return strands;
}

export interface WigShape {
  length: LengthInches;
  texture: TextureId;
  parting: Parting;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function ellipseFor(depth: number, volume: number) {
  const { rx, ry, cy } = HEAD;
  return {
    rx: lerp(rx + 12 + volume, rx - 10, depth),
    ry: lerp(ry + 10 + volume * 0.8, ry - 8, depth),
    cy: lerp(cy - 2, cy + 16, depth),
  };
}

function partOffset(parting: Parting) {
  return parting === "side" ? -26 : 0;
}

/** Writes one strand's points (x0, y0, x1, y1, …) into `out` at `offset`. */
function writeStrand(s: StrandSeed, shape: WigShape, out: Float32Array, offset: number) {
  const tex = TEXTURES[shape.texture];
  const fall = fallLength(shape.length) * tex.shrink * s.lengthJitter;
  const phase = (1 - tex.coherence) * s.phase * Math.PI * 2 + s.depth * 0.9;
  const k = (Math.PI * 2) / tex.wavelength;
  const amp = tex.amp * s.ampJitter;
  const coil = tex.coil * s.ampJitter;

  const wave = (u: number) => {
    const ramp = Math.min(1, u / 28);
    return {
      dx: amp * ramp * Math.sin(k * u + phase),
      dy: coil * ramp * Math.cos(k * u + phase),
    };
  };

  if (s.layer === "nape") {
    const x0 = HEAD.cx + s.napeX;
    const y0 = HEAD.cy + 10;
    const total = fall - 6;
    for (let i = 0; i < POINTS_PER_STRAND; i++) {
      const u = (i / (POINTS_PER_STRAND - 1)) * total;
      const p = u / total;
      const { dx, dy } = wave(u + 40);
      const spread = (s.napeX / 60) * (10 + tex.volume) * tex.flare * (1 - (1 - p) * (1 - p));
      out[offset + i * 2] = x0 + spread + dx;
      out[offset + i * 2 + 1] = y0 + u + dy;
    }
    return;
  }

  const e = ellipseFor(s.depth, tex.volume);
  const px = partOffset(shape.parting);
  const thetaPart = -Math.acos(Math.max(-0.95, Math.min(0.95, px / e.rx)));
  const thetaStart = thetaPart + s.side * s.gap;
  const thetaEnd = s.side > 0 ? 0 : -Math.PI;

  // Arc over the dome.
  const arcLen = Math.abs(thetaEnd - thetaStart) * (e.rx + e.ry) * 0.5;
  for (let i = 0; i < ARC_POINTS; i++) {
    const t = i / ARC_POINTS;
    const theta = lerp(thetaStart, thetaEnd, t);
    const noise = tex.arcNoise * Math.sin((t * arcLen) / 7 + s.phase * 6.28) * Math.min(1, t * 4);
    out[offset + i * 2] = HEAD.cx + (e.rx + noise) * Math.cos(theta);
    out[offset + i * 2 + 1] = e.cy + (e.ry + noise) * Math.sin(theta);
  }

  // Fall from the side of the head.
  const startX = HEAD.cx + s.side * e.rx;
  const startY = e.cy;
  const f = Math.max(12, fall - (e.cy - (HEAD.cy - 2)));
  const flare = (8 + 26 * (1 - s.depth)) * tex.flare * Math.min(1, f / 160);
  for (let j = 0; j < FALL_POINTS; j++) {
    const u = ((j + 1) / FALL_POINTS) * f;
    const p = u / f;
    const { dx, dy } = wave(u);
    const idx = offset + (ARC_POINTS + j) * 2;
    out[idx] = startX + s.side * flare * (1 - (1 - p) * (1 - p)) + dx;
    out[idx + 1] = startY + u + dy;
  }
}

/** Outline of the hair mass over the dome — fills gaps between strands. */
function writeCap(shape: WigShape, out: Float32Array) {
  const tex = TEXTURES[shape.texture];
  const outer = ellipseFor(0.02, tex.volume);
  const inner = ellipseFor(1, tex.volume);
  const half = CAP_POINTS / 2;
  for (let i = 0; i < half; i++) {
    const theta = lerp(-Math.PI, 0, i / (half - 1));
    out[i * 2] = HEAD.cx + (outer.rx - 3) * Math.cos(theta);
    out[i * 2 + 1] = outer.cy + (outer.ry - 3) * Math.sin(theta);
  }
  for (let i = 0; i < half; i++) {
    const theta = lerp(0, -Math.PI, i / (half - 1));
    const idx = (half + i) * 2;
    out[idx] = HEAD.cx + (inner.rx + 2) * Math.cos(theta);
    out[idx + 1] = inner.cy + (inner.ry + 2) * Math.sin(theta);
  }
}

export interface WigGeometry {
  strands: Float32Array;
  cap: Float32Array;
  tip: number;
}

export function computeGeometry(seeds: StrandSeed[], shape: WigShape): WigGeometry {
  const strands = new Float32Array(seeds.length * POINTS_PER_STRAND * 2);
  seeds.forEach((s, i) => writeStrand(s, shape, strands, i * POINTS_PER_STRAND * 2));
  const cap = new Float32Array(CAP_POINTS * 2);
  writeCap(shape, cap);
  return { strands, cap, tip: tipY(shape.length, shape.texture) };
}

export function mixGeometry(a: WigGeometry, b: WigGeometry, t: number, out: WigGeometry) {
  for (let i = 0; i < out.strands.length; i++) out.strands[i] = a.strands[i] + (b.strands[i] - a.strands[i]) * t;
  for (let i = 0; i < out.cap.length; i++) out.cap[i] = a.cap[i] + (b.cap[i] - a.cap[i]) * t;
  out.tip = a.tip + (b.tip - a.tip) * t;
}

export function cloneGeometry(g: WigGeometry): WigGeometry {
  return { strands: g.strands.slice(), cap: g.cap.slice(), tip: g.tip };
}

const r = (v: number) => Math.round(v * 10) / 10;

/** Smooth path through a strand's points using quadratic midpoint splines. */
export function strandPath(points: Float32Array, strandIndex: number): string {
  const o = strandIndex * POINTS_PER_STRAND * 2;
  const n = POINTS_PER_STRAND;
  let d = `M${r(points[o])} ${r(points[o + 1])}`;
  for (let i = 1; i < n - 1; i++) {
    const x = points[o + i * 2], y = points[o + i * 2 + 1];
    const mx = (x + points[o + i * 2 + 2]) / 2, my = (y + points[o + i * 2 + 3]) / 2;
    d += `Q${r(x)} ${r(y)} ${r(mx)} ${r(my)}`;
  }
  d += `L${r(points[o + (n - 1) * 2])} ${r(points[o + (n - 1) * 2 + 1])}`;
  return d;
}

export function capPath(points: Float32Array): string {
  let d = `M${r(points[0])} ${r(points[1])}`;
  for (let i = 1; i < points.length / 2; i++) d += `L${r(points[i * 2])} ${r(points[i * 2 + 1])}`;
  return d + "Z";
}
