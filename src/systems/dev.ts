// Developer mode: cheats for play-testing. Pure functions on GameState, like
// every other system; the UI panel only calls these. Every change is logged
// with a [Dev] mark so a tested life is never mistaken for a real one.
import type { Content } from '../core/content';
import { APTITUDES, FightSchema, MORTAL_STATS } from '../core/schemas';
import { advanceYear } from '../core/state';
import type { GameState, LogLine } from '../core/types';
import { startBattle } from './combat';
import { STAT_LABELS } from './deltas';
import { addItems } from './items';
import { createNpc } from './npcs';

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
  const event = content.events.find((e) => e.id === eventId);
  if (!state.alive || !event) return state;
  // An NPC-driven event needs its NPC: take the first living one with a matching ledger, else anyone alive.
  const cfg = content.balance.npcs;
  const alive = state.npcs.filter((n) => n.alive);
  const fits = alive.find((n) => (event.npcTrigger === 'revenge' ? n.grudge >= cfg.revengeAt : event.npcTrigger === 'repay' ? n.favor >= cfg.repayAt : true));
  const npc = event.npcTrigger ? (fits ?? alive[0])?.id ?? null : null;
  return devLog({ ...state, events: { ...state.events, pending: eventId, npc } }, `gọi sự kiện ${eventId}`);
}

/** Meet a test NPC (task 3.4): a friend, an enemy with a grudge, or someone owing a kindness. */
export function devMeetNpc(state: GameState, content: Content, kind: 'friend' | 'enemy' | 'debtor'): GameState {
  if (!state.alive) return state;
  const spec = kind === 'enemy' ? { role: 'kẻ thù', affinity: 10, grudge: 40 }
    : kind === 'debtor' ? { role: 'người mang ơn', affinity: 70, favor: 40 }
    : { role: 'bằng hữu', affinity: 75 };
  const met = createNpc(state, content, { ...spec, realm: state.cult.realm, stage: state.cult.stage });
  const n = met.state.npcs.find((x) => x.id === met.id)!;
  return devLog(met.state, `gặp ${spec.role} ${n.name}`);
}

/** Skip `years` years; events that come up are dismissed unanswered. */
export function devSkipYears(state: GameState, content: Content, years: number): GameState {
  let s = devLog(state, `bỏ qua ${years} năm`);
  for (let i = 0; i < years && s.alive; i++) {
    s = advanceYear({ ...s, combat: null, events: { ...s.events, pending: null } }, content);
  }
  return { ...s, events: { ...s.events, pending: null } };
}

/** Full health. */
export function devHeal(state: GameState): GameState {
  return devLog({ ...state, stats: { ...state.stats, health: 100 } }, 'hồi đầy sức khỏe');
}

/** Start a test fight against a foe one realm below, the same realm, or one above. */
export function devStartFight(state: GameState, content: Content, realm: 'below' | 'same' | 'above', intent: 'teach' | 'rob' | 'kill'): GameState {
  if (!state.alive || state.combat) return state;
  const fight = FightSchema.parse({
    foe: { name: 'Hình nhân thử võ', realm, element: 'random', intent },
    win: { text: 'Hình nhân đổ xuống, mạt cưa bay đầy sân.', effects: { 'stat.happiness': 1 } },
    lose: { text: 'Bị hình nhân đánh bại, mất mặt vô cùng.', effects: { 'stat.happiness': -1 } },
  });
  return startBattle(devLog(state, `đánh thử (${realm}, ${intent})`), content, fight, 'Dev');
}

/** Put one item in the bag. */
export function devGiveItem(state: GameState, content: Content, itemId: string): GameState {
  const item = content.items.find((i) => i.id === itemId);
  if (!state.alive || !item) return state;
  return devLog(addItems(state, [itemId]), `nhận ${item.name}`);
}

/** Forget this year's and this life's item use (kháng thuốc, once-per-life). */
export function devResetItemUse(state: GameState): GameState {
  return devLog({ ...state, itemUse: { ...state.itemUse, lastAge: {}, spent: [] } }, 'xóa kháng thuốc');
}
