import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeHooks, realmLabel, yearlyGain } from '../src/systems/cultivation';
import { findEvent, resolveChoice, eventWeight } from '../src/systems/events/engine';
import { martialPromote, martialView, trainMartial } from '../src/systems/martial';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();
const NONE = { grade: 'none', elements: [], body: null };

function mortal(age = 12, physique = 60, patch: Partial<GameState> = {}, seed = 'mar'): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age, originId: 'nong_dan' },
    stats: { health: 70, happiness: 50, intellect: 50, charm: 50 },
    aptitudes: { physique, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    flags: {},
    log: [...b.log, { age, lines: [] }],
    events: { pending: null, history: {}, followUps: [] },
    cult: { ...b.cult, root: NONE, lifespan: 75 },
    ...patch,
  };
}
const year = (s: GameState) => ({ ...s, character: { ...s.character, age: s.character.age + 1 } });

/** Train every year from 12 to 70; returns the highest stage reached. */
function lifetime(seed: string, physique: number, teacher: boolean): number {
  let s = mortal(12, physique, teacher ? { flags: { luc_hop_mon: true } } : {}, seed);
  s = { ...s, rng: new Rng(seed).getState() };
  for (let age = 12; age <= 70; age++) {
    s = trainMartial(s, content)?.state ?? s;
    s = year(s);
  }
  return s.martial.stage;
}

describe('martial path (task 3.11)', () => {
  it('training years lead to Tam lưu; once a year only', () => {
    let s = mortal(12, 100);
    const first = trainMartial(s, content)!;
    expect(first.state.martial.years).toBe(1);
    expect(trainMartial(first.state, content)).toBeNull();
    s = first.state;
    for (let i = 0; i < 6 && s.martial.stage < 0; i++) s = trainMartial(year(s), content)!.state;
    expect(s.martial.stage).toBe(0);
    expect(realmLabel(s, content)).toBe('Phàm Nhân · Tam lưu');
  });

  it('Nhất lưu needs a teacher; Hóa cảnh needs Căn cốt 70', () => {
    expect(martialView(mortal(20, 60, { martial: { stage: 1, years: 5, bonus: 0, lastTrain: null } }), content).gate).toContain('sư phụ');
    expect(martialView(mortal(20, 60, { martial: { stage: 1, years: 5, bonus: 0, lastTrain: null }, flags: { luc_hop_mon: true } }), content).gate).toBeNull();
    expect(martialView(mortal(30, 65, { martial: { stage: 3, years: 10, bonus: 0, lastTrain: null } }), content).gate).toContain('Căn cốt 70');
  });

  it('the last two stages need a kỳ ngộ', () => {
    const s = mortal(40, 90, { martial: { stage: 4, years: 0, bonus: 0, lastTrain: null } });
    expect(martialView(s, content).blocked).toContain('kỳ ngộ');
  });

  it('stages add lifespan; past 50 the chance halves', () => {
    const s = mortal(30, 80, { martial: { stage: 3, years: 10, bonus: 0, lastTrain: null } });
    expect(martialPromote(s, content).cult.lifespan).toBe(75 + 30);
    const old = { ...s, character: { ...s.character, age: 55 } };
    expect(martialView(old, content).chance).toBeCloseTo(martialView(s, content).chance / 2);
  });

  it('Ngũ khí triều nguyên becomes a Ngũ linh căn and Luyện Khí 1, keeping the body edge', () => {
    const s = martialPromote(mortal(50, 90, { martial: { stage: 5, years: 0, bonus: 0, lastTrain: null } }), content);
    expect(s.cult.root?.grade).toBe('ngu');
    expect(s.cult.realm).toBe('luyen_khi');
    expect(s.cult.technique).toBe('dan_khi_quyet');
    expect(lifeHooks(s, content).some((h) => h.hook === 'path.body.affinity' && h.add === 30)).toBe(true);
    expect(yearlyGain(s, content)).toBeGreaterThan(0);
  });

  it('balance: a dedicated high-Căn-cốt fighter with a teacher reaches Hóa cảnh about 40% of the time', () => {
    let hoa = 0;
    for (let i = 0; i < 300; i++) if (lifetime(`sim${i}`, 75, true) >= 4) hoa++;
    expect(hoa / 300).toBeGreaterThan(0.25);
    expect(hoa / 300).toBeLessThan(0.6);
    // Căn cốt below 70 never reaches Hóa cảnh by training.
    for (let i = 0; i < 50; i++) expect(lifetime(`low${i}`, 65, true)).toBeLessThan(4);
  });

  it('events: Lục Hợp Môn makes a Tam lưu; Hóa cảnh event needs readiness', () => {
    const kid = mortal(12, 80, { character: { ...mortal().character, age: 12, originId: 'vo_lam' } });
    expect(eventWeight(kid, content, findEvent(content, 'bai_nhap_luc_hop_mon')!)).toBeGreaterThan(0);
    const r = resolveChoice({ ...kid, events: { ...kid.events, pending: 'bai_nhap_luc_hop_mon' } }, content, 0).state;
    if (r.flags.luc_hop_mon) expect(r.martial.stage).toBe(0);
    const peak = mortal(40, 75, { martial: { stage: 3, years: 3, bonus: 0, lastTrain: null } });
    expect(eventWeight(peak, content, findEvent(content, 'dot_pha_hoa_canh')!)).toBe(0);
    const ready = { ...peak, martial: { ...peak.martial, years: 10 } };
    expect(eventWeight(ready, content, findEvent(content, 'dot_pha_hoa_canh')!)).toBeGreaterThan(0);
  });

  it('old saves have no martial path', () => {
    const { martial: _m, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life.martial.stage).toBe(-1);
  });
});
