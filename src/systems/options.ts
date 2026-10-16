// 9.R11: per-life options the player sets in Cài đặt that change what the game does (not only how it looks).
// gentle: "ẩn nội dung nhạy cảm" (PLAN H) — events tagged dark or mature never come.
import type { GameEvent } from '../core/schemas';
import type { GameState } from '../core/types';

export const SENSITIVE_TAGS = ['dark', 'mature'] as const;

/** Is this event hidden by the life's options? */
export function hiddenByOptions(state: GameState, event: GameEvent): boolean {
  return !!state.options?.gentle && event.tags.some((t) => (SENSITIVE_TAGS as readonly string[]).includes(t));
}

/** Turn the gentle filter on or off for this life. */
export function setGentle(state: GameState, on: boolean): GameState {
  if (!!state.options?.gentle === on) return state;
  return { ...state, options: { ...state.options, gentle: on } };
}
