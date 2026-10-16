// Developer mode: cheats for the people around the protagonist (backlog 13): NPCs met along the way
// and family members, picked by name from a list. Pure functions on GameState, like dev.ts.
import type { Content } from '../core/content';
import type { GameState, LogLine, Npc, Relative, SpiritRoot } from '../core/types';
import { relationLabel } from './relationships';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export interface DevPerson {
  /** "npc:<id>" or "rel:<id>". */
  key: string;
  kind: 'npc' | 'relative';
  /** Name with role and age, for the list. */
  name: string;
  group: string;
  alive: boolean;
}

/** Everyone the cheats can reach: family first, then the people met. */
export function devPeople(state: GameState): DevPerson[] {
  const family = state.family.map((r): DevPerson => ({
    key: `rel:${r.id}`, kind: 'relative', alive: r.alive, group: 'Gia đình',
    name: `${r.name} · ${relationLabel(r, state.character.age)} · ${r.alive ? `${r.age} tuổi` : 'đã mất'}`,
  }));
  const npcs = state.npcs.map((n): DevPerson => ({
    key: `npc:${n.id}`, kind: 'npc', alive: n.alive, group: 'Người quen',
    name: `${n.name} · ${n.role} · ${n.alive ? `${n.age} tuổi` : 'đã mất'}`,
  }));
  return [...family, ...npcs];
}

export type PersonCheat =
  | { kind: 'affinity' | 'favor' | 'grudge' | 'age' | 'lifespan' | 'aptitude'; delta: number }
  | { kind: 'alive'; on: boolean }
  | { kind: 'realm'; realmId: string }
  | { kind: 'stage' }
  | { kind: 'root'; on: boolean }
  | { kind: 'remove' }
  // 9.R6b: set any number outright, swap a trait, reveal the nature, hand down a technique.
  | { kind: 'set'; field: 'affinity' | 'favor' | 'grudge' | 'aptitude' | 'age' | 'lifespan' | 'progress' | 'insight'; value: number }
  | { kind: 'trait'; slot: 'surface' | 'nature' | 'goal'; id: string }
  | { kind: 'revealNature'; on: boolean }
  | { kind: 'technique'; id: string | null };

function devLog(state: GameState, text: string): GameState {
  const line: LogLine = { text: `[Dev] ${text}`, tone: 'normal' };
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: state.character.age, lines: [line] });
  return { ...state, log };
}

/** The cheats a person takes: relatives have no ledger, realm or aptitude. */
export function personCheatsAvailable(person: DevPerson): PersonCheat['kind'][] {
  const common: PersonCheat['kind'][] = ['affinity', 'age', 'lifespan', 'alive', 'root'];
  return person.kind === 'npc'
    ? [...common, 'favor', 'grudge', 'aptitude', 'realm', 'stage', 'remove', 'set', 'trait', 'revealNature', 'technique']
    : [...common, 'set', 'technique'];
}

const FIELD_NAMES: Record<string, string> = {
  affinity: 'thiện cảm', favor: 'ân', grudge: 'oán', aptitude: 'tư chất', age: 'tuổi', lifespan: 'thọ nguyên', progress: 'tiến độ', insight: 'ngộ tính',
};
const TRAIT_NAMES = { surface: 'tính nết', nature: 'bản chất', goal: 'chí hướng' } as const;
const traitList = (content: Content, slot: 'surface' | 'nature' | 'goal') => (slot === 'goal' ? content.npcTraits.goals : content.npcTraits[slot]);

export interface SheetRow { label: string; value: string }

