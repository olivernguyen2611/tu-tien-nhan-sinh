import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { describeChanges } from '../src/systems/deltas';
import { ageFamily, availableActions, performFamilyAction, relationLabel } from '../src/systems/relationships';
import balance from '../content/config/balance.json';
import familyActions from '../content/family-actions.json';
import { FamilyActionFileSchema, LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, fateTalents, items, martial, lineages, sectLife, sects, techniques, tutorial, combat } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import traits from '../content/traits.json';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  traits: TraitFileSchema.parse(traits),
  events: [],
  glossary: [],
  familyActions: FamilyActionFileSchema.parse(familyActions),
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
};

describe('family', () => {
  it('starts with father and mother sharing the right surnames; orphans have nobody', () => {
    const s = createLife({ seed: 'fam', originId: 'nong_dan' }, content);
    const father = s.family.find((r) => r.role === 'father')!;
    expect(s.family.find((r) => r.role === 'mother')).toBeDefined();
    expect(father.name.split(' ')[0]).toBe(s.character.name.split(' ')[0]);
    expect(father.age).toBeGreaterThanOrEqual(20);
    expect(createLife({ seed: 'fam', originId: 'co_nhi' }, content).family).toEqual([]);
  });

  it('relatives age, die at their lifespan, and orphan the player when both parents are gone', () => {
    let s = createLife({ seed: 'old', originId: 'nong_dan' }, content);
    s = { ...s, family: s.family.map((r) => (r.role !== 'sibling' ? { ...r, lifespan: r.age + 2 } : r)) };
    const happy = s.stats.happiness;
    s = advanceYear(s, content);
    expect(s.family.filter((r) => r.role !== 'sibling').every((r) => r.alive)).toBe(true);
    s = advanceYear(s, content);
    expect(s.family.filter((r) => r.role !== 'sibling').every((r) => !r.alive)).toBe(true);
    expect(s.flags.no_parents).toBe(true);
    expect(s.stats.happiness).toBeLessThan(happy);
    expect(s.log.at(-1)!.lines.filter((l) => l.text.includes('qua đời'))).toHaveLength(2);
  });

  it('a parent dying always hurts, shows the loss, and only stops events for that parent', () => {
    let s = createLife({ seed: 'grief', originId: 'nong_dan' }, content);
    // Father dies next year even though the player barely knows him (affinity 0).
    s = {
      ...s,
      stats: { ...s.stats, happiness: 60 },
      family: s.family.map((r) => (r.role === 'father' ? { ...r, lifespan: r.age + 1, affinity: 0 } : { ...r, lifespan: 999 })),
    };
    const next = ageFamily(s, content);
    const [distant] = content.balance.family.grief.father;
    expect(next.stats.happiness).toBe(60 + distant);
    expect(next.aptitudes.daoHeart).toBe(Math.min(100, s.aptitudes.daoHeart + content.balance.family.grief.parentDaoHeart));
    const line = next.log.at(-1)!.lines.find((l) => l.text.includes('qua đời'))!;
    expect(line.text).toContain(`Hạnh phúc −${Math.abs(distant)}`);
    expect(next.flags.no_father).toBe(true);
    expect(next.flags.no_mother).toBeUndefined();
    expect(next.flags.no_parents).toBeUndefined();
  });

  it('older siblings are never born before the mother turned 16', () => {
    for (let i = 0; i < 300; i++) {
      const s = createLife({ seed: `sib${i}`, originId: 'nong_dan' }, content);
      const mother = s.family.find((r) => r.role === 'mother')!;
      for (const sib of s.family.filter((r) => r.role === 'sibling')) expect(mother.age - sib.age).toBeGreaterThanOrEqual(16);
    }
  });

  it('labels siblings by age and gender', () => {
    const r = { id: 'x', role: 'sibling' as const, gender: 'nu' as const, name: 'A B', age: 10, alive: true, lifespan: 70, affinity: 50, lastActions: {} };
    expect(relationLabel(r, 5)).toBe('Chị');
    expect(relationLabel(r, 12)).toBe('Em gái');
  });

  it('actions change affinity, cost silver and work once a year per relative', () => {
    let s = createLife({ seed: 'act', originId: 'nong_dan' }, content);
    s = { ...s, character: { ...s.character, age: 20 } };
    const mother = s.family.find((r) => r.role === 'mother')!;
    const gift = performFamilyAction(s, content, mother.id, 'tang_qua');
    const after = gift.state.family.find((r) => r.id === mother.id)!;
    expect(after.affinity).toBeGreaterThan(mother.affinity);
    expect(gift.state.money.silver).toBe(s.money.silver - 5);
    expect(gift.text).not.toContain('{');
    expect(gift.state.log.at(-1)!.lines.at(-1)!.text).toBe(gift.text);
    expect(performFamilyAction(gift.state, content, mother.id, 'tang_qua').state).toBe(gift.state);
    expect(availableActions(gift.state, content, after).find((a) => a.id === 'tang_qua')!.disabled).toBe(true);
  });

  it('actions respect ages, roles and money', () => {
    const base = createLife({ seed: 'act2', originId: 'nong_dan' }, content);
    const father = base.family.find((r) => r.role === 'father')!;
    const ids = (s: typeof base) => availableActions(s, content, father).map((a) => a.id);
    expect(ids({ ...base, character: { ...base.character, age: 2 } })).toEqual([]);
    expect(ids({ ...base, character: { ...base.character, age: 8 } })).not.toContain('du_ngoan');
    expect(ids({ ...base, character: { ...base.character, age: 20 } })).toContain('du_ngoan');
    expect(ids({ ...base, character: { ...base.character, age: 20 } })).not.toContain('cham_soc');
    const broke = { ...base, character: { ...base.character, age: 20 }, money: { ...base.money, silver: 0 } };
    expect(availableActions(broke, content, father).find((a) => a.id === 'tang_qua')!.disabled).toBe(true);
  });

  it('asking for money is refused when affinity is low', () => {
    let s = createLife({ seed: 'money', originId: 'nong_dan' }, content);
    s = { ...s, character: { ...s.character, age: 10 }, family: s.family.map((r) => ({ ...r, affinity: 20 })) };
    const r = performFamilyAction(s, content, s.family[0].id, 'xin_tien');
    expect(r.tone).toBe('bad');
    expect(r.state.money.silver).toBe(s.money.silver);
  });

  it('a long life is deterministic and siblings stay within the cap', () => {
    const run = () => {
      let s: GameState = createLife({ seed: 'long', originId: 'nong_dan' }, content);
      for (let i = 0; i < 80; i++) s = ageFamily({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
      return s;
    };
    const a = run();
    expect(run()).toEqual(a);
    expect(a.family.filter((r) => r.role === 'sibling').length).toBeLessThanOrEqual(content.balance.family.maxSiblings);
  });

  it('describes stat changes in a short line', () => {
    const s = createLife({ seed: 'delta', originId: 'nong_dan' }, content);
    const after = { ...s, stats: { ...s.stats, happiness: s.stats.happiness - 12 }, money: { ...s.money, silver: s.money.silver + 30 } };
    expect(describeChanges(s, after)).toBe('Hạnh phúc −12 · Bạc +30');
    expect(describeChanges(s, s)).toBe('');
  });
});
