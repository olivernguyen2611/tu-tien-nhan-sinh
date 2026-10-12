// Aging, illness and death of a mortal body (PLAN.md G.3, task 1.8).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { DeathCause, GameState, LogLine } from '../core/types';
import { describeDelta } from './deltas';
import { extremeHookSum } from './extremes';
import { difficultyHookSum } from './difficulty';
import { rollGhostOffer } from './ghost';

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
  let { health, happiness, charm } = state.stats;
  const lines: LogLine[] = [];

  // A quỷ tu has no body to mend or to age (task 4.12); Quỷ đạo wears health on its own.
  if (state.flags.quy_tu) { /* no recovery, no old-age decline */ }
  else if (age >= cfg.declineStartAge) health -= cfg.healthDeclinePerYear;
  else if (health < cfg.recoverCap && !state.flags.quy_tu) health = Math.min(cfg.recoverCap, health + cfg.recoverPerYear);
  // Old-age milestones (60, 70, 80): a visible blow to health and looks.
  if (cfg.milestoneAges.includes(age)) {
    const dh = clamp(health + cfg.milestoneHealth) - clamp(health);
    // Trú Nhan Đan keeps the face (flag no_aging_charm).
    const dc = state.flags.no_aging_charm ? 0 : clamp(charm + cfg.milestoneCharm) - charm;
    health += dh;
    charm += dc;
    const change = [describeDelta('health', dh), describeDelta('charm', dc)].filter(Boolean).join(' · ');
    lines.push({ text: `${fill(rng.pick(content.lifeTexts.agingMilestone), age)}${change ? ` ${change}.` : ''}`, tone: 'normal' });
  }
  // Extreme states can make illness likelier or rule it out (illnessChancePct).
  const illnessMul = Math.max(0, 1 + (extremeHookSum(state, content, 'illnessChancePct') + difficultyHookSum(state, content, 'illnessChancePct')) / 100);
  const illnessChance = (age - cfg.illnessStartAge) * cfg.illnessChancePerYear * illnessMul;
  if (illnessChance > 0 && rng.chance(illnessChance)) {
    health -= rng.int(cfg.illnessHealthLoss[0], cfg.illnessHealthLoss[1]);
    happiness -= cfg.illnessHappinessLoss;
    lines.push({ text: fill(rng.pick(content.lifeTexts.illness), age), tone: 'bad' });
  }

  return {
    ...state,
    rng: rng.getState(),
    stats: { ...state.stats, health: clamp(health), happiness: clamp(happiness), charm: clamp(charm) },
    log: addLines(state, lines),
  };
}

/** Why this life should end now, if it should. */
export function deathCause(state: GameState): DeathCause | null {
  if (state.character.age >= state.cult.lifespan) return 'old_age';
  if (state.stats.health <= 0) return 'illness';
  return null;
}

/**
 * End the life if lifespan ran out or health hit zero. Call after anything that changes age or health.
 * `forced` ends it now for that cause (e.g. a failed breakthrough).
 */
export function checkDeath(state: GameState, content: Content, forced?: DeathCause): GameState {
  if (!state.alive) return state;
  const cause = forced ?? deathCause(state);
  if (!cause) return state;
  const cfg = content.balance.aging;
  const texts = content.lifeTexts;
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  const pools = { old_age: texts.deathOldAge, breakthrough: texts.deathBreakthrough, ordeal: texts.deathOrdeal, illness: texts.deathIllness, combat: texts.deathCombat, tribulation: texts.deathTribulation };
  const line = rng.pick(pools[cause]);
  const karma = state.social.karma;
  const pool = karma >= cfg.epitaphKarma ? texts.epitaph.good : karma <= -cfg.epitaphKarma ? texts.epitaph.bad : texts.epitaph.plain;
  return {
    ...state,
    rng: rng.getState(),
    alive: false,
    death: { age, cause, epitaph: rng.pick(pool), ghostOffer: rollGhostOffer(state, content, cause) },
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
    causeText: cause === 'old_age' ? `Hưởng thọ ${age} tuổi`
      : cause === 'breakthrough' ? `Mất năm ${age} tuổi khi đột phá`
      : cause === 'ordeal' ? `Mất năm ${age} tuổi khi luyện hóa kỳ vật`
      : cause === 'combat' ? `Tử trận năm ${age} tuổi`
      : cause === 'tribulation' ? `Mất năm ${age} tuổi dưới thiên kiếp`
      : `Mất năm ${age} tuổi vì bệnh`,
    epitaph,
    karmaLabel: k >= t ? 'Thiện nhân' : k <= -t ? 'Ác nhân' : 'Người thường',
    eventsLived: Object.keys(state.events.history).length,
    relativesAlive: state.family.filter((r) => r.alive).length,
    traits: state.traits,
  };
}
