import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { caveView, rentCave } from '../src/systems/cave';
import { yearlyGain } from '../src/systems/cultivation';

const content = loadContent();
const b = content.balance.caveRent;

function cultivator(stones: number): GameState {
  const s = createLife({ seed: 'cave' }, content);
  return {
    ...s,
    character: { ...s.character, age: 30 },
    money: { ...s.money, spiritStones: stones },
    cult: { ...s.cult, realm: 'truc_co', stage: 2, root: { grade: 'song', elements: ['kim', 'hoa'] }, technique: 'dan_khi_quyet', lifespan: 200 },
    log: [...s.log, { age: 30, lines: [] }],
  };
}

describe('động phủ linh mạch (6b.14)', () => {
  it('a mortal cannot rent; a cultivator pays by realm, less per year on a long lease', () => {
    expect(caveView(createLife({ seed: 'm' }, content), content).blocked).toBe('Chưa tu hành.');
    const v = caveView(cultivator(10_000), content);
    expect(v.blocked).toBeNull();
    const [one, ten] = v.leases;
    expect(one.cost).toBe(b.cost.truc_co);
    expect(ten.cost).toBeLessThan(one.cost * 10);
  });

  it('renting takes the stones, speeds up exactly the leased years, then can be renewed', () => {
    const s0 = cultivator(1000);
    const r = rentCave(s0, content, 1)!;
    expect(r.state.money.spiritStones).toBe(1000 - b.cost.truc_co);
    expect(caveView(r.state, content).blocked).toContain('Đang thuê');
    const next = { ...r.state, character: { ...r.state.character, age: 31 } };
    const plain = { ...s0, character: { ...s0.character, age: 31 } };
    expect(yearlyGain(next, content)).toBeCloseTo(yearlyGain(plain, content) * b.speedMul);
    const after = { ...r.state, character: { ...r.state.character, age: 32 } };
    expect(yearlyGain(after, content)).toBeCloseTo(yearlyGain({ ...s0, character: { ...s0.character, age: 32 } }, content));
    expect(caveView({ ...r.state, character: { ...r.state.character, age: 31 } }, content).blocked).toBeNull();
  });

  it('cannot rent without the stones', () => {
    expect(rentCave(cultivator(0), content, 1)).toBeNull();
    expect(caveView(cultivator(0), content).leases.every((l) => l.blocked === 'Không đủ linh thạch.')).toBe(true);
  });

  it('old saves get caveUntil through advanceYear without breaking', () => {
    const s = cultivator(100);
    expect(advanceYear(s, content).cult.caveUntil).toBeNull();
  });
});
