// 9.R9 Nhân quả xuyên kiếp: when a life ends, the heaviest ties it leaves (đạo lữ, ân, oán, kẻ thù)
// go into the save meta (karmaLedger). A later life is born carrying them (state.pastTies); each year
// one may come back as a new NPC who "feels familiar" (npc.pastLife), and the ledger's npcTrigger
// "reunion" brings the cố nhân tái ngộ event about them. Numbers in balance.karmaLedger.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, KarmaTie, KarmaTieKind } from '../core/types';
import { hookSum } from './cultivation';
import { createNpc, npcById } from './npcs';

export const KARMA_TIE_KINDS: KarmaTieKind[] = ['dao_lu', 'an', 'oan', 'ke_thu'];

/** The ties one finished life leaves behind, heaviest first. */
export function lifeTies(life: GameState, content: Content): KarmaTie[] {
  const cfg = content.balance.karmaLedger;
  const out: KarmaTie[] = [];
  for (const n of life.npcs) {
    const tie = (kind: KarmaTieKind, weight: number) => out.push({ kind, name: n.name, gender: n.gender, self: life.character.name, weight: Math.round(weight), lives: 0 });
    if (n.id === life.romance.partner) tie('dao_lu', Math.max(n.affinity, cfg.minWeight));
    else if (n.grudge >= cfg.enemyAt) tie('ke_thu', n.grudge);
    else if (n.grudge >= cfg.minWeight && n.grudge > n.favor) tie('oan', n.grudge);
    else if (n.favor >= cfg.minWeight) tie('an', n.favor);
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, cfg.perLife);
}

/** The meta ledger after this life: older ties a life further away (gone after maxLives), this life's added. */
export function nextKarmaLedger(prev: KarmaTie[], life: GameState, content: Content): KarmaTie[] {
  const cfg = content.balance.karmaLedger;
  if (life.challenge) return prev;
  const older = prev.map((t) => ({ ...t, lives: t.lives + 1 })).filter((t) => t.lives < cfg.maxLives);
  return [...lifeTies(life, content), ...older].slice(0, cfg.max);
}

/** A stored ledger, tolerant of a missing or broken one. */
export function readKarmaLedger(raw: unknown): KarmaTie[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is KarmaTie => !!t && typeof t.name === 'string' && typeof t.self === 'string' && KARMA_TIE_KINDS.includes(t.kind)
    && typeof t.weight === 'number' && typeof t.lives === 'number');
}

/** Ties a new life is born with (none in a first life). */
export function pastTiesFor(ledger: KarmaTie[] | undefined): GameState['pastTies'] {
  return (ledger ?? []).map((t) => ({ ...t, met: false }));
}

/** This year's chance that a tie comes back: heavier ties and nearer lives come sooner. */
export function reunionChance(state: GameState, content: Content, tie: KarmaTie): number {
  const cfg = content.balance.karmaLedger;
  const p = cfg.chance * (1 + tie.weight / 100) * cfg.livesDecay ** tie.lives + hookSum(state, content, 'reunionChance');
  return Math.min(1, Math.max(0, p));
}

/** One year: maybe a cố nhân from a past life appears (an NPC marked pastLife; the reunion event follows). */
export function reunionYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.karmaLedger;
  const ties = state.pastTies ?? [];
  if (!state.alive || ties.length === 0 || state.character.age < cfg.minAge) return state;
  // One cố nhân at a time: wait until the last one's event has come.
  if (state.npcs.some((n) => n.pastLife && !n.pastLife.met)) return state;
  const rng = new Rng(`${state.seed}:reunion:${state.character.age}`);
  const i = ties.findIndex((t) => !t.met && (t.kind !== 'dao_lu' || state.character.age >= cfg.romanceMinAge) && rng.chance(reunionChance(state, content, t)));
  return i < 0 ? state : bringBack(state, content, i);
}

/** The i-th past tie comes back as a new NPC marked pastLife (their reunion event comes next). */
export function bringBack(state: GameState, content: Content, i: number): GameState {
  const cfg = content.balance.karmaLedger;
  const ties = state.pastTies ?? [];
  const tie = ties[i];
  if (!tie) return state;
  const look = cfg.kinds[tie.kind];
  const met = createNpc(state, content, {
    role: look.role, gender: tie.gender, peer: true, minAge: tie.kind === 'dao_lu' ? cfg.romanceMinAge : undefined,
    affinity: look.affinity, favor: look.favor, grudge: look.grudge,
  });
  const npcs = met.state.npcs.map((n) => (n.id === met.id ? { ...n, pastLife: { kind: tie.kind, name: tie.name, self: tie.self, met: false } } : n));
  const pastTies = ties.map((t, j) => (j === i ? { ...t, met: true } : t));
  return { ...met.state, npcs, pastTies };
}

/** The reunion event has come for this NPC: no second one. */
export function markReunion(state: GameState, id: string): GameState {
  const n = npcById(state, id);
  if (!n?.pastLife) return state;
  return { ...state, npcs: state.npcs.map((m) => (m.id === id && m.pastLife ? { ...m, pastLife: { ...m.pastLife, met: true } } : m)) };
}
