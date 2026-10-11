// Seeded random number generator (sfc32). All game randomness goes through
// this so a seed + the same choices always replays the same life.

export type RngState = [number, number, number, number];

/** Hash a string seed (e.g. "tu-tien-2026") into a 32-bit number. */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Spread one 32-bit seed into a full 4-word state (splitmix32). */
function expandSeed(seed: number): RngState {
  const out: number[] = [];
  let x = seed >>> 0;
  for (let i = 0; i < 4; i++) {
    x = (x + 0x9e3779b9) >>> 0;
    let z = x;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    out.push((z ^ (z >>> 16)) >>> 0);
  }
  return out as RngState;
}

export class Rng {
  private s: RngState;

  constructor(seed: number | string) {
    this.s = expandSeed(typeof seed === 'string' ? hashSeed(seed) : seed);
  }

  /** Resume from a saved state (see SaveSystem). */
  static fromState(state: RngState): Rng {
    const rng = new Rng(0);
    rng.s = [...state] as RngState;
    return rng;
  }

  getState(): RngState {
    return [...this.s] as RngState;
  }

  /** Float in [0, 1). */
  next(): number {
    let [a, b, c, d] = this.s;
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) >>> 0;
    this.s = [a >>> 0, b, c, d];
    return t / 4294967296;
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[Math.floor(this.next() * items.length)];
  }

  /** Pick one item, each with probability proportional to its weight. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    const weights = items.map((it) => Math.max(0, weightOf(it)));
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total <= 0) throw new Error('Rng.weighted: no positive weights');
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** New shuffled copy (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
