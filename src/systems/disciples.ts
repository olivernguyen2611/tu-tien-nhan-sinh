// Thu đồ đệ (task 4.9, basic): from Trúc Cơ a cultivator may take disciples,
// more as the realm rises. A disciple is an NPC (task 3.4) who cultivates on
// their own; teaching them once a year speeds them up, deepens the bond and the
// favor they owe, and the teacher learns a little by teaching. A disciple's
// hidden nature may still turn out ugly (Bộ mặt thật). Numbers in
// balance.disciples, texts in disciples.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { addProgress } from './cultivation';
import { changeNpc, createNpc } from './npcs';

export function disciples(state: GameState): Npc[] {
  return state.npcs.filter((n) => n.alive && n.disciple);
}

export function maxDisciples(state: GameState, content: Content): number {
  return content.balance.disciples.maxByRealm[state.cult.realm] ?? 0;
}

/** Why no new disciple can be taken now, or null. */
export function recruitBlocked(state: GameState, content: Content): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  const max = maxDisciples(state, content);
  if (max === 0) return 'Tới Trúc Cơ mới thu được đồ đệ.';
  if (disciples(state).length >= max) return `Cảnh giới này chỉ dạy nổi ${max} đồ đệ.`;
  if (state.npcs.some((n) => n.disciple?.since === state.character.age)) return 'Năm nay đã thu một đồ đệ.';
  return null;
}

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

export function recruitDisciple(state: GameState, content: Content): { state: GameState; text: string } | null {
  if (recruitBlocked(state, content)) return null;
  const cfg = content.balance.disciples;
  const rng = Rng.fromState(state.rng);
  const age = rng.int(cfg.age[0], cfg.age[1]);
  // The master opens the way: a disciple starts at the first realm above Phàm Nhân.
  const first = content.cultivation.realms.realms[1]?.id;
  const met = createNpc({ ...state, rng: rng.getState() }, content, { role: content.disciples.role, age, root: true, realm: first, stage: 0, affinity: cfg.affinity });
  const r2 = Rng.fromState(met.state.rng);
  const aptitude = r2.int(cfg.aptitude[0], cfg.aptitude[1]);
  let s: GameState = {
    ...met.state,
    rng: r2.getState(),
    npcs: met.state.npcs.map((n) => (n.id === met.id ? { ...n, aptitude, disciple: { since: state.character.age, lastTaught: null } } : n)),
  };
  const npc = s.npcs.find((n) => n.id === met.id)!;
  const text = content.disciples.recruit.replaceAll('{npc}', npc.name).replaceAll('{name}', state.character.name);
  s = pushLine(s, { text, tone: 'good' });
  return { state: s, text };
}

export function teachBlocked(state: GameState, npc: Npc): string | null {
  if (!state.alive || !npc.alive || !npc.disciple) return 'Không dạy được.';
  if (npc.disciple.lastTaught === state.character.age) return 'Năm nay đã chỉ điểm rồi.';
  return null;
}

/** Teach a disciple once a year. */
export function teachDisciple(state: GameState, content: Content, npcId: string): { state: GameState; text: string } | null {
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!npc || teachBlocked(state, npc)) return null;
  const cfg = content.balance.disciples;
  const rng = Rng.fromState(state.rng);
  const boost = cfg.teachProgress * (0.5 + state.aptitudes.comprehension / 100);
  let s: GameState = {
    ...state,
    rng: rng.getState(),
    npcs: state.npcs.map((n) => (n.id === npcId ? { ...n, progress: n.realm === 'pham_nhan' ? n.progress : n.progress + boost, disciple: { ...n.disciple!, lastTaught: state.character.age } } : n)),
  };
  s = changeNpc(s, content, npcId, { affinity: cfg.teachAffinity, favor: cfg.teachFavor });
  s = addProgress(s, cfg.teacherProgress);
  const text = rng.pick(content.disciples.teach).replaceAll('{npc}', npc.name).replaceAll('{name}', state.character.name);
  return { state: pushLine(s, { text, tone: 'good' }), text };
}
