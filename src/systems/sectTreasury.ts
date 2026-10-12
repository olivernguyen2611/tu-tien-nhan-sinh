// Bảo khố (task 5c.4): the sect treasury turns contribution into things the sect holds back for its
// own: pills, artifacts, spirit stones, a year beside the spirit vein. Spending does not lower the
// total contribution that promotion counts (state.sect.spent tracks it). Entries in sect-life.json.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { addItems, itemById } from './items';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Contribution still free to spend. */
export function merit(state: GameState): number {
  return Math.max(0, state.sect.contribution - (state.sect.spent ?? 0));
}

export interface TreasuryView { id: string; name: string; text: string; cost: number; left: number; blocked: string | null }

function blockedReason(state: GameState, t: { cost: number; minRank: number; limit: number; id: string; sects?: string[] }, ranks: string[]): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  if (t.sects && !t.sects.includes(state.sect.id ?? '')) return 'Tông này không bán.';
  if (state.sect.rank < t.minRank) return `Cần là đệ tử ${ranks[t.minRank] ?? ''}.`;
  if ((state.sect.bought?.[t.id] ?? 0) >= t.limit) return 'Đã đổi hết suất của đời này.';
  if (merit(state) < t.cost) return `Cần ${t.cost} cống hiến.`;
  return null;
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
      cost: t.cost,
      left: Math.max(0, t.limit - (state.sect.bought?.[t.id] ?? 0)),
      blocked: blockedReason(state, t, sect.ranks),
    }));
}

/** Buy one entry with contribution. */
export function buyTreasury(state: GameState, content: Content, id: string): { state: GameState; text: string; success: boolean } | null {
  const sect = content.sects.find((s) => s.id === state.sect.id);
  const t = content.sectLife?.treasury.find((x) => x.id === id);
  if (!sect || !t || blockedReason(state, t, sect.ranks)) return null;
  let s: GameState = {
    ...state,
    sect: { ...state.sect, spent: (state.sect.spent ?? 0) + t.cost, bought: { ...state.sect.bought, [id]: (state.sect.bought?.[id] ?? 0) + 1 } },
    money: { ...state.money, spiritStones: state.money.spiritStones + t.spiritStones },
  };
  s = addItems(s, t.items);
  if (t.progress && s.cult.realm !== 'pham_nhan') s = { ...s, cult: { ...s.cult, progress: clamp(s.cult.progress + t.progress) } };
  const got = [
    ...t.items.map((i) => itemById(content, i)?.name ?? i),
    ...(t.spiritStones ? [`${t.spiritStones} linh thạch`] : []),
    ...(t.progress ? [`thanh tu vi +${t.progress}%`] : []),
  ].join(', ');
  const text = `Bảo khố ${sect.name}: đổi ${t.cost} cống hiến lấy ${t.name} (${got}).`;
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'good' }] };
  return { state: { ...s, log }, text, success: true };
}
