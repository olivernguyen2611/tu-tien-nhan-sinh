import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { careerIncome, careerViews, careerYear, joinCareer, lifeTitles, promotionChance } from '../src/systems/career';
import { officeYear } from '../src/systems/office';
import { grantRoot } from '../src/systems/cultivation';
import { eventWeight, findEvent, resolveChoice } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();
const NONE = { grade: 'none', elements: [] };

function mortal(seed: string, age = 16, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age, originId: 'nong_dan' },
    stats: { health: 70, happiness: 50, intellect: 50, charm: 50 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    flags: {},
    log: [...b.log, { age, lines: [] }],
    ...patch,
  };
}
const rootless = (s: GameState): GameState => ({ ...s, cult: { ...s.cult, root: NONE } });
/** 10.2: Quan lộ needs Cử nhân (exam rank 2). */
const cuNhan = (s: GameState, rank = 2): GameState => ({ ...s, exam: { ...s.exam!, rank } });

describe('mortal careers (task 2.11)', () => {
  it('opens at 14 for mortals; Tạp dịch only for the tested rootless', () => {
    expect(careerViews(mortal('a', 12), content).every((c) => c.blocked)).toBe(true);
    const views = careerViews(mortal('a'), content);
    expect(views.filter((c) => !c.blocked).map((c) => c.id)).toEqual(['thuong', 'vo_lam', 'y']);
    expect(views.find((c) => c.id === 'quan')?.blocked).toContain('Cử nhân');
    expect(careerViews(cuNhan(mortal('a')), content).filter((c) => !c.blocked).map((c) => c.id)).toEqual(['quan', 'thuong', 'vo_lam', 'y']);
    expect(careerViews(rootless(mortal('a')), content).find((c) => c.id === 'tap_dich')?.blocked).toBeNull();
    const cult = mortal('a');
    expect(careerViews({ ...cult, cult: { ...cult.cult, realm: 'luyen_khi' } }, content).every((c) => c.blocked)).toBe(true);
  });

  it('joining starts at the first rung and pays a yearly income', () => {
    const s = joinCareer(cuNhan(mortal('b')), content, 'quan')!.state;
    expect(s.career).toEqual({ id: 'quan', rung: 0, since: 16 });
    expect(s.log.at(-1)!.lines.at(-1)!.text).toContain('Huyện thừa');
    // 12.2: a Tiến sĩ starts as thông phán; an official is paid by rank.
    expect(joinCareer(cuNhan(mortal('b'), 4), content, 'quan')!.state.career.rung).toBe(2);
    const pay = content.balance.office!.salary[0];
    expect(careerIncome(s, content)).toBe(pay);
    expect(careerYear(s, content).money.silver).toBe(s.money.silver + pay);
  });

  it('promotions wait a few years and follow the main stats', () => {
    // Y lộ (Quan lộ promotes by chính tích since 12.2, see office.test.ts).
    const s = joinCareer(mortal('c'), content, 'y')!.state;
    expect(promotionChance(s, content)).toBe(0);
    const later = { ...s, character: { ...s.character, age: 19 } };
    const smart = { ...later, stats: { ...later.stats, intellect: 90 }, aptitudes: { ...later.aptitudes, comprehension: 90 } };
    expect(promotionChance(smart, content)).toBeGreaterThan(promotionChance(later, content));
    expect(promotionChance({ ...later, flags: { nghe_thuoc: true } }, content)).toBeCloseTo(promotionChance(later, content) + 0.1);
  });

  it('a gifted scholar climbs several rungs over a life', () => {
    let s = joinCareer(cuNhan(mortal('d', 16, { stats: { health: 70, happiness: 50, intellect: 85, charm: 80 } })), content, 'quan')!.state;
    for (let age = 17; age <= 60; age++) s = officeYear(careerYear({ ...s, character: { ...s.character, age } }, content), content);
    expect(s.career.rung).toBeGreaterThanOrEqual(2);
  });

  it('top rung and a hundred years give titles', () => {
    const s = mortal('e', 101, { career: { id: 'y', rung: 4, since: 80 } });
    expect(lifeTitles(s, content)).toEqual(['Thần y cứu thế', 'Bình an trăm tuổi']);
    expect(lifeTitles(mortal('e', 50, { career: { id: 'y', rung: 3, since: 40 } }), content)).toEqual([]);
  });

  it('Tạp dịch triples kỳ vật events', () => {
    const lucky = rootless(mortal('f', 20, { aptitudes: { physique: 50, comprehension: 50, luck: 80, daoHeart: 50 } }));
    const ev = findEvent(content, 'linh_qua_nghin_nam')!;
    const base = eventWeight(lucky, content, ev);
    expect(base).toBeGreaterThan(0);
    const servant = joinCareer(lucky, content, 'tap_dich')!.state;
    expect(eventWeight(servant, content, ev)).toBeCloseTo(base * 3);
    expect(eventWeight({ ...lucky, aptitudes: { ...lucky.aptitudes, luck: 60 } }, content, ev)).toBe(0);
  });

  it('old saves get no career', () => {
    const { career: _c, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life.career).toEqual({ id: null, rung: 0, since: 0 });
  });
});

