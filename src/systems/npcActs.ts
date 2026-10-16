// Việc làm với người quen theo mức thân (task 9.0.3, content/npc-acts.json): quen thì trò chuyện, bạn thì
// rượu và ngao du, thân thì tâm sự và xin chỉ điểm, thù thì dò la, cầu hòa, đối đầu. Mỗi việc một lần mỗi năm.
import { drawText } from './textPool';
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { NpcAct } from '../core/schemas';
import type { GameState, LogLine, Npc, Tone } from '../core/types';
import { addProgress } from './cultivation';
import { checkChance } from './events/engine';
import { changeNpc, npcById } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Someone the player holds a grudge or cold feelings toward: gets the enemy acts. */
function isFoe(content: Content, n: Npc): boolean {
  return n.grudge >= content.balance.npcs.revengeAt || n.affinity < content.balance.npcs.coldBelow;
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
    .map((a) => {
      const done = n.lastActs?.[a.id] === state.character.age;
      const poor = state.money.silver < a.cost;
      return {
        id: a.id, name: a.name, cost: a.cost,
        chance: a.check ? checkChance(state, content, a.check.stat, a.check.difficulty) : null,
        blocked: done ? 'Năm nay đã làm' : poor ? 'Không đủ bạc' : null,
      };
    });
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
  s = changeNpc(s, content, npcId, { affinity: gain, grudge: won ? -act.grudgeEase : 0, reveal: won && act.reveal });
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
  return { state: { ...s, log }, text, tone };
}
