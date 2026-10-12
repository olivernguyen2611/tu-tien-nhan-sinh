// Đạo thống × con đường (task 3.8, PLAN K.3). The lineage comes from the main
// technique; its hooks, one-time stats and yearly costs live in lineages.json.
// Each life rolls a base aptitude for the five combat paths; hooks add on top,
// and the highest is the main path, which tunes cultivation speed (Kiếm +10%, Thể −10%).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Lineage } from '../core/schemas';
import type { GameState } from '../core/types';
import { hookSum } from './cultivation';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Base path aptitudes from the life's seed (a separate stream, so other rolls stay unchanged). */
export function rollPaths(seed: string, content: Content): Record<string, number> {
  const rng = new Rng(`${seed}:paths`);
  const [lo, hi] = content.balance.paths.startAffinity;
  return Object.fromEntries(content.cultivation.aptitudes.paths.map((p) => [p.id, rng.int(lo, hi)]));
}

export function lineageOf(state: GameState, content: Content): Lineage | undefined {
  return state.cult.lineage ? content.lineages.find((l) => l.id === state.cult.lineage) : undefined;
}

/** Base + path.<id>.affinity hooks, 0–100. */
export function pathAffinity(state: GameState, content: Content, pathId: string): number {
  return clamp((state.paths[pathId] ?? 0) + hookSum(state, content, `path.${pathId}.affinity`));
}

/** The path with the strictly highest aptitude; a tie at the top means no main path yet (id ''). */
export function mainPath(state: GameState, content: Content): { id: string; name: string; affinity: number } {
  let best = { id: '', name: '', affinity: -1 };
  let tied = false;
  for (const p of content.cultivation.aptitudes.paths) {
    const a = pathAffinity(state, content, p.id);
    if (a > best.affinity) {
      best = { id: p.id, name: p.name, affinity: a };
      tied = false;
    } else if (a === best.affinity) tied = true;
  }
  return tied ? { id: '', name: '', affinity: best.affinity } : best;
}

/** Cultivation speed bonus from the main path (balance.paths.<id>.cultivationSpeed). */
export function pathSpeedBonus(state: GameState, content: Content): number {
  if (state.cult.realm === 'pham_nhan') return 0;
  const p = content.balance.paths[mainPath(state, content).id] as Record<string, number> | undefined;
  return p?.cultivationSpeed ?? 0;
}

export function addPathAffinity(state: GameState, gains: Record<string, number>): GameState {
  const paths = { ...state.paths };
  for (const [k, v] of Object.entries(gains)) paths[k] = clamp((paths[k] ?? 0) + v);
  return { ...state, paths };
}

/** One-time stats when a life first takes up a lineage. */
export function adoptLineage(state: GameState, content: Content): GameState {
  const lineage = lineageOf(state, content);
  if (!lineage || state.cult.lineagesAdopted.includes(lineage.id)) return state;
  return {
    ...applyStats(state, lineage.onAdopt),
    cult: { ...state.cult, lineagesAdopted: [...state.cult.lineagesAdopted, lineage.id] },
  };
}

function applyStats(state: GameState, delta: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [k, v] of Object.entries(delta)) {
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  return { ...state, stats, aptitudes };
}

/** Yearly lineage costs (Quỷ đạo wears health, Ma đạo stains karma). */
export function lineageYear(state: GameState, content: Content): GameState {
  const lineage = lineageOf(state, content);
  if (!state.alive || !lineage || state.cult.realm === 'pham_nhan') return state;
  const s = applyStats(state, lineage.perYear);
  const k = lineage.karmaPerYear ?? 0;
  return k ? { ...s, social: { ...s.social, karma: Math.max(-100, Math.min(100, s.social.karma + k)) } } : s;
}

/** What the Tu luyện sheet shows: the lineage and the five path aptitudes. */
export function pathsView(state: GameState, content: Content) {
  const lineage = lineageOf(state, content);
  const main = mainPath(state, content);
  const speed = pathSpeedBonus(state, content);
  return {
    lineage: lineage ? { name: lineage.name, strengths: lineage.strengths, costs: lineage.costs } : null,
    main: main.id ? `${main.name}${speed ? ` (tu luyện ${speed > 0 ? '+' : ''}${Math.round(speed * 100)}%)` : ''}` : 'chưa định hướng',
    paths: content.cultivation.aptitudes.paths.map((p) => ({
      id: p.id, name: p.name, value: pathAffinity(state, content, p.id), main: p.id === main.id,
    })),
  };
}
