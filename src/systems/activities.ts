// 9.2 Khung Hoạt động: every thing the player chooses to do, as JSON (content/activities,
// worlds/<id>/activities). This module filters the menu, shows the price and the chance, draws an
// outcome, applies it and logs one line. The UI only lists activityViews and sends doActivity.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Activity, ActivityGroup, ActivityOutcome } from '../core/schemas';
import type { GameState, Tone } from '../core/types';
import { meets } from './events/conditions';
import { applyOutcome, checkChance } from './events/engine';
import { drawText } from './textPool';

/** Menu headings, in menu order. */
export const ACTIVITY_GROUP_NAMES: Record<ActivityGroup, string> = {
  ban_than: 'Bản thân', hoc_hanh: 'Học hành', nghe: 'Nghề', tai_san: 'Tài sản', quan_he: 'Quan hệ',
  giai_tri: 'Giải trí', suc_khoe: 'Sức khỏe', pham_phap: 'Phạm pháp', giang_ho: 'Giang hồ', tu_luyen: 'Tu luyện',
};

type Cost = Activity['cost'][number];

export interface ActivityView {
  id: string;
  group: ActivityGroup;
  name: string;
  icon: string;
  text: string;
  /** The price that would be paid now ("3 linh thạch"), "miễn phí" for the free version, or null when it costs nothing. */
  cost: string | null;
  /** Success chance (0–1) when the activity is a check. */
  chance: number | null;
  /** Why it cannot be done now, or null. */
  blocked: string | null;
}

const activityById = (content: Content, id: string) => content.activities?.find((a) => a.id === id);

/** The first cost option that applies and can be paid; null when none can (undefined: the activity is free). */
function payable(state: GameState, content: Content, a: Activity): Cost | null | undefined {
  if (a.cost.length === 0) return undefined;
  const fits = a.cost.filter((c) => meets(state, c.when, content));
  return fits.find((c) => state.money.silver >= (c.silver ?? 0) && state.money.spiritStones >= (c.spiritStones ?? 0) && state.stats.health > (c.health ?? 0)) ?? null;
}

