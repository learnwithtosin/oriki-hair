/** Small, fast seeded PRNG (mulberry32). Same seed → same sequence everywhere. */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Random = ReturnType<typeof createRandom>;

export function range(random: Random, min: number, max: number) {
  return min + random() * (max - min);
}
