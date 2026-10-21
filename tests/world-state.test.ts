import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { meets } from '../src/systems/events/conditions';
import { eraLabel, lifeEraLine, priceNote, timesPriceMul, timesYear } from '../src/systems/worldState';

const content = loadContent();
/** A hundred years of the world alone (the life's own year is not needed for it). */
function century(seed: string) {
  let s: GameState = createLife({ seed }, content);
  const harvest: number[] = [];
  const prices: number[] = [];
  const phases = new Set<string>();
  for (let age = 1; age <= 100; age++) {
    s = timesYear({ ...s, character: { ...s.character, age } }, content);
    harvest.push(s.times!.vars.harvest);
    prices.push(timesPriceMul(s, content));
    phases.add(s.times!.phase);
  }
  return { s, harvest, prices, phases };
}

describe('Thời cuộc (9.5)', () => {
  it('every life is born into a phase, a dynasty and a niên hiệu', () => {
    const s = createLife({ seed: 'tc-born' }, content);
    expect(s.times?.phase).toBeTruthy();
    expect(eraLabel(s, 0)).toMatch(/ năm thứ \d+$/);
  });

  it('a hundred years: phases or thrones change, some lean harvests, prices move', () => {
    for (let i = 0; i < 20; i++) {
      const { s, harvest, prices, phases } = century(`tc-${i}`);
      expect(phases.size > 1 || s.times!.eras.length > 1).toBe(true);
      expect(Math.max(...prices) / Math.min(...prices)).toBeGreaterThan(1.1);
      if (i < 5) expect(s.log.flatMap((y) => y.lines).some((l) => l.text.startsWith('Thời cuộc: '))).toBe(true);
      expect(harvest.every((h) => h >= 0 && h <= 100)).toBe(true);
    }
    const lean = Array.from({ length: 20 }, (_, i) => century(`tc-${i}`).harvest.filter((h) => h <= 30).length);
    expect(lean.reduce((a, b) => a + b, 0) / 20).toBeGreaterThanOrEqual(2);
  });

  it('a thousand-year life outlasts the dynasty list without running out', () => {
    let s: GameState = createLife({ seed: 'tc-long' }, content);
    for (let age = 1; age <= 1000; age++) s = timesYear({ ...s, character: { ...s.character, age } }, content);
    expect(new Set(s.times!.eras.map((e) => e.dynasty)).size).toBeGreaterThan(1);
  });

  it('runs on its own dice; the life’s rng is untouched', () => {
    const s = createLife({ seed: 'tc-rng' }, content);
    const next = timesYear({ ...s, character: { ...s.character, age: 1 } }, content);
    expect(next.rng).toEqual(s.rng);
    expect(timesYear({ ...s, character: { ...s.character, age: 1 } }, content).times).toEqual(next.times);
  });

  it('conditions read the phase and the variables; a save without the world gets one', () => {
    const s = createLife({ seed: 'tc-cond' }, content);
    const famine = { ...s, times: { ...s.times!, vars: { ...s.times!.vars, harvest: 10 } } };
    expect(meets(famine, { worldVars: [{ id: 'harvest', lte: 28 }] }, content)).toBe(true);
    expect(meets(s, { worldPhase: ['khong_co'] }, content)).toBe(false);
    expect(priceNote(famine, content)).toMatch(/đắt hơn thường/);
    const { times: _t, ...old } = s;
    const filled = timesYear({ ...(old as GameState), character: { ...s.character, age: 40 } }, content);
    expect(filled.times?.eras.length).toBeGreaterThan(0);
  });

  it('the end of life names the eras and dynasties it lived through', () => {
    const { s } = century('tc-0');
    const line = lifeEraLine({ ...s, alive: false })!;
    expect(line).toMatch(/^Sinh năm .+ thứ \d+, mất năm .+ thứ \d+, /);
  });
});
