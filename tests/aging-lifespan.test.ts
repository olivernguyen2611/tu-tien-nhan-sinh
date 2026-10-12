import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { ageBody } from '../src/systems/time';

const content = loadContent();

function at(age: number, lifespan: number, realm = 'pham_nhan'): GameState {
  const b = createLife({ seed: 'age' }, content);
  return { ...b, traits: [], flags: {}, character: { ...b.character, age }, stats: { ...b.stats, health: 60 }, cult: { ...b.cult, realm, lifespan }, log: [...b.log, { age, lines: [] }] };
}

describe('aging follows the lifespan (playtest 2026-10-12)', () => {
  it('a 62-year-old mortal declines; a Trúc Cơ of 200 years still mends', () => {
    expect(ageBody(at(62, 70), content).stats.health).toBeLessThan(60);
    expect(ageBody(at(62, 200, 'truc_co'), content).stats.health).toBeGreaterThan(60);
  });

  it('a Trúc Cơ only grows old near the end of its span', () => {
    let s = at(20, 200, 'truc_co');
    for (let a = 21; a <= 120; a++) s = ageBody({ ...s, character: { ...s.character, age: a } }, content);
    expect(s.stats.health).toBeGreaterThanOrEqual(content.balance.aging.recoverCap - 10);
  });
});
