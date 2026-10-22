import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { courtJobMul, courtLine, courtPriceMul, courtTax, courtYear, initCourt } from '../src/systems/court';
import { meets } from '../src/systems/events/conditions';

const content = loadContent();
const cfg = content.balance.court!;
const life = (age = 30): GameState => {
  const s = createLife({ seed: 'trieu-dinh', originId: content.origins[0].id }, content);
  return { ...s, character: { ...s.character, age }, money: { ...s.money, silver: 500 } };
};
const withCourt = (s: GameState, patch: Partial<NonNullable<GameState['court']>> = {}): GameState => ({ ...s, court: { ...initCourt(s, content)!, ...patch } });

describe('Triều đại và đại sự (12.1)', () => {
  it('a life is born under an emperor named by the niên hiệu, with a temper', () => {
    const s = life();
    const c = initCourt(s, content)!;
    expect(c.emperor.name).toBe(`${s.times!.era} đế`);
    expect(content.court!.tempers.map((t) => t.id)).toContain(c.emperor.temper);
  });

  it('a new niên hiệu crowns the heir (or someone) and may open the ngục', () => {
    let s = withCourt(life(), { heir: { name: 'Thái tử Minh', age: 20 } });
    const t = s.times!;
    s = { ...s, times: { ...t, era: 'Hưng Long', eraFrom: 30, eras: [...t.eras, { dynasty: t.dynasty, era: 'Hưng Long', from: 30 }] }, law: { wanted: 0, jail: { until: 40, crime: 'trom' }, trial: null, convictions: 1, escapes: 0, failedEscapes: 0, lastCrime: null, lastCrimeAge: null } };
    const next = courtYear(s, content);
    expect(next.court!.emperor.name).toBe('Hưng Long đế');
    expect(next.court!.emperor.age).toBe(20);
    expect(next.court!.heir).toBeNull();
    expect(next.log.flatMap((y) => y.lines).some((l) => l.text.includes('Thái tử Minh lên ngôi'))).toBe(true);
  });

  it('đại sự raise the sưu thuế and prices, move trades, and are read by conditions', () => {
    const s = withCourt(life(), { affairs: [{ id: 'ngoai_xam', until: 40 }, { id: 'thien_tai', until: 35 }], started: { ngoai_xam: 30, thien_tai: 30 } });
    const base = withCourt(life());
    expect(courtTax(s, content)).toBeGreaterThan(courtTax(base, content));
    expect(courtPriceMul(s, content)).toBeGreaterThan(1);
    expect(courtJobMul(s, content, 'nong')).toBeLessThan(1);
    expect(courtJobMul(s, content, 'vo')).toBeGreaterThan(1);
    expect(meets(s, { court: { affair: ['ngoai_xam'] } }, content)).toBe(true);
    expect(meets(base, { court: { affair: ['ngoai_xam'] } }, content)).toBe(false);
    expect(courtLine(s, content)).toContain('Ngoại xâm');
  });

  it('a grown mortal pays sưu thuế each year; the court lives on through a long life', () => {
    const s = withCourt(life());
    const y = courtYear(s, content);
    const due = Math.round((courtTax(s, content) / 100) * cfg.taxSilver);
    expect(y.money.silver).toBe(500 - due);
    let l = life(0);
    for (let i = 0; i < 80 && l.alive; i++) { l = advanceYear(l, content); if (l.events.pending) l = { ...l, events: { ...l.events, pending: null } }; }
    expect(l.court?.emperor.name).toMatch(/ đế$/);
  });
});
