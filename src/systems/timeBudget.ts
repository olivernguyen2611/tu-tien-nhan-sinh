// 9.4 Quỹ thời gian: each year has balance.time.monthsPerYear months. A mortal's career takes its months first;
// activities spend months; for a cultivator the months left at the end of the year go to cultivation, so a
// year of visits and errands is a year of slower tu vi. Bế quan locks the whole year for cultivation.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';

/** Months spent on activities in the year the life is in now. */
export function monthsUsed(state: GameState): number {
  const a = state.activities;
  return a && a.year === state.character.age ? (a.months ?? 0) : 0;
}

/** Months the mortal career takes (cultivators live off their cultivation, not a trade). */
export function careerMonths(state: GameState, content: Content): number {
  if (!state.career.id || state.cult.realm !== 'pham_nhan') return 0;
  const cfg = content.balance.time;
  return cfg.careerMonths[state.career.id] ?? cfg.careerMonthsDefault;
}

/** Months still free this year for activities. */
export function monthsLeft(state: GameState, content: Content): number {
  return Math.max(0, content.balance.time.monthsPerYear - careerMonths(state, content) - monthsUsed(state));
}

/** Share of the year that goes to cultivation, given the months activities took. */
export function cultivationShare(state: GameState, content: Content, used = monthsUsed(state)): number {
  if (state.seclusion) return 1;
  const total = content.balance.time.monthsPerYear;
  return Math.max(0, total - used) / total;
}
