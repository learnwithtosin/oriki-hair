"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef } from "react";
import { createRandom, range } from "@/lib/random";

interface HairFieldProps {
  className?: string;
  count?: number;
}

interface FieldStrand {
  x: number;
  length: number;
  width: number;
  opacity: number;
  phase: number;
  speed: number;
  amp: number;
  tone: 0 | 1 | 2;
}

const POINTS = 26;
const r = (v: number) => Math.round(v * 10) / 10;

/**
 * A slow field of hanging strands that sway in a warm breeze, lean towards the
 * cursor and part around it, like fingers drawn through hair.
 */
export function HairField({ className, count = 54 }: HairFieldProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduceMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathEls = useRef<(SVGPathElement | null)[]>([]);

  const strands = useMemo<FieldStrand[]>(() => {
    const random = createRandom(2026);
    return Array.from({ length: count }, (_, i) => {
      const t = (i + random() * 0.9) / count;
      const roll = random();
      return {
        // Denser towards the right edge, like a fall of hair entering the frame.
        x: 0.04 + Math.pow(t, 0.82) * 0.98,
        length: range(random, 0.72, 1.08),
        width: roll < 0.18 ? range(random, 4, 7) : range(random, 0.7, 1.9),
        opacity: roll < 0.18 ? range(random, 0.08, 0.16) : range(random, 0.35, 0.95),
        phase: random() * Math.PI * 2,
        speed: range(random, 0.7, 1.25),
        amp: range(random, 14, 34),
        tone: roll > 0.8 ? 2 : roll > 0.45 ? 1 : 0,
      };
    });
  }, [count]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let w = svg.clientWidth;
    let h = svg.clientHeight;
    const pointer = { x: w * 0.6, y: h * 0.5, tx: w * 0.6, ty: h * 0.5, active: 0, targetActive: 0 };

    const draw = (time: number) => {
      const t = time / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      pointer.active += (pointer.targetActive - pointer.active) * 0.04;
      const lean = ((pointer.x - w / 2) / w) * 46 * pointer.active;
      const sigmaX = Math.max(60, w * 0.07);
      const sigmaY = h * 0.32;

      strands.forEach((s, i) => {
        const el = pathEls.current[i];
        if (!el) return;
        const x0 = s.x * w;
        const L = h * s.length + 40;
        let d = "";
        let px = 0, py = 0;
        for (let j = 0; j < POINTS; j++) {
          const y = -30 + (j / (POINTS - 1)) * L;
          const p = Math.max(0, y / h);
          const weight = Math.pow(p, 1.25);
          const sway =
            (s.amp * Math.sin(t * 0.32 * s.speed + s.phase + y * 0.0045) +
              s.amp * 0.45 * Math.sin(t * 0.57 * s.speed + s.phase * 1.7 - y * 0.011)) *
            weight;
          const dx = x0 - pointer.x;
          const part =
            Math.sign(dx || 1) *
            42 *
            pointer.active *
            Math.exp(-(dx * dx) / (2 * sigmaX * sigmaX)) *
            Math.exp(-((y - pointer.y) ** 2) / (2 * sigmaY * sigmaY)) *
            Math.min(1, p * 3);
          const x = x0 + sway + lean * weight + part;
          if (j === 0) d = `M${r(x)} ${r(y)}`;
          else d += `Q${r(px)} ${r(py)} ${r((px + x) / 2)} ${r((py + y) / 2)}`;
          px = x;
          py = y;
        }
        el.setAttribute("d", d + `L${r(px)} ${r(py)}`);
      });
    };

    const resize = () => {
      w = svg.clientWidth;
      h = svg.clientHeight;
      if (reduceMotion) draw(0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(svg);

    if (reduceMotion) {
      draw(0);
      return () => ro.disconnect();
    }

    const onPointer = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      const inside = e.clientY > rect.top - 80 && e.clientY < rect.bottom + 80;
      pointer.targetActive = inside ? 1 : 0;
    };
    const onLeave = () => (pointer.targetActive = 0);

    let frame = 0;
    let visible = true;
    const loop = (time: number) => {
      draw(time);
      if (visible) frame = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) frame = requestAnimationFrame(loop);
    });
    io.observe(svg);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      visible = false;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [strands, reduceMotion]);

  const gid = (n: number) => `field-${uid}-${n}`;

  return (
    <svg ref={svgRef} className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <linearGradient id={gid(0)} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="var(--espresso)" />
          <stop offset="0.7" stopColor="#5a3a26" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
        <linearGradient id={gid(1)} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="var(--ink)" />
          <stop offset="1" stopColor="var(--espresso)" />
        </linearGradient>
        <linearGradient id={gid(2)} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#6b4a2c" />
          <stop offset="1" stopColor="#d9b06a" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        {strands.map((s, i) => (
          <motion.path
            key={i}
            ref={(el) => {
              pathEls.current[i] = el;
            }}
            stroke={`url(#${gid(s.tone)})`}
            strokeWidth={s.width}
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: s.opacity }}
            transition={{
              pathLength: { duration: 2.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 + (i % 9) * 0.08 },
              opacity: { duration: 1.2, delay: 0.3 + (i % 9) * 0.08 },
            }}
          />
        ))}
      </g>
    </svg>
  );
}
