// 9.R5a Sổ tri thức: what lives have learned about the world, kept across lives (the save meta keeps the
// list through codex.ts). Each year a life meets a source of an unknown entry, it may be found. Pure; the
// roll uses its own seeded stream so adding entries never shifts the rest of a life.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { KnowledgeEntry } from '../core/schemas';
import type { GameState } from '../core/types';
import { rootUsable } from './cultivation';

type Source = KnowledgeEntry['sources'][number];

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** Does this source hold for the life right now? */
export function sourceHolds(state: GameState, content: Content, s: Source): boolean {
  switch (s.kind) {
    case 'event': return !!s.id && (state.events.history[s.id] ?? 0) > 0;
    case 'flag': return !!s.id && !!state.flags[s.id];
    case 'item': return !!s.id && (state.inventory[s.id] ?? 0) > 0;
    case 'realm': return !!s.id && realmIndex(content, state.cult.realm) >= realmIndex(content, s.id) && realmIndex(content, s.id) >= 0;
    case 'martial': return state.martial.stage >= (s.stage ?? 0);
    case 'sect': return s.id ? state.sect.id === s.id : state.sect.id !== null;
    case 'region': return !!s.id && (state.region?.id ?? content.regions[0]?.id) === s.id;
  }
}

export function knownEntries(state: GameState): string[] {
  return state.knowledge ?? [];
}

/**
 * 9.R5b: what the life was born knowing (past lives' Sổ tri thức). Doors into the immortal world open on
 * this, so what a first life learns pays off in the next one.
 */
export function bornKnowing(state: GameState): string[] {
  const fresh = state.knowledgeNew ?? [];
  return knownEntries(state).filter((k) => !fresh.includes(k));
}

/**
 * The year's finds: unknown entries whose sources hold, each by its chance. A sure source (chance 1, e.g.
 * entering a realm) is always found; chancy finds stop at balance.knowledge.maxPerYear and maxPerLife.
 */
export function knowledgeYear(state: GameState, content: Content): GameState {
  const entries = content.knowledge ?? [];
  const cfg = content.balance.knowledge;
  if (!entries.length || !cfg) return state;
  const known = new Set(knownEntries(state));
  const rng = new Rng(`${state.seed}:knowledge:${state.character.age}`);
  let room = Math.min(cfg.maxPerYear, cfg.maxPerLife - (state.knowledgeFound ?? 0));
  const found: KnowledgeEntry[] = [];
  let chancy = 0;
  for (const e of entries) {
    if (known.has(e.id)) continue;
    const chance = Math.max(0, ...e.sources.filter((s) => sourceHolds(state, content, s)).map((s) => s.chance ?? cfg.defaultChance));
    if (chance >= 1) found.push(e);
    else if (room > 0 && chance > 0 && rng.chance(chance)) { found.push(e); room--; chancy++; }
  }
  if (!found.length) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  const lines = found.map((e) => ({ text: `Ghi vào Sổ tri thức: ${e.name}.`, tone: 'good' as const }));
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  const ids = found.map((e) => e.id);
  return { ...state, knowledge: [...known, ...ids], knowledgeFound: (state.knowledgeFound ?? 0) + chancy, knowledgeNew: [...(state.knowledgeNew ?? []), ...ids], log };
}

/** Found / total by group, for the Sổ tri thức tab. */
export function knowledgeByGroup(known: string[], content: Content): { group: KnowledgeEntry['group']; entries: { entry: KnowledgeEntry; known: boolean }[] }[] {
  const groups: KnowledgeEntry['group'][] = [];
  for (const e of content.knowledge ?? []) if (!groups.includes(e.group)) groups.push(e.group);
  return groups.map((group) => ({ group, entries: (content.knowledge ?? []).filter((e) => e.group === group).map((entry) => ({ entry, known: known.includes(entry.id) })) }));
}

/** Does any known entry open this (9.R5b reads gates, tabs, terms, regions, origins this way)? */
export function knowledgeUnlocks(known: string[], content: Content, kind: KnowledgeEntry['unlocks'][number]['kind'], id: string): boolean {
  return (content.knowledge ?? []).some((e) => known.includes(e.id) && e.unlocks.some((u) => u.kind === kind && u.id === id));
}

/**
 * 9.R5b mở khóa dần: is a part of the game open to this life? Open when no entry gates it, when an entry
 * that opens it is known, or when the life is already inside it (cultivating, in a sect, rooted).
 */
export function featureOpen(state: GameState, content: Content, kind: KnowledgeEntry['unlocks'][number]['kind'], id: string, opts: { born?: boolean } = {}): boolean {
  const gated = (content.knowledge ?? []).some((e) => e.unlocks.some((u) => u.kind === kind && u.id === id));
  if (!gated || knowledgeUnlocks(opts.born ? bornKnowing(state) : knownEntries(state), content, kind, id)) return true;
  if (kind === 'tab' && id === 'tu_luyen') return state.cult.realm !== 'pham_nhan' || rootUsable(state, content);
  if (kind === 'tab' && id === 'tong_mon') return !!state.sect.id || !!state.ownSect || rootUsable(state, content);
  return false;
}

/** 9.R5b: glossary terms an entry gates stay plain text until it is known. */
export function visibleGlossary(content: Content, known: string[]): Content['glossary'] {
  const gated = new Set((content.knowledge ?? []).flatMap((e) => e.unlocks.filter((u) => u.kind === 'term').map((u) => u.id)));
  return content.glossary.filter((g) => !gated.has(g.id) || knowledgeUnlocks(known, content, 'term', g.id));
}

/** 9.R5b: an origin, talent or anything else that names requiresKnowledge is open with that entry known. */
export const knowsFor = (known: string[] | undefined, requires: string | undefined) => !requires || (known ?? []).includes(requires);

/**
 * 9.R5b migration: a browser that played before the Sổ tri thức existed already saw the immortal world,
 * so it starts with the basics instead of being locked out.
 */
export const BASIC_KNOWLEDGE = ['tin_don_tien_nhan', 'tien_mon_thu_do', 'linh_can_la_gi', 'dan_khi_nhap_the', 'chinh_dao_tong_mon'];
