// Aging, illness and death of a mortal body (PLAN.md G.3, task 1.8).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { DeathCause, GameState, LogLine } from '../core/types';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fill = (text: string, age: number) => text.replaceAll('{age}', String(age));

/** Push lines into the current year's log block. */
function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** Yearly change of the body: the young heal, the old wear down and fall ill. */
export function ageBody(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  const cfg = content.balance.aging;
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  let { health, happiness } = state.stats;
  const lines: LogLine[] = [];

  if (age >= cfg.declineStartAge) health -= cfg.healthDeclinePerYear;
  else if (health < cfg.recoverCap) health = Math.min(cfg.recoverCap, health + cfg.recoverPerYear);
  const illnessChance = (age - cfg.illnessStartAge) * cfg.illnessChancePerYear;
  if (illnessChance > 0 && rng.chance(illnessChance)) {
    health -= rng.int(cfg.illnessHealthLoss[0], cfg.illnessHealthLoss[1]);
    happiness -= cfg.illnessHappinessLoss;
    lines.push({ text: fill(rng.pick(content.lifeTexts.illness), age), tone: 'bad' });
  }

  return {
    ...state,
    rng: rng.getState(),
    stats: { ...state.stats, health: clamp(health), happiness: clamp(happiness) },
    log: addLines(state, lines),
  };
}

/** Why this life should end now, if it should. */
export function deathCause(state: GameState): DeathCause | null {
  if (state.character.age >= state.cult.lifespan) return 'old_age';
  if (state.stats.health <= 0) return 'illness';
  return null;
}

/** End the life if lifespan ran out or health hit zero. Call after anything that changes age or health. */
export function checkDeath(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  const cause = deathCause(state);
  if (!cause) return state;
  const cfg = content.balance.aging;
  const texts = content.lifeTexts;
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  const line = rng.pick(cause === 'old_age' ? texts.deathOldAge : texts.deathIllness);
  const karma = state.social.karma;
  const pool = karma >= cfg.epitaphKarma ? texts.epitaph.good : karma <= -cfg.epitaphKarma ? texts.epitaph.bad : texts.epitaph.plain;
  return {
    ...state,
    rng: rng.getState(),
    alive: false,
    death: { age, cause, epitaph: rng.pick(pool) },
    events: { ...state.events, pending: null },
    log: addLines(state, [{ text: fill(line, age), tone: 'bad' }]),
  };
}

export interface LifeSummary {
  age: number;
  causeText: string;
  epitaph: string;
  karmaLabel: string;
  eventsLived: number;
  relativesAlive: number;
  traits: string[];
}

/** What the death screen shows. */
export function lifeSummary(state: GameState, content: Content): LifeSummary | null {
  if (!state.death) return null;
  const { age, cause, epitaph } = state.death;
  const k = state.social.karma;
  const t = content.balance.aging.epitaphKarma;
  return {
    age,
    causeText: cause === 'old_age' ? `Hưởng thọ ${age} tuổi` : `Mất năm ${age} tuổi vì bệnh`,
    epitaph,
    karmaLabel: k >= t ? 'Thiện nhân' : k <= -t ? 'Ác nhân' : 'Người thường',
    eventsLived: Object.keys(state.events.history).length,
    relativesAlive: state.family.filter((r) => r.alive).length,
    traits: state.traits,
  };
}
