"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type MouseEvent } from "react";
import { EASE } from "@/lib/motion";
import { closeWig } from "@/lib/navigation";
import { cartCount, useCart } from "@/store/cart";
import { useShop } from "@/store/shop";

const LINKS = [
  { href: "#collection", label: "Collection" },
  { href: "#care", label: "Care" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const count = useCart((s) => cartCount(s.items));
  const setCartOpen = useShop((s) => s.setCartOpen);
  const activeId = useShop((s) => s.activeId);

  // With a wig open, "Collection" and the logo close it rather than just scrolling.
  const leaveConfigurator = (scroll: "collection" | "top") => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!activeId) return;
    e.preventDefault();
    closeWig(scroll);
  };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.1 }}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-700 ease-house ${
        scrolled
          ? "border-b border-rule bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 md:h-[72px] md:px-10"
      >
        <a href="#top" onClick={leaveConfigurator("top")} className="font-display text-[28px] leading-none tracking-[-0.03em] md:text-[34px]">
          oriki
          <span className="sr-only"> Hair — home</span>
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={link.href === "#collection" ? leaveConfigurator("collection") : undefined}
                className="group relative text-[13px] tracking-[0.02em] text-ink/80 transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-house group-hover:origin-left group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="group flex items-center gap-2 text-[13px] tracking-[0.02em]"
          aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
        >
          <span className="hidden sm:inline">Cart</span>
          <span className="sm:hidden">Bag</span>
          <span className="relative inline-flex h-6 min-w-6 items-center justify-center overflow-hidden rounded-full border border-ink/70 px-1.5 text-[11px] tnum transition-colors duration-500 group-hover:bg-ink group-hover:text-paper">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
      </nav>
    </motion.header>
  );
}