/** 9.R6b: everything stored about a person, hidden parts included, for the dev panel. */
export function devPersonSheet(state: GameState, content: Content, key: string): SheetRow[] {
  const id = key.slice(key.indexOf(':') + 1);
  const realmName = (rid: string, stage: number) => {
    const r = content.cultivation.realms.realms.find((x) => x.id === rid);
    return r ? `${r.name}${rid === content.cultivation.realms.realms[0].id ? '' : ` ${r.stages[stage] ?? ''}`}`.trim() : rid;
  };
  const tech = (tid?: string | null) => (tid ? content.techniques.find((t) => t.id === tid)?.name ?? tid : '—');
  const nameOf = (nid: string | null) => (nid ? state.npcs.find((x) => x.id === nid)?.name ?? nid : '—');
  const acts = (m?: Record<string, number>) => (m && Object.keys(m).length ? Object.entries(m).map(([k, v]) => `${k}@${v}`).join(', ') : '—');
  if (key.startsWith('npc:')) {
    const n = state.npcs.find((x) => x.id === id);
    if (!n) return [];
    const trait = (slot: 'surface' | 'nature' | 'goal', tid: string | null) => (tid ? traitList(content, slot).find((x) => x.id === tid)?.name ?? tid : '—');
    return [
      { label: 'Id', value: n.id },
      { label: 'Giới tính · tuổi', value: `${n.gender} · ${n.age} / thọ ${n.lifespan}${n.alive ? '' : ' (đã mất)'}` },
      { label: 'Thân phận', value: n.role },
      { label: 'Linh căn · tư chất', value: `${n.root ? (n.acquired ? 'hậu thiên' : 'có') : 'không'} · ${n.aptitude}${n.rootTries ? ` · thử ${n.rootTries} lần` : ''}` },
      { label: 'Tu vi', value: `${realmName(n.realm, n.stage)} · ${Math.round(n.progress)}%` },
      { label: 'Công pháp', value: tech(n.technique) },
      { label: 'Tính nết · bản chất', value: `${trait('surface', n.surface)} · ${trait('nature', n.nature)}${n.natureKnown ? ' (đã lộ)' : ' (ẩn)'}` },
      { label: 'Chí hướng', value: trait('goal', n.goal) },
      { label: 'Thiện cảm · ân · oán', value: `${n.affinity} · ${n.favor} · ${n.grudge}` },
      { label: 'Thù truyền đời từ', value: nameOf(n.heirOf) },
      { label: 'Đồ đệ', value: n.disciple ? `từ ${n.disciple.since} tuổi, chỉ điểm ${n.disciple.lastTaught ?? '—'}; ${acts(n.disciple.acts)}` : '—' },
      { label: 'Đồng môn', value: n.sectmate ? `${n.sectmate.sect} · ${n.sectmate.kind}` : '—' },
      { label: 'Môn nhân tông mình', value: n.member ? `từ ${n.member.since} tuổi` : '—' },
      { label: 'Khí vận chi tử', value: n.chosen ? `${n.chosen.template}${n.chosen.role ? ` · ${n.chosen.role}` : ''}` : '—' },
      { label: 'Bạn đời', value: state.romance.partner === n.id ? 'có' : '—' },
      { label: 'Lần tương tác', value: `${acts(n.lastActs)}${n.lastGift !== undefined ? ` · tặng ${n.lastGift}` : ''}${n.lastBond ? ` · ${acts(n.lastBond)}` : ''}` },
    ];
  }
  const r = state.family.find((x) => x.id === id);
  if (!r) return [];
  return [
    { label: 'Id', value: r.id },
    { label: 'Vai · giới tính · tuổi', value: `${r.role} · ${r.gender} · ${r.age} / thọ ${r.lifespan}${r.alive ? '' : ' (đã mất)'}` },
    { label: 'Linh căn', value: r.root ? `${r.root.grade} [${r.root.elements.join(', ')}]${r.acquired ? ' hậu thiên' : ''}` : '—' },
    { label: 'Thể chất', value: r.bodyId ?? '—' },
    { label: 'Thiện cảm · ngộ tính', value: `${r.affinity} · ${r.insight ?? 0}` },
    { label: 'Công pháp được truyền', value: tech(r.technique) },
    { label: 'Lần tương tác', value: acts(r.lastActions) },
  ];
}

const GRADE_ROOT: SpiritRoot = { grade: 'song', elements: ['kim', 'moc'] };

