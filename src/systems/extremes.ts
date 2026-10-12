// Stats stuck at an extreme (stat-extremes-approved.md): a stat at ≤ lowAt or
// ≥ highAt for `years` years in a row gives a special state with lasting
// effects (K.6 hooks), until the stat climbs back past the exit threshold.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { StatExtreme } from '../core/schemas';
import type { GameState, LogLine, Tone } from '../core/types';
import { STAT_LABELS } from './deltas';

type Zone = 'low' | 'high';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Current value of a tracked stat ("karma" or a stat/aptitude name). */
export function trackedValue(state: GameState, key: string): number {
  if (key === 'karma') return state.social.karma;
  if (key in state.stats) return state.stats[key as keyof GameState['stats']];
  return state.aptitudes[key as keyof GameState['aptitudes']];
}

function thresholds(content: Content, key: string) {
  const b = content.balance.extremes;
  return key === 'karma'
    ? { lowAt: b.karmaLowAt, highAt: b.karmaHighAt, exitLow: b.karmaExitLow, exitHigh: b.karmaExitHigh }
    : { lowAt: b.lowAt, highAt: b.highAt, exitLow: b.exitLow, exitHigh: b.exitHigh };
}

const statLabel = (key: string) => (key === 'karma' ? 'Nhân quả' : STAT_LABELS[key] ?? key);
const yearsFor = (content: Content, def: StatExtreme) => def.years ?? content.balance.extremes.years;

/** States this life is in now. */
export function activeExtremes(state: GameState, content: Content): StatExtreme[] {
  return content.extremes.states.filter((d) => state.extremes.active[d.id] !== undefined);
}

/** Sum of an add-hook over the active states (0 when none). */
export function extremeHookSum(state: GameState, content: Content, hook: string): number {
  let sum = 0;
  for (const d of activeExtremes(state, content)) for (const e of d.effects) if (e.hook === hook) sum += e.add ?? 0;
  return sum;
}

/** An active state carries this flag hook (cannotWork, noLineageChange…). */
export function extremeHasHook(state: GameState, content: Content, hook: string): boolean {
  return activeExtremes(state, content).some((d) => d.effects.some((e) => e.hook === hook));
}

/** Product of eventWeight.<theme> multipliers from active states for these themes. */
export function extremeThemeMultiplier(state: GameState, content: Content, themes: string[]): number {
  let mul = 1;
  for (const d of activeExtremes(state, content)) {
    for (const e of d.effects) {
      if (e.hook.startsWith('eventWeight.') && e.mul !== undefined && themes.includes(e.hook.slice('eventWeight.'.length))) mul *= e.mul;
    }
  }
  return mul;
}

/** Stats one year away from tipping into a state (their bars blink as a warning). */
export function extremeWarnings(state: GameState, content: Content): string[] {
  const out = new Set<string>();
  for (const d of content.extremes.states) {
    if (state.extremes.active[d.id] !== undefined) continue;
    const years = yearsFor(content, d);
    if (years > 1 && (state.extremes.streak[d.stat]?.[d.zone] ?? 0) === years - 1) out.add(d.stat);
  }
  return [...out];
}

/** Add to a stat/aptitude ("stat.<name>"), or lifespan by percent; returns the new state. */
function applyOnce(state: GameState, hook: string, add: number): GameState {
  if (hook === 'lifespanPct') {
    return { ...state, cult: { ...state.cult, lifespan: Math.round(state.cult.lifespan * (1 + add)) } };
  }
  return addToStat(state, hook.slice('stat.'.length), add);
}

function addToStat(state: GameState, key: string, add: number): GameState {
  if (key in state.stats) {
    const k = key as keyof GameState['stats'];
    return { ...state, stats: { ...state.stats, [k]: clamp(state.stats[k] + add) } };
  }
  if (key in state.aptitudes) {
    const k = key as keyof GameState['aptitudes'];
    return { ...state, aptitudes: { ...state.aptitudes, [k]: clamp(state.aptitudes[k] + add) } };
  }
  return state;
}

