import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';

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

  // 9.2: Ngao du is now an activity (content/activities/giai-tri.json); its numbers come from there.
  const trip = content.activities!.find((a) => a.id === 'ngao_du')!;
  const view = (s: GameState) => activityViews(s, content).find((a) => a.id === 'ngao_du')!;

  it('Ngao du lifts happiness once a year and costs spirit stones for a cultivator', () => {
    let s = adult('trip');
    s = { ...s, stats: { ...s.stats, happiness: 10 }, money: { silver: 0, spiritStones: 50 }, cult: { ...s.cult, realm: 'luyen_khi' } };
    const r = doActivity(s, content, 'ngao_du')!;
    expect(r.state.money.spiritStones).toBe(50 - trip.cost[0].spiritStones!);
    expect(r.state.stats.happiness).toBeGreaterThanOrEqual(10 + trip.outcomes[0].roll['stat.happiness'][0]);
    expect(r.state.aptitudes.daoHeart).toBe(Math.min(100, s.aptitudes.daoHeart + (trip.outcomes[0].bonus[0].effects['stat.daoHeart'] as number)));
    expect(view(r.state).blocked).not.toBeNull();
    expect(doActivity(r.state, content, 'ngao_du')).toBeNull();
  });

  it('an empty purse still allows a free walk', () => {
    let s = adult('free');
    s = { ...s, stats: { ...s.stats, happiness: 30 }, money: { silver: 0, spiritStones: 0 } };
    expect(view(s).cost).toBe('miễn phí, 1 tháng');
    const r = doActivity(s, content, 'ngao_du')!;
    expect(r.state.stats.happiness).toBeGreaterThanOrEqual(30 + trip.free!.outcomes[0].roll['stat.happiness'][0]);
  });
});
