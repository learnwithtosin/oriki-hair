"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { formatNaira } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { buildWhatsAppLink, cartSubtotal } from "@/lib/whatsapp";
import { cartCount, useCart } from "@/store/cart";
import { useShop } from "@/store/shop";
import { CartLine } from "./CartLine";

const SLIDE = { duration: 0.85, ease: EASE };

export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const items = useCart((s) => s.items);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    // In demo mode a focus ring would end up in the recording.
    if (!useShop.getState().demo) closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        // Claim the key so the configurator underneath stays open.
        e.preventDefault();
        setCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [open, setCartOpen]);

  // Keep Tab inside the drawer while it is open.
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-50 bg-espresso/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onKeyDown={trapFocus}
            className="fixed inset-y-0 right-0 z-50 flex w-[88vw] flex-col border-l border-rule bg-paper sm:w-[460px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SLIDE}
          >
            <header className="flex items-end justify-between border-b border-rule px-6 pb-5 pt-6 md:px-8 md:pt-8">
              <div>
                <p className="eyebrow tnum text-ink/45">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
                <h2 id="cart-title" className="mt-2 font-display text-[40px] leading-none tracking-[-0.03em]">
                  Your cart
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setCartOpen(false)}
                className="group flex items-center gap-2 pb-1 text-[13px] text-ink/70 transition-colors hover:text-ink"
              >
                Close
                <span aria-hidden className="relative block h-3 w-3">
                  <span className="absolute left-0 top-1/2 h-px w-3 rotate-45 bg-current transition-transform duration-500 ease-house group-hover:rotate-[135deg]" />
                  <span className="absolute left-0 top-1/2 h-px w-3 -rotate-45 bg-current transition-transform duration-500 ease-house group-hover:rotate-45" />
                </span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 md:px-8">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.3 } }}
                  className="pt-16 text-center"
                >
                  <p className="font-display text-[30px] italic leading-tight">Nothing here yet.</p>
                  <p className="mx-auto mt-3 max-w-[18rem] text-[14px] leading-relaxed text-ink/60">
                    Choose a unit from the collection and make it yours — it will wait for you here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-8 text-[13px] underline decoration-rule underline-offset-[6px] hover:decoration-ink"
                  >
                    Browse the collection
                  </button>
                </motion.div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <CartLine key={item.key} item={item} index={i} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            <motion.footer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.35 } }}
              className="border-t border-rule px-6 pb-6 pt-5 md:px-8 md:pb-8"
            >
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-ink/60">Subtotal</span>
                <span className="text-[26px] font-light tracking-[-0.01em] tnum">{formatNaira(subtotal)}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink/55">
                Delivery is quoted on WhatsApp. Lagos and Abuja in 24 hours, Port Harcourt in 48,
                everywhere else within the week.
              </p>
              {items.length > 0 ? (
                <a
                  href={buildWhatsAppLink(items)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-espresso text-[14px] tracking-[0.03em] text-paper transition-colors duration-500 hover:bg-ink"
                >
                  <WhatsAppGlyph />
                  Order on WhatsApp
                  <span aria-hidden className="transition-transform duration-500 ease-house group-hover:translate-x-1">
                    →
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-14 w-full cursor-not-allowed items-center justify-center rounded-full border border-rule text-[14px] text-ink/40"
                >
                  Order on WhatsApp
                </button>
              )}
            </motion.footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.2Z" strokeLinejoin="round" />
      <path d="M9 8.6c0 3.3 3.1 6.4 6.4 6.4l1.1-1.6-1.9-.9-.9.9a5 5 0 0 1-2.5-2.5l.9-.9-.9-1.9L9.6 9" strokeLinejoin="round" />
    </svg>
  );
}
