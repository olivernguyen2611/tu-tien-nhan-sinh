import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { realFestival, withRealDate } from '../src/systems/calendar';
import { festivalFor } from '../src/systems/leisure';
import { eventWeight } from '../src/systems/events/engine';
import { kinYear } from '../src/systems/kin';
import { lifeMeets } from '../src/systems/achievements';
import { challengeDef } from '../src/systems/challenge';

const content = loadContent();
const born = createLife({ seed: 'lich', originId: 'nong_dan' }, content);
const at = (age: number, s: GameState = born): GameState => ({ ...s, character: { ...s.character, age } });

describe('Lịch lễ hội thật (10.13)', () => {
  it('finds the real lễ hội within the window, none outside', () => {
    expect(realFestival(content, new Date(2026, 8, 25))).toBe('trung_thu');
    expect(realFestival(content, new Date(2026, 8, 27))).toBe('trung_thu');
    expect(realFestival(content, new Date(2027, 1, 6))).toBe('tet');
    expect(realFestival(content, new Date(2026, 6, 1))).toBeNull();
    expect(withRealDate(born, content, new Date(2026, 8, 25)).realFestival).toBe('trung_thu');
  });

  it('most years of a real festival week keep that lễ hội', () => {
    const real = { ...born, realFestival: 'trung_thu' };
    let same = 0;
    let plain = 0;
    for (let age = 10; age < 110; age++) {
      if (festivalFor(at(age, real), content) === 'trung_thu') same++;
      if (festivalFor(at(age), content) === 'trung_thu') plain++;
    }
    expect(same).toBeGreaterThan(plain * 2);
    expect(same).toBeGreaterThan(60);
  });

  it('festival events weigh more in a real festival week', () => {
    const ev = content.events.find((e) => e.id === 'lh_trung_thu_trang')!;
    // An age where the year's lễ hội is Trung thu either way.
    let age = 10;
    while (festivalFor(at(age), content) !== 'trung_thu') age++;
    const plain = eventWeight(at(age), content, ev);
    const real = eventWeight(at(age, { ...born, realFestival: 'trung_thu' }), content, ev);
    expect(plain).toBeGreaterThan(0);
    expect(real).toBeCloseTo(plain * content.balance.calendar!.boost);
  });
});

describe('Thiên Đạo Khảo Nghiệm cho mọi lối sống (10.13)', () => {
  it('a child coming of age may pass Tú tài; the gia phả marks it', () => {
    const kin = { elder: null, relatives: [], forebears: [], split: false, heir: null, rules: ['hieu_hoc'], shrine: 0, rites: 0 };
    const child = { id: 'c1', role: 'child' as const, gender: 'nam' as const, name: 'Lê Văn Bảo', age: 18, alive: true, lifespan: 70, affinity: 50, lastActions: {}, rearing: -10, insight: 80 };
    const cfg = { ...content, balance: { ...content.balance, kin: { ...content.balance.kin!, scholar: { ...content.balance.kin!.scholar!, base: 1, max: 1 } } } };
    const s = kinYear({ ...at(45), kin, family: [...born.family, child] }, cfg);
    expect(s.family.find((r) => r.id === 'c1')!.scholar).toBe(true);
    expect(s.log.at(-1)!.lines.some((l) => l.text.includes('Lê Văn Bảo'))).toBe(true);
  });

  it('the new goals read the life: no martial stage, children with Tú tài, escapes', () => {
    const dead = { ...at(70), alive: false };
    expect(lifeMeets(dead, content, { martialMax: -1 }, 1)).toBe(dead.martial.stage < 0);
    const kids = Array.from({ length: 5 }, (_, i) => ({ id: `k${i}`, role: 'child' as const, gender: 'nu' as const, name: `Con ${i}`, age: 30, alive: true, lifespan: 70, affinity: 50, lastActions: {}, scholar: true }));
    expect(lifeMeets({ ...dead, family: kids }, content, challengeDef(content, 'ngu_tu_dang_khoa')!.goal, 1)).toBe(true);
    expect(lifeMeets(dead, content, challengeDef(content, 'ngu_tu_dang_khoa')!.goal, 1)).toBe(false);
    const law = { wanted: 0, jail: null, trial: null, convictions: 3, escapes: 3, failedEscapes: 0, lastCrime: null, lastCrimeAge: null };
    expect(lifeMeets({ ...dead, law }, content, challengeDef(content, 'ba_lan_vuot_nguc')!.goal, 1)).toBe(true);
  });

  it('the world has challenges for the mortal lifestyles, not only cultivators', () => {
    const mortal = content.challenges.filter((c) => c.goal.holds || c.goal.crimesMin || c.goal.scholarKidsMin || c.goal.mortal);
    expect(mortal.length).toBeGreaterThanOrEqual(8);
  });
});
