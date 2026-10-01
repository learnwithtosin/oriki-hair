import { create } from "zustand";
import { getProduct, type WigConfig } from "@/data/products";

/** Where the page should scroll after the view switches. */
export type ScrollIntent = "collection" | "collection-instant" | "top" | "none";

interface ShopState {
  /** Product open in the configurator, or null when the collection row is showing. */
  activeId: string | null;
  /** Last product opened — the row uses it to choreograph the return. */
  lastActiveId: string | null;
  config: WigConfig;
  cartOpen: boolean;
  demo: boolean;
  /** Increments on every add-to-cart, so the button can play its confirmation. */
  addedTick: number;
  scrollIntent: ScrollIntent;
  /** Bumped when the page boots straight into a wig, to skip the row's exit. */
  bootKey: number;

  /**
   * Low-level state changes. UI code should call `openWig` / `closeWig` from
   * lib/navigation instead, which keep the URL and browser history in step.
   */
  open: (id: string, scroll?: ScrollIntent) => void;
  close: (scroll?: ScrollIntent) => void;
  setOption: <K extends keyof WigConfig>(key: K, value: WigConfig[K]) => void;
  setCartOpen: (open: boolean) => void;
  setDemo: (demo: boolean) => void;
  markAdded: () => void;
}

export const useShop = create<ShopState>()((set) => ({
  activeId: null,
  lastActiveId: null,
  config: { length: 24, texture: "straight", colour: "natural-black", cap: "medium" },
  cartOpen: false,
  demo: false,
  addedTick: 0,
  scrollIntent: "collection",
  bootKey: 0,

  open: (id, scroll = "collection") => {
    const product = getProduct(id);
    if (!product) return;
    set((s) => ({
      activeId: id,
      lastActiveId: id,
      config: { ...product.defaults },
      scrollIntent: scroll,
      // Arriving by link/refresh there is no row to fly from: remount instead of exiting.
      bootKey: scroll === "collection-instant" ? s.bootKey + 1 : s.bootKey,
    }));
  },
  close: (scroll = "collection") => set({ activeId: null, scrollIntent: scroll }),
  setOption: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setDemo: (demo) => set({ demo }),
  markAdded: () => set((s) => ({ addedTick: s.addedTick + 1 })),
}));
