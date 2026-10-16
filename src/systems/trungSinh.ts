// 9.S3 Trùng sinh: a soul that has lived this life before. It brings memories of what is to come (a treasure,
// a disaster, a future enemy or ally), recalled as the realm rises; when a memory's age comes its event plays.
// Hiệu ứng cánh bướm: the past drifts each year and each time a memory is used, and a drifted memory breaks.
// Some memories are false from the start (ký ức rạn nứt). Cultivation experience helps only up to expUntil.
// Own seed stream `${seed}:ts:<age>`. Content in worlds/<id>/trung-sinh.json, numbers in balance.trungSinh.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { applyOutcome } from './events/engine';

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

type Memory = NonNullable<GameState['trungSinh']>['memories'][number];

export const memoryDef = (content: Content, id: string) => content.trungSinh?.memories.find((m) => m.id === id);

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

/** Memory text with its age filled in. */
export const memoryText = (content: Content, m: Memory) => (memoryDef(content, m.id)?.text ?? '').replaceAll('{age}', `${m.age}`);

const recallable = (state: GameState, content: Content, realm: string) => realmIndex(content, state.cult.realm) >= realmIndex(content, realm);

/** The soul wakes with its memories: draw them, set their ages, mark some false. */
export function bindTrungSinh(state: GameState, content: Content): GameState {
  const file = content.trungSinh;
  if (!file || state.trungSinh) return state;
  const cfg = content.balance.trungSinh;
  const rng = new Rng(`${state.seed}:ts:bind`);
  const pool = rng.shuffle(file.memories.filter((m) => m.age.max > state.character.age));
  const memories: Memory[] = pool.slice(0, cfg.memories)
    .map((m) => ({ id: m.id, age: rng.int(Math.max(m.age.min, state.character.age + 1), m.age.max), recalled: false, state: 'waiting' as const, false: rng.chance(cfg.falseChance) }))
    .sort((a, b) => a.age - b.age);
  return recallYear({ ...state, trungSinh: { memories, drift: 0 } }, content);
}

/** Memories whose realm is reached come back, with a log line. */
function recallYear(state: GameState, content: Content): GameState {
  const ts = state.trungSinh;
  if (!ts) return state;
  const back = ts.memories.filter((m) => !m.recalled && m.state === 'waiting' && recallable(state, content, memoryDef(content, m.id)?.recallRealm ?? 'pham_nhan'));
  if (back.length === 0) return state;
  const memories = ts.memories.map((m) => (back.includes(m) ? { ...m, recalled: true } : m));
  return pushLines({ ...state, trungSinh: { ...ts, memories } }, back.map((m) => ({ text: `Ký ức kiếp trước hiện về: ${memoryText(content, m)}`, tone: 'rare' as const })));
}

/** Chance a memory has broken by now. */
export const breakChance = (state: GameState, content: Content) => Math.min(content.balance.trungSinh.maxBreak, (state.trungSinh?.drift ?? 0) / 100);

/** One year: drift, recall, and the memory whose age has come plays (or breaks). */
export function trungSinhYear(state: GameState, content: Content): GameState {
  const ts = state.trungSinh;
  if (!ts || !state.alive) return state;
  const cfg = content.balance.trungSinh;
  const age = state.character.age;
  let s = recallYear({ ...state, trungSinh: { ...ts, drift: Math.min(100, ts.drift + cfg.driftPerYear) } }, content);
  const due = s.trungSinh!.memories.find((m) => m.state === 'waiting' && m.age <= age);
  const def = due && memoryDef(content, due.id);
  if (!due || !def) return s;
  const rng = new Rng(`${state.seed}:ts:${age}`);
  // A memory not yet recalled cannot be acted on: it simply passes.
  const broken = due.false || !due.recalled || rng.chance(breakChance(s, content));
  const set = (st: Memory['state'], drift: number) => ({ ...s.trungSinh!, drift: Math.min(100, drift), memories: s.trungSinh!.memories.map((m) => (m === due ? { ...m, state: st } : m)) });
  if (broken) {
    const r = applyOutcome({ ...s, trungSinh: set('broken', s.trungSinh!.drift) }, content, def.broken, rng);
    return pushLines(r.state, [{ text: due.recalled ? r.text : `Có chuyện gì đó lẽ ra phải nhớ, mà ngươi không nhớ ra. ${r.text}`, tone: 'bad' }]);
  }
  // Acting on what one knows bends history further.
  s = { ...s, trungSinh: set('done', s.trungSinh!.drift + cfg.driftPerMemory) };
  return { ...s, events: { ...s.events, followUps: [{ event: def.event, atAge: age }, ...s.events.followUps] } };
}

/** Cultivation experience of the last life: helps until expUntil is reached. */
export function trungSinhHooks(state: GameState, content: Content): EffectHook[] {
  const file = content.trungSinh;
  if (!state.trungSinh || !file) return [];
  return realmIndex(content, state.cult.realm) < realmIndex(content, file.expUntil) ? file.exp : [];
}
