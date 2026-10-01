"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  getColour,
  getLength,
  getTexture,
  type ColourId,
  type LengthInches,
  type Parting,
  type TextureId,
} from "@/data/products";
import { mix } from "@/lib/color";
import { EASE, houseEase } from "@/lib/motion";
import {
  HEAD,
  VIEW_H,
  VIEW_W,
  VIEW_Y,
  capPath,
  cloneGeometry,
  computeGeometry,
  createStrandSeeds,
  massBounds,
  massPath,
  mixGeometry,
  strandPath,
  type WigGeometry,
} from "@/lib/wigGeometry";

export interface WigArtProps {
  length: LengthInches;
  texture: TextureId;
  colour: ColourId;
  /** Stable seed — each product gets its own strand layout. */
  seed: number;
  parting?: Parting;
  className?: string;
  /** Plays the slow highlight sweep. Off for thumbnails. */
  sheen?: boolean;
}

const MORPH_MS = 650;
const COLOUR_TRANSITION = { duration: 0.6, ease: EASE };

export function WigArt({
  length,
  texture,
  colour,
  seed,
  parting = "middle",
  className,
  sheen = true,
}: WigArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduceMotion = useReducedMotion();
  const seeds = useMemo(() => createStrandSeeds(seed), [seed]);
  const bounds = useMemo(() => massBounds(seeds), [seeds]);

  // The first geometry is rendered by React (and on the server). Every later
  // change is animated imperatively so React never re-renders mid-morph.
  const [initial] = useState(() => computeGeometry(seeds, { length, texture, parting }));
  const current = useRef<WigGeometry>(cloneGeometry(initial));
  const strandEls = useRef<(SVGPathElement | null)[]>([]);
  const sheenEls = useRef<(SVGPathElement | null)[]>([]);
  const capEl = useRef<SVGPathElement>(null);
  const massEls = useRef<(SVGPathElement | null)[]>([]);
  const gradientEls = useRef<(SVGLinearGradientElement | null)[]>([]);
  const shapeKey = useRef(`${length}|${texture}|${parting}`);

  useEffect(() => {
    const key = `${length}|${texture}|${parting}`;
    if (key === shapeKey.current) return;
    shapeKey.current = key;
    const target = computeGeometry(seeds, { length, texture, parting });
    const from = cloneGeometry(current.current);
    const draw = (g: WigGeometry) => {
      for (let i = 0; i < seeds.length; i++) {
        const d = strandPath(g.strands, i);
        strandEls.current[i]?.setAttribute("d", d);
        sheenEls.current[i]?.setAttribute("d", d);
      }
      capEl.current?.setAttribute("d", capPath(g.cap));
      bounds.forEach(([outer, inner], k) => massEls.current[k]?.setAttribute("d", massPath(g.strands, outer, inner)));
      const y2 = String(Math.round(g.tip));
      for (const el of gradientEls.current) el?.setAttribute("y2", y2);
    };

    if (reduceMotion) {
      current.current = target;
      draw(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MORPH_MS);
      mixGeometry(from, target, houseEase(t), current.current);
      draw(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seeds, bounds, length, texture, parting, reduceMotion]);

  const shades = getColour(colour).shades;
  const tones = [
    shades,
    shades.map((s) => mix(s, "#000000", 0.38)),
    shades.map((s, i) => mix(s, "#fff4e2", 0.1 + i * 0.1)),
  ];
  const sheenColour = mix(shades[2], "#fff8ee", 0.7);

  const label = `${getLength(length).label} ${getTexture(texture).label.toLowerCase()} wig in ${getColour(colour).label.toLowerCase()}`;
  const gid = (n: number) => `wig-${uid}-g${n}`;
  const layers = { nape: [] as number[], back: [] as number[], front: [] as number[] };
  seeds.forEach((s, i) => layers[s.layer].push(i));

  const renderStrand = (i: number) => {
    const s = seeds[i];
    return (
      <path
        key={i}
        ref={(el) => {
          strandEls.current[i] = el;
        }}
        d={strandPath(initial.strands, i)}
        stroke={`url(#${gid(s.tone)})`}
        strokeWidth={s.width}
        opacity={s.opacity}
        suppressHydrationWarning
      />
    );
  };

  return (
    <svg
      viewBox={`0 ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {tones.map((stops, n) => (
          <linearGradient
            key={n}
            id={gid(n)}
            ref={(el) => {
              gradientEls.current[n] = el;
            }}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="86"
            x2="0"
            y2={Math.round(initial.tip)}
            suppressHydrationWarning
          >
            {stops.map((c, k) => (
              <motion.stop
                key={k}
                offset={["0", "0.4", "1"][k]}
                initial={false}
                animate={{ stopColor: c }}
                transition={COLOUR_TRANSITION}
              />
            ))}
          </linearGradient>
        ))}
        {sheen && (
          <>
            <linearGradient id={`wig-${uid}-band`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
              <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id={`wig-${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y={VIEW_Y} width={VIEW_W} height={VIEW_H}>
              <g className={reduceMotion ? undefined : "wig-sweep"}>
                <rect
                  x={-VIEW_W}
                  y={VIEW_Y - 60}
                  width={VIEW_W * 3}
                  height={VIEW_H + 120}
                  fill={`url(#wig-${uid}-band)`}
                  transform={`rotate(-18 ${VIEW_W / 2} ${VIEW_Y + VIEW_H / 2})`}
                />
              </g>
            </mask>
          </>
        )}
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {layers.nape.map(renderStrand)}
        {layers.back.map(renderStrand)}
      </g>

      {/* Head form */}
      <g>
        <path
          d={`M${HEAD.cx - 30} ${HEAD.cy + 58} C ${HEAD.cx - 26} ${HEAD.cy + 120}, ${HEAD.cx - 22} ${HEAD.cy + 150}, ${HEAD.cx - 34} ${HEAD.cy + 172} L ${HEAD.cx + 34} ${HEAD.cy + 172} C ${HEAD.cx + 22} ${HEAD.cy + 150}, ${HEAD.cx + 26} ${HEAD.cy + 120}, ${HEAD.cx + 30} ${HEAD.cy + 58} Z`}
          fill="#e2d6c6"
        />
        <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill="#e9dfd2" />
        <ellipse
          cx={HEAD.cx - 14}
          cy={HEAD.cy + 18}
          rx={HEAD.rx * 0.42}
          ry={HEAD.ry * 0.52}
          fill="#f1e9de"
          opacity="0.7"
        />
        <ellipse cx={HEAD.cx} cy={HEAD.cy + 172} rx="40" ry="5" fill="#2a1b14" />
        <rect x={HEAD.cx - 4} y={HEAD.cy + 172} width="8" height={VIEW_Y + VIEW_H} fill="#2a1b14" />
      </g>

      {bounds.map(([outer, inner], k) => (
        <path
          key={k}
          ref={(el) => {
            massEls.current[k] = el;
          }}
          d={massPath(initial.strands, outer, inner)}
          fill={`url(#${gid(1)})`}
          opacity="0.82"
          suppressHydrationWarning
        />
      ))}

      <motion.path
        ref={capEl}
        d={capPath(initial.cap)}
        initial={false}
        animate={{ fill: shades[0] }}
        transition={COLOUR_TRANSITION}
        suppressHydrationWarning
      />

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {layers.front.map(renderStrand)}
      </g>

      {sheen && (
        <motion.g
          fill="none"
          strokeLinecap="round"
          mask={`url(#wig-${uid}-mask)`}
          initial={false}
          animate={{ stroke: sheenColour }}
          transition={COLOUR_TRANSITION}
        >
          {layers.front
            .filter((i) => seeds[i].sheen)
            .map((i) => (
              <path
                key={i}
                ref={(el) => {
                  sheenEls.current[i] = el;
                }}
                d={strandPath(initial.strands, i)}
                strokeWidth={seeds[i].width * 0.55}
                opacity={0.55}
                suppressHydrationWarning
              />
            ))}
        </motion.g>
      )}
    </svg>
  );
}