function costText(c: Cost): string {
  const parts = [
    c.spiritStones ? `${c.spiritStones} linh thạch` : '',
    c.silver ? `${c.silver} lượng bạc` : '',
    c.health ? `${c.health} sức khỏe` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/** What the cheapest option that applies asks for, to say what is missing. */
function wanted(state: GameState, content: Content, a: Activity): string {
  const c = a.cost.find((x) => meets(state, x.when, content)) ?? a.cost[0];
  return c ? costText(c) : '';
}

function usedThisYear(state: GameState, id: string): number {
  const u = state.activities;
  return u && u.year === state.character.age ? (u.uses[id] ?? 0) : 0;
}

function blockedReason(state: GameState, content: Content, a: Activity): string | null {
  if (!state.alive) return 'Đã qua đời.';
  if (state.seclusion) return 'Đang bế quan.';
  if (state.events.pending || state.combat) return 'Đang có việc phải xử trí.';
  const used = usedThisYear(state, a.id);
  if (used >= a.limit.perYear) return a.limit.perYear === 1 ? 'Năm nay đã làm rồi.' : `Năm nay đã làm ${used} lần.`;
  const last = state.activities?.last[a.id];
  if (last !== undefined && last !== state.character.age && state.character.age - last < a.limit.cooldownYears) {
    return `Còn ${last + a.limit.cooldownYears - state.character.age} năm nữa.`;
  }
  if (payable(state, content, a) === null && !a.free) return `Cần ${wanted(state, content, a)}.`;
  return null;
}

/** The menu: activities whose conditions hold, grouped in ACTIVITY_GROUP_NAMES order. */
export function activityViews(state: GameState, content: Content): ActivityView[] {
  const order = Object.keys(ACTIVITY_GROUP_NAMES);
  return (content.activities ?? [])
    .filter((a) => meets(state, a.conditions, content))
    .map((a) => {
      const pay = payable(state, content, a);
      return {
        id: a.id,
        group: a.group,
        name: a.name,
        icon: a.icon,
        text: a.text,
        cost: pay ? costText(pay) : pay === null ? 'miễn phí' : null,
        // The free version has no check: the walk always happens.
        chance: a.check && pay !== null ? checkChance(state, content, a.check.stat, a.check.difficulty) : null,
        blocked: blockedReason(state, content, a),
      };
    })
    .sort((x, y) => order.indexOf(x.group) - order.indexOf(y.group));
}

/** Effects of one outcome for this use: its effects, the rolled ranges, and the bonuses that hold now. */
function outcomeEffects(state: GameState, content: Content, o: ActivityOutcome, rng: Rng): ActivityOutcome['effects'] {
  const fx: Record<string, unknown> = { ...o.effects };
  for (const [k, [lo, hi]] of Object.entries(o.roll)) fx[k] = ((fx[k] as number | undefined) ?? 0) + rng.int(lo, hi);
  for (const b of o.bonus) {
    if (!meets(state, b.when, content)) continue;
    for (const [k, v] of Object.entries(b.effects)) {
      if (typeof v === 'number') fx[k] = ((fx[k] as number | undefined) ?? 0) + v;
      else if (Array.isArray(v)) fx[k] = [...((fx[k] as unknown[] | undefined) ?? []), ...v];
      else if (v !== undefined) fx[k] = v;
    }
  }
  return fx as ActivityOutcome['effects'];
}

/**
 * Do one activity: pay, roll the check, draw an outcome, apply it, log "Name: text".
 * `target` is the person it is done with (their id becomes {npc} for the texts and npc effects).
 */
export function doActivity(state: GameState, content: Content, id: string, target?: string): { state: GameState; text: string; tone: Tone; success: boolean | null } | null {
  const a = activityById(content, id);
  if (!a || !meets(state, a.conditions, content) || blockedReason(state, content, a)) return null;
  const rng = Rng.fromState(state.rng);
  const pay = payable(state, content, a);
  const before = target ? { ...state, events: { ...state.events, npc: target } } : state;
  let s = before;
  if (pay) {
    s = {
      ...s,
      money: { silver: s.money.silver - (pay.silver ?? 0), spiritStones: s.money.spiritStones - (pay.spiritStones ?? 0) },
      stats: { ...s.stats, health: s.stats.health - (pay.health ?? 0) },
    };
  }
  // Paid (or free by nature): the check decides; the lesser free version has no check.
  const success = pay === null || !a.check ? null : rng.chance(checkChance(state, content, a.check.stat, a.check.difficulty));
  const list = pay === null ? a.free!.outcomes : success === false ? a.failOutcomes! : a.outcomes;
  const which = pay === null ? 'free' : success === false ? 'fail' : 'win';
  const open = list.filter((o) => meets(state, o.when, content));
  const pool = open.length > 0 ? open : list;
  const outcome = pool.length === 1 ? pool[0] : rng.weighted(pool, (o) => o.weight);
  const key = `activity.${a.id}.${which}.${list.indexOf(outcome)}`;
  const said = typeof outcome.text === 'string' ? { text: outcome.text, state: s } : drawText(s, content, key, outcome.text, {}, rng);
  // Bonuses read the life as it was before the activity (e.g. how unhappy it was).
  const r = applyOutcome(said.state, content, { text: said.text, effects: outcomeEffects(state, content, outcome, rng) }, rng);
  const tone: Tone = success === false ? 'bad' : 'good';
  const text = `${a.name}: ${r.text}`;
  const log = r.state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone }] };
  const age = state.character.age;
  const prev = state.activities;
  const uses = prev && prev.year === age ? prev.uses : {};
  let next: GameState = {
    ...r.state,
    rng: rng.getState(),
    log,
    activities: { last: { ...prev?.last, [a.id]: age }, year: age, uses: { ...uses, [a.id]: (uses[a.id] ?? 0) + 1 } },
    events: { ...r.state.events, npc: state.events.npc },
  };
  if (outcome.startEvent && !next.events.pending) next = { ...next, events: { ...next.events, pending: outcome.startEvent, npc: target ?? null } };
  return { state: next, text, tone, success };
}
