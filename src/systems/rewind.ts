// Trùng sinh (task 5b.10, mortal-path.md 3.3; fate talent Nhất Niệm Hồi Quang): a rewindOnDeath
// hook lets a dead life go back once, keeping the memory of the life before (flag ky_uc_kiep_truoc).
// A hook with `at: 6` (Hồi Quang Kính) goes back to age 6; without it, to the start of the
// current major realm. The spirit root stays; the world turns out a little different (new rng).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Checkpoint, GameState } from '../core/types';
import { lifeHooks } from './cultivation';

export const MEMORY_FLAG = 'ky_uc_kiep_truoc';
const CHECKPOINT_AGE = 6;

function snapshot(state: GameState): Checkpoint {
  const { log: _log, checkpoints: _cp, ...rest } = state;
  return rest;
}

/** Called as a year begins: remember the life at age 6 and on first reaching each major realm. */
export function withCheckpoints(state: GameState): GameState {
  const cp = state.checkpoints;
  const age6 = !cp.age6 && state.character.age === CHECKPOINT_AGE ? snapshot(state) : cp.age6;
  const newRealm = state.cult.realm !== 'pham_nhan' && cp.realm?.cult.realm !== state.cult.realm;
  const realm = newRealm ? snapshot(state) : cp.realm;
  return age6 === cp.age6 && realm === cp.realm ? state : { ...state, checkpoints: { age6, realm } };
}

export interface RewindOffer { target: 'age6' | 'realm'; age: number }

/** What a dead life could go back to, if anything (once a life). */
export function rewindOffer(state: GameState, content: Content): RewindOffer | null {
  if (state.alive || !state.death || state.flags[MEMORY_FLAG]) return null;
  const hooks = lifeHooks(state, content).filter((h) => h.hook === 'rewindOnDeath');
  const { age6, realm } = state.checkpoints;
  if (hooks.some((h) => h.at === CHECKPOINT_AGE) && age6) return { target: 'age6', age: age6.character.age };
  if (hooks.some((h) => h.at === undefined)) {
    const cp = realm ?? age6;
    if (cp) return { target: realm ? 'realm' : 'age6', age: cp.character.age };
  }
  return null;
}

/** Go back: the saved moment, the same spirit root, the memory of what came after. */
export function rewind(state: GameState, content: Content): GameState {
  const offer = rewindOffer(state, content);
  if (!offer || !state.death) return state;
  const cp = (offer.target === 'realm' ? state.checkpoints.realm : state.checkpoints.age6)!;
  const t = content.lifeTexts;
  const text = (offer.target === 'age6' ? t.rewindAge6 : t.rewindRealm)
    .replaceAll('{age}', String(state.death.age)).replaceAll('{back}', String(cp.character.age));
  // Lines up to the moment gone back to stay as the record; the rest is only memory now.
  const log = state.log.filter((y) => y.age <= cp.character.age);
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'rare' }] };
  return {
    ...cp,
    // The butterfly: the same years will not roll the same way.
    rng: new Rng(`${state.seed}:trung_sinh:${state.death.age}`).getState(),
    cult: { ...cp.cult, root: state.cult.root ?? cp.cult.root },
    flags: { ...cp.flags, [MEMORY_FLAG]: true },
    checkpoints: { age6: state.checkpoints.age6, realm: offer.target === 'realm' ? cp : null },
    log,
  };
}
