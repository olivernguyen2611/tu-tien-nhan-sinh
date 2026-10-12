// Tình duyên (task 3.6): court an NPC met along the way, give gifts, confess.
// Affinity has named tiers (romance.json); a gift may be turned down, a masked
// lover may use the player; a yes makes a couple (task 3.7 adds the đạo lữ).
// Nobody under balance.romance.minAge takes part, and Phật đạo keeps its precept.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameEvent } from '../core/schemas';
import type { GameState, LogLine, Npc, Tone } from '../core/types';
import { changeNpc, isMasked, npcById } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export type RomanceAction = 'pursue' | 'giveUp' | 'gift' | 'confess';

export function affinityTier(content: Content, affinity: number): string {
  let name = content.romance.tiers[0].name;
  for (const t of content.romance.tiers) if (affinity >= t.min) name = t.name;
  return name;
}

/** Why the player cannot take part in romance now, or null. */
export function romanceBlocked(state: GameState, content: Content): string | null {
  if (!state.alive) return 'Đã mất';
  if (state.character.age < content.balance.romance.minAge) return `Cần ${content.balance.romance.minAge} tuổi`;
  if (state.cult.lineage === 'phat') return 'Phật đạo kiêng tình duyên';
  return null;
}

/** An NPC who can be courted or loved: alive and of age. */
function ofAge(content: Content, n: Npc | undefined): n is Npc {
  return !!n && n.alive && n.age >= content.balance.romance.minAge;
}

/** Lover, partner, or the partner if there is one (else the lover). */
export function romanceTarget(state: GameState, target: 'lover' | 'partner' | 'beloved'): Npc | undefined {
  const r = state.romance;
  const id = target === 'lover' ? r.lover : target === 'partner' ? r.partner : r.partner ?? r.lover;
  return npcById(state, id);
}

/** Event conditions on romance (see ConditionsSchema.romance). */
export function romanceMeets(state: GameState, c: NonNullable<GameEvent['conditions']['romance']>, content: Content): boolean {
  if (romanceBlocked(state, content)) return false;
  const r = state.romance;
  const lover = npcById(state, r.lover);
  const partner = npcById(state, r.partner);
  if (c.lover !== undefined && ofAge(content, lover) !== c.lover) return false;
  if (c.couple !== undefined && (ofAge(content, lover) && r.couple) !== c.couple) return false;
  if (c.partner !== undefined && ofAge(content, partner) !== c.partner) return false;
  if (c.ex !== undefined && r.exes.some((id) => ofAge(content, npcById(state, id))) !== c.ex) return false;
  if (c.target) {
    const t = romanceTarget(state, c.target);
    if (!ofAge(content, t)) return false;
    if (c.minAffinity !== undefined && t.affinity < c.minAffinity) return false;
    if (c.maxAffinity !== undefined && t.affinity > c.maxAffinity) return false;
    if (c.targetRooted !== undefined && t.root !== c.targetRooted) return false;
  }
  return true;
}

/** Event effects on romance, applied to the event's NPC. */
export function applyRomance(state: GameState, content: Content, npcId: string | null, fx: { pursue?: boolean; lose?: boolean; couple?: boolean; rival?: number; rivalExposed?: boolean }): GameState {
  let r = state.romance;
  if (fx.pursue && npcId && !r.lover && !r.partner && !romanceBlocked(state, content) && ofAge(content, npcById(state, npcId))) r = { ...r, lover: npcId, couple: false, rivals: 0 };
  if (fx.couple && npcId && r.lover === npcId) r = { ...r, couple: true };
  if (fx.rival) r = { ...r, rivals: Math.max(0, r.rivals + fx.rival) };
  if (fx.rivalExposed) r = { ...r, rivals: 0 };
  if (fx.lose && npcId) r = loseRomance(r, npcId);
  return { ...state, romance: r };
}

function loseRomance(r: GameState['romance'], id: string): GameState['romance'] {
  if (r.lover === id) return { ...r, lover: null, couple: false, rivals: 0, exes: r.exes.includes(id) ? r.exes : [...r.exes, id] };
  if (r.partner === id) return { ...r, partner: null, exes: r.exes.includes(id) ? r.exes : [...r.exes, id] };
  return r;
}

export interface RomanceView {
  action: RomanceAction;
  label: string;
  /** Cost text, if any. */
  cost: string | null;
  blocked: string | null;
}

function giftCost(state: GameState, content: Content): { silver: number; stones: number } {
  const b = content.balance.romance;
  return state.cult.realm === 'pham_nhan' ? { silver: b.giftSilver, stones: 0 } : { silver: 0, stones: b.giftStones };
}

/** What the player can do with this NPC now (empty when romance is out of the question). */
export function romanceViews(state: GameState, content: Content, npcId: string): RomanceView[] {
  const n = npcById(state, npcId);
  if (romanceBlocked(state, content) || !ofAge(content, n)) return [];
  const r = state.romance;
  const b = content.balance.romance;
  const doneThisYear = (a: RomanceAction) => r.lastActions[a] === state.character.age;
  if (r.partner === npcId) return [];
  if (r.lover !== npcId) {
    if (r.partner || r.exes.includes(npcId)) return [];
    return [{ action: 'pursue', label: 'Theo đuổi', cost: null, blocked: r.lover ? 'Đang theo đuổi người khác' : null }];
  }
  const cost = giftCost(state, content);
  const poor = state.money.silver < cost.silver || state.money.spiritStones < cost.stones;
  const views: RomanceView[] = [
    {
      action: 'gift', label: 'Tặng quà',
      cost: cost.stones ? `${cost.stones} linh thạch` : `${cost.silver} bạc`,
      blocked: doneThisYear('gift') ? 'Năm nay đã tặng' : poor ? 'Không đủ tiền' : null,
    },
  ];
  if (!r.couple) {
    views.push({
      action: 'confess', label: 'Tỏ tình', cost: null,
      blocked: doneThisYear('confess') ? 'Năm nay đã nói' : n.affinity < b.confessAt ? `Cần thiện cảm ${b.confessAt}` : null,
    });
  }
  views.push({ action: 'giveUp', label: r.couple ? 'Chia tay' : 'Thôi theo đuổi', cost: null, blocked: null });
  return views;
}

