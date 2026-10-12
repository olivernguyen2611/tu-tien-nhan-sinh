// Developer mode: rewind time (backlog 6). A snapshot of the life is kept as each age begins (the
// state `advanceYear` returns, before the player has done anything that year), for the last few
// years. "Tua ngược N năm" restores the snapshot of N years ago, so that year's events can be
// answered differently. Snapshots live in memory only; nothing here touches the save file.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';

export interface Snapshot { age: number; state: GameState }

type Observer = (state: GameState) => void;
const observers = new Set<Observer>();

/** Be told of every state `advanceYear` produces (it is how the app records snapshots for fast-forward and seclusion too). */
export function onYearAdvanced(observer: Observer): () => void {
  observers.add(observer);
  return () => { observers.delete(observer); };
}

export function notifyYear(state: GameState): void {
  for (const o of observers) o(state);
}

/**
 * Add the life as it stands to the history. A different life (another seed) starts the history over,
 * a snapshot at the same age replaces the old one, and only `keep` years back from the newest are kept.
 */
export function recordSnapshot(history: Snapshot[], state: GameState, keep: number): Snapshot[] {
  if (!state.alive) return history;
  const base = history.length > 0 && history[0].state.seed === state.seed ? history : [];
  const kept = base.filter((h) => h.age < state.character.age && h.age >= state.character.age - keep);
  return [...kept, { age: state.character.age, state }];
}

export interface RewindOption { years: number; age: number }

/** The rewinds on offer: each configured step that has a snapshot. */
export function rewindOptions(history: Snapshot[], state: GameState, content: Content): RewindOption[] {
  if (history.length === 0 || history[0].state.seed !== state.seed) return [];
  return content.balance.dev.rewindSteps
    .map((years) => ({ years, age: state.character.age - years }))
    .filter((o) => history.some((h) => h.age === o.age));
}

/**
 * Go back `years` years: the state at the start of that age, with a [Dev] line in its log. The
 * snapshots after it are dropped (the life will be played again from there). Null when there is none.
 */
export function rewind(history: Snapshot[], state: GameState, years: number): { state: GameState; history: Snapshot[] } | null {
  const target = state.character.age - years;
  const snap = history.find((h) => h.age === target && h.state.seed === state.seed);
  if (!snap || years < 1) return null;
  const line = { text: `[Dev] Tua ngược ${years} năm, về lại ${target} tuổi.`, tone: 'normal' as const };
  const log = snap.state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === target) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: target, lines: [line] });
  return { state: { ...snap.state, log }, history: history.filter((h) => h.age <= target) };
}
