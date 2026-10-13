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

describe('6c.4 stat gains taper', () => {
  it('ordinary gains to happiness, trí tuệ and mị lực shrink at the top, losses and other stats do not', async () => {
    const { ordinaryStat } = await import('../src/systems/aptitudeGain');
    const { Rng } = await import('../src/core/rng');
    const rng = new Rng('taper');
    expect(ordinaryStat('happiness', 50, 10, content, rng)).toBe(60);
    expect(ordinaryStat('happiness', 80, 10, content, rng)).toBe(85);
    expect(ordinaryStat('happiness', 95, 8, content, rng)).toBe(97);
    expect(ordinaryStat('happiness', 95, -8, content, rng)).toBe(87);
    expect(ordinaryStat('health', 95, 4, content, rng)).toBe(99);
    expect(ordinaryStat('charm', 99, 20, content, rng)).toBe(100);
  });
});

describe('6c.7 charmResist eases a check', () => {
  it('a charm-resisting trait raises the chance of a check marked with resist', async () => {
    const { checkChance } = await import('../src/systems/events/engine');
    const s = cultivator('kim_dan', 'resist');
    const guarded = { ...s, traits: ['huyen_tam'] };
    const plain = checkChance(s, content, 'stat.daoHeart', 60, 'charmResist');
    expect(checkChance(guarded, content, 'stat.daoHeart', 60, 'charmResist')).toBeGreaterThan(plain);
    // Without `resist`, the trait changes nothing.
    expect(checkChance(guarded, content, 'stat.daoHeart', 60)).toBeCloseTo(checkChance(s, content, 'stat.daoHeart', 60));
    // The new late-realm events carry the mark.
    const marked = content.events.filter((e) => e.choices.some((c) => c.check?.resist === 'charmResist')).map((e) => e.id);
    expect(marked).toEqual(expect.arrayContaining(['hr_nu_tu_mi_hoac', 'hr_ma_nu_cau_ban']));
  });

  it('there are events for Kim Đan, Nguyên Anh and Hóa Thần, with unique ids', () => {
    const hr = content.events.filter((e) => e.id.startsWith('hr_'));
    expect(hr.length).toBeGreaterThanOrEqual(30);
    expect(new Set(content.events.map((e) => e.id)).size).toBe(content.events.length);
    const from = (r: string) => hr.filter((e) => e.conditions.realm?.min === r).length;
    expect(from('kim_dan')).toBeGreaterThanOrEqual(10);
    expect(from('nguyen_anh')).toBeGreaterThanOrEqual(10);
    expect(from('hoa_than')).toBeGreaterThanOrEqual(8);
  });
});

describe('6c.7 late-realm events can come up', () => {
  it('Hóa Thần events with only a realm condition have weight for a Hóa Thần cultivator', async () => {
    const { eventWeight } = await import('../src/systems/events/engine');
    const s = { ...cultivator('hoa_than', 'late'), character: { ...cultivator('hoa_than', 'late').character, age: 400 } };
    const open = ['hr_chu_thien_giang_the', 'hr_pho_the_tu_nhan', 'hr_lao_ban_tu_quen', 'hr_kiep_nan_chap_chong', 'hr_thien_dao_tu_van', 'hr_nguoi_xua_ma_hoa'];
    for (const id of open) {
      const e = content.events.find((x) => x.id === id)!;
      expect(eventWeight(s, content, e), id).toBeGreaterThan(0);
    }
    const early = cultivator('kim_dan', 'late');
    expect(eventWeight(early, content, content.events.find((x) => x.id === 'hr_chu_thien_giang_the')!)).toBe(0);
  });
});
