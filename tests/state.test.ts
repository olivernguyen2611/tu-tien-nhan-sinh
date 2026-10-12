import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { BalanceSchema, WorldSchema, NamesSchema, OriginFileSchema } from '../src/core/schemas';
import { LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, fateTalents, items, martial, lineages, rankings, romance, heartDemon, recipes, disciples, founding, heir, clan, blessings, sectLife, sects, techniques, tutorial, combat } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import world from '../content/worlds/thuong_lan/world.json';
import balance from '../content/config/balance.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  events: [],
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
  sectLife,
  fateTalents,
  items,
  martial,
  lineages,
  markets: [],
  combat,
  npcTraits: { surface: [], nature: [], goals: [] },
  rankings,
  romance,
  heartDemon,
  recipes,
  corePatterns: [],
  regions: [],
  chosenOnes: { templates: [] },
  nascentSouls: { realm: 'nguyen_anh', forms: [] },
  disciples,
  founding,
  heir,
  clan,
  blessings,
  traits: [],
};

describe('createLife', () => {
  it('records which world the life belongs to', () => {
    expect(createLife({ seed: 'w' }, content).worldId).toBe('thuong_lan');
  });

  it('same seed gives the same character', () => {
    expect(createLife({ seed: 'abc' }, content)).toEqual(createLife({ seed: 'abc' }, content));
  });

  it('different seeds give different characters', () => {
    const a = createLife({ seed: 'a' }, content);
    const b = createLife({ seed: 'b' }, content);
    expect(a.stats).not.toEqual(b.stats);
  });

  it('keeps every stat within 0–100 and starts as a mortal newborn', () => {
    for (let i = 0; i < 200; i++) {
      const s = createLife({ seed: `seed-${i}` }, content);
      for (const v of [...Object.values(s.stats), ...Object.values(s.aptitudes)]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      expect(s.character.age).toBe(0);
      expect(s.cult.realm).toBe('pham_nhan');
      expect(s.cult.lifespan).toBeGreaterThanOrEqual(50);
      expect(s.cult.lifespan).toBeLessThanOrEqual(90);
    }
  });

  it('respects the chosen name, gender and origin', () => {
    const s = createLife({ seed: 'x', name: '  Tô Vân  ', gender: 'nu', originId: 'co_nhi' }, content);
    expect(s.character.name).toBe('Tô Vân');
    expect(s.character.gender).toBe('nu');
    expect(s.character.originId).toBe('co_nhi');
    expect(s.flags.no_parents).toBe(true);
    expect(s.money.silver).toBe(0);
  });

  it('fills the hometown into the birth line', () => {
    const s = createLife({ seed: 'y' }, content);
    expect(s.log[0].lines[0].text).toContain(s.character.hometown);
    expect(s.log[0].lines[0].text).not.toContain('{');
  });
});

describe('advanceYear', () => {
  it('ages the character by one and logs the year', () => {
    const s = advanceYear(createLife({ seed: 'z' }, content), content);
    expect(s.character.age).toBe(1);
    expect(s.log.at(-1)?.age).toBe(1);
  });
});
