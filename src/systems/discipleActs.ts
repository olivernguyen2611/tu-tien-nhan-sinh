// Sư phụ và đồ đệ, ngoài chỉ điểm (task 5c.8): luận bàn, luận đạo, truyền công pháp đang tu,
// tặng vật phẩm đang giữ. Mỗi việc một lần mỗi năm cho mỗi đồ đệ. Số trong balance.disciples.acts,
// lời văn trong disciples.json `acts`. Người thầy cũng nhận lại chỉ số (mọi lựa chọn đều đổi chỉ số).
import { drawText } from './textPool';
import type { TextPool } from '../core/schemas';
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { combatPower } from './combat';
import { addProgress } from './cultivation';
import { itemById, removeItems } from './items';
import { changeNpc } from './npcs';
import { techniqueById } from './technique';

export type DiscipleAct = { kind: 'spar' } | { kind: 'debate' } | { kind: 'technique'; techniqueId: string } | { kind: 'gift'; itemId: string };

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

const fill = (text: string, vars: Record<string, string>) => Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), text);

function actKey(a: DiscipleAct) {
  return a.kind === 'technique' ? 'technique' : a.kind;
}

/** Why this act cannot be done with this disciple now, or null. */
export function actBlocked(state: GameState, content: Content, npc: Npc, act: DiscipleAct): string | null {
  if (!state.alive || !npc.alive || !npc.disciple) return 'Không làm được.';
  if (npc.disciple.acts?.[actKey(act)] === state.character.age) return 'Năm nay đã làm rồi.';
  if (act.kind === 'technique') {
    const tech = techniqueById(content, act.techniqueId);
    if (!tech || !state.cult.learned.includes(act.techniqueId)) return 'Ngươi chưa học công pháp này.';
    if (npc.technique === act.techniqueId) return 'Đồ đệ đã học công pháp này.';
    if (!npc.root) return 'Đồ đệ chưa có linh căn.';
  }
  if (act.kind === 'gift' && !(state.inventory[act.itemId] > 0)) return 'Không còn vật phẩm này.';
  return null;
}

/** Techniques the master can hand down (learned, not yet passed to this disciple). */
export function teachableTechniques(state: GameState, content: Content, npc: Npc) {
  return state.cult.learned
    .map((id) => techniqueById(content, id))
    .filter((t): t is NonNullable<typeof t> => !!t && npc.technique !== t.id && !t.requires.ghostOnly);
}

/** Items the master can give (any carried item). */
export function giftableItems(state: GameState, content: Content) {
  return Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ item: itemById(content, id), count: n }))
    .filter((x): x is { item: NonNullable<typeof x.item>; count: number } => !!x.item);
}

/** Chance the master wins a spar: Chiến lực share against the disciple's power. */
export function sparChance(state: GameState, content: Content, npc: Npc): number {
  const c = content.balance.combat;
  const base = content.balance.realms[npc.realm]?.combatPower ?? 1;
  const theirs = base * (1 + c.stagePct * npc.stage) * (c.physiqueBase + npc.aptitude / c.physiqueDivisor);
  const mine = combatPower(state, content);
  return Math.max(0.1, Math.min(0.9, mine / (mine + theirs)));
}

export function doDiscipleAct(state: GameState, content: Content, npcId: string, act: DiscipleAct): { state: GameState; text: string } | null {
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!npc || actBlocked(state, content, npc, act)) return null;
  const cfg = content.balance.disciples.acts;
  const texts = content.disciples.acts;
  const rng = Rng.fromState(state.rng);
  const vars = { npc: npc.name, name: state.character.name, technique: '', item: '' };
  let s: GameState = { ...state, rng: rng.getState() };
  // Mark the act done and give the disciple's progress (mortals take none).
  const mark = (n: Npc, progress: number, extra: Partial<Npc> = {}): Npc => ({
    ...n, ...extra,
    progress: n.realm === 'pham_nhan' ? n.progress : n.progress + progress,
    disciple: { ...n.disciple!, acts: { ...n.disciple!.acts, [actKey(act)]: state.character.age } },
  });
  const stat = (k: keyof GameState['stats'] | keyof GameState['aptitudes'], v: number) => {
    if (k in s.stats) s = { ...s, stats: { ...s.stats, [k]: clamp(s.stats[k as keyof GameState['stats']] + v) } };
    else s = { ...s, aptitudes: { ...s.aptitudes, [k]: clamp(s.aptitudes[k as keyof GameState['aptitudes']] + v) } };
  };
  let text: string;
  let tone: LogLine['tone'] = 'good';
  // 9.3: lines from pools that remember what this life has already read.
  const draw = (pool: TextPool, key: string) => { const d = drawText(s, content, `disciple.${key}`, pool, { affinity: npc.affinity, relation: 'disciple' }, rng); s = d.state; return d.text; };

  if (act.kind === 'spar') {
    const win = rng.chance(sparChance(state, content, npc));
    s = { ...s, rng: rng.getState(), npcs: s.npcs.map((n) => (n.id === npcId ? mark(n, cfg.sparProgress * (win ? cfg.sparLoseMul : 1)) : n)) };
    s = changeNpc(s, content, npcId, { affinity: cfg.sparAffinity });
    if (win) { stat('physique', 1); text = draw(texts.sparWin, 'sparWin'); } else { stat('health', -4); stat('daoHeart', 1); text = draw(texts.sparLose, 'sparLose'); tone = 'normal'; }
  } else if (act.kind === 'debate') {
    const chance = Math.max(0.1, Math.min(0.9, 0.5 + (state.aptitudes.comprehension - cfg.debateDifficulty) * 0.015));
    const win = rng.chance(chance);
    s = { ...s, rng: rng.getState(), npcs: s.npcs.map((n) => (n.id === npcId ? mark(n, cfg.debateProgress * (win ? 1 : 0.5)) : n)) };
    s = changeNpc(s, content, npcId, { affinity: cfg.debateAffinity });
    if (win) { stat('comprehension', 1); s = addProgress(s, content.balance.disciples.teacherProgress); text = draw(texts.debateWin, 'debateWin'); }
    else { stat('intellect', 1); stat('happiness', -1); text = draw(texts.debateFail, 'debateFail'); tone = 'normal'; }
  } else if (act.kind === 'technique') {
    const tech = techniqueById(content, act.techniqueId)!;
    vars.technique = tech.name;
    s = { ...s, npcs: s.npcs.map((n) => (n.id === npcId ? mark(n, cfg.techniqueProgress, { technique: tech.id }) : n)) };
    s = changeNpc(s, content, npcId, { affinity: cfg.techniqueAffinity, favor: 10 });
    stat('comprehension', 1); stat('daoHeart', 1);
    text = rng.pick(texts.technique);
  } else {
    const item = itemById(content, act.itemId)!;
    const g = cfg.gift[item.kind] ?? cfg.gift.misc!;
    vars.item = item.name;
    s = removeItems(s, [act.itemId]);
    s = { ...s, npcs: s.npcs.map((n) => (n.id === npcId ? mark(n, g.progress, { aptitude: clamp(n.aptitude + g.aptitude) }) : n)) };
    s = changeNpc(s, content, npcId, { affinity: g.affinity, favor: g.favor });
    stat('happiness', 2); stat('charm', 1);
    text = rng.pick(texts.gift);
  }
  s = { ...s, rng: rng.getState() };
  text = fill(text, vars);
  return { state: pushLine(s, { text, tone }), text };
}
