// Việc làm với người quen theo mức thân (task 9.0.3, content/npc-acts.json): quen thì trò chuyện, bạn thì
// rượu và ngao du, thân thì tâm sự và xin chỉ điểm, thù thì dò la, cầu hòa, đối đầu. Mỗi việc một lần mỗi năm.
import { drawText } from './textPool';
import type { Content } from '../core/content';
import { remember } from './acquaintances';
import { Rng } from '../core/rng';
import type { NpcAct } from '../core/schemas';
import type { GameState, LogLine, Npc, Tone } from '../core/types';
import { addProgress } from './cultivation';
import { checkChance } from './events/engine';
import { changeNpc, npcById } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Someone the player holds a grudge or cold feelings toward: gets the enemy acts. */
function isFoe(content: Content, n: Npc): boolean {
  return !!n.cut || n.grudge >= content.balance.npcs.revengeAt || n.affinity < content.balance.npcs.coldBelow;
}

export interface NpcActView { id: string; name: string; cost: number; chance: number | null; blocked: string | null }

/** Acts that suit how close this NPC is now (empty for the dead and for sectmates handled elsewhere). */
export function npcActViews(state: GameState, content: Content, n: Npc): NpcActView[] {
  if (!n.alive || !state.alive) return [];
  const foe = isFoe(content, n);
  return (content.npcActs ?? [])
    .filter((a) => (foe ? a.enemy : !a.enemy))
    .filter((a) => a.minAffinity === undefined || n.affinity >= a.minAffinity)
    .filter((a) => a.maxAffinity === undefined || n.affinity <= a.maxAffinity)
    .filter((a) => !a.cultivatorOnly || (n.realm !== 'pham_nhan' && state.cult.realm !== 'pham_nhan'))
    // 10.5: by relation kind, the player's age, and what stands between the two (debts, an oath).
    .filter((a) => a.kinds.length === 0 || a.kinds.includes(n.kind ?? ''))
    .filter((a) => !a.notKinds.includes(n.kind ?? ''))
    .filter((a) => a.minAge === undefined || state.character.age >= a.minAge)
    .filter((a) => specialFits(a, n))
    .map((a) => {
      const done = n.lastActs?.[a.id] === state.character.age;
      const poor = state.money.silver < a.cost + (a.special === 'repay' ? -(n.owed ?? 0) : 0);
      return {
        id: a.id, name: a.name, cost: a.cost,
        chance: a.check ? checkChance(state, content, a.check.stat, a.check.difficulty) : null,
        blocked: done ? 'Năm nay đã làm' : poor ? 'Không đủ bạc' : null,
      };
    });
}

function specialFits(a: NpcAct, n: Npc): boolean {
  switch (a.special) {
    case 'collect': return (n.owed ?? 0) > 0;
    case 'repay': return (n.owed ?? 0) < 0;
    case 'borrow': return (n.owed ?? 0) >= 0;
    case 'swear': return !n.sworn && !n.cut;
    case 'cut': return !n.cut;
    default: return true;
  }
}

/** 10.5: breaking a kết nghĩa oath (cutting ties, fighting, reporting a sworn sibling) costs Đạo tâm and nghiệp. */
export function breakOath(state: GameState, content: Content, npcId: string): GameState {
  const n = npcById(state, npcId);
  const k = content.balance.kinship;
  if (!n?.sworn || !k) return state;
  const text = (content.relations?.oath?.broken ?? '{npc}').replaceAll('{npc}', n.name);
  const s: GameState = {
    ...state,
    npcs: state.npcs.map((x) => (x.id === npcId ? { ...x, sworn: undefined } : x)),
    aptitudes: { ...state.aptitudes, daoHeart: clamp(state.aptitudes.daoHeart + k.oathDaoHeart) },
    social: { ...state.social, karma: clamp(state.social.karma + k.oathKarma, -100, 100) },
    flags: { ...state.flags, boi_uoc: true },
  };
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'bad' }] };
  return { ...s, log };
}

