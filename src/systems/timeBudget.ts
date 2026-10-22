// 9.4 Quỹ thời gian: each year has balance.time.monthsPerYear months. A mortal's career takes its months first;
// activities spend months; for a cultivator the months left at the end of the year go to cultivation, so a
// year of visits and errands is a year of slower tu vi. Bế quan locks the whole year for cultivation.
import { schoolMonths } from './schooling';
import { jobMonths } from './jobs';
import { assetMonths } from './assets';
import type { Content } from '../core/content';
import type { GameState } from '../core/types';

/** Months spent on activities in the year the life is in now. */
export function monthsUsed(state: GameState): number {
  const a = state.activities;
  return a && a.year === state.character.age ? (a.months ?? 0) : 0;
}

/** Months the mortal career takes (cultivators live off their cultivation, not a trade). */
export function careerMonths(state: GameState, content: Content): number {
  // 10.3: a job's own months replace the đường đời's.
  if (!state.career.id || state.cult.realm !== 'pham_nhan' || state.job?.id) return 0;
  const cfg = content.balance.time;
  return cfg.careerMonths[state.career.id] ?? cfg.careerMonthsDefault;
}

/** Months still free this year for activities. */
export function monthsLeft(state: GameState, content: Content): number {
  return Math.max(0, content.balance.time.monthsPerYear - careerMonths(state, content) - jobMonths(state, content) - assetMonths(state, content) - schoolMonths(state, content) - monthsUsed(state));
}

/** Share of the year that goes to cultivation, given the months activities took. */
export function cultivationShare(state: GameState, content: Content, used = monthsUsed(state)): number {
  if (state.seclusion) return 1;
  const total = content.balance.time.monthsPerYear;
  return Math.max(0, total - used) / total;
}

/** 13.3: other things a cultivator does that eat months (sect missions, crafting, the bảo khố, disciples, đạo lữ and children). */
export type TimedAction = 'mission' | 'craft' | 'treasury' | 'disciple' | 'bond';

/** Months this action takes (balance.time.actionMonths); mortals live by their trade, so 0 for them. */
export function actionMonths(state: GameState, content: Content, kind: TimedAction): number {
  return state.cult.realm === 'pham_nhan' ? 0 : content.balance.time.actionMonths?.[kind] ?? 0;
}

/** Why the action does not fit in the year, or null. */
export function monthsShort(state: GameState, content: Content, kind: TimedAction): string | null {
  const need = actionMonths(state, content, kind);
  return need > 0 && monthsLeft(state, content) < need ? `Năm nay không còn đủ ${need} tháng.` : null;
}

/** Spend the action's months from this year. */
export function spendMonths(state: GameState, content: Content, kind: TimedAction): GameState {
  const need = actionMonths(state, content, kind);
  if (need === 0) return state;
  const age = state.character.age;
  const a = state.activities;
  const same = a && a.year === age;
  return { ...state, activities: { last: a?.last ?? {}, year: age, uses: same ? a.uses : {}, months: monthsUsed(state) + need } };
}
