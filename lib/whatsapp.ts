import { getCap, getColour, getLength, getProduct, getTexture } from "@/data/products";
import type { CartItem } from "@/store/cart";
import { formatNaira } from "./format";

export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000"
).replace(/\D/g, "");

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function buildOrderMessage(items: CartItem[]): string {
  const lines = items.map((item, i) => {
    const name = getProduct(item.productId)?.name ?? item.productId;
    const { config } = item;
    return [
      `${i + 1}. ${name}`,
      `   Length: ${getLength(config.length).label}`,
      `   Texture: ${getTexture(config.texture).label}`,
      `   Colour: ${getColour(config.colour).label}`,
      `   Cap size: ${getCap(config.cap).label}`,
      `   Qty: ${item.quantity}`,
      `   Line total: ${formatNaira(item.unitPrice * item.quantity)}`,
    ].join("\n");
  });

  return [
    "Hello Oriki, I'd like to place an order:",
    "",
    lines.join("\n\n"),
    "",
    `Total: ${formatNaira(cartSubtotal(items))}`,
    "",
    "Please confirm availability and delivery cost.",
  ].join("\n");
}

/** Line breaks are kept as \n and survive encodeURIComponent as %0A. */
export function buildWhatsAppLink(items: CartItem[]): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(items))}`;
}
