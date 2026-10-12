// Chiêu mộ người quen vào tông mình (task 5c.9): chưởng môn mời một NPC đã quen biết (bằng hữu, ân nhân…)
// gia nhập tông. Tỉ lệ nhận lời theo thiện cảm, ân tình và oán hận; mỗi người một lần mỗi năm.
// Người đã nhập là đệ tử của tông: tính vào số đệ tử, nộp thêm vào kho mỗi năm. Số trong balance.founding.recruit.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { changeNpc } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Acquaintances who joined the player's sect and are still alive. */
export function sectMembers(state: GameState): Npc[] {
  return state.npcs.filter((n) => n.alive && n.member);
}

/** Chance the invited NPC says yes. */
export function recruitChance(content: Content, npc: Npc): number {
  const c = content.balance.founding.recruit;
  return Math.max(0.05, Math.min(0.95, c.base + (npc.affinity - 50) * c.affinityWeight + npc.favor * c.favorWeight - npc.grudge * c.grudgeWeight));
}

export interface RecruitView { npc: Npc; chance: number; blocked: string | null }

/** Acquaintances who could be invited (cultivators of age who are not already bound to a sect or the player). */
export function recruitViews(state: GameState, content: Content): RecruitView[] {
  const own = state.ownSect;
  if (!state.alive || !own) return [];
  const c = content.balance.founding.recruit;
  return state.npcs
    .filter((n) => n.alive && !n.member && !n.disciple && !n.sectmate && n.root && n.age >= c.minAge)
    .map((npc) => ({
      npc,
      chance: recruitChance(content, npc),
      blocked: npc.recruitTried === state.character.age ? 'Năm nay đã mời rồi.'
        : npc.affinity < c.minAffinity ? `Cần thiện cảm ${c.minAffinity} trở lên.`
        : own.treasury < c.giftCost ? `Kho cần ${c.giftCost} linh thạch làm lễ.` : null,
    }))
    .sort((a, b) => Number(!!a.blocked) - Number(!!b.blocked) || b.npc.affinity - a.npc.affinity);
}

/** Invite an acquaintance. The gift is spent either way; a yes adds a member, a no cools the bond a little. */
export function recruitNpc(state: GameState, content: Content, npcId: string): { state: GameState; text: string; joined: boolean } | null {
  const own = state.ownSect;
  const view = recruitViews(state, content).find((v) => v.npc.id === npcId);
  if (!own || !view || view.blocked) return null;
  const c = content.balance.founding.recruit;
  const rng = Rng.fromState(state.rng);
  const joined = rng.chance(view.chance);
  const t = content.founding.texts;
  const text = rng.pick(joined ? t.recruitYes : t.recruitNo).replaceAll('{npc}', view.npc.name).replaceAll('{sect}', own.name).replaceAll('{name}', state.character.name);
  const prestige = own.prestige ?? content.balance.founding.prestige.start;
  let s: GameState = {
    ...state,
    rng: rng.getState(),
    stats: { ...state.stats, happiness: clamp(state.stats.happiness + (joined ? 2 : -1)) },
    ownSect: { ...own, treasury: own.treasury - c.giftCost, members: own.members + (joined ? 1 : 0), prestige: joined ? Math.min(100, prestige + c.joinPrestige) : prestige },
    npcs: state.npcs.map((n) => (n.id === npcId ? { ...n, recruitTried: state.character.age, ...(joined ? { member: { since: state.character.age } } : {}) } : n)),
  };
  s = changeNpc(s, content, npcId, joined ? { affinity: c.joinAffinity, favor: 5 } : { affinity: c.refuseAffinity });
  return { state: pushLine(s, { text, tone: joined ? 'good' : 'normal' }), text, joined };
}
