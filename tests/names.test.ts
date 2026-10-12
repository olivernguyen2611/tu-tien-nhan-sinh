import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { BalanceSchema, FamilyActionFileSchema, LifeTextsSchema, NamesSchema, OriginFileSchema, WorldSchema } from '../src/core/schemas';
import { advanceYear, createLife } from '../src/core/state';
import { makeName, splitName } from '../src/systems/names';
import balance from '../content/config/balance.json';
import familyActions from '../content/family-actions.json';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, fateTalents, items, martial, sectLife, sects, techniques, tutorial } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';

const N = NamesSchema.parse(names);
const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: N,
  origins: OriginFileSchema.parse(origins),
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
  familyActions: FamilyActionFileSchema.parse(familyActions),
  events: [],
  glossary: [],
  traits: [],
};

describe('names', () => {
  it('keeps compound surnames whole', () => {
    expect(splitName('Thượng Quan Nguyệt Dao', N)).toEqual({ surname: 'Thượng Quan', given: 'Nguyệt Dao' });
    expect(splitName('Lý Thanh Phong', N)).toEqual({ surname: 'Lý', given: 'Thanh Phong' });
    expect(splitName('Ai Đó', N)).toEqual({ surname: 'Ai', given: 'Đó' });
  });

  it('makes many different names', () => {
    const rng = new Rng('many');
    const male = new Set(Array.from({ length: 500 }, () => makeName(rng, N, 'nam')));
    const female = new Set(Array.from({ length: 500 }, () => makeName(rng, N, 'nu')));
    expect(male.size).toBeGreaterThan(450);
    expect(female.size).toBeGreaterThan(450);
  });

  it('avoids taken given names', () => {
    const rng = new Rng('avoid');
    for (let i = 0; i < 300; i++) {
      const name = makeName(rng, N, 'nam', { surname: 'Lý', taken: ['Lý Thanh Phong', 'Lý Hạo Nhiên'] });
      expect(name.startsWith('Lý ')).toBe(true);
      expect(['Lý Thanh Phong', 'Lý Hạo Nhiên']).not.toContain(name);
    }
  });

  it('no relative ever shares a given name with the player or another relative', () => {
    for (let i = 0; i < 150; i++) {
      let s = createLife({ seed: `fam-${i}`, originId: 'nong_dan' }, content);
      for (let y = 0; y < 30; y++) s = advanceYear(s, content);
      const given = [s.character.name, ...s.family.map((r) => r.name)].map((n) => splitName(n, N).given);
      expect(new Set(given).size).toBe(given.length);
      const { surname } = splitName(s.character.name, N);
      for (const r of s.family.filter((x) => x.role !== 'mother')) expect(r.name.startsWith(`${surname} `)).toBe(true);
    }
  });

  it('the name lists have no duplicates', () => {
    for (const [key, list] of Object.entries(N)) expect(new Set(list).size, key).toBe(list.length);
  });
});
