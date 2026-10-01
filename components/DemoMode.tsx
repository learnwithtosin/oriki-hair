"use client";

import { useEffect } from "react";
import { getProduct, type WigConfig } from "@/data/products";
import { addToCart } from "@/lib/actions";
import { useCart } from "@/store/cart";
import { useShop } from "@/store/shop";

const DEMO_PRODUCT = "adunni";

type Step =
  | { wait: number }
  | { set: Partial<WigConfig> }
  | { run: () => void };

/**
 * The ~22 second loop for screen recordings. Each `set` is followed by a
 * pause long enough for its 400–700ms transition to land and be seen.
 */
function script(): Step[] {
  const shop = () => useShop.getState();
  const product = getProduct(DEMO_PRODUCT)!;
  return [
    { run: () => scrollToCollection() },
    { wait: 1100 },
    { run: () => shop().open(DEMO_PRODUCT) },
    { wait: 1700 },
    { set: { length: 30 } },
    { wait: 1000 },
    { set: { length: 16 } },
    { wait: 1000 },
    { set: { length: 20 } },
    { wait: 1100 },
    { set: { texture: "body-wave" } },
    { wait: 1000 },
    { set: { texture: "deep-wave" } },
    { wait: 1000 },
    { set: { texture: "curly" } },
    { wait: 1200 },
    { set: { colour: "burgundy" } },
    { wait: 1000 },
    { set: { colour: "copper" } },
    { wait: 1000 },
    { set: { colour: "honey-blonde" } },
    { wait: 1100 },
    { set: { cap: "large" } },
    { wait: 1000 },
    { run: () => addToCart(product, shop().config) },
    { wait: 1300 },
    { run: () => shop().setCartOpen(true) },
    { wait: 3000 },
    { run: () => shop().setCartOpen(false) },
    { wait: 900 },
    { run: () => shop().close() },
    { wait: 1800 },
  ];
}

function scrollToCollection() {
  const el = document.getElementById("collection");
  if (!el) return;
  const navOffset = window.innerWidth >= 768 ? 72 : 56;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navOffset, behavior: "smooth" });
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/** Keyboard shortcut (D to start/stop, Esc to stop) and the auto-play loop. */
export function DemoMode() {
  const demo = useShop((s) => s.demo);
  const setDemo = useShop((s) => s.setDemo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "d" || e.key === "D") setDemo(!useShop.getState().demo);
      if (e.key === "Escape" && useShop.getState().demo) setDemo(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDemo]);

  useEffect(() => {
    if (!demo) return;
    const root = document.documentElement;
    root.classList.add("demo-mode");
    (document.activeElement as HTMLElement | null)?.blur();

    // The loop adds to the cart; put the visitor's real cart back afterwards.
    const snapshot = useCart.getState().items;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

    const play = async () => {
      const shop = useShop.getState();
      shop.setCartOpen(false);
      if (shop.activeId) {
        shop.close();
        await wait(1200);
      }
      while (!cancelled) {
        useCart.getState().replace(snapshot);
        for (const step of script()) {
          if (cancelled) return;
          if ("wait" in step) await wait(step.wait);
          else if ("set" in step) {
            for (const [key, value] of Object.entries(step.set)) {
              useShop.getState().setOption(key as keyof WigConfig, value as never);
            }
          } else step.run();
        }
      }
    };
    play();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      root.classList.remove("demo-mode");
      useCart.getState().replace(snapshot);
      useShop.getState().setCartOpen(false);
    };
  }, [demo]);

  return null;
}
