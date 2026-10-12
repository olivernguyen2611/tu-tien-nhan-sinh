// Quỷ tu (task 4.12, mortal-path.md 2.6): a life that ends with a lingering
// obsession (killed, or cut short with luck on its side) may go on as a ghost
// cultivator on the Quỷ đạo. The body is gone: health no longer recovers, the
// living fear the ghost (Quỷ đạo lineage costs), and Bất Tử U Minh Lục, the
// method only ghosts can read, becomes the main technique. Once per life.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { DeathCause, GameState, LogLine } from '../core/types';
import { hookSum } from './cultivation';
import { learnTechnique } from './technique';

export function isGhost(state: GameState): boolean {
  return !!state.flags.quy_tu;
}

/** Chance this death leaves a lingering obsession. */
export function ghostChance(state: GameState, content: Content, cause: DeathCause): number {
  if (isGhost(state)) return 0;
  const cfg = content.balance.ghost;
  const base = cfg.causeChance[cause] ?? 0;
  if (base <= 0) return 0;
  const p = base + (state.aptitudes.luck - 50) * cfg.luckPerPoint + hookSum(state, content, 'continueAfterDeath');
  return Math.max(0, Math.min(cfg.maxChance, p));
}

/** Roll at death (its own seeded stream, so the rest of the life is unchanged). */
export function rollGhostOffer(state: GameState, content: Content, cause: DeathCause): boolean {
  const p = ghostChance(state, content, cause);
  return p > 0 && new Rng(`${state.seed}:ghost:${state.character.age}`).chance(p);
}

/** Rise as a quỷ tu: the life goes on from the death screen. */
export function becomeGhost(state: GameState, content: Content): GameState {
  if (state.alive || !state.death?.ghostOffer) return state;
  const cfg = content.balance.ghost;
  const realms = content.cultivation.realms.realms.map((r) => r.id);
  const raised = realms.indexOf(state.cult.realm) < realms.indexOf(cfg.realm);
  let s: GameState = {
    ...state,
    alive: true,
    death: null,
    flags: { ...state.flags, quy_tu: true },
    stats: { ...state.stats, health: cfg.health },
    combat: null,
    cult: {
      ...state.cult,
      realm: raised ? cfg.realm : state.cult.realm,
      stage: raised ? 0 : state.cult.stage,
      progress: raised ? 0 : state.cult.progress,
      lifespan: state.character.age + cfg.lifespanYears,
      injuredUntil: null,
    },
    seclusion: null,
  };
  const learned = learnTechnique(s, content, cfg.technique, { quiet: true });
  if (learned) s = learned.state;
  const line: LogLine = { text: content.lifeTexts.ghostRise, tone: 'rare' };
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...s, log };
}
