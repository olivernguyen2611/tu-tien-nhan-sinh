import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, EventFileSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { cultivation, difficulties, tutorial } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import { createLife } from '../src/core/state';
import balance from '../content/config/balance.json';
import traits from '../content/traits.json';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';
import childhood from '../content/worlds/thuong_lan/events/childhood.json';
import study from '../content/worlds/thuong_lan/events/study.json';
import work from '../content/worlds/thuong_lan/events/work.json';
import funny from '../content/worlds/thuong_lan/events/funny.json';
import accident from '../content/worlds/thuong_lan/events/accident.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  traits: TraitFileSchema.parse(traits),
  events: [childhood, study, work, funny, accident].flatMap((f) => EventFileSchema.parse(f)),
  glossary: [],
  familyActions: [],
  lifeTexts: LifeTextsSchema.parse(lifeTexts),
  extremes: StatExtremesFileSchema.parse(extremes),
  cultivation,
  difficulties,
  tutorial,
};

import { ageExtremes, extremeHookSum, extremeWarnings } from '../src/systems/extremes';
import { advanceYear } from '../src/core/state';
import { eventWeight } from '../src/systems/events/engine';
import type { GameState } from '../src/core/types';

const base = createLife({ seed: 'extreme', originId: 'nong_dan' }, content);
const withYear = (s: GameState): GameState => ({ ...s, log: [...s.log, { age: s.character.age, lines: [] }] });
/** Run the extremes step `n` years with the stats forced each year. */
function years(s: GameState, n: number, force: (s: GameState) => GameState): GameState {
  for (let i = 0; i < n; i++) {
    s = withYear({ ...force(s), character: { ...s.character, age: s.character.age + 1 } });
    s = ageExtremes(s, content);
  }
  return s;
}
const happy = (v: number) => (s: GameState): GameState => ({ ...s, stats: { ...s.stats, happiness: v } });
const lines = (s: GameState) => s.log.flatMap((y) => y.lines.map((l) => l.text));

describe('stat extremes', () => {
  it('warns the year before, then starts the state after 3 years at the bottom', () => {
    const two = years(base, 2, happy(3));
    expect(two.extremes.active.long_nhu_tro_nguoi).toBeUndefined();
    expect(extremeWarnings(two, content)).toContain('happiness');
    expect(lines(two).some((t) => t.includes('Hạnh phúc của ngươi chạm đáy'))).toBe(true);
    const three = years(two, 1, happy(3));
    expect(three.extremes.active.long_nhu_tro_nguoi).toBe(three.character.age);
    expect(lines(three).at(-1)).toContain('Lòng như tro nguội');
  });

  it('a state takes its yearly toll and ends only past the exit threshold', () => {
    let s = years(base, 3, happy(3));
    s = { ...s, stats: { ...s.stats, health: 60 }, aptitudes: { ...s.aptitudes, daoHeart: 60 } };
    s = years(s, 1, happy(15)); // out of the zone but under exitLow 20: still on
    expect(s.extremes.active.long_nhu_tro_nguoi).toBeDefined();
    expect(s.stats.health).toBe(57);
    expect(s.aptitudes.daoHeart).toBe(58);
    s = years(s, 1, happy(25));
    expect(s.extremes.active.long_nhu_tro_nguoi).toBeUndefined();
    expect(lines(s).at(-1)).toContain('đã qua');
  });

  it('once-effects are given again only after the cooldown', () => {
    const top = (s: GameState): GameState => ({ ...s, stats: { ...s.stats, health: 98 } });
    const low = (s: GameState): GameState => ({ ...s, stats: { ...s.stats, health: 50 } });
    let s = years(base, 3, top);
    expect(s.cult.lifespan).toBe(Math.round(base.cult.lifespan * 1.05));
    expect(extremeHookSum(s, content, 'illnessChancePct')).toBe(-100);
    s = years(s, 1, low);
    s = years(s, 3, top); // back within 10 years: the state returns, no second gift
    expect(s.extremes.active.than_cuong_the_trang).toBeDefined();
    expect(s.cult.lifespan).toBe(Math.round(base.cult.lifespan * 1.05));
  });

  it('floors and event weights apply while a state is on', () => {
    const dull = (s: GameState): GameState => ({ ...s, stats: { ...s.stats, intellect: 2, happiness: 10 } });
    const s = years(base, 3, dull);
    expect(s.extremes.active.ngay_ngo).toBeDefined();
    expect(s.stats.happiness).toBe(30);

    const unlucky = years(base, 3, (x) => ({ ...x, aptitudes: { ...x.aptitudes, luck: 1 } }));
    const mishap = content.events.find((e) => e.themes.includes('mishap'))!;
    const at = (x: GameState) => ({ ...x, character: { ...x.character, age: 10 }, events: { ...x.events, history: {} } });
    expect(eventWeight(at(unlucky), content, mishap)).toBeCloseTo(eventWeight(at(base), content, mishap) * 2);
  });

  it('karma uses its own thresholds', () => {
    const s = years(base, 3, (x) => ({ ...x, social: { ...x.social, karma: 90 } }));
    expect(s.extremes.active.cong_duc_kim_quang).toBeDefined();
    expect(s.aptitudes.luck).toBe(Math.min(100, base.aptitudes.luck + 10));
  });

  it('quiet years ease happiness toward 50', () => {
    let s: GameState = { ...base, stats: { ...base.stats, happiness: 90 }, family: [] };
    const before = s.stats.happiness;
    for (let i = 0; i < 20; i++) {
      const next = advanceYear(s, content);
      const quiet = next.log.at(-1)!.lines.length === 1 && next.log.at(-1)!.lines[0].text === 'Một năm bình lặng trôi qua.';
      if (quiet) {
        expect(Math.abs(next.stats.happiness - 50)).toBeLessThan(Math.abs(s.stats.happiness - 50) + 1);
      }
      s = { ...next, events: { ...next.events, pending: null } };
    }
    expect(s.stats.happiness).toBeLessThan(before);
  });
});
