// 10.13 Lịch lễ hội thật (content/calendar.json): in the days around a real lễ hội (Tết, Trung thu…) the game's lễ hội
// that year is likely the same one and festival events come more often. The UI hands in the device's date; the
// rest is decided here. Numbers: balance.calendar.
import type { Content } from '../core/content';
import type { GameEvent } from '../core/schemas';
import type { GameState } from '../core/types';

const DAY = 86_400_000;
const dayOf = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** The real lễ hội on `date` (within balance.calendar.windowDays), or null. */
export function realFestival(content: Content, date: Date): string | null {
  const cal = content.calendar;
  const cfg = content.balance.calendar;
  if (!cal || !cfg) return null;
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const known = new Set((content.leisure?.festivals ?? []).map((f) => f.id));
  for (const f of cal.festivals) {
    if (!known.has(f.id)) continue;
    if (f.dates.some((d) => Math.abs(dayOf(d) - today) <= cfg.windowDays * DAY)) return f.id;
  }
  return null;
}

/** The life as played on `date`: remembers the real lễ hội of the week (or none). */
export function withRealDate(state: GameState, content: Content, date: Date): GameState {
  const id = realFestival(content, date);
  return (state.realFestival ?? null) === id ? state : { ...state, realFestival: id };
}

/** Festival events weigh balance.calendar.boost times more in a real festival week. */
export function festivalBoost(state: GameState, content: Content, event: GameEvent): number {
  if (!state.realFestival || !event.themes?.includes('festival')) return 1;
  return content.balance.calendar?.boost ?? 1;
}
