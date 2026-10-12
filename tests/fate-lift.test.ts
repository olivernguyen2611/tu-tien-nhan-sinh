import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { Trait } from '../src/core/schemas';
import { applyFateLift, confirmDestiny, fateScore } from '../src/systems/destiny';

const content = loadContent();
const trait = (id: string): Trait => content.traits.find((t) => t.id === id)!;
const base = () => createLife({ seed: 'fate-lift' }, content);
const LOW = { health: 31, happiness: 40, intellect: 32, charm: 33 };
const lowLife = () => {
  const b = base();
  return { ...b, stats: { ...b.stats, ...LOW }, aptitudes: { physique: 30, comprehension: 30, luck: 30, daoHeart: 30 } };
};
const stat = (s: ReturnType<typeof lowLife>['stats'] & ReturnType<typeof lowLife>['aptitudes'], k: string) => (s as Record<string, number>)[k];

describe('tiên thiên khí vận lifts starting stats (backlog 5)', () => {
  it('scores by rarity', () => {
    expect(fateScore([trait('kheo_mom')], content)).toBe(0);
    expect(fateScore([trait('tu_khi_dong_lai'), trait('thien_vong_huu_lau')], content)).toBe(20);
  });

  it('plain khí vận changes nothing', () => {
    const s = lowLife();
    const r = applyFateLift(s, [trait('kheo_mom'), trait('khoai_cuoc'), trait('can_cu')], content);
    expect(r.stats).toEqual(s.stats);
    expect(r.aptitudes).toEqual(s.aptitudes);
    expect(r.lifted).toBe(false);
  });

  it('a stronger khí vận gives higher stats, in proportion, and no low stat for a genius', () => {
    const s = lowLife();
    const mid = applyFateLift(s, [trait('tu_khi_dong_lai')], content);
    const top = applyFateLift(s, [trait('tu_khi_dong_lai'), trait('thien_vong_huu_lau')], content);
    const keys = content.balance.traits.fate.stats;
    const sum = (r: typeof mid) => keys.reduce((a, k) => a + stat({ ...r.stats, ...r.aptitudes }, k), 0);
    expect(sum(mid)).toBeGreaterThan(sum({ stats: s.stats, aptitudes: s.aptitudes, lifted: false }));
    expect(sum(top)).toBeGreaterThan(sum(mid));
    // A score of 20 floors every listed stat well above the low rolls.
    for (const k of keys) expect(stat({ ...top.stats, ...top.aptitudes }, k)).toBeGreaterThanOrEqual(content.balance.traits.fate.floorMax * 0.9);
    // Happiness is not part of it, and nothing goes past 100.
    expect(top.stats.happiness).toBe(LOW.happiness);
    for (const k of keys) expect(stat({ ...top.stats, ...top.aptitudes }, k)).toBeLessThanOrEqual(100);
  });

  it('is deterministic and never touches the RNG; confirming logs the lift', () => {
    const s = lowLife();
    const t = [trait('tu_khi_dong_lai'), trait('thien_vong_huu_lau')];
    expect(applyFateLift(s, t, content)).toEqual(applyFateLift(s, t, content));
    const forced = { ...s, destiny: { ...s.destiny, offered: t.map((x) => x.id) } };
    const done = confirmDestiny(forced, content);
    expect(done.rng).toEqual(forced.rng);
    expect(done.log[0].lines.some((l) => l.text === content.lifeTexts.fateLift)).toBe(true);
  });
});
