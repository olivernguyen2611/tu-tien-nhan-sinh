// Trưởng lão của tông mình (task 5c.7): a founded or inherited sect has a few named elders who
// are real NPCs (they age, cultivate, remember favors). The master can reward them from the
// treasury once a year each to deepen the bond and raise the sect's danh vọng.
import type { Content } from '../core/content';
import type { GameState, LogLine, Npc } from '../core/types';
import { changeNpc, createNpc, npcById } from './npcs';

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

/** Name the first elders of a sect that has just become the player's own. */
export function seedElders(state: GameState, content: Content): GameState {
  const own = state.ownSect;
  if (!own) return state;
  const count = content.balance.founding.elders.count;
  const realms = content.cultivation.realms.realms;
  const at = Math.max(1, realms.findIndex((r) => r.id === state.cult.realm));
  const realm = realms[Math.max(1, at - 1)]!;
  let s = state;
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const made = createNpc(s, content, { role: 'Trưởng lão', realm: realm.id, stage: Math.min(realm.stages.length - 1, i), root: true, age: state.character.age + 20 + i * 15, affinity: 60 });
    s = made.state;
    s = { ...s, npcs: s.npcs.map((n) => (n.id === made.id ? { ...n, sectmate: { sect: 'own', kind: 'elder' as const, lastMet: null } } : n)) };
    ids.push(made.id);
  }
  const names = ids.map((id) => npcById(s, id)?.name ?? '').join(', ');
  const text = content.founding.texts.eldersMet.replaceAll('{sect}', own.name).replaceAll('{names}', names);
  return pushLines({ ...s, ownSect: { ...own, elders: ids } }, [{ text, tone: 'normal' }]);
}

export interface ElderView { npc: Npc; blocked: string | null }

export function elderViews(state: GameState, content: Content): ElderView[] {
  const own = state.ownSect;
  if (!own?.elders) return [];
  const cfg = content.balance.founding.elders;
  return own.elders.map((id) => npcById(state, id)).filter((n): n is Npc => !!n && n.alive).map((npc) => ({
    npc,
    blocked: npc.sectmate?.lastMet === state.character.age ? 'Năm nay đã ban thưởng rồi.'
      : own.treasury < cfg.rewardCost ? `Kho cần ${cfg.rewardCost} linh thạch.` : null,
  }));
}

/** Reward an elder from the treasury. */
export function rewardElder(state: GameState, content: Content, id: string): { state: GameState; text: string } | null {
  const own = state.ownSect;
  const view = elderViews(state, content).find((v) => v.npc.id === id);
  if (!own || !view || view.blocked) return null;
  const cfg = content.balance.founding.elders;
  let s: GameState = {
    ...state,
    ownSect: { ...own, treasury: own.treasury - cfg.rewardCost, prestige: Math.min(100, (own.prestige ?? content.balance.founding.prestige.start) + cfg.rewardPrestige) },
    npcs: state.npcs.map((n) => (n.id === id ? { ...n, sectmate: { ...n.sectmate!, lastMet: state.character.age } } : n)),
  };
  s = changeNpc(s, content, id, { affinity: cfg.rewardAffinity, favor: 5 });
  const text = content.founding.texts.elderRewarded.replaceAll('{title}', 'Trưởng lão').replaceAll('{npc}', view.npc.name);
  return { state: pushLines(s, [{ text, tone: 'good' }]), text };
}
