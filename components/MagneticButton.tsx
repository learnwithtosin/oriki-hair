"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ComponentPropsWithoutRef, PointerEvent, ReactNode } from "react";

type Common = {
  children: ReactNode;
  className?: string;
  /** How far the button follows the pointer, as a fraction of the offset. */
  strength?: number;
};

type AsButton = Common & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, keyof Common | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">;
type AsLink = Common & { href: string } & Omit<ComponentPropsWithoutRef<"a">, keyof Common | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">;

const SPRING = { stiffness: 180, damping: 18, mass: 0.6 };

/** A button (or link) that leans towards the pointer and springs back. */
export function MagneticButton(props: AsButton | AsLink) {
  const { children, className, strength = 0.28, ...rest } = props;
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const lx = useSpring(useMotionValue(0), SPRING);
  const ly = useSpring(useMotionValue(0), SPRING);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
    lx.set(dx * strength * 0.45);
    ly.set(dy * strength * 0.45);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
    lx.set(0);
    ly.set(0);
  };

  const inner = (
    <motion.span className="relative inline-flex items-center gap-3" style={{ x: lx, y: ly }}>
      {children}
    </motion.span>
  );

  if ("href" in rest && rest.href !== undefined) {
    const linkProps = rest as Omit<AsLink, keyof Common>;
    return (
      <motion.a
        {...linkProps}
        className={className}
        style={{ x: sx, y: sy }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {inner}
      </motion.a>
    );
  }
  const buttonProps = rest as Omit<AsButton, keyof Common>;
  return (
    <motion.button
      type="button"
      {...buttonProps}
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {inner}
    </motion.button>
  );
}