const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
const toneOf = (d: StatExtreme): Tone => (d.zone === 'high' ? 'good' : 'bad');

/** One year of the extreme-stat system. Runs after the body ages, before death is checked. */
export function ageExtremes(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  const file = content.extremes;
  const cooldown = content.balance.extremes.onceCooldownYears;
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  const lines: LogLine[] = [];
  let s = state;
  const active = { ...s.extremes.active };
  const givenAt = { ...s.extremes.givenAt };

  // 1. States already on take their yearly toll (or gift).
  for (const d of activeExtremes(s, content)) {
    for (const e of d.effects) {
      if (e.hook.startsWith('statPerYear.')) s = addToStat(s, e.hook.slice('statPerYear.'.length), e.add ?? 0);
      else if (e.hook === 'silverPerYear') s = { ...s, money: { ...s.money, silver: Math.max(0, s.money.silver + (e.add ?? 0)) } };
      else if (e.hook === 'deathChancePerYear' && rng.chance(e.add ?? 0)) s = { ...s, stats: { ...s.stats, health: 0 } };
    }
    d.specials.forEach((sp, i) => {
      const key = `${d.id}#${i}`;
      const inState = age - active[d.id];
      const due = sp.afterYears !== undefined ? inState >= sp.afterYears : rng.chance(sp.chancePerYear ?? 0);
      if (!due || (givenAt[key] !== undefined && givenAt[key] >= active[d.id])) return;
      givenAt[key] = age;
      for (const e of sp.effects) s = applyOnce(s, e.hook, e.add);
      lines.push({ text: sp.text, tone: 'rare' });
    });
  }

  // 2. Count years in each zone, from this year's values.
  const streak: GameState['extremes']['streak'] = {};
  for (const key of new Set(file.states.map((d) => d.stat))) {
    const v = trackedValue(s, key);
    const t = thresholds(content, key);
    const prev = s.extremes.streak[key] ?? { low: 0, high: 0 };
    streak[key] = { low: v <= t.lowAt ? prev.low + 1 : 0, high: v >= t.highAt ? prev.high + 1 : 0 };
  }

  for (const d of file.states) {
    const v = trackedValue(s, d.stat);
    const t = thresholds(content, d.stat);
    if (active[d.id] !== undefined) {
      // 3. Leave a state once the stat is clearly back (a buffer so it does not flicker).
      const out = d.zone === 'low' ? v >= t.exitLow : v <= t.exitHigh;
      if (out) {
        delete active[d.id];
        lines.push({ text: fill(file.exit, { name: d.name }), tone: 'normal' });
      }
      continue;
    }
    // 4. Enter after enough years in the zone; warn the year before.
    const years = yearsFor(content, d);
    const n = streak[d.stat][d.zone as Zone];
    if (n >= years) {
      active[d.id] = age;
      lines.push({ text: fill(file.enter, { name: d.name, text: d.text }), tone: toneOf(d) });
      const last = givenAt[d.id];
      if (d.onceEffects.length > 0 && (last === undefined || age - last >= cooldown)) {
        givenAt[d.id] = age;
        for (const e of d.onceEffects) s = applyOnce(s, e.hook, e.add);
      }
    } else if (years > 1 && n === years - 1) {
      lines.push({ text: fill(file.warn[d.zone as Zone], { stat: statLabel(d.stat) }), tone: 'normal' });
    }
  }

  s = { ...s, extremes: { streak, active, givenAt } };

  // 5. Floors last, so nothing this year pushes a stat under them.
  for (const d of activeExtremes(s, content)) {
    for (const e of d.effects) {
      if (!e.hook.startsWith('statFloor.')) continue;
      const key = e.hook.slice('statFloor.'.length);
      const v = trackedValue(s, key);
      if (v < (e.add ?? 0)) s = addToStat(s, key, (e.add ?? 0) - v);
    }
  }

  const log = s.log.slice();
  if (lines.length > 0) {
    const last = log[log.length - 1];
    log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  }
  return { ...s, rng: rng.getState(), log };
}
