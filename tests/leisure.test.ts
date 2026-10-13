import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { goLeisure, leisureView } from '../src/systems/leisure';

const content = loadContent();
const adult = (seed: string, patch: Partial<GameState> = {}): GameState => {
  const s = createLife({ seed }, content);
  return { ...s, destiny: { ...s.destiny, confirmed: true }, character: { ...s.character, age: 30 }, ...patch };
};

describe('6b.2 happiness', () => {
  it('drifts toward rest every year, not only in quiet years', () => {
    let s = adult('drift');
    s = { ...s, stats: { ...s.stats, happiness: 0 } };
    const next = advanceYear(s, content);
    expect(next.stats.happiness).toBeGreaterThanOrEqual(content.balance.extremes.happinessDrift);
  });

  it('Ngao du lifts happiness once a year and costs spirit stones for a cultivator', () => {
    let s = adult('trip');
    s = { ...s, stats: { ...s.stats, happiness: 10 }, money: { silver: 0, spiritStones: 50 }, cult: { ...s.cult, realm: 'luyen_khi' } };
    const r = goLeisure(s, content)!;
    const b = content.balance.leisure;
    expect(r.state.money.spiritStones).toBe(50 - b.spiritStones);
    expect(r.state.stats.happiness).toBeGreaterThanOrEqual(10 + b.happiness[0]);
    expect(r.state.aptitudes.daoHeart).toBe(Math.min(100, s.aptitudes.daoHeart + b.daoHeart));
    expect(leisureView(r.state, content).blocked).not.toBeNull();
    expect(goLeisure(r.state, content)).toBeNull();
  });

  it('an empty purse still allows a free walk', () => {
    let s = adult('free');
    s = { ...s, stats: { ...s.stats, happiness: 30 }, money: { silver: 0, spiritStones: 0 } };
    expect(leisureView(s, content).cost).toBeNull();
    const r = goLeisure(s, content)!;
    expect(r.state.stats.happiness).toBeGreaterThanOrEqual(30 + content.balance.leisure.freeHappiness[0]);
  });
});
