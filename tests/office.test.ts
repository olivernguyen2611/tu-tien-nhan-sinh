import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { careerIncome, careerLabel } from '../src/systems/career';
import { initCourt } from '../src/systems/court';
import { meets } from '../src/systems/events/conditions';
import { defendChance, officeDefend, officeJoin, officeLine, officeOf, officePromoteChance, officeYear, setOfficeFaction, setOfficeStyle } from '../src/systems/office';
import { migrate, makeSave } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.office!;
const life = (silver = 2000, age = 30): GameState => {
  const s = createLife({ seed: 'quan-truong', originId: content.origins[0].id }, content);
  return { ...s, character: { ...s.character, age }, money: { ...s.money, silver } };
};
const official = (rung = 1, patch: Partial<NonNullable<GameState['office']>> = {}): GameState => {
  const s = life();
  return { ...s, court: initCourt(s, content), career: { id: 'quan', rung, since: 20 }, office: { style: 'vua_phai', faction: 'trung_lap', patron: null, merit: 0, evidence: 0, via: 'exam', impeached: null, best: rung, ...patch } };
};

describe('Quan trường (12.2)', () => {
  it('Quan lộ has 8 ranks, each with a phẩm and a salary', () => {
    const quan = content.careers.careers.find((c) => c.id === 'quan')!;
    expect(quan.rungs).toHaveLength(8);
    expect(content.office!.grades).toHaveLength(8);
    expect(cfg.salary).toHaveLength(8);
    expect(careerIncome(official(3), content)).toBe(cfg.salary[3]);
    expect(careerLabel(official(7), content)).toContain('Tể tướng');
  });

  it('buying an office takes the bigger seat the purse allows; a poor man gets nothing', () => {
    const rich = officeJoin(life(1500), content, 'buy');
    expect(rich.career).toMatchObject({ id: 'quan', rung: 1 });
    expect(rich.money.silver).toBe(1500 - cfg.buyCost[1]);
    expect(officeOf(rich, content)).toMatchObject({ via: 'buy', evidence: cfg.buyEvidence });
    const poor = officeJoin(life(100), content, 'buy');
    expect(poor.career.id).toBeNull();
    const rec = officeJoin(life(0), content, 'recommend');
    expect(officeOf(rec, content)?.via).toBe('recommend');
  });

  it('a dirty hand skims silver and piles up tội chứng; a clean one gains hương danh', () => {
    const tham = officeYear(setOfficeStyle(official(), content, 'tham'), content);
    const sach = officeYear(setOfficeStyle(official(1, { evidence: 10 }), content, 'thanh_liem'), content);
    expect(tham.money.silver).toBeGreaterThan(official().money.silver);
    expect(officeOf(tham, content)!.evidence).toBeGreaterThan(0);
    expect(officeOf(sach, content)!.evidence).toBeLessThan(10);
    expect(sach.social.reputation.lang_xa).toBeGreaterThan(official().social.reputation.lang_xa);
  });

  it('promotion needs years at the rank and enough chính tích; a bought office stops at buyCap', () => {
    expect(officePromoteChance(official(1, { merit: 0 }), content)).toBe(0);
    const ready = official(1, { merit: 100 });
    expect(officePromoteChance(ready, content)).toBeGreaterThan(0);
    expect(officePromoteChance(official(cfg.buyCap, { merit: 100, via: 'buy' }), content)).toBe(0);
    let s = ready;
    for (let i = 0; i < 20 && s.career.rung === 1; i++) s = officeYear({ ...s, character: { ...s.character, age: s.character.age + 1 }, office: { ...s.office!, merit: 100 } }, content);
    expect(s.career.rung).toBe(2);
  });

  it('the quyền thần phe needs a quyền thần, and his fall drags his men down', () => {
    const s = official(2);
    expect(setOfficeFaction(s, content, 'quyen_than').office!.faction).toBe('trung_lap');
    const withMinister = { ...s, court: { ...s.court!, minister: { name: 'Tần Khải', sway: 60 } } };
    const man = setOfficeFaction(withMinister, content, 'quyen_than');
    expect(man.office).toMatchObject({ faction: 'quyen_than', patron: 'Tần Khải' });
    // The minister falls: over many seeds, some of his men lose their seats.
    let hit = 0;
    for (let i = 0; i < 20; i++) {
      const fallen = officeYear({ ...man, seed: `purge-${i}`, court: { ...man.court!, minister: null } }, content);
      if (fallen.career.rung < 2 || fallen.career.id === null) hit++;
      else expect(fallen.office!.faction).toBe('trung_lap');
    }
    expect(hit).toBeGreaterThan(0);
  });

  it('an đàn hặc is harder to beat with tội chứng; the worst record can cost the head', () => {
    expect(defendChance(official(2, { evidence: 80 }), content)).toBeLessThan(defendChance(official(2, { evidence: 0 }), content));
    expect(defendChance(official(2), content, true)).toBeGreaterThan(defendChance(official(2), content));
    let dead = 0;
    let lost = 0;
    for (let i = 0; i < 30; i++) {
      const s = officeDefend({ ...official(3, { evidence: 90 }), seed: `dh-${i}` }, content, 'argue');
      if (!s.alive) dead++;
      if (s.career.id === null) lost++;
    }
    expect(dead).toBeGreaterThan(0);
    expect(lost).toBeGreaterThan(20);
    expect(officeDefend(official(2), content, 'confess').career.id).toBeNull();
  });

  it('conditions read the office; the profile shows it', () => {
    const s = official(5, { style: 'thanh_liem' });
    expect(meets(s, { office: { held: true, atCourt: true, style: ['thanh_liem'] } }, content)).toBe(true);
    expect(meets(life(), { office: { held: false } }, content)).toBe(true);
    expect(meets(life(), { office: { rankMin: 0 } }, content)).toBe(false);
    expect(officeLine(s, content)).toContain('Thị lang');
  });

  it('an old official keeps the same office on the wider ladder', () => {
    const s = { ...official(2), office: undefined };
    const life8 = migrate({ ...makeSave(s, 1), saveVersion: 7 }).life;
    expect(life8.career.rung).toBe(3);
    expect(migrate({ ...makeSave(s, 1), saveVersion: 8 }).life.career.rung).toBe(2);
  });
});
