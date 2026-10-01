import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WigConfig } from "@/data/products";

export interface CartItem {
  /** productId + options — identical configurations share a line. */
  key: string;
  productId: string;
  config: WigConfig;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (productId: string, config: WigConfig, unitPrice: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  replace: (items: CartItem[]) => void;
}

export function lineKey(productId: string, c: WigConfig) {
  return [productId, c.length, c.texture, c.colour, c.cap].join(":");
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (productId, config, unitPrice) =>
        set((state) => {
          const key = lineKey(productId, config);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return {
            items: [...state.items, { key, productId, config, unitPrice, quantity: 1 }],
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      replace: (items) => set({ items }),
    }),
    {
      name: "oriki-cart",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually after mount to keep server and client markup identical.
      skipHydration: true,
    },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}
