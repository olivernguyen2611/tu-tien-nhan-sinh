// 9.R7e Sự kiện thiên hạ: world-wide happenings (Tiên Ma đại chiến, bí cảnh mở, thú triều…) that run
// in phases from world-events.json. At most one is under way; when none is, one may start each year
// (balance.worldEvents.startChance) on its own seeded stream. While a phase lasts, where it is felt,
// it reweights event themes and market prices; events can ask for it with the worldEvent condition.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { WorldEvent } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { currentRegion } from './regions';

const EMPTY: NonNullable<GameState['world']> = { active: null, cooldown: {} };

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

export function activeWorldEvent(state: GameState, content: Content): { event: WorldEvent; phase: WorldEvent['phases'][number]; index: number } | null {
  const a = state.world?.active;
  const event = a && (content.worldEvents ?? []).find((e) => e.id === a.id);
  const phase = event?.phases[a!.phase];
  return event && phase ? { event, phase, index: a!.phase } : null;
}

/** Whether the player stands where the event is felt (everywhere when it names no region). */
function felt(state: GameState, content: Content, event: WorldEvent): boolean {
  return event.regions.length === 0 || event.regions.includes(currentRegion(state, content)?.id ?? '');
}

/** Theme multiplier from the phase under way. */
export function worldThemeMultiplier(state: GameState, content: Content, themes: string[]): number {
  const w = activeWorldEvent(state, content);
  if (!w || !felt(state, content, w.event)) return 1;
  return themes.reduce((m, t) => m * (w.phase.eventWeight[t] ?? 1), 1);
}

/** Price multiplier from the phase under way. */
export function worldPriceMul(state: GameState, content: Content): number {
  const w = activeWorldEvent(state, content);
  return w && felt(state, content, w.event) ? w.phase.priceMul : 1;
}

function phaseLine(event: WorldEvent, index: number): LogLine {
  return { text: `${event.name} · ${event.phases[index].name}: ${event.phases[index].text}`, tone: 'normal' };
}

/** Start a given event now (also used by developer mode). */
export function startWorldEvent(state: GameState, content: Content, id: string): GameState {
  const event = (content.worldEvents ?? []).find((e) => e.id === id);
  if (!event) return state;
  const world = state.world ?? EMPTY;
  return { ...state, world: { ...world, active: { id, phase: 0, left: event.phases[0].years } }, log: pushLines(state, [phaseLine(event, 0)]) };
}

/** One year of the world: the phase under way runs down, or a new event may begin. */
export function worldEventsYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.worldEvents;
  const events = content.worldEvents ?? [];
  if (!cfg || events.length === 0) return state;
  const age = state.character.age;
  const world = state.world ?? EMPTY;
  const a = world.active;
  if (a) {
    const event = events.find((e) => e.id === a.id);
    if (!event) return { ...state, world: { ...world, active: null } };
    if (a.left > 1) return { ...state, world: { ...world, active: { ...a, left: a.left - 1 } } };
    const next = a.phase + 1;
    if (next >= event.phases.length) return { ...state, world: { active: null, cooldown: { ...world.cooldown, [event.id]: age + event.cooldownYears } } };
    return { ...state, world: { ...world, active: { id: a.id, phase: next, left: event.phases[next].years } }, log: pushLines(state, [phaseLine(event, next)]) };
  }
  if (age < cfg.minAge) return state;
  const rng = new Rng(`${state.seed}:world:${age}`);
  if (!rng.chance(cfg.startChance)) return state;
  const open = events.filter((e) => (world.cooldown[e.id] ?? -1) <= age);
  if (open.length === 0) return state;
  return startWorldEvent({ ...state, world }, content, rng.weighted(open, (e) => e.weight).id);
}
