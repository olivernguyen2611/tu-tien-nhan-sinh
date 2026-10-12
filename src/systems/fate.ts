// Nghịch Thiên Cải Mệnh (task 2.7, docs/design/fate-talents.md): after breaking
// into a new realm the player picks 1 of 3 fate talents. Rarity odds follow the
// foundation grade and khí vận; the first slot prefers a talent that fits the build.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { FateTalent } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { lifeHooks } from './cultivation';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function talentById(content: Content, id: string): FateTalent | undefined {
  return content.fateTalents.find((t) => t.id === id);
}

/** Rarity weights for this life: the foundation's row, shifted by khí vận. */
export function fateRarityWeights(state: GameState, content: Content): Record<string, number> {
  const cfg = content.balance.fate;
  // From Kim Đan on, the core's grade picks the row (task 4.2); in Trúc Cơ the foundation does.
  const tier = state.cult.coreGrade !== null ? content.balance.coreForming.fateTier[state.cult.coreGrade - 1] : state.cult.foundation;
  const row = { ...(cfg.rarityByFoundation[tier ?? cfg.defaultFoundation] ?? cfg.rarityByFoundation[cfg.defaultFoundation]) };
  const order = Object.keys(row).filter((k) => row[k] > 0);
  const steps = Math.max(0, Math.floor((state.aptitudes.luck - 50) / 10));
  const shift = Math.min(row[order[0]] ?? 0, steps * cfg.luckShiftPer10);
  if (order.length > 1 && shift > 0) {
    row[order[0]] -= shift;
    row[order[order.length - 1]] += shift;
  }
  return row;
}

/** Build tags of this life: lineage, crafts at level 20+, paths its hooks favour. */
export function fitTags(state: GameState, content: Content): Set<string> {
  const tags = new Set<string>();
  if (state.cult.lineage) tags.add(state.cult.lineage);
  for (const [craft, skill] of Object.entries(state.crafts.skills)) if (skill.level >= 20) tags.add(craft);
  for (const e of lifeHooks(state, content)) {
    const m = /^path\.([a-z]+)\.(affinity|power)$/.exec(e.hook);
    if (m && (e.add ?? 0) > 0) tags.add(m[1]);
  }
  return tags;
}

function eligible(state: GameState, content: Content, taken: Set<string>): FateTalent[] {
  return content.fateTalents.filter((t) =>
    !taken.has(t.id) && !state.talents.includes(t.id) && (!t.requiresLineage || t.requiresLineage === state.cult.lineage));
}

/** Draw `slots` distinct talents; slot one prefers one that fits the build. */
export function drawFate(state: GameState, content: Content, rng: Rng): string[] {
  const weights = fateRarityWeights(state, content);
  const tags = fitTags(state, content);
  const taken = new Set<string>();
  const pickByRarity = (pool: FateTalent[]): FateTalent | null => {
    const rarities = Object.keys(weights).filter((r) => weights[r] > 0 && pool.some((t) => t.rarity === r));
    if (rarities.length === 0) return pool.length ? rng.pick(pool) : null;
    const rarity = rng.weighted(rarities, (r) => weights[r]);
    return rng.pick(pool.filter((t) => t.rarity === rarity));
  };
  for (let i = 0; i < content.balance.fate.slots; i++) {
    const pool = eligible(state, content, taken);
    const fitting = i === 0 ? pool.filter((t) => t.fits.some((f) => tags.has(f))) : [];
    const pick = (fitting.length > 0 ? pickByRarity(fitting) : null) ?? pickByRarity(pool);
    if (!pick) break;
    taken.add(pick.id);
  }
  return [...taken];
}

/** Open a talent choice (called after a big breakthrough). */
export function offerFate(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const offered = drawFate(state, content, rng);
  if (offered.length === 0) return { ...state, rng: rng.getState() };
  const cfg = content.balance.fate;
  const refreshesLeft = cfg.refreshes + (state.aptitudes.luck >= cfg.extraRefreshLuck ? 1 : 0);
  return { ...state, rng: rng.getState(), fate: { offered, refreshesLeft } };
}

/** Draw a new set of three (developer mode: no limit). */
export function rerollFate(state: GameState, content: Content, unlimited = false): GameState {
  if (!state.fate || (!unlimited && state.fate.refreshesLeft <= 0)) return state;
  const rng = Rng.fromState(state.rng);
  const offered = drawFate(state, content, rng);
  const refreshesLeft = unlimited ? state.fate.refreshesLeft : state.fate.refreshesLeft - 1;
  return { ...state, rng: rng.getState(), fate: { offered, refreshesLeft } };
}

/** Take one of the offered talents; stat and lifespan hooks apply now, the rest through lifeHooks. */
export function chooseFate(state: GameState, content: Content, talentId: string): GameState {
  if (!state.fate?.offered.includes(talentId)) return state;
  const talent = talentById(content, talentId);
  if (!talent) return state;
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespan = state.cult.lifespan;
  for (const e of talent.effects) {
    if (e.add === undefined) continue;
    if (e.hook.startsWith('stat.')) {
      const k = e.hook.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    } else if (e.hook === 'lifespanPct') {
      lifespan = Math.round(lifespan * (1 + e.add));
    }
  }
  const line: LogLine = {
    text: `Nghịch thiên cải mệnh: ${talent.name}. ${talent.flavor}`,
    tone: talent.rarity === 'thien' || talent.rarity === 'than' ? 'rare' : 'good',
  };
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, stats, aptitudes, cult: { ...state.cult, lifespan }, talents: [...state.talents, talentId], fate: null, log };
}
