// 13.4 Kình địch suốt đời: once a cultivator reaches balance.rival.fromRealm, a peer of about the same
// age becomes the life's kình địch (someone already met who cultivates, else a new thiên kiêu). Every
// few years the next meeting of the chain comes (balance.rival.steps: event ids, about that NPC):
// first sight, a contest, luận đạo, an alliance, a betrayal or a rescue, the reckoning. The rival keeps
// pace with the player. Rolls use a side stream, so the life's rng is untouched.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, Npc } from '../core/types';
import { createNpc } from './npcs';

const realmIdx = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** The kình địch, when one is set and still alive. */
export function rivalNpc(state: GameState): Npc | undefined {
  const id = state.rival?.npc;
  return id ? state.npcs.find((n) => n.id === id && n.alive) : undefined;
}

/** Someone already met who fits: cultivates, near the player's age, not a disciple, kin or lover. */
function pickKnown(state: GameState, content: Content, rng: Rng): Npc | undefined {
  const cfg = content.balance.rival!;
  const close = new Set([state.romance.partner, state.romance.lover, ...(state.romance.concubines ?? [])]);
  const fits = state.npcs.filter((n) => n.alive && n.root && !n.disciple && !n.chosen && !close.has(n.id)
    && Math.abs(n.age - state.character.age) <= cfg.ageGap && realmIdx(content, n.realm) >= 1);
  return fits.length ? rng.pick(fits) : undefined;
}

/** Bring the rival level with the player (a realm ahead at the steps in `aheadAt`). */
function keepPace(state: GameState, content: Content, id: string, step: number): GameState {
  const cfg = content.balance.rival!;
  const realms = content.cultivation.realms.realms;
  const mine = realmIdx(content, state.cult.realm);
  const want = Math.min(realms.length - 1, mine + (cfg.aheadAt.includes(step) ? 1 : 0));
  return {
    ...state,
    npcs: state.npcs.map((n) => (n.id === id && realmIdx(content, n.realm) < want ? { ...n, realm: realms[want].id, stage: 0, progress: 0, lifespan: Math.max(n.lifespan, state.cult.lifespan) } : n)),
  };
}

/** One year: choose the rival, or book the next meeting of the chain when it is due. */
export function rivalYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.rival;
  if (!cfg || !state.alive || realmIdx(content, state.cult.realm) < realmIdx(content, cfg.fromRealm)) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:rival:${age}`);
  const gap = () => rng.int(cfg.gapYears[0], cfg.gapYears[1]);
  let s = state;
  if (!s.rival) {
    let id = pickKnown(s, content, rng)?.id;
    if (!id) {
      const made = createNpc(s, content, { role: cfg.role, peer: true, root: true, realm: s.cult.realm, stage: s.cult.stage, affinity: 40 });
      s = made.state;
      id = made.id;
    }
    s = { ...s, npcs: s.npcs.map((n) => (n.id === id ? { ...n, rival: true } : n)), rival: { npc: id, step: 0, next: age } };
  }
  const r = s.rival!;
  if (r.step >= cfg.steps.length || age < r.next) return s;
  // The rival died before the reckoning: the chain ends without one.
  if (!rivalNpc(s)) return { ...s, rival: { ...r, step: cfg.steps.length } };
  s = keepPace(s, content, r.npc, r.step);
  return {
    ...s,
    rival: { ...r, step: r.step + 1, next: age + gap() },
    events: { ...s.events, followUps: [{ event: cfg.steps[r.step], atAge: age, npc: r.npc }, ...s.events.followUps] },
  };
}
