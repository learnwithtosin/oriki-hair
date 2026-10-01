"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

export interface RevealWord {
  text: string;
  className?: string;
}

interface RevealTextProps {
  /** Lines of words. Each line breaks on wide screens. */
  lines: (string | RevealWord)[][];
  as?: "h1" | "h2" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
  /** Reveal when scrolled into view instead of on mount. */
  inView?: boolean;
  suffix?: ReactNode;
}

/** Words rise out of a clipping mask one after another. */
export function RevealText({
  lines,
  as = "h2",
  className,
  delay = 0,
  stagger = 0.07,
  inView = false,
  suffix,
}: RevealTextProps) {
  const Tag = motion[as];
  let index = 0;
  const trigger = inView
    ? { initial: "hidden", whileInView: "shown", viewport: { once: true, amount: 0.6 } }
    : { initial: "hidden", animate: "shown" };

  return (
    <Tag className={className} {...trigger}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((w) => {
            const word = typeof w === "string" ? { text: w } : w;
            const i = index++;
            return (
              <span
                key={i}
                className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] pr-[0.06em] align-bottom"
              >
                <motion.span
                  className={`inline-block will-change-transform ${word.className ?? ""}`}
                  variants={{
                    hidden: { y: "110%", rotate: 3 },
                    shown: {
                      y: "0%",
                      rotate: 0,
                      transition: { duration: 1.1, ease: EASE, delay: delay + i * stagger },
                    },
                  }}
                >
                  {word.text}
                </motion.span>
                {" "}
              </span>
            );
          })}
        </span>
      ))}
      {suffix}
    </Tag>
  );
}
