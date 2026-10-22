// 9.1 Tầng (cõi) and Lối sống. One plane: Phàm gian (with Giang hồ) for everyone, Tu chân giới once a life
// enters the Dao, Linh giới later. A tier only rises (nhập đạo, phi thăng) and its entry is shown once on the
// full-screen "nhập đạo" card. Lối sống are the deep lives one is in at the same time (giang hồ, quan
// trường, tu tiên…), on while their entry holds. Both read world.json (tiers, lifestyles).
import type { Content } from '../core/content';
import type { GameState, LogLine } from '../core/types';
import { meets, type Conditions } from './events/conditions';

export const tierDef = (content: Content, id: string | undefined) => content.world.tiers.find((t) => t.id === id);

/** The tier the life is in (the first tier when none is set). */
export const currentTier = (state: GameState, content: Content) => state.tier ?? content.world.tiers[0]?.id;

/** Highest open tier whose entry holds now (index), never below the current one. */
function reachedTier(state: GameState, content: Content): number {
  const tiers = content.world.tiers;
  let at = Math.max(0, tiers.findIndex((t) => t.id === currentTier(state, content)));
  tiers.forEach((t, i) => { if (i > at && !t.locked && meets(state, t.entry as Conditions, content)) at = i; });
  return at;
}

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Enter a tier: history, a log line, and its screen waits to be shown. Works for any way in (nhập đạo, phi thăng). */
export function enterTier(state: GameState, content: Content, tierId: string): GameState {
  const t = tierDef(content, tierId);
  if (!t || state.tier === tierId) return state;
  let s: GameState = { ...state, tier: tierId, tierHistory: { ...state.tierHistory, [tierId]: state.character.age }, tierScreen: tierId };
  // 13.1: the tier's own event comes right after (now, or next year if one is already waiting).
  const ev = t.enterEvent;
  if (ev && !s.events.history[ev]) {
    s = s.events.pending
      ? { ...s, events: { ...s.events, followUps: [...s.events.followUps, { event: ev, atAge: s.character.age + 1 }] } }
      : { ...s, events: { ...s.events, pending: ev, npc: null } };
  }
  return pushLine(s, { text: `Bước vào ${t.name}.`, tone: 'rare' });
}

/** Bring tier and lối sống up to date (each year, and after any action that may change them). */
export function syncTier(state: GameState, content: Content): GameState {
  const tiers = content.world.tiers;
  if (tiers.length === 0) return state;
  let s = state;
  if (!s.tier) s = { ...s, tier: tiers[0].id, tierHistory: { [tiers[0].id]: 0, ...s.tierHistory } };
  const reached = tiers[reachedTier(s, content)].id;
  if (reached !== s.tier) s = enterTier(s, content, reached);
  const age = s.character.age;
  let changed = false;
  const lifestyles = { ...s.lifestyles };
  for (const l of content.world.lifestyles) {
    const on = meets(s, l.entry as Conditions, content);
    const cur = lifestyles[l.id];
    if (on === !!cur?.active) continue;
    changed = true;
    lifestyles[l.id] = { since: cur?.since ?? age, active: on };
  }
  return changed ? { ...s, lifestyles } : s;
}

/** The nhập đạo screen was shown. */
export const seeTier = (state: GameState): GameState => (state.tierScreen ? { ...state, tierScreen: null } : state);

/** Lối sống active now, by name. */
export const activeLifestyles = (state: GameState, content: Content) =>
  content.world.lifestyles.filter((l) => state.lifestyles?.[l.id]?.active);
