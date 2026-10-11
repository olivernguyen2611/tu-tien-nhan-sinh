import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { ageFamily, chatWith, relationLabel } from '../src/systems/relationships';
import balance from '../content/config/balance.json';
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

  it('older siblings are never born before the mother turned 16', () => {
    for (let i = 0; i < 300; i++) {
      const s = createLife({ seed: `sib${i}`, originId: 'nong_dan' }, content);
      const mother = s.family.find((r) => r.role === 'mother')!;
      for (const sib of s.family.filter((r) => r.role === 'sibling')) expect(mother.age - sib.age).toBeGreaterThanOrEqual(16);
    }
  });

  it('labels siblings by age and gender', () => {
    const r = { id: 'x', role: 'sibling' as const, gender: 'nu' as const, name: 'A B', age: 10, alive: true, lifespan: 70, affinity: 50, chattedAt: null };
    expect(relationLabel(r, 5)).toBe('Chị');
    expect(relationLabel(r, 12)).toBe('Em gái');
  });

  it('chatting raises affinity once per year', () => {
    const s = createLife({ seed: 'chat', originId: 'nong_dan' }, content);
    const id = s.family[0].id;
    const once = chatWith(s, content, id);
    expect(once.family[0].affinity).toBeGreaterThan(s.family[0].affinity);
    expect(chatWith(once, content, id)).toBe(once);
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
});
