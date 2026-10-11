import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, EventFileSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, sects, techniques, tutorial } from './fixtures';
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
  careers,
  techniques,
  sects,
};

import { devAddKarma, devAddMoney, devAddStat, devHeal, devSkipYears, devTriggerEvent } from '../src/systems/dev';

describe('developer mode', () => {
  const base = createLife({ seed: 'dev', originId: 'nong_dan' }, content);
  const lastLine = (s: typeof base) => s.log.at(-1)!.lines.at(-1)!.text;

  it('changes stats, money and karma within bounds and logs each change', () => {
    const s = devAddStat(base, 'happiness', 500);
    expect(s.stats.happiness).toBe(100);
    expect(lastLine(s)).toBe('[Dev] Hạnh phúc +500');
    expect(devAddStat(base, 'luck', -500).aptitudes.luck).toBe(0);
    expect(devAddMoney(base, -10_000, 10).money).toEqual({ silver: 0, spiritStones: base.money.spiritStones + 10 });
    expect(devAddKarma(base, 500).social.karma).toBe(100);
    expect(devHeal(base).stats.health).toBe(100);
  });

  it('opens any event regardless of conditions, but not unknown ones', () => {
    const old = { ...base, character: { ...base.character, age: 70 } };
    expect(devTriggerEvent(old, content, 'thoi_noi').events.pending).toBe('thoi_noi');
    expect(devTriggerEvent(old, content, 'khong_co')).toBe(old);
  });

  it('skips years without leaving an event open', () => {
    const s = devSkipYears(base, content, 10);
    expect(s.character.age).toBe(base.character.age + 10);
    expect(s.events.pending).toBeNull();
  });
});
