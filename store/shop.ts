import { create } from "zustand";
import { getProduct, type WigConfig } from "@/data/products";

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

  open: (id: string) => void;
  close: () => void;
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

  open: (id) => {
    const product = getProduct(id);
    if (!product) return;
    set({ activeId: id, lastActiveId: id, config: { ...product.defaults } });
  },
  close: () => set({ activeId: null }),
  setOption: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setDemo: (demo) => set({ demo }),
  markAdded: () => set((s) => ({ addedTick: s.addedTick + 1 })),
}));
