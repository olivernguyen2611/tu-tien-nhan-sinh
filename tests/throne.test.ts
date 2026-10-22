import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { initCourt } from '../src/systems/court';
import { meets } from '../src/systems/events/conditions';
import { applyOutcome } from '../src/systems/events/engine';
import { hitRival, initRoyal, throneAscend, throneLine, throneOf, throneYear } from '../src/systems/throne';

const content = loadContent();
const cfg = content.balance.throne!;
const file = content.throne!;
const fx = (s: GameState, effects: Record<string, unknown>) => applyOutcome(s, content, { text: '', effects: effects as never }, new Rng('t')).state;

const royal = (age = 20, gender: 'nam' | 'nu' = 'nam'): GameState => {
  const s = createLife({ seed: 'hoang-that', originId: 'hoang_tu', gender }, content);
  const grown = { ...s, character: { ...s.character, age, gender }, court: initCourt(s, content) };
  return { ...grown, throne: { ...initRoyal(grown, content)!, since: 0 } };
};

describe('Hoàng thất tranh ngôi (12.6)', () => {
  it('a hoàng tử is born with siblings in line, a mother of some rank and the royal bars', () => {
    const o = content.origins.find((x) => x.id === 'hoang_tu')!;
    expect(o.royal).toBe(true);
    expect(o.rebirthCost).toBeGreaterThan(content.origins.find((x) => x.id === 'hoang_than')!.rebirthCost!);
    const s = royal();
    const t = throneOf(s)!;
    expect(t.path).toBe('royal');
    expect(t.rivals!.length).toBeGreaterThanOrEqual(cfg.rivals[0]);
    expect(Object.keys(t.bars).sort()).toEqual(Object.keys(file.bars.royal!).sort());
    expect(throneLine(s, content)).toContain(file.pathNames.royal);
    // A farmer never gets one.
    const farmer = createLife({ seed: 'hoang-that', originId: 'nong_dan' }, content);
    expect(throneOf(throneYear(farmer, content))).toBeNull();
  });

  it('the old emperor names an heir: the strongest wins, the loser is offered the lập trữ event', () => {
    let s = royal();
    s = { ...s, court: { ...s.court!, emperor: { ...s.court!.emperor, age: 70 } } };
    const strong = { ...s, throne: { ...throneOf(s)!, bars: { favor: 100, power: 100, suspicion: 0 } } };
    const weak = { ...s, throne: { ...throneOf(s)!, bars: { favor: 0, power: 0, suspicion: 0 } } };
    let won = false;
    let lost = false;
    for (let i = 0; i < 40 && !(won && lost); i++) {
      const a = throneYear({ ...strong, seed: `lt${i}` }, content);
      if (throneOf(a)?.heir === 'self') won = true;
      const b = throneYear({ ...weak, seed: `lt${i}` }, content);
      if (throneOf(b)?.heir && throneOf(b)!.heir !== 'self') {
        lost = true;
        expect(b.events.followUps.some((f) => f.event === file.events.heirLost)).toBe(true);
      }
    }
    expect(won && lost).toBe(true);
  });

  it('too much nghi kỵ brings the cup of wine; a named thái tử brought low is phế', () => {
    const s = royal();
    const feared = throneYear({ ...s, throne: { ...throneOf(s)!, bars: { favor: 40, power: 20, suspicion: 95 } } }, content);
    expect(feared.events.followUps.some((f) => f.event === file.events.banned)).toBe(true);
    const t = throneOf(s)!;
    const heir = t.rivals![0].name;
    const withHeir = { ...s, throne: { ...t, heir } };
    const hit = hitRival(withHeir, content, -100);
    expect(throneOf(hit)!.heir).toBeNull();
  });

  it('the named heir takes the throne when the niên hiệu changes; a passed-over sibling becomes a nhàn vương', () => {
    const s = royal(30);
    const turn = (x: GameState): GameState => ({ ...x, times: { ...x.times!, era: 'Thử Nghiệm', eraFrom: 30, eras: [...x.times!.eras, { dynasty: x.times!.dynasty, era: 'Thử Nghiệm', from: 30 }] } });
    const heir = throneYear(turn({ ...s, throne: { ...throneOf(s)!, heir: 'self' } }), content);
    expect(heir.reign).toMatchObject({ how: 'royal', era: 'Thử Nghiệm', founder: false });
    expect(heir.flags.len_ngoi).toBe(true);
    expect(heir.court!.emperor.name).toContain('Thử Nghiệm');
    const other = throneYear(turn({ ...s, throne: { ...throneOf(s)!, heir: throneOf(s)!.rivals![0].name } }), content);
    expect(other.reign ?? null).toBeNull();
    expect(other.flags.nhan_vuong).toBe(true);
  });

  it('the binh biến runs in three steps and ends on the throne or at the execution ground', () => {
    const steps = ['dn_binh_bien_1', 'dn_binh_bien_2', 'dn_binh_bien_3'].map((id) => content.events.find((e) => e.id === id)!);
    let s = royal(30);
    expect(meets(s, steps[0].conditions, content)).toBe(true);
    s = fx(s, { throneStep: 1 });
    expect(meets(s, steps[1].conditions, content)).toBe(true);
    s = fx(s, { throneStep: 1, throneRivalDies: true });
    expect(meets(s, steps[2].conditions, content)).toBe(true);
    const king = fx(s, { throneAscend: true });
    expect(king.reign?.how).toBe('royal');
    const dead = fx(s, { throneFail: 'death' });
    expect(dead.alive).toBe(false);
    expect(dead.flags.bi_tru_di).toBe(true);
  });

  it('a công chúa: hòa thân leaves the road; a woman heir needs more to be named', () => {
    const ev = content.events.find((e) => e.id === 'dn_hoa_than')!;
    const girl = royal(20, 'nu');
    const passed = { ...girl, throne: { ...throneOf(girl)!, heir: throneOf(girl)!.rivals![0].name } };
    expect(meets(passed, ev.conditions, content)).toBe(true);
    expect(meets({ ...passed, character: { ...passed.character, age: 16 } }, ev.conditions, content)).toBe(false);
    expect(cfg.womanNeeds).toBeGreaterThan(0);
    const crowned = throneAscend({ ...girl, throne: { ...throneOf(girl)!, heir: 'self' } }, content);
    expect(crowned.flags.nu_hoang).toBe(true);
  });

  it('royal activities only show for a hoàng tử on the road', () => {
    const acts = content.activities!.filter((a) => a.conditions.throne?.path?.includes('royal'));
    expect(acts.map((a) => a.id).sort()).toEqual(['an_nhan', 'duong_danh', 'ham_hai', 'ket_dang', 'lap_cong']);
    const farmer = createLife({ seed: 'hoang-that', originId: 'nong_dan' }, content);
    for (const a of acts) expect(meets({ ...farmer, character: { ...farmer.character, age: 20 } }, a.conditions, content)).toBe(false);
    for (const a of acts) expect(meets(royal(), a.conditions, content)).toBe(true);
  });
});
