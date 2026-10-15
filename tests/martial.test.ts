import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeHooks, realmLabel, rootLabel, yearlyGain } from '../src/systems/cultivation';
import { findEvent, resolveChoice, eventWeight } from '../src/systems/events/engine';
import { combatPower } from '../src/systems/combat';
import { learnBlocked, techniqueById } from '../src/systems/technique';
import { martialPromote, martialView, mortalManual, trainMartial } from '../src/systems/martial';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();
const NONE = { grade: 'none', elements: [] };

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
    events: { pending: null, history: {}, followUps: [], npc: null },
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

  it('playtest 2026-10-12: no countdown; high Căn cốt and Ngộ tính break through sooner', () => {
    /** Years of training until Tam lưu, averaged over seeds. */
    const avg = (physique: number, comprehension: number) => {
      let total = 0;
      for (let i = 0; i < 200; i++) {
        let s = mortal(12, physique, {}, `t${i}`);
        s = { ...s, rng: new Rng(`t${i}`).getState(), aptitudes: { ...s.aptitudes, comprehension } };
        let n = 0;
        while (s.martial.stage < 0 && n < 40) { s = year(trainMartial(s, content)!.state); n++; }
        total += n;
      }
      return total / 200;
    };
    const gifted = avg(95, 95);
    const plain = avg(40, 40);
    expect(gifted).toBeLessThan(plain);
    // Some gifted trainees make it in the very first year.
    expect(gifted).toBeLessThan(content.balance.martial.steps[0].years * 2);
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
    expect(martialPromote(s, content).cult.lifespan).toBe(75 + 30 + content.martial.manual.lifespan);
    const old = { ...s, character: { ...s.character, age: 55 } };
    expect(martialView(old, content).chance).toBeCloseTo(martialView(s, content).chance / 2);
  });

  it('Ngũ khí triều nguyên gives the Ngũ khí root (better than Ngũ linh căn) with Tiên Võ thể, and Luyện Khí 1', () => {
    const s = martialPromote(mortal(50, 90, { martial: { stage: 5, years: 0, bonus: 0, lastTrain: null } }), content);
    expect(s.cult.root?.grade).toBe('ngu_khi');
    expect(rootLabel(s, content)).toBe('Ngũ khí');
    expect(s.cult.bodyId).toBe('tien_vo_the');
    const grades = content.balance.roots.gradeSpeed;
    expect(grades.ngu_khi).toBeGreaterThan(grades.song);
    expect(lifeHooks(s, content).some((h) => h.hook === 'bottleneckResist')).toBe(true);
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

  it('playtest 2026-10-12: Hóa cảnh senses Tam hoa; kỳ ngộ lead to Tam hoa tụ đỉnh and Ngũ khí triều nguyên', () => {
    const hoa = mortal(45, 90, { martial: { stage: 4, years: 0, bonus: 0, lastTrain: null } });
    const sense = findEvent(content, 'vd_cam_ung_tam_hoa')!;
    expect(eventWeight(hoa, content, sense)).toBeGreaterThan(0);
    // The kỳ ngộ need the sensing first, and are rare.
    const falls = findEvent(content, 'vd_tam_hoa_thac_bang')!;
    expect(eventWeight(hoa, content, falls)).toBe(0);
    const sensed = resolveChoice({ ...hoa, events: { ...hoa.events, pending: sense.id } }, content, 0).state;
    expect(sensed.flags.cam_ung_tam_hoa).toBe(true);
    expect(eventWeight(sensed, content, falls)).toBeGreaterThan(0);
    expect(falls.weight).toBeLessThan(1);
    // A success makes Tam hoa tụ đỉnh.
    const strong = { ...sensed, aptitudes: { ...sensed.aptitudes, daoHeart: 100 } };
    let tried = strong;
    for (let i = 0; i < 30 && tried.martial.stage < 5; i++) {
      tried = resolveChoice({ ...strong, rng: new Rng(`th${i}`).getState(), events: { ...strong.events, pending: falls.id } }, content, 0).state;
    }
    expect(tried.martial.stage).toBe(5);
    // Ngũ khí: sense, then five linh tinh.
    const five = ['linh_tinh_kim', 'linh_tinh_moc', 'linh_tinh_thuy', 'linh_tinh_hoa', 'linh_tinh_tho'];
    const tam: GameState = { ...tried, flags: { ...tried.flags, cam_ung_ngu_khi: true }, inventory: Object.fromEntries(five.map((id) => [id, 1])) };
    const gather = findEvent(content, 'vd_ngu_khi_linh_tinh')!;
    expect(eventWeight(tam, content, gather)).toBeGreaterThan(0);
    let up: GameState = tam;
    for (let i = 0; i < 30 && up.cult.realm === 'pham_nhan'; i++) {
      up = resolveChoice({ ...tam, rng: new Rng(`nk${i}`).getState(), events: { ...tam.events, pending: gather.id } }, content, 0).state;
    }
    expect(up.cult.realm).toBe('luyen_khi');
    expect(up.cult.root?.grade).toBe('ngu_khi');
    expect(up.inventory.linh_tinh_kim ?? 0).toBe(0);
  });
});

describe('Hóa cảnh: the cao nhân\'s gift (backlog 7)', () => {
  const atTuyetDinh = () => mortal(40, 90, { martial: { stage: 3, years: 0, bonus: 0, lastTrain: null } });

  it('gives Cửu Chuyển Kim Cốt Quyết as a scroll that a rootless body cannot cultivate, and a mortal manual', () => {
    const s = martialPromote(atTuyetDinh(), content);
    const g = content.martial.gift;
    expect(s.martial.stage).toBe(g.stage);
    expect(s.cult.scrolls).toContain(g.technique);
    expect(s.flags[g.flag]).toBe(true);
    expect(learnBlocked(s, content, techniqueById(content, g.technique)!)).toMatch(/linh căn/);
    expect(mortalManual(s, content)?.id).toBe(content.martial.manual.id);
    expect(s.cult.technique).toBeNull();
    expect(s.log.at(-1)!.lines.map((l) => l.text).join(' ')).toContain('Cửu Chuyển Kim Cốt Quyết');
  });

  it('the manual adds a little lifespan, Căn cốt and combat power, and goes away at Ngũ khí', () => {
    const before = atTuyetDinh();
    const s = martialPromote(before, content);
    const m = content.martial.manual;
    expect(s.cult.lifespan).toBe(before.cult.lifespan + content.balance.martial.lifespan[4] + m.lifespan);
    expect(s.aptitudes.physique).toBe(before.aptitudes.physique + m.physique);
    const without = { ...s, martial: { ...s.martial, manual: null } };
    expect(combatPower(s, content)).toBeGreaterThan(combatPower(without, content));
    const up = martialPromote(martialPromote({ ...s, martial: { ...s.martial, stage: 5 } }, content), content);
    expect(up.martial.manual).toBeNull();
    expect(mortalManual(up, content)).toBeNull();
  });
});