/** 10.5: what a special act does once it succeeds (silver is the amount moved). */
function applySpecial(state: GameState, content: Content, act: NpcAct, npcId: string, silver: number): GameState {
  const set = (patch: Partial<Npc>) => ({ ...state, npcs: state.npcs.map((x) => (x.id === npcId ? { ...x, ...patch } : x)) });
  const n = npcById(state, npcId)!;
  switch (act.special) {
    case 'lend': return set({ owed: (n.owed ?? 0) + act.cost });
    case 'borrow': return set({ owed: (n.owed ?? 0) - silver });
    case 'collect': return { ...set({ owed: 0 }), money: { ...state.money, silver: state.money.silver + (n.owed ?? 0) } };
    case 'repay': return { ...set({ owed: 0 }), money: { ...state.money, silver: Math.max(0, state.money.silver + (n.owed ?? 0)) } };
    case 'swear': return set({ sworn: state.character.age, kind: 'huynh_de', role: 'huynh đệ kết nghĩa' });
    case 'cut': return breakOath(set({ cut: true, affinity: Math.min(n.affinity, 15) }), content, npcId);
    case 'fight': case 'report': return breakOath(state, content, npcId);
    default: return state;
  }
}

function applyNumbers(state: GameState, effects: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [key, v] of Object.entries(effects)) {
    const k = key.slice(5);
    if (key.startsWith('stat.') && k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else if (key.startsWith('stat.') && k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  return { ...state, stats, aptitudes };
}

/** Do one act with an NPC; returns null when it is not allowed. */
export function doNpcAct(state: GameState, content: Content, npcId: string, actId: string): { state: GameState; text: string; tone: Tone } | null {
  const n = npcById(state, npcId);
  const act: NpcAct | undefined = (content.npcActs ?? []).find((a) => a.id === actId);
  const view = n && npcActViews(state, content, n).find((v) => v.id === actId);
  if (!n || !act || !view || view.blocked) return null;
  const rng = Rng.fromState(state.rng);
  const won = !act.check || rng.chance(checkChance(state, content, act.check.stat, act.check.difficulty));
  const out = won ? act.success : act.fail!;
  const gain = rng.int(out.affinity[0], out.affinity[1]);
  const drawn = drawText(state, content, `npcAct.${actId}.${won ? 'win' : 'fail'}`, out.texts, { affinity: n.affinity }, rng);
  const text = drawn.text.replaceAll('{npc}', n.name).replaceAll('{name}', state.character.name);
  const silver = won && act.silver ? rng.int(act.silver[0], act.silver[1]) : 0;

  let s = applyNumbers(drawn.state, out.effects);
  s = { ...s, money: { ...s.money, silver: Math.max(0, s.money.silver - act.cost + silver) } };
  s = { ...s, npcs: s.npcs.map((x) => (x.id === npcId ? { ...x, lastActs: { ...x.lastActs, [actId]: state.character.age } } : x)) };
  s = changeNpc(s, content, npcId, { affinity: gain, grudge: won ? act.grudgeAdd - act.grudgeEase : 0, reveal: won && act.reveal });
  // A cut tie and a fight happen whether or not the rest goes well.
  if (won || act.special === 'cut' || act.special === 'fight') s = applySpecial(s, content, act, npcId, silver);
  // Cầu hòa mends a tie that was cut.
  if (won && act.grudgeEase > 0) s = { ...s, npcs: s.npcs.map((x) => (x.id === npcId ? { ...x, cut: undefined } : x)) };
  if (won && act.progress > 0) {
    s = addProgress(s, act.progress);
    s = { ...s, npcs: s.npcs.map((x) => (x.id === npcId && x.realm !== 'pham_nhan' ? { ...x, progress: x.progress + act.progress } : x)) };
  }
  s = { ...s, rng: rng.getState() };
  const tone: Tone = won ? 'good' : 'bad';
  const line: LogLine = { text, tone };
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  // 9.6: kỷ niệm.
  return { state: remember({ ...s, log }, content, npcId, act.name), text, tone };
}