function cheatNpc(n: Npc, content: Content, c: PersonCheat): { npc: Npc | null; what: string } {
  const realms = content.cultivation.realms.realms;
  switch (c.kind) {
    case 'affinity': return { npc: { ...n, affinity: clamp(n.affinity + c.delta) }, what: `thiện cảm ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'favor': return { npc: { ...n, favor: clamp(n.favor + c.delta) }, what: `ân ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'grudge': return { npc: { ...n, grudge: clamp(n.grudge + c.delta) }, what: `oán ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'aptitude': return { npc: { ...n, aptitude: clamp(n.aptitude + c.delta) }, what: `tư chất ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'age': { const age = Math.max(0, n.age + c.delta); return { npc: { ...n, age, lifespan: Math.max(n.lifespan, age + 1) }, what: `tuổi ${age}` }; }
    case 'lifespan': return { npc: { ...n, lifespan: Math.max(n.age + 1, n.lifespan + c.delta) }, what: `thọ nguyên ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'alive': return { npc: { ...n, alive: c.on, lifespan: c.on ? Math.max(n.lifespan, n.age + 10) : n.lifespan }, what: c.on ? 'sống lại' : 'chết' };
    case 'root': return { npc: { ...n, root: c.on, realm: c.on ? n.realm : realms[0].id, stage: c.on ? n.stage : 0, progress: c.on ? n.progress : 0 }, what: c.on ? 'có linh căn' : 'mất linh căn' };
    case 'realm': {
      const r = realms.find((x) => x.id === c.realmId);
      if (!r) return { npc: n, what: '' };
      return { npc: { ...n, realm: r.id, stage: 0, progress: 0, root: r.id === realms[0].id ? n.root : true }, what: `cảnh giới ${r.name}` };
    }
    case 'stage': {
      const r = realms.find((x) => x.id === n.realm);
      if (!r || n.realm === realms[0].id) return { npc: n, what: '' };
      return { npc: { ...n, stage: Math.min(r.stages.length - 1, n.stage + 1), progress: 0 }, what: `lên tầng ${Math.min(r.stages.length - 1, n.stage + 1) + 1}` };
    }
    case 'remove': return { npc: null, what: 'xóa khỏi thế giới' };
    case 'set': {
      if (c.field === 'insight') return { npc: n, what: '' };
      const v = c.field === 'age' || c.field === 'lifespan' ? Math.max(0, Math.round(c.value)) : clamp(c.value);
      const next = { ...n, [c.field]: v };
      if (c.field === 'age') next.lifespan = Math.max(n.lifespan, v + 1);
      if (c.field === 'lifespan') next.lifespan = Math.max(n.age + 1, v);
      return { npc: next, what: `${FIELD_NAMES[c.field]} = ${next[c.field]}` };
    }
    case 'trait': {
      const t = traitList(content, c.slot).find((x) => x.id === c.id);
      return t ? { npc: { ...n, [c.slot]: t.id }, what: `${TRAIT_NAMES[c.slot]}: ${t.name}` } : { npc: n, what: '' };
    }
    case 'revealNature': return { npc: { ...n, natureKnown: c.on }, what: c.on ? 'lộ bản chất' : 'giấu bản chất' };
    case 'technique': {
      if (c.id === null) return { npc: { ...n, technique: undefined }, what: 'bỏ công pháp' };
      const t = content.techniques.find((x) => x.id === c.id);
      return t ? { npc: { ...n, technique: t.id }, what: `công pháp ${t.name}` } : { npc: n, what: '' };
    }
  }
}

function cheatRelative(r: Relative, content: Content, c: PersonCheat): { rel: Relative; what: string } {
  switch (c.kind) {
    case 'set': {
      if (c.field === 'affinity' || c.field === 'insight') { const v = clamp(c.value); return { rel: { ...r, [c.field]: v }, what: `${FIELD_NAMES[c.field]} = ${v}` }; }
      if (c.field === 'age') { const age = Math.max(0, Math.round(c.value)); return { rel: { ...r, age, lifespan: Math.max(r.lifespan, age + 1) }, what: `tuổi ${age}` }; }
      if (c.field === 'lifespan') { const l = Math.max(r.age + 1, Math.round(c.value)); return { rel: { ...r, lifespan: l }, what: `thọ nguyên = ${l}` }; }
      return { rel: r, what: '' };
    }
    case 'technique': {
      if (c.id === null) return { rel: { ...r, technique: null }, what: 'bỏ công pháp' };
      const t = content.techniques.find((x) => x.id === c.id);
      return t ? { rel: { ...r, technique: t.id }, what: `công pháp ${t.name}` } : { rel: r, what: '' };
    }
    case 'affinity': return { rel: { ...r, affinity: clamp(r.affinity + c.delta) }, what: `thiện cảm ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'age': { const age = Math.max(0, r.age + c.delta); return { rel: { ...r, age, lifespan: Math.max(r.lifespan, age + 1) }, what: `tuổi ${age}` }; }
    case 'lifespan': return { rel: { ...r, lifespan: Math.max(r.age + 1, r.lifespan + c.delta) }, what: `thọ nguyên ${c.delta > 0 ? '+' : ''}${c.delta}` };
    case 'alive': return { rel: { ...r, alive: c.on, lifespan: c.on ? Math.max(r.lifespan, r.age + 10) : r.lifespan }, what: c.on ? 'sống lại' : 'chết' };
    case 'root': return { rel: { ...r, root: c.on ? GRADE_ROOT : { grade: 'none', elements: [] }, bodyId: null, acquired: false }, what: c.on ? 'có song linh căn' : 'không linh căn' };
    default: return { rel: r, what: '' };
  }
}

/** Apply a cheat to the person under `key`. Unknown people and cheats they do not take change nothing. */
export function devPersonCheat(state: GameState, content: Content, key: string, cheat: PersonCheat): GameState {
  if (!state.alive) return state;
  const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
  if (kind === 'npc') {
    const n = state.npcs.find((x) => x.id === id);
    if (!n) return state;
    // The đạo lữ and disciples are bound to other systems: they can be changed but not removed.
    if (cheat.kind === 'remove' && (state.romance.partner === n.id || n.disciple)) return state;
    const r = cheatNpc(n, content, cheat);
    if (!r.what) return state;
    const npcs = r.npc ? state.npcs.map((x) => (x.id === id ? r.npc! : x)) : state.npcs.filter((x) => x.id !== id);
    return devLog({ ...state, npcs }, `${n.name}: ${r.what}`);
  }
  if (kind === 'rel') {
    const rel = state.family.find((x) => x.id === id);
    if (!rel) return state;
    const r = cheatRelative(rel, content, cheat);
    if (!r.what) return state;
    return devLog({ ...state, family: state.family.map((x) => (x.id === id ? r.rel : x)) }, `${rel.name}: ${r.what}`);
  }
  return state;
}
