// 9.6 Người quen sâu hơn: kinds of relation (relations.json) and the groups the Nhân duyên tab shows,
// kỷ niệm (the last few things the player and an NPC did together), NPCs who come on their own
// (npcTrigger "visit": mượn tiền, mời cưới, rủ làm ăn, nhờ báo thù…), and NPCs whose lives move on
// (bạn học thành bộ khoái, tán tu…). The yearly parts roll on their own streams (seed:acq:age,
// seed:visit:age), so a year with nothing new leaves the life's dice as they were.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { meets } from './events/conditions';
import { createNpc, kindFor } from './npcs';
import { standingMul } from './standing';

export function kindName(content: Content, n: Npc): string | null {
  return content.relations?.kinds.find((k) => k.id === n.kind)?.name ?? null;
}

/** Where the NPC shows in the Nhân duyên tab: love, sect and enmity win over the kind. */
export function relationGroup(state: GameState, content: Content, n: Npc): string {
  const r = content.relations;
  if (state.romance.partner === n.id || state.romance.lover === n.id || state.romance.exes.includes(n.id)) return 'tinh_duyen';
  if (n.sectmate || n.disciple || n.member) return 'tong_mon';
  if (n.grudge >= content.balance.npcs.revengeAt) return 'thu_dich';
  const kind = r?.kinds.find((k) => k.id === (n.kind ?? kindFor(content, n.role)));
  return kind?.group ?? r?.groups.at(-1)?.id ?? 'khac';
}

/** Remember something done together (newest last, balance.npcs.memories kept). */
export function remember(state: GameState, content: Content, npcId: string | null | undefined, text: string): GameState {
  if (!npcId) return state;
  const keep = content.balance.npcs.memories;
  return {
    ...state,
    npcs: state.npcs.map((n) => n.id === npcId
      ? { ...n, memories: [...(n.memories ?? []), { age: state.character.age, text }].slice(-keep) }
      : n),
  };
}

/** "{npcMemory}": the last thing done together before now, for texts that bring it up. */
export function memoryText(state: GameState, n: Npc | undefined): string {
  const m = n?.memories?.filter((x) => x.age < state.character.age).at(-1) ?? n?.memories?.at(-1);
  return m ? `chuyện ${m.text.charAt(0).toLowerCase()}${m.text.slice(1)} năm ngươi ${m.age} tuổi` : 'chuyện ngày trước';
}

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** Meet someone on a side stream of dice: the life's own rng stays where it was. */
function meetAside(state: GameState, content: Content, rng: Rng, spec: Parameters<typeof createNpc>[2]): { state: GameState; id: string } {
  const met = createNpc({ ...state, rng: rng.getState() }, content, spec);
  return { state: { ...met.state, rng: state.rng }, id: met.id };
}

/** One year of acquaintances: the first neighbours and friends, and NPCs taking up new occupations. */
export function acquaintanceYear(state: GameState, content: Content): GameState {
  const r = content.relations;
  if (!r || !state.alive) return state;
  const cfg = content.balance.npcs;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:acq:${age}`);
  let s = state;
  const lines: LogLine[] = [];
  if (age === cfg.childhoodAge) {
    for (const c of r.childhood) {
      const met = meetAside(s, content, rng, { role: c.role, kind: c.kind, peer: c.peer, affinity: c.affinity, root: false });
      s = met.state;
      const name = s.npcs.find((n) => n.id === met.id)?.name ?? '';
      lines.push({ text: c.text.replaceAll('{npc}', name), tone: 'normal' });
    }
  }
  const npcs = s.npcs.map((n) => {
    if (!n.alive || n.disciple || n.member || n.age < 16 || !rng.chance(cfg.occupationChance)) return n;
    const cultivator = n.realm !== 'pham_nhan';
    const open = r.occupations.filter((o) => n.age >= o.minAge && o.id !== n.occupation && (o.root === undefined || o.root === cultivator));
    if (open.length === 0) return n;
    const o = rng.weighted(open, (x) => x.weight);
    if (n.affinity >= cfg.newsAffinity) lines.push({ text: o.news.replaceAll('{npc}', n.name), tone: 'normal' });
    return { ...n, occupation: o.id };
  });
  s = { ...s, npcs };
  return { ...s, log: pushLines(s, lines) };
}

/** Someone came on their own within balance.npcs.visitGapYears. */
function visitedRecently(state: GameState, content: Content): boolean {
  const gap = content.balance.npcs.visitGapYears;
  return content.events.some((e) => e.npcTrigger === 'visit' && state.events.history[e.id] !== undefined && state.character.age - state.events.history[e.id] < gap);
}

/**
 * This year's visit, if any: an acquaintance comes with something (mượn tiền, mời cưới, nhờ báo thù…).
 * The same NPC never brings the same matter twice.
 */
export function pickVisit(state: GameState, content: Content, eligible: (e: Content['events'][number]) => boolean): { npc: string; event: string } | null {
  const cfg = content.balance.npcs;
  const visits = content.events.filter((e) => e.npcTrigger === 'visit' && e.weight > 0 && eligible(e));
  if (visits.length === 0 || visitedRecently(state, content)) return null;
  const rng = new Rng(`${state.seed}:visit:${state.character.age}`);
  if (!rng.chance(cfg.visitChance)) return null;
  const people = rng.shuffle(state.npcs.filter((n) => n.alive && !n.pastLife));
  for (const n of people) {
    const withNpc = { ...state, events: { ...state.events, npc: n.id } };
    const pool = visits.filter((e) => n.visits?.[e.id] === undefined && standingMul(state, content, e) > 0 && meets(withNpc, e.conditions, content));
    if (pool.length > 0) return { npc: n.id, event: rng.weighted(pool, (e) => e.weight * standingMul(state, content, e)).id };
  }
  return null;
}

/** The NPC came with this matter (so they do not bring it again). */
export function markVisit(state: GameState, npcId: string, eventId: string): GameState {
  return { ...state, npcs: state.npcs.map((n) => (n.id === npcId ? { ...n, visits: { ...n.visits, [eventId]: state.character.age } } : n)) };
}
