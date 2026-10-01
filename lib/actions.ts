import { priceFor, type Product, type WigConfig } from "@/data/products";
import { useCart } from "@/store/cart";
import { useShop } from "@/store/shop";

/** Adds a configured wig to the cart and lets the UI play its confirmation. */
export function addToCart(product: Product, config: WigConfig) {
  useCart.getState().add(product.id, config, priceFor(product, config));
  useShop.getState().markAdded();
}
