function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mixes `hex` towards `target` by `amount` (0–1). */
export function mix(hex: string, target: string, amount: number): string {
  const a = toRgb(hex);
  const b = toRgb(target);
  return (
    "#" +
    a
      .map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0"))
      .join("")
  );
}
