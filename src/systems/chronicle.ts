// 9.R8 Sổ luân hồi: every finished life on this browser (name, age, realm, path, ending, points),
// the endings ever reached (endings.json, first match wins) and the đại vực ever set foot in.
// Pure: the save meta stores a Chronicle; chronicleOf reads one life, mergeChronicle folds it in.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { lifeMeets } from './achievements';
import { careerLabel } from './career';
import { realmLabel } from './cultivation';
import { rebirthPoints } from './rebirth';
import { sectLabel } from './sect';

export interface LifeRecord {
  /** Seed and age at death: one record per life (the tries of a weekly challenge differ by age or are the same life). */
  key: string;
  /** Which life on this browser it was (1-based). */
  life: number;
  name: string;
  age: number;
  realm: string;
  /** Tông môn, đường đời or "Phàm nhân". */
  path: string;
  ending: string | null;
  points: number;
  /** 9.S1: karma at the end; the Tình tiết đặc biệt hiếm this life drew. */
  karma?: number;
  special?: string[];
}

export interface Chronicle {
  lives: LifeRecord[];
  endings: string[];
  regions: string[];
  /** 9.S1: Tình tiết đặc biệt hiếm met, and how many lives drew each. */
  special?: Record<string, number>;
}

export const EMPTY_CHRONICLE: Chronicle = { lives: [], endings: [], regions: [], special: {} };
/** Lives kept; older ones drop off (their endings and regions stay). */
const MAX_LIVES = 100;

/** The ending this life reached (endings.json order: the first that holds). */
export function lifeEnding(state: GameState, content: Content, lives: number): string | null {
  if (state.alive) return null;
  return (content.endings ?? []).find((e) => lifeMeets(state, content, e.check, lives))?.id ?? null;
}

/** What one finished life adds to the Sổ luân hồi. */
export function chronicleOf(state: GameState, content: Content, lives: number): Chronicle {
  const regions = [content.regions[0]?.id, ...state.region.visited].filter((r): r is string => !!r);
  if (state.alive || !state.death) return { lives: [], endings: [], regions, special: {} };
  const ending = lifeEnding(state, content, lives);
  const record: LifeRecord = {
    key: `${state.seed}@${state.death.age}`,
    life: lives,
    name: state.character.name,
    age: state.death.age,
    realm: realmLabel(state, content),
    path: sectLabel(state, content) ?? careerLabel(state, content) ?? 'Phàm nhân',
    ending,
    points: rebirthPoints(state, content).total,
    karma: state.social.karma,
    special: state.special?.ids ?? [],
  };
  return { lives: [record], endings: ending ? [ending] : [], regions, special: Object.fromEntries((state.special?.ids ?? []).map((id) => [id, 1])) };
}

const union = (a: string[], b: string[]) => [...a, ...b.filter((x) => !a.includes(x))];

export function mergeChronicle(a: Chronicle, b: Chronicle): Chronicle {
  const lives = [...a.lives.filter((l) => !b.lives.some((m) => m.key === l.key)), ...b.lives].slice(-MAX_LIVES);
  // A life already recorded adds no second count.
  const fresh = b.lives.some((l) => !a.lives.some((m) => m.key === l.key)) || b.lives.length === 0;
  const special = { ...(a.special ?? {}) };
  if (fresh) for (const [id, n] of Object.entries(b.special ?? {})) special[id] = (special[id] ?? 0) + n;
  return { lives, endings: union(a.endings, b.endings), regions: union(a.regions, b.regions), special };
}

/** A stored chronicle, tolerant of a missing or broken one. */
export function readChronicle(raw: unknown): Chronicle {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<Chronicle>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return {
    lives: Array.isArray(c.lives) ? c.lives.filter((l) => l && typeof l.key === 'string' && typeof l.name === 'string') : [],
    endings: strings(c.endings),
    regions: strings(c.regions),
    special: c.special && typeof c.special === 'object' ? Object.fromEntries(Object.entries(c.special).filter(([, n]) => typeof n === 'number')) : {},
  };
}

/** Totals for the head of the Sổ luân hồi. */
export function chronicleStats(c: Chronicle, content: Content) {
  const ages = c.lives.map((l) => l.age);
  return {
    lives: c.lives.length,
    longest: ages.length ? Math.max(...ages) : 0,
    meanAge: ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0,
    points: c.lives.reduce((n, l) => n + l.points, 0),
    endings: [c.endings.filter((e) => (content.endings ?? []).some((x) => x.id === e)).length, (content.endings ?? []).length] as const,
    regions: [c.regions.filter((r) => content.regions.some((x) => x.id === r)).length, content.regions.length] as const,
  };
}