describe('Thiên địa kỳ vật (task 2.11)', () => {
  it('gives a rootless mortal a Ngũ or Tứ root at a cost to health (9.R4c: Luyện Khí waits for a technique)', () => {
    let tu = 0;
    for (let i = 0; i < 200; i++) {
      const s = rootless(mortal(`kv${i}`, 20));
      const r = grantRoot(s, content).state;
      expect(r.alive).toBe(true);
      expect(['ngu', 'tu']).toContain(r.cult.root!.grade);
      expect(r.cult.realm).toBe('pham_nhan');
      expect(r.stats.health).toBe(40);
      if (r.cult.root!.grade === 'tu') tu++;
    }
    expect(tu).toBeGreaterThan(20);
    expect(tu).toBeLessThan(65);
  });

  it('is deadlier past 30', () => {
    let dead = 0;
    for (let i = 0; i < 300; i++) if (!grantRoot(rootless(mortal(`old${i}`, 50)), content).state.alive) dead++;
    // (50 − 30) × 2% = 40%.
    expect(dead / 300).toBeGreaterThan(0.3);
    expect(dead / 300).toBeLessThan(0.5);
    const deadOne = Array.from({ length: 50 }, (_, i) => grantRoot(rootless(mortal(`old${i}`, 50)), content).state).find((s) => !s.alive)!;
    expect(deadOne.death?.cause).toBe('ordeal');
  });

  it('does nothing for someone who already has a root', () => {
    const s = mortal('has', 20, {});
    const rooted = { ...s, cult: { ...s.cult, root: { grade: 'tam', elements: ['kim', 'moc', 'thuy'] } } };
    expect(grantRoot(rooted, content).state).toBe(rooted);
  });

  it('works through the event choice', () => {
    const s = { ...rootless(mortal('ev', 20)), events: { pending: 'tuy_linh_mach', history: {}, followUps: [], npc: null } };
    const r = resolveChoice(s, content, 0);
    expect(r.state.cult.root?.grade).toMatch(/ngu|tu/);
    expect(r.text).toContain('Linh căn:');
  });
});

describe('event conditions on realm and root', () => {
  it('realm.min / realm.max follow realms.json order', () => {
    const s = mortal('r');
    const lk = { ...s, cult: { ...s.cult, realm: 'luyen_khi' } };
    expect(meets(s, { realm: { min: 'luyen_khi' } }, content)).toBe(false);
    expect(meets(lk, { realm: { min: 'luyen_khi' } }, content)).toBe(true);
    expect(meets(lk, { realm: { max: 'pham_nhan' } }, content)).toBe(false);
  });

  it('root.tested / root.usable', () => {
    const s = mortal('r2');
    expect(meets(s, { root: { tested: false } }, content)).toBe(true);
    expect(meets(rootless(s), { root: { usable: false } }, content)).toBe(true);
    expect(meets(s, { root: { usable: false } }, content)).toBe(false);
  });
});
