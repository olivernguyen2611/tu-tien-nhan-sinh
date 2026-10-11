// EventEngine (PLAN.md task 1.5): each year pick at most one event, the player
// chooses, the outcome is applied. Pure functions over GameState + Content.
import type { Content } from '../../core/content';
import { Rng } from '../../core/rng';
import type { GameEvent } from '../../core/schemas';
import { fillTemplate } from '../../core/state';
import { extremeThemeMultiplier } from '../extremes';
import type { GameState, LogLine, Tone } from '../../core/types';
import { meets, readValue } from './conditions';
import { grantRoot, hookActive, lifeHooks, revealRoot, startCultivating } from '../cultivation';

type Outcome = NonNullable<GameEvent['choices'][number]['result']>;

export function findEvent(content: Content, id: string): GameEvent | undefined {
  return content.events.find((e) => e.id === id);
}

/** Product of the life's multipliers for this event's themes (K.6 eventWeight.<theme>). */
export function themeMultiplier(state: GameState, content: Content, event: GameEvent): number {
  let mul = 1;
  // Traits, special body and career (K.6 eventWeight.<theme>).
  for (const e of lifeHooks(state, content)) {
    if (!e.hook.startsWith('eventWeight.') || e.mul === undefined || !hookActive(e, state, content)) continue;
    if (event.themes.includes(e.hook.slice('eventWeight.'.length))) mul *= e.mul;
  }
  return mul * extremeThemeMultiplier(state, content, event.themes);
}

/** Weight of an event for this life right now; 0 = cannot happen. */
export function eventWeight(state: GameState, content: Content, event: GameEvent): number {
  if (event.weight <= 0) return 0; // follow-up only
  const last = state.events.history[event.id];
  if (last !== undefined) {
    if (event.oncePerLife) return 0;
    if (event.cooldownYears > 0 && state.character.age - last < event.cooldownYears) return 0;
  }
  if (!meets(state, event.conditions, content)) return 0;
  let w = event.weight * themeMultiplier(state, content, event);
  if (event.luckAffected) w *= 1 + (state.aptitudes.luck - 50) / 100; // G.4
  return Math.max(0, w);
}

/** Roll this year's event (after age +1). Follow-ups that are due come first. */
export function rollYearEvent(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  const due = state.events.followUps.find((f) => f.atAge <= age && findEvent(content, f.event));
  let picked: string | null = null;
  let followUps = state.events.followUps;

  if (due) {
    picked = due.event;
    followUps = followUps.filter((f) => f !== due);
  } else if (rng.chance(content.balance.events.popupChanceLowRealm)) {
    const pool = content.events
      .map((e) => ({ e, w: eventWeight(state, content, e) }))
      .filter((x) => x.w > 0);
    if (pool.length > 0) picked = rng.weighted(pool, (x) => x.w).e.id;
  }

  return {
    ...state,
    rng: rng.getState(),
    events: { ...state.events, followUps, pending: picked },
  };
}

export interface ChoiceView {
  index: number;
  text: string;
  /** Hidden choice unlocked by a trait: shown highlighted. */
  hidden: boolean;
  /** Trait that unlocked it (for the label/colour). */
  traitId: string | null;
  /** Visible but its requirement is not met (e.g. not enough silver). */
  disabled: boolean;
  check: { stat: string; difficulty: number; chance: number } | null;
}

export function checkChance(state: GameState, content: Content, stat: string, difficulty: number): number {
  const c = content.balance.events.check;
  const p = c.base + (readValue(state, stat) - difficulty) * c.perPoint;
  return Math.max(c.min, Math.min(c.max, p));
}

/** Choices to show for the pending event: hidden ones only when unlocked. */
export function visibleChoices(state: GameState, content: Content, event: GameEvent): ChoiceView[] {
  const out: ChoiceView[] = [];
  event.choices.forEach((c, index) => {
    const ok = meets(state, c.requires, content);
    if (c.hidden && !ok) return;
    out.push({
      index,
      text: c.text,
      hidden: c.hidden,
      traitId: c.hidden ? c.requires?.traitsAny?.find((t) => state.traits.includes(t)) ?? null : null,
      disabled: !ok,
      check: c.check ? { ...c.check, chance: checkChance(state, content, c.check.stat, c.check.difficulty) } : null,
    });
  });
  return out;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function applyEffects(state: GameState, effects: Outcome['effects'], rng: Rng): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  const money = { ...state.money };
  const social = { ...state.social };
  const flags = { ...state.flags };
  let followUps = state.events.followUps;

  for (const [key, value] of Object.entries(effects)) {
    if (typeof value !== 'number') continue;
    if (key.startsWith('stat.')) {
      const k = key.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + value);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + value);
    } else if (key === 'silver' || key === 'spiritStones') {
      money[key] = Math.max(0, money[key] + value);
    } else if (key === 'karma') {
      social.karma = Math.max(-100, Math.min(100, social.karma + value));
    }
  }
  for (const f of effects.setFlags ?? []) flags[f] = true;
  for (const f of effects.clearFlags ?? []) delete flags[f];
  if (effects.followUp) {
    const [a, b] = effects.followUp.afterYears;
    followUps = [...followUps, { event: effects.followUp.event, atAge: state.character.age + rng.int(a, b) }];
  }
  // addItems / removeItems / addTraits: inventory and later traits come in GĐ 2–4.

  return { ...state, stats, aptitudes, money, social, flags, events: { ...state.events, followUps } };
}

export interface ChoiceResult {
  state: GameState;
  text: string;
  tone: Tone;
  /** Skill check outcome, when the choice had one. */
  success: boolean | null;
}

/** Player picks a choice of the pending event. */
export function resolveChoice(state: GameState, content: Content, choiceIndex: number): ChoiceResult {
  const eventId = state.events.pending;
  const event = eventId ? findEvent(content, eventId) : undefined;
  const choice = event?.choices[choiceIndex];
  if (!event || !choice || !meets(state, choice.requires, content)) {
    return { state, text: '', tone: 'normal', success: null };
  }

  const rng = Rng.fromState(state.rng);
  let outcome: Outcome;
  let success: boolean | null = null;
  if (choice.check) {
    success = rng.chance(checkChance(state, content, choice.check.stat, choice.check.difficulty));
    outcome = (success ? choice.success : choice.fail)!;
  } else {
    outcome = choice.result!;
  }

  let next = applyEffects(state, outcome.effects, rng);
  let text = fillTemplate(outcome.text, state);
  const tone: Tone = event.tags.includes('rare') ? 'rare' : success === true ? 'good' : success === false ? 'bad' : 'normal';
  const lines: LogLine[] = [
    { text: `${event.title}: ${fillTemplate(choice.text, state)}.`, tone: 'normal' },
    { text, tone },
  ];
  const log = next.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });

  next = {
    ...next,
    rng: rng.getState(),
    log,
    events: {
      ...next.events,
      pending: null,
      history: { ...next.events.history, [event.id]: state.character.age },
    },
  };
  if (outcome.effects.testRoot) {
    const revealed = revealRoot(next, content);
    const started = startCultivating(revealed.state, content);
    next = started.state;
    for (const line of [revealed.line, started.line]) if (line) text = `${text} ${line.text}`;
  }
  if (outcome.effects.grantRoot) {
    const granted = grantRoot(next, content);
    next = granted.state;
    if (granted.text) text = `${text} ${granted.text}`;
  }
  return { state: next, text, tone, success };
}
