"use client";

import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { EASE } from "@/lib/motion";

export interface OptionItem<T> {
  value: T;
  label: string;
  /** Colour fill for swatch-style options. */
  swatch?: string;
}

interface OptionGroupProps<T extends string | number> {
  /** Unique name — also scopes the sliding selection indicator. */
  name: string;
  label: string;
  /** Readout shown beside the label, e.g. the selected colour's name. */
  readout?: string;
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "text" | "swatch";
}

const PILL = { type: "tween", duration: 0.55, ease: EASE } as const;

/**
 * A radio group with roving focus: Tab enters at the selection, arrow keys
 * move and select, Home/End jump to the ends.
 */
export function OptionGroup<T extends string | number>({
  name,
  label,
  readout,
  options,
  value,
  onChange,
  variant = "text",
}: OptionGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = selectedIndex === last ? 0 : selectedIndex + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = selectedIndex === 0 ? last : selectedIndex - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="border-t border-rule pt-3 md:grid md:grid-cols-[8.5rem_1fr] md:items-center md:gap-4 md:py-3.5">
      <div className="mb-2 flex items-baseline justify-between md:mb-0 md:block">
        <span id={`${name}-label`} className="eyebrow text-ink/60">
          {label}
        </span>
        {readout && <span className="text-[12px] text-ink/55 tnum md:mt-1.5 md:block">{readout}</span>}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        onKeyDown={onKeyDown}
        className={variant === "swatch" ? "flex flex-wrap gap-3.5 md:gap-4" : "-ml-1 flex flex-wrap gap-0.5 md:gap-1"}
      >
        {options.map((option, i) => {
          const selected = i === selectedIndex;
          return (
            <button
              key={String(option.value)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={variant === "swatch" ? option.label : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={
                variant === "swatch"
                  ? "relative flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-offset-[7px] md:h-9 md:w-9"
                  : `relative h-9 rounded-full px-3.5 text-[13px] transition-colors duration-500 md:h-10 md:px-4 md:text-[14px] ${
                      selected ? "text-ink" : "text-ink/50 hover:text-ink"
                    }`
              }
            >
              {selected && (
                <motion.span
                  layoutId={`pill-${name}`}
                  transition={PILL}
                  className={
                    variant === "swatch"
                      ? "absolute -inset-[5px] rounded-full border border-gold"
                      : "absolute inset-0 rounded-full border border-ink/80"
                  }
                />
              )}
              {variant === "swatch" ? (
                <span
                  className="block h-full w-full rounded-full ring-1 ring-ink/10 ring-inset"
                  style={{ background: option.swatch }}
                />
              ) : (
                <span className="relative tnum">{option.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
