// Thiên phú luân hồi (task 5b.1): bought on the Luân Hồi đài with points from past lives,
// kept for every later life. A talent at level n gives levels[n-1] (rebirth-talents.json).
// stat.* and lifespanPct are given once at birth (confirmDestiny); other hooks act all life.
import type { Content } from '../core/content';
import type { EffectHook, RebirthTalentFile } from '../core/schemas';
import type { GameState } from '../core/types';

type Talent = RebirthTalentFile['talents'][number];
type Level = Talent['levels'][number];
type Owned = Record<string, number>;

/** Only known talents, levels clamped to what the content offers. */
export function ownedRebirthTalents(owned: Owned, content: Content): Owned {
  const out: Owned = {};
  for (const t of content.rebirthTalents.talents) {
    const lv = Math.min(Math.floor(owned[t.id] ?? 0), t.levels.length);
    if (lv > 0) out[t.id] = lv;
  }
  return out;
}

function activeLevels(owned: Owned, content: Content): { t: Talent; level: Level }[] {
  return content.rebirthTalents.talents
    .filter((t) => (owned[t.id] ?? 0) > 0)
    .map((t) => ({ t, level: t.levels[Math.min(owned[t.id], t.levels.length) - 1] }));
}

/** Sum of a numeric bonus (extra destiny rerolls, fate refreshes, silver at birth). */
export function rebirthTalentBonus(owned: Owned, content: Content, key: 'destinyRerolls' | 'fateRefreshes' | 'startSilver' | 'destinySlots' | 'destinyLocks'): number {
  return activeLevels(owned, content).reduce((n, { level }) => n + (level[key] ?? 0), 0);
}

const ONCE = (e: EffectHook) => e.hook.startsWith('stat.') || e.hook === 'lifespanPct';

/** Hooks that last the whole life (read through lifeHooks). */
export function rebirthTalentHooks(state: GameState, content: Content): EffectHook[] {
  return activeLevels(state.rebirthTalents ?? {}, content).flatMap(({ level }) => level.effects.filter((e) => !ONCE(e)));
}

/** One-time gains given at birth with the Tiên Thiên Khí Vận. */
export function rebirthTalentGains(state: GameState, content: Content): EffectHook[] {
  return activeLevels(state.rebirthTalents ?? {}, content).flatMap(({ level }) => level.effects.filter(ONCE));
}

export function rebirthTalentNames(state: GameState, content: Content): string[] {
  return activeLevels(state.rebirthTalents ?? {}, content).map(({ t }) => `${t.name} ${roman(state.rebirthTalents[t.id])}`);
}

const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);

export interface TalentRow {
  id: string;
  name: string;
  text: string;
  level: number;
  max: number;
  /** What the current level gives (null before the first). */
  current: string | null;
  /** The next level: what it gives and its price; null at max. */
  next: { summary: string; cost: number; affordable: boolean } | null;
}

/** The Luân Hồi đài: every talent with its level and next price. */
export function talentShop(content: Content, owned: Owned, points: number): TalentRow[] {
  return content.rebirthTalents.talents.map((t) => {
    const level = Math.min(owned[t.id] ?? 0, t.levels.length);
    const nx = t.levels[level];
    return {
      id: t.id, name: t.name, text: t.text, level, max: t.levels.length,
      current: level > 0 ? t.levels[level - 1].summary : null,
      next: nx ? { summary: nx.summary, cost: nx.cost, affordable: nx.cost <= points } : null,
    };
  });
}

/** Price of the next level of a talent, or null when maxed or unknown. */
export function nextTalentCost(content: Content, owned: Owned, id: string): number | null {
  const t = content.rebirthTalents.talents.find((x) => x.id === id);
  if (!t) return null;
  return t.levels[owned[id] ?? 0]?.cost ?? null;
}
