// Khí vận chi tử (task 5.5): now and then the world births the hero of some other story.
// One may become the player's disciple; their story is a chain of world events that
// read conditions.chosen and speak of them as {npc}. Hào quang (in npcs.ts): they
// cultivate faster, break through more easily and never die by mishap.
// Numbers in balance.chosen, templates in chosen-ones.json.
import type { Content } from '../core/content';
import type { EffectHook, GameEvent } from '../core/schemas';
import type { GameState, LogLine, Npc } from '../core/types';
import { Rng } from '../core/rng';
import { createNpc } from './npcs';

/** The khí vận chi tử this life took in, alive or not. */
export function chosenDisciple(state: GameState): Npc | undefined {
  return state.npcs.find((n) => n.chosen);
}

/** Does conditions.chosen hold? */
export function chosenMeets(state: GameState, c: NonNullable<GameEvent['conditions']['chosen']>): boolean {
  const n = chosenDisciple(state);
  if (c.has !== undefined && !!n !== c.has) return false;
  if (c.template === undefined && c.minYears === undefined && c.role === undefined) return true;
  if (!n?.alive) return false;
  if (c.template && !c.template.includes(n.chosen!.template)) return false;
  if (c.minYears !== undefined && state.character.age - n.chosen!.since < c.minYears) return false;
  if (c.role && !c.role.includes(n.chosen!.role ?? 'none')) return false;
  return true;
}

/** An event about the chosen one speaks of them as {npc}. */
export function isChosenEvent(e: GameEvent): boolean {
  const c = e.conditions.chosen;
  return !!c && (c.has === true || c.template !== undefined || c.minYears !== undefined || c.role !== undefined);
}

/** Take in a khí vận chi tử of this template (once a life; destiny ignores the disciple limit). */
export function takeChosen(state: GameState, content: Content, templateId: string): GameState {
  const t = content.chosenOnes.templates.find((x) => x.id === templateId);
  if (!t || chosenDisciple(state)) return state;
  const cfg = content.balance.chosen;
  const rng = Rng.fromState(state.rng);
  const age = rng.int(cfg.age[0], cfg.age[1]);
  const aptitude = rng.int(t.aptitude[0], t.aptitude[1]);
  const first = content.cultivation.realms.realms[1]?.id;
  const met = createNpc({ ...state, rng: rng.getState() }, content, { role: content.disciples.role, age, root: true, realm: first, stage: 0, affinity: cfg.affinity });
  const since = state.character.age;
  const npcs = met.state.npcs.map((n) => (n.id === met.id
    ? { ...n, aptitude, disciple: { since, lastTaught: null }, chosen: { template: t.id, since } }
    : n));
  const npc = npcs.find((n) => n.id === met.id)!;
  const line: LogLine = { text: t.recruit.replaceAll('{npc}', npc.name).replaceAll('{name}', state.character.name), tone: 'rare' };
  const log = met.state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...met.state, npcs, log, events: { ...met.state.events, npc: met.id } };
}

export type ChosenRole = 'protect' | 'exploit' | 'ignore';

/**
 * Task 5.6: the master picks a role once. Hộ đạo keeps them close; Lợi dụng takes their fortune (the
 * event gives the spoils); Mặc kệ lets them walk their own road (no longer a disciple, the story goes on).
 */
export function setChosenRole(state: GameState, content: Content, role: ChosenRole): GameState {
  const n = chosenDisciple(state);
  if (!n?.alive || n.chosen!.role) return state;
  const npcs = state.npcs.map((x) => (x.id === n.id
    ? { ...x, chosen: { ...x.chosen!, role }, disciple: role === 'ignore' ? undefined : x.disciple }
    : x));
  const line: LogLine = { text: content.chosenOnes.roles[role].text.replaceAll('{npc}', n.name), tone: role === 'exploit' ? 'bad' : 'rare' };
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, npcs, log };
}

/** Hooks the master carries from their role while the chosen one lives (khí vận lan sang, thiên đạo phản phệ). */
export function chosenHooks(state: GameState, content: Content): EffectHook[] {
  const n = chosenDisciple(state);
  return n?.alive && n.chosen!.role ? content.chosenOnes.roles[n.chosen!.role].effects : [];
}
