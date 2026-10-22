import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { missionViews, doMission } from '../src/systems/sect';
import { monthsLeft } from '../src/systems/timeBudget';

const content = loadContent();

function disciple(seed: string): GameState {
  const b = createLife({ seed }, content);
  const sect = content.sects[0];
  return {
    ...b,
    character: { ...b.character, age: 30 },
    destiny: { ...b.destiny, confirmed: true },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    log: [...b.log, { age: 30, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    sect: { ...b.sect, id: sect.id, rank: 1, lastMission: null },
    cult: { ...b.cult, realm: 'luyen_khi', stage: 2, progress: 10, root: { grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'] }, technique: 'dan_khi_quyet', lifespan: 200 },
  };
}

describe('13.3 Đánh đổi thời gian', () => {
  it('a sect mission takes months, and waits when the year has none left', () => {
    const s = disciple('tt1');
    const m = missionViews(s, content)[0];
    expect(m.blocked).toBeNull();
    const done = doMission(s, content, m.id)!;
    expect(monthsLeft(done.state, content)).toBe(monthsLeft(s, content) - content.balance.time.actionMonths!.mission);
    const busy = { ...s, activities: { last: {}, year: 30, uses: {}, months: 11 } };
    expect(missionViews(busy, content)[0].blocked).toContain('tháng');
  });

  it('quiet years in a row fold into one block with the bar before and after', () => {
    let s: GameState = { ...disciple('tt2'), flags: { ...disciple('tt2').flags } };
    // No events at all, so every year is quiet.
    const still = { ...content, events: [] };
    for (let i = 0; i < 40; i++) s = advanceYear(s, still);
    const folded = s.log.filter((y) => y.toAge);
    expect(folded.length).toBeGreaterThan(0);
    const run = folded[folded.length - 1];
    expect(run.toAge! - run.age).toBeGreaterThan(0);
    expect(run.lines).toHaveLength(1);
    expect(run.lines[0].text).toMatch(/năm khổ tu/);
  });
});
