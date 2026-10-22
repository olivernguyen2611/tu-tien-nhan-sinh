import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { eventWeight, findEvent, resolveChoice } from '../src/systems/events/engine';
import { artsLine, festivalFor, pastimeOf, pastimeYear, petsLine } from '../src/systems/leisure';

const content = loadContent();
const cfg = content.balance.pastime!;

function adult(age = 25, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'leisure' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age }, money: { ...b.money, silver: 200 }, log: [...b.log, { age, lines: [] }], ...patch };
}

describe('10.7 giải trí', () => {
  it('one lễ hội a year opens its own activities, and the years differ', () => {
    const seen = new Set<string>();
    for (let age = 20; age < 40; age++) {
      const s = adult(age);
      const f = festivalFor(s, content)!;
      seen.add(f);
      const own = content.activities!.filter((a) => a.conditions.festival?.includes(f)).map((a) => a.id);
      const other = content.activities!.filter((a) => a.conditions.festival && !a.conditions.festival.includes(f)).map((a) => a.id);
      const ids = activityViews(s, content).map((v) => v.id);
      expect(own.length).toBeGreaterThanOrEqual(2);
      for (const id of own) expect(ids).toContain(id);
      for (const id of other) expect(ids).not.toContain(id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it('arts grow and show; a pet is bought, named, ages and dies', () => {
    let s = doActivity(adult(), content, 'hoc_dan')!.state;
    expect(pastimeOf(s).arts.cam).toBe(4);
    expect(artsLine(s, content)).toContain('Đàn 4');
    s = doActivity(s, content, 'mua_thu_nuoi')!.state;
    expect(s.events.pending).toBe('gt_mua_thu');
    s = resolveChoice(s, content, 0).state;
    expect(pastimeOf(s).pets).toHaveLength(1);
    expect(petsLine(s, content)).toContain('Chó');
    const life = content.leisure!.pets.find((p) => p.id === 'cho')!.lifespan;
    const before = s.stats.happiness;
    for (let i = 0; i < life; i++) s = pastimeYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(pastimeOf(s).pets).toHaveLength(0);
    expect(s.stats.happiness).not.toBe(before);
  });

  it('a quẻ names a coming event and makes it likelier', () => {
    const s = doActivity(adult(), content, 'xin_que')!.state;
    const o = pastimeOf(s).omen!;
    expect(o).toBeTruthy();
    const e = findEvent(content, o.id)!;
    const plain = { ...s, pastime: { ...pastimeOf(s), omen: null } };
    expect(eventWeight(s, content, e)).toBeCloseTo(eventWeight(plain, content, e) * cfg.omenMul);
  });

  it('too many nights at the sòng bạc become a habit that costs every year', () => {
    let s = adult();
    for (let i = 0; i < cfg.addictAt; i++) {
      s = doActivity({ ...s, money: { ...s.money, silver: 200 } }, content, 'chieu_bac')!.state;
      s = resolveChoice(s, content, 0).state;
      if (i % 3 === 2) s = { ...s, character: { ...s.character, age: s.character.age + 1 } };
    }
    s = pastimeYear(s, content);
    expect(s.flags.nghien_bac).toBe(true);
    const silver = s.money.silver;
    s = pastimeYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(s.money.silver).toBe(Math.max(0, silver + cfg.addictSilver));
  });
});
