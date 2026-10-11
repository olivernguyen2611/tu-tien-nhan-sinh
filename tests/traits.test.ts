import { describe, expect, it } from 'vitest';
import { EffectHookSchema, TraitFileSchema } from '../src/core/schemas';
import { validateContent } from '../src/core/validate';
import traits from '../content/traits.json';

const ok = (e: object) => EffectHookSchema.safeParse(e).success;

describe('traits.json', () => {
  const parsed = TraitFileSchema.parse(traits);

  it('has the 20 approved traits: 16 normal + 4 bad-luck', () => {
    expect(parsed).toHaveLength(20);
    expect(parsed.filter((t) => t.rarity === 'ac')).toHaveLength(4);
  });

  it('covers every rarity', () => {
    const rarities = new Set(parsed.map((t) => t.rarity));
    expect([...rarities].sort()).toEqual(['ac', 'luong', 'pham', 'than', 'thien', 'tuyet', 'uu']);
  });

  it('passes the content validator', () => {
    expect(validateContent({ 'traits.json': traits }).filter((p) => p.level === 'error')).toEqual([]);
  });
});

describe('effect hooks (PLAN.md K.6)', () => {
  it('accepts hooks from the vocabulary', () => {
    expect(ok({ hook: 'stat.luck', add: 25 })).toBe(true);
    expect(ok({ hook: 'path.sword.power', add: 0.2 })).toBe(true);
    expect(ok({ hook: 'craft.alchemy.yield', add: 1 })).toBe(true);
    expect(ok({ hook: 'element.root.power', add: 0.2 })).toBe(true);
    expect(ok({ hook: 'eventWeight.herb', mul: 1.5 })).toBe(true);
    expect(ok({ hook: 'unlockChain.kiem_minh_trong_mong' })).toBe(true);
    expect(ok({ hook: 'trigger.everyNYears', years: 10, tag: 'fortune' })).toBe(true);
  });

  it('rejects unknown hooks and missing values', () => {
    expect(ok({ hook: 'stat.strength', add: 5 })).toBe(false);
    expect(ok({ hook: 'flyingSpeed', add: 1 })).toBe(false);
    expect(ok({ hook: 'stat.luck' })).toBe(false);
    expect(ok({ hook: 'eventWeight.herb', add: 1 })).toBe(false);
    expect(ok({ hook: 'trigger.everyNYears', years: 10 })).toBe(false);
  });

  it('requires romance event weights to start at 18', () => {
    const bad = [{ id: 'x', rarity: 'ac', name: 'X', flavor: 'x', summary: 'x', effects: [{ hook: 'eventWeight.romance_trouble', mul: 2 }] }];
    expect(validateContent({ 'traits.json': bad }).some((p) => p.message.includes('activeFrom'))).toBe(true);
  });
});
