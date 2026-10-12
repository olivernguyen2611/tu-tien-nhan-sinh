import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { yearlyGain, breakthroughPct } from '../src/systems/cultivation';
import { difficultyHookSum, savesLocked } from '../src/systems/difficulty';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();
const rerolls = content.balance.traits.rerolls;

function cultivator(difficulty: string): GameState {
  const b = createLife({ seed: 'diff', difficulty }, content);
  return {
    ...b,
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    cult: { ...b.cult, realm: 'luyen_khi', root: { grade: 'song', elements: ['kim', 'hoa'] } },
  };
}

describe('difficulty (task 2.10)', () => {
  it('defaults to Thường and keeps the chosen one', () => {
    expect(createLife({ seed: 'd0' }, content).difficulty).toBe('normal');
    expect(createLife({ seed: 'd0', difficulty: 'hard' }, content).difficulty).toBe('hard');
    expect(createLife({ seed: 'd0', difficulty: 'nope' }, content).difficulty).toBe('normal');
  });

  it('changes destiny rerolls', () => {
    expect(createLife({ seed: 'd1', difficulty: 'easy' }, content).destiny.rerollsLeft).toBe(rerolls + 2);
    expect(createLife({ seed: 'd1', difficulty: 'hard' }, content).destiny.rerollsLeft).toBe(rerolls - 1);
  });

  it('does not change the character itself for the same seed', () => {
    const a = createLife({ seed: 'same', difficulty: 'easy' }, content);
    const b = createLife({ seed: 'same', difficulty: 'hard' }, content);
    expect(a.character).toEqual(b.character);
    expect(a.aptitudes).toEqual(b.aptitudes);
  });

  it('easy cultivates faster and breaks through more easily; hard the reverse', () => {
    const [easy, normal, hard] = ['easy', 'normal', 'hard'].map(cultivator);
    expect(yearlyGain(easy, content) / yearlyGain(normal, content)).toBeCloseTo(1.25);
    expect(yearlyGain(hard, content) / yearlyGain(normal, content)).toBeCloseTo(0.9);
    expect(breakthroughPct(easy, content, 30, true) - breakthroughPct(normal, content, 30, true)).toBeCloseTo(10);
    expect(breakthroughPct(hard, content, 30, true) - breakthroughPct(normal, content, 30, true)).toBeCloseTo(-5);
    expect(difficultyHookSum(easy, content, 'illnessChancePct')).toBe(-50);
  });

  it('Khó locks export/import only while the life is alive', () => {
    const hard = createLife({ seed: 'lock', difficulty: 'hard' }, content);
    expect(savesLocked(hard, content)).toBe(true);
    expect(savesLocked({ ...hard, alive: false }, content)).toBe(false);
    expect(savesLocked(createLife({ seed: 'lock' }, content), content)).toBe(false);
  });

  it('old saves become Thường', () => {
    const { difficulty: _d, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life.difficulty).toBe('normal');
  });
});
