// Difficulty (task 2.10): Dễ/Thường/Khó as K.6 hooks for the whole life,
// extra destiny rerolls, and the "no reload" rule for Khó.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';

export function difficultyOf(state: Pick<GameState, 'difficulty'>, content: Content) {
  return content.balance.difficulty[state.difficulty] ?? content.balance.difficulty[content.balance.defaultDifficulty];
}

/** Sum of an add-hook from the life's difficulty. */
export function difficultyHookSum(state: GameState, content: Content, hook: string): number {
  let sum = 0;
  for (const e of difficultyOf(state, content)?.effects ?? []) if (e.hook === hook) sum += e.add ?? 0;
  return sum;
}

/** Khó: a living life cannot be exported or imported (no undoing by reloading a copy). */
export function savesLocked(life: Pick<GameState, 'difficulty' | 'alive'>, content: Content): boolean {
  return life.alive && !!difficultyOf(life, content)?.noReload;
}

export function difficultyName(state: Pick<GameState, 'difficulty'>, content: Content): string {
  return content.difficulties.find((d) => d.id === state.difficulty)?.name ?? state.difficulty;
}
