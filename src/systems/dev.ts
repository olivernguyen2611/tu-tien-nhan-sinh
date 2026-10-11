// Developer mode: cheats for play-testing. Pure functions on GameState, like
// every other system; the UI panel only calls these. Every change is logged
// with a [Dev] mark so a tested life is never mistaken for a real one.
import type { Content } from '../core/content';
import { APTITUDES, MORTAL_STATS } from '../core/schemas';
import { advanceYear } from '../core/state';
import type { GameState, LogLine } from '../core/types';
import { STAT_LABELS } from './deltas';

export type DevStat = (typeof MORTAL_STATS)[number] | (typeof APTITUDES)[number];
export const DEV_STATS: DevStat[] = [...MORTAL_STATS, ...APTITUDES];

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

function devLog(state: GameState, text: string): GameState {
  const line: LogLine = { text: `[Dev] ${text}`, tone: 'normal' };
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: state.character.age, lines: [line] });
  return { ...state, log };
}

/** Add `delta` to a stat or aptitude (clamped 0–100). */
export function devAddStat(state: GameState, stat: DevStat, delta: number): GameState {
  if ((MORTAL_STATS as readonly string[]).includes(stat)) {
    const k = stat as (typeof MORTAL_STATS)[number];
    return devLog({ ...state, stats: { ...state.stats, [k]: clamp(state.stats[k] + delta) } }, `${STAT_LABELS[stat]} ${delta > 0 ? '+' : ''}${delta}`);
  }
  const k = stat as (typeof APTITUDES)[number];
  return devLog({ ...state, aptitudes: { ...state.aptitudes, [k]: clamp(state.aptitudes[k] + delta) } }, `${STAT_LABELS[stat]} ${delta > 0 ? '+' : ''}${delta}`);
}

export function devAddMoney(state: GameState, silver: number, spiritStones: number): GameState {
  const money = {
    silver: Math.max(0, state.money.silver + silver),
    spiritStones: Math.max(0, state.money.spiritStones + spiritStones),
  };
  return devLog({ ...state, money }, `bạc ${silver >= 0 ? '+' : ''}${silver}, linh thạch ${spiritStones >= 0 ? '+' : ''}${spiritStones}`);
}

export function devAddKarma(state: GameState, delta: number): GameState {
  return devLog({ ...state, social: { ...state.social, karma: clamp(state.social.karma + delta, -100, 100) } }, `nhân quả ${delta > 0 ? '+' : ''}${delta}`);
}

/** Open any event now, ignoring its conditions. */
export function devTriggerEvent(state: GameState, content: Content, eventId: string): GameState {
  if (!state.alive || !content.events.some((e) => e.id === eventId)) return state;
  return devLog({ ...state, events: { ...state.events, pending: eventId } }, `gọi sự kiện ${eventId}`);
}

/** Skip `years` years; events that come up are dismissed unanswered. */
export function devSkipYears(state: GameState, content: Content, years: number): GameState {
  let s = devLog(state, `bỏ qua ${years} năm`);
  for (let i = 0; i < years && s.alive; i++) {
    s = advanceYear({ ...s, events: { ...s.events, pending: null } }, content);
  }
  return { ...s, events: { ...s.events, pending: null } };
}

/** Full health. */
export function devHeal(state: GameState): GameState {
  return devLog({ ...state, stats: { ...state.stats, health: 100 } }, 'hồi đầy sức khỏe');
}