export function confessChance(state: GameState, content: Content, n: Npc): number {
  const b = content.balance.romance;
  const p = b.confessBase + (n.affinity - b.confessAt) * b.confessPerAffinity + (state.stats.charm - 50) * b.confessPerCharm;
  return Math.max(b.confessMin, Math.min(b.confessMax, p));
}

/** Do one romance action; returns the new state and the log line. */
export function romanceAction(state: GameState, content: Content, npcId: string, action: RomanceAction): { state: GameState; text: string; tone: Tone } {
  const view = romanceViews(state, content, npcId).find((v) => v.action === action);
  const n = npcById(state, npcId);
  if (!view || view.blocked || !n) return { state, text: '', tone: 'normal' };
  const b = content.balance.romance;
  const t = content.romance.texts;
  const rng = Rng.fromState(state.rng);
  const fill = (text: string) => text.replace(/\{npc\}/g, n.name).replace(/\{name\}/g, state.character.name);
  let s: GameState = { ...state, romance: { ...state.romance, lastActions: { ...state.romance.lastActions, [action]: state.character.age } } };
  const lines: LogLine[] = [];

  if (action === 'pursue') {
    s = applyRomance(s, content, npcId, { pursue: true });
    lines.push({ text: fill(t.pursue), tone: 'normal' });
  } else if (action === 'giveUp') {
    s = { ...s, romance: loseRomance(s.romance, npcId) };
    lines.push({ text: fill(t.giveUp), tone: 'normal' });
  } else if (action === 'gift') {
    const cost = giftCost(s, content);
    s = { ...s, money: { ...s.money, silver: s.money.silver - cost.silver, spiritStones: s.money.spiritStones - cost.stones } };
    if (n.affinity < b.rejectBelow && rng.chance(b.rejectChance)) {
      s = changeNpc(s, content, npcId, { affinity: b.rejectAffinity });
      lines.push({ text: fill(t.giftRejected), tone: 'bad' });
    } else {
      const gain = rng.int(b.giftAffinity[0], b.giftAffinity[1]) + Math.max(0, (s.stats.charm - 50) / b.giftCharmDivisor);
      s = changeNpc(s, content, npcId, { affinity: gain });
      lines.push({ text: fill(t.gift), tone: 'good' });
      // A kind face over a greedy heart: the lover takes more than a gift.
      if (isMasked(content, n) && rng.chance(b.usedChance)) {
        const silver = Math.min(s.money.silver, cost.silver ? b.usedSilver : 0);
        const stones = Math.min(s.money.spiritStones, cost.stones ? b.usedStones : 0);
        s = { ...s, money: { ...s.money, silver: s.money.silver - silver, spiritStones: s.money.spiritStones - stones } };
        lines.push({ text: fill(t.used), tone: 'bad' });
      }
    }
  } else if (action === 'confess') {
    if (rng.chance(confessChance(s, content, n))) {
      s = { ...s, romance: { ...s.romance, couple: true }, stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.confessHappiness) } };
      lines.push({ text: fill(t.confessYes), tone: 'good' });
    } else {
      s = changeNpc(s, content, npcId, { affinity: b.rejectAffinity * 2 });
      s = {
        ...s,
        stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.rejectHappiness) },
        aptitudes: { ...s.aptitudes, daoHeart: clamp(s.aptitudes.daoHeart + b.rejectDaoHeart) },
      };
      lines.push({ text: fill(t.confessNo), tone: 'bad' });
    }
  }
  s = { ...s, rng: rng.getState() };
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { state: { ...s, log }, text: lines.map((l) => l.text).join(' '), tone: lines[0]?.tone ?? 'normal' };
}

/** Yearly: rivals cool the lover; a lover or partner who died is mourned and let go. */
export function romanceYear(state: GameState, content: Content): GameState {
  const b = content.balance.romance;
  const t = content.romance.texts;
  let s = state;
  const lines: LogLine[] = [];
  for (const id of [s.romance.lover, s.romance.partner]) {
    const n = npcById(s, id);
    if (!id || !n || n.alive) continue;
    s = {
      ...s,
      romance: { ...s.romance, lover: s.romance.lover === id ? null : s.romance.lover, couple: s.romance.lover === id ? false : s.romance.couple, partner: s.romance.partner === id ? null : s.romance.partner },
      stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.griefHappiness) },
    };
    lines.push({ text: t.died.replace(/\{npc\}/g, n.name), tone: 'bad' });
  }
  if (s.romance.lover && s.romance.rivals > 0) s = changeNpc(s, content, s.romance.lover, { affinity: b.rivalAffinityPerYear * s.romance.rivals });
  if (lines.length === 0) return s;
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...s, log };
}

/** Label for the Người quen tab: Người trong lòng / Người yêu / Người cũ, plus the affinity tier. */
export function romanceLabel(state: GameState, content: Content, n: Npc): { role: string | null; tier: string } {
  const r = state.romance;
  const l = content.romance.labels;
  const role = r.lover === n.id ? (r.couple ? l.couple : l.lover) : r.exes.includes(n.id) ? l.ex : null;
  return { role, tier: affinityTier(content, n.affinity) };
}
