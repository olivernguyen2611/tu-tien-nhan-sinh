import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { ageBody, checkDeath, deathCause, lifeSummary } from '../src/systems/time';

const content = loadContent();

function cultivator(realm: string, seed: string): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 30 },
    stats: { ...b.stats, health: 80 },
    aptitudes: { ...b.aptitudes, luck: 0, physique: 0 },
    cult: { ...b.cult, realm },
    log: [...b.log, { age: 30, lines: [] }],
  };
}

describe('6c.3 calamity (tai ương)', () => {
  it('hits cultivators now and then, never mortals or Luyện Khí', () => {
    const count = (realm: string) => {
      let hit = 0;
      for (let i = 0; i < 300; i++) {
        const s = cultivator(realm, `cal-${realm}-${i}`);
        if (ageBody(s, content).stats.health < s.stats.health) hit++;
      }
      return hit;
    };
    expect(count('pham_nhan')).toBe(0);
    expect(count('luyen_khi')).toBe(0);
    expect(count('hoa_than')).toBeGreaterThan(count('kim_dan'));
    expect(count('kim_dan')).toBeGreaterThan(0);
  });

  it('luck and physique lower the chance, with a floor', () => {
    const c = content.balance.aging.calamity;
    const lucky = (i: number) => {
      const s = cultivator('hoa_than', `cal-lucky-${i}`);
      return { ...s, aptitudes: { ...s.aptitudes, luck: 100, physique: 100 } };
    };
    let plain = 0;
    let guarded = 0;
    for (let i = 0; i < 400; i++) {
      const p = cultivator('hoa_than', `cal-lucky-${i}`);
      if (ageBody(p, content).stats.health < p.stats.health) plain++;
      const g = lucky(i);
      if (ageBody(g, content).stats.health < g.stats.health) guarded++;
    }
    expect(guarded).toBeLessThan(plain);
    expect(c.minChance).toBeGreaterThan(0);
  });

  it('a cultivator who drops to 0 health dies of calamity, a mortal of illness', () => {
    const k = { ...cultivator('kim_dan', 'cal-die'), stats: { ...cultivator('kim_dan', 'x').stats, health: 0 } };
    expect(deathCause(k)).toBe('calamity');
    const dead = checkDeath(k, content);
    expect(dead.death?.cause).toBe('calamity');
    expect(lifeSummary(dead, content)!.causeText).toContain('tai ương');
    const m = { ...cultivator('pham_nhan', 'cal-mortal'), stats: { ...cultivator('pham_nhan', 'y').stats, health: 0 } };
    expect(deathCause(m)).toBe('illness');
  });
});
