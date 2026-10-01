import { describeConfig, getProduct } from "@/data/products";
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
    const lineTotal = formatNaira(item.unitPrice * item.quantity);
    return [
      `${i + 1}. ${name}`,
      `   ${describeConfig(item.config)}`,
      `   Qty ${item.quantity} × ${formatNaira(item.unitPrice)} = ${lineTotal}`,
    ].join("\n");
  });

  return [
    "Hello Oriki, I'd like to place an order:",
    "",
    ...lines,
    "",
    `Total: ${formatNaira(cartSubtotal(items))}`,
    "",
    "Please confirm availability and delivery to:",
  ].join("\n");
}

export function buildWhatsAppLink(items: CartItem[]): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(items))}`;
}
