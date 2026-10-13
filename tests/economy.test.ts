import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { dependents, economyYear } from '../src/systems/economy';

const content = loadContent();

function cultivator(realm: string, patch: Partial<GameState['money']> = {}): GameState {
  const b = createLife({ seed: `econ-${realm}` }, content);
  return {
    ...b,
    character: { ...b.character, age: 60 },
    cult: { ...b.cult, realm },
    money: { silver: 0, spiritStones: 0, ...patch },
    family: [],
    log: [...b.log, { age: 60, lines: [] }],
  };
}

const child = (n: number) => ({ id: `c${n}`, role: 'child', alive: true }) as unknown as GameState['family'][number];

describe('6c.5 economy', () => {
  it('swaps silver for spirit stones at the exchange rate, mortals untouched', () => {
    const s = economyYear(cultivator('kim_dan', { silver: 1050 }), content);
    expect(s.money).toEqual({ silver: 50, spiritStones: 10 });
    expect(s.log[s.log.length - 1].lines[0].text).toContain('1000 lượng bạc');
    const m = cultivator('pham_nhan', { silver: 1050 });
    expect(economyYear(m, content)).toBe(m);
  });

  it('feeds dependents from Trúc Cơ, and a short purse costs happiness', () => {
    const base = cultivator('nguyen_anh', { spiritStones: 10 });
    const s0 = { ...base, family: [child(1), child(2), child(3)] };
    expect(dependents(s0, content)).toBe(3);
    const paid = economyYear(s0, content);
    expect(paid.money.spiritStones).toBe(10 - 3 * content.balance.economy.upkeepPerDependent.nguyen_anh);
    const poor = economyYear({ ...s0, money: { silver: 0, spiritStones: 2 } }, content);
    expect(poor.money.spiritStones).toBe(0);
    expect(poor.stats.happiness).toBe(Math.max(0, s0.stats.happiness + content.balance.economy.shortHappiness));
    expect(economyYear(cultivator('luyen_khi', { spiritStones: 10 }), content).money.spiritStones).toBe(10);
  });

  it('caps the dependents', () => {
    const s = { ...cultivator('hoa_than', { spiritStones: 100 }), family: Array.from({ length: 12 }, (_, i) => child(i)) };
    expect(dependents(s, content)).toBe(content.balance.economy.maxDependents);
  });
});
