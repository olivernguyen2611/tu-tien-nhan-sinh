import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { gateChance, gateFlag, gatesYear } from '../src/systems/immortalGates';

const content = loadContent();
const gates = content.immortalGates ?? [];
const gate = (id: string) => gates.find((g) => g.id === id)!;
const all = (content.knowledge ?? []).map((e) => e.id);
const kid = (seed: string, age: number, originId = 'nong_dan', knowledge: string[] = all): GameState => {
  const b = createLife({ seed, originId, knowledge }, content);
  return { ...b, character: { ...b.character, age }, aptitudes: { ...b.aptitudes, luck: 50 }, events: { ...b.events, followUps: [] } };
};

/** Did a gate open between 6 and 40 (rolling the gates only)? */
function opened(s: GameState): boolean {
  for (let age = 6; age <= 40; age++) {
    const t = gatesYear({ ...s, character: { ...s.character, age } }, content);
    if (t.events.followUps.length) return true;
  }
  return false;
}

describe('9.R4b tiên duyên gates', () => {
  it('there are five gates, a to e', () => {
    expect(gates.map((g) => g.id)).toEqual(['hoi_thu_do', 'the_gia', 'hoang_that', 'co_duyen', 'pham_gian']);
  });

  it('a gate is shut outside its conditions, and scaled down without its knowledge', () => {
    const a = gate('hoi_thu_do');
    expect(gateChance(kid('g1', 5), content, a)).toBe(0);
    expect(gateChance(kid('g1', 20), content, a)).toBe(0);
    const known = gateChance(kid('g1', 10), content, a);
    expect(known).toBeCloseTo(content.balance.immortalGates!.chance.hoi_thu_do);
    // 9.R5b: hội thu đồ and cơ duyên stay shut to a life born knowing nothing; cơ duyên phàm gian is only scaled down.
    expect(gateChance(kid('g1', 10, 'nong_dan', []), content, a)).toBe(0);
    const gifted = (k: string[]) => { const s = kid('g1', 20, 'nong_dan', k); return { ...s, aptitudes: { ...s.aptitudes, comprehension: 90 } }; };
    expect(gateChance(gifted(all), content, gate('co_duyen'))).toBeGreaterThan(0);
    expect(gateChance(gifted([]), content, gate('co_duyen'))).toBe(0);
    const fighter3 = (k: string[]) => { const s = kid('g1', 30, 'nong_dan', k); return { ...s, martial: { ...s.martial, stage: 3 } }; };
    expect(gateChance(fighter3([]), content, gate('pham_gian')) / gateChance(fighter3(all), content, gate('pham_gian'))).toBeCloseTo(content.balance.immortalGates!.unknownMul);
    // What a life learns itself opens doors only for the lives after it.
    const learned = { ...kid('g1', 10, 'nong_dan', []), knowledge: ['tien_mon_thu_do'], knowledgeNew: ['tien_mon_thu_do'] };
    expect(gateChance(learned, content, a)).toBe(0);
    // Luck helps.
    const lucky = kid('g1', 10);
    expect(gateChance({ ...lucky, aptitudes: { ...lucky.aptitudes, luck: 80 } }, content, a)).toBeGreaterThan(known);
    // Thế gia and triều đình need the origin; Cơ duyên phàm gian needs Tuyệt đỉnh.
    expect(gateChance(kid('g1', 7), content, gate('the_gia'))).toBe(0);
    expect(gateChance(kid('g1', 7, 'tu_tien_gia_toc'), content, gate('the_gia'))).toBeGreaterThan(0.5);
    expect(gateChance(kid('g1', 10, 'quan_gia'), content, gate('hoang_that'))).toBeGreaterThan(0);
    const fighter = kid('g1', 30);
    expect(gateChance(fighter, content, gate('pham_gian'))).toBe(0);
    expect(gateChance({ ...fighter, martial: { ...fighter.martial, stage: 3 } }, content, gate('pham_gian'))).toBeGreaterThan(0);
  });

  it('an open gate brings its event this very year, once a life', () => {
    let s = kid('g2', 7, 'tu_tien_gia_toc');
    for (let i = 0; i < 5 && !s.flags[gateFlag(gate('the_gia'))]; i++) s = gatesYear({ ...s, character: { ...s.character, age: 6 + i } }, content);
    expect(s.flags[gateFlag(gate('the_gia'))]).toBe(true);
    expect(s.events.followUps[0].event).toBe('the_gia_thu_linh');
    expect(gateChance(s, content, gate('the_gia'))).toBe(0);
    const next = advanceYear({ ...s, character: { ...s.character, age: s.events.followUps[0].atAge - 1 } }, content);
    expect(next.events.pending).toBe('the_gia_thu_linh');
  });

  it('a known root shuts every gate', () => {
    const s = kid('g3', 10);
    expect(gatesYear({ ...s, cult: { ...s.cult, root: { grade: 'none', elements: [] } } }, content).events.followUps).toHaveLength(0);
  });

  it('a seasoned player is found far more often than a first life (9.R5b: a first life only by rare cơ duyên)', () => {
    let seasoned = 0;
    let first = 0;
    for (let i = 0; i < 300; i++) {
      if (opened(kid(`gs${i}`, 6))) seasoned++;
      if (opened(kid(`gs${i}`, 6, 'nong_dan', []))) first++;
    }
    expect(seasoned / 300).toBeGreaterThan(0.5);
    expect(first / 300).toBeLessThan(0.05);
  });
});
