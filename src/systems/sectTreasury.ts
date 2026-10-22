// Bảo khố (task 5c.4): the sect treasury turns contribution into things the sect holds back for its
// own: pills, artifacts, spirit stones, a year beside the spirit vein. Spending does not lower the
// total contribution that promotion counts (state.sect.spent tracks it). Entries in sect-life.json.
import { monthsShort, spendMonths } from './timeBudget';
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { addItems, itemById, pillOutgrown } from './items';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Contribution still free to spend. */
export function merit(state: GameState): number {
  return Math.max(0, state.sect.contribution - (state.sect.spent ?? 0));
}

/** 6c.2: the price climbs with each earlier purchase of the same entry. */
export function treasuryCost(state: GameState, content: Content, t: { id: string; cost: number }): number {
  const bought = state.sect.bought?.[t.id] ?? 0;
  return Math.round(t.cost * (1 + (bought * content.balance.sects.treasuryPriceStepPct) / 100));
}

export interface TreasuryView { id: string; name: string; text: string; cost: number; left: number; blocked: string | null }

function blockedReason(state: GameState, content: Content, t: { cost: number; minRank: number; limit: number; id: string; sects?: string[]; items: string[] }, ranks: string[]): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  if (t.items.length > 0 && t.items.every((i) => pillOutgrown(state, content, i))) return 'Vô dụng ở cảnh giới này.';
  if (t.sects && !t.sects.includes(state.sect.id ?? '')) return 'Tông này không bán.';
  if (state.sect.rank < t.minRank) return `Cần là đệ tử ${ranks[t.minRank] ?? ''}.`;
  if ((state.sect.bought?.[t.id] ?? 0) >= t.limit) return 'Đã đổi hết suất của đời này.';
  const cost = treasuryCost(state, content, t);
  if (merit(state) < cost) return `Cần ${cost} cống hiến.`;
  return monthsShort(state, content, 'treasury');
}

/** What the player can see in the treasury: every entry the sect sells, with why it is shut. */
export function treasuryViews(state: GameState, content: Content): TreasuryView[] {
  const sect = content.sects.find((s) => s.id === state.sect.id);
  if (!sect || !content.sectLife) return [];
  return content.sectLife.treasury
    .filter((t) => !t.sects || t.sects.includes(sect.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      text: t.text,
      cost: treasuryCost(state, content, t),
      left: Math.max(0, t.limit - (state.sect.bought?.[t.id] ?? 0)),
      blocked: blockedReason(state, content, t, sect.ranks),
    }));
}

/** Buy one entry with contribution. */
export function buyTreasury(state: GameState, content: Content, id: string): { state: GameState; text: string; success: boolean } | null {
  const sect = content.sects.find((s) => s.id === state.sect.id);
  const t = content.sectLife?.treasury.find((x) => x.id === id);
  if (!sect || !t || blockedReason(state, content, t, sect.ranks)) return null;
  const cost = treasuryCost(state, content, t);
  let s: GameState = {
    ...state,
    sect: { ...state.sect, spent: (state.sect.spent ?? 0) + cost, bought: { ...state.sect.bought, [id]: (state.sect.bought?.[id] ?? 0) + 1 } },
    money: { ...state.money, spiritStones: state.money.spiritStones + t.spiritStones },
  };
  s = spendMonths(addItems(s, t.items), content, 'treasury');
  if (t.progress && s.cult.realm !== 'pham_nhan') s = { ...s, cult: { ...s.cult, progress: clamp(s.cult.progress + t.progress) } };
  const got = [
    ...t.items.map((i) => itemById(content, i)?.name ?? i),
    ...(t.spiritStones ? [`${t.spiritStones} linh thạch`] : []),
    ...(t.progress ? [`thanh tu vi +${t.progress}%`] : []),
  ].join(', ');
  const deal = `${cost} cống hiến lấy ${t.name}${got && got !== t.name ? ` (${got})` : ''}`;
  const head = `Bảo khố ${sect.name}: đổi `;
  const text = `${head}${deal}.`;
  const log = s.log.slice();
  const last = log[log.length - 1];
  // 9.3: several trades in one year make one line.
  const prev = last?.lines.at(-1);
  if (last && prev?.text.startsWith(head)) log[log.length - 1] = { ...last, lines: [...last.lines.slice(0, -1), { ...prev, text: `${prev.text.replace(/\.$/, '')}; ${deal}.` }] };
  else if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'good' }] };
  return { state: { ...s, log }, text, success: true };
}
