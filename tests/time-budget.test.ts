import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { yearlyGain } from '../src/systems/cultivation';
import { careerMonths, cultivationShare, monthsLeft } from '../src/systems/timeBudget';

const content = loadContent();
const life = (patch: Partial<GameState> = {}): GameState => {
  const s = createLife({ seed: 'tb' }, content);
  return { ...s, destiny: { ...s.destiny, confirmed: true }, character: { ...s.character, age: 30 }, money: { silver: 200, spiritStones: 50 }, ...patch };
};
const cultivator = (): GameState => {
  const s = life();
  return { ...s, tier: 'tu_chan', cult: { ...s.cult, realm: 'luyen_khi', root: { grade: 'tam', elements: ['kim', 'moc', 'thuy'] } as GameState['cult']['root'] } };
};

describe('Quỹ thời gian 12 tháng (9.4)', () => {
  it('a career takes its months first; with no career the whole year is free', () => {
    expect(monthsLeft(life(), content)).toBe(content.balance.time.monthsPerYear);
    const official = life({ career: { ...life().career, id: 'quan' } });
    expect(careerMonths(official, content)).toBe(content.balance.time.careerMonths.quan);
    expect(monthsLeft(official, content)).toBe(content.balance.time.monthsPerYear - content.balance.time.careerMonths.quan);
  });

  it('activities spend months, show them, and wait once the year is used up', () => {
    let s = cultivator();
    expect(activityViews(s, content).find((a) => a.id === 've_tham_que')!.cost).toContain('2 tháng');
    s = doActivity(s, content, 've_tham_que')!.state;
    expect(monthsLeft(s, content)).toBe(10);
    s = { ...s, activities: { ...s.activities!, months: 11 } };
    expect(activityViews(s, content).find((a) => a.id === 'ap_tieu')!.blocked).toBe('Cần 2 tháng, năm nay chỉ còn 1.');
    expect(doActivity(s, content, 'ap_tieu')).toBeNull();
    // Activities of 0 months still go.
    expect(activityViews(s, content).find((a) => a.id === 'song_bac')!.blocked).toBeNull();
    const nextYear = { ...s, character: { ...s.character, age: 31 } };
    expect(monthsLeft(nextYear, content)).toBe(12);
  });

  it('the months left go to cultivation: 4 months away is a third less tu vi; bế quan keeps the whole year', () => {
    const s = cultivator();
    const full = yearlyGain(s, content);
    expect(full).toBeGreaterThan(0);
    expect(yearlyGain(s, content, 4)).toBeCloseTo(full * (8 / 12), 6);
    expect(cultivationShare({ ...s, seclusion: { until: 40, since: 30 } }, content, 4)).toBe(1);
  });
});
