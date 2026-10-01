/** The house easing — slow out, no bounce. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
}

/** Evaluates cubic-bezier(0.22, 1, 0.36, 1) for use in hand-rolled rAF loops. */
export function houseEase(x: number): number {
  const p1x = 0.22, p1y = 1, p2x = 0.36, p2y = 1;
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 20; i++) {
    t = (lo + hi) / 2;
    if (bx(t) < x) lo = t;
    else hi = t;
  }
  return by(t);
}
