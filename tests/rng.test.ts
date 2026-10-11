import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';

describe('Rng', () => {
  it('same seed gives the same sequence', () => {
    const a = new Rng('tu-tien');
    const b = new Rng('tu-tien');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds give different sequences', () => {
    expect(new Rng(1).next()).not.toEqual(new Rng(2).next());
  });

  it('resumes exactly from a saved state', () => {
    const rng = new Rng(42);
    for (let i = 0; i < 10; i++) rng.next();
    const resumed = Rng.fromState(rng.getState());
    expect(resumed.next()).toEqual(rng.next());
  });

  it('int stays within bounds and hits both ends', () => {
    const rng = new Rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('weighted pick roughly follows weights', () => {
    const rng = new Rng(123);
    const counts = { common: 0, rare: 0 };
    const items = [
      { id: 'common' as const, w: 9 },
      { id: 'rare' as const, w: 1 },
    ];
    for (let i = 0; i < 10000; i++) counts[rng.weighted(items, (it) => it.w).id]++;
    expect(counts.rare / 10000).toBeGreaterThan(0.08);
    expect(counts.rare / 10000).toBeLessThan(0.12);
  });

  it('weighted never picks zero-weight items', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 500; i++) {
      expect(rng.weighted(['a', 'b'], (x) => (x === 'a' ? 0 : 1))).toBe('b');
    }
  });

  it('shuffle keeps all items', () => {
    const out = new Rng(9).shuffle([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
