import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { ordinaryAptitude } from '../src/systems/aptitudeGain';

const content = loadContent();
const cfg = content.balance.aptitudeGain;

/** Mean gain of `add` at `current` over many draws. */
function meanGain(current: number, add: number, key = 'comprehension'): number {
  const rng = new Rng('apt');
  let sum = 0;
  for (let i = 0; i < 2000; i++) sum += ordinaryAptitude(key, current, add, content, rng) - current;
  return sum / 2000;
}

describe('ordinary aptitude gains (6b.9)', () => {
  it('a low aptitude takes the full gain', () => {
    expect(meanGain(40, 3)).toBe(3);
  });

  it('gains shrink past softAt and again past hardAt, about in proportion', () => {
    expect(meanGain(cfg.softAt, 2)).toBeCloseTo(2 * cfg.softMul, 1);
    expect(meanGain(cfg.hardAt, 2)).toBeCloseTo(2 * cfg.hardMul, 1);
  });

  it('losses and other stats are never scaled', () => {
    expect(meanGain(90, -4)).toBe(-4);
    expect(meanGain(90, 3, 'daoHeart')).toBe(3);
  });

  it('stays within 0–100', () => {
    expect(ordinaryAptitude('luck', 99, 5, content, new Rng('x'))).toBeLessThanOrEqual(100);
    expect(ordinaryAptitude('luck', 1, -5, content, new Rng('x'))).toBe(0);
  });
});
