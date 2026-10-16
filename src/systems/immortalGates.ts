// 9.R4b Tiên duyên: how a mortal is found by the immortal world. No child is tested by default any
// more; each year a gate (immortal-gates.json) whose conditions hold may open and bring its event,
// which tests the innate root (9.R4a). The roll uses its own seeded stream.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { ImmortalGate } from '../core/schemas';
import type { GameState } from '../core/types';
import { meets } from './events/conditions';
import { bornKnowing } from './knowledge';

/** This year's chance of a gate, or 0 when it is shut (conditions, already opened, no number). */
export function gateChance(state: GameState, content: Content, gate: ImmortalGate): number {
  const cfg = content.balance.immortalGates;
  const base = cfg?.chance[gate.id] ?? 0;
  if (!cfg || base <= 0 || state.flags[gateFlag(gate)] || !meets(state, gate.conditions, content)) return 0;
  const known = !gate.requiresKnowledge || bornKnowing(state).includes(gate.requiresKnowledge);
  const luck = 1 + (cfg.luckWeight * (state.aptitudes.luck - 50)) / 100;
  if (!known && cfg.closedUnknown.includes(gate.id)) return 0;
  return Math.max(0, Math.min(1, base * (known ? 1 : cfg.unknownMul) * luck));
}

/** Set once a gate has opened in this life (each gate opens at most once). */
export const gateFlag = (gate: ImmortalGate) => `tien_duyen_${gate.id}`;

/** The year's gate, if one opens: its event becomes due now. */
export function gatesYear(state: GameState, content: Content): GameState {
  if (state.cult.root || state.events.pending) return state;
  const rng = new Rng(`${state.seed}:gate:${state.character.age}`);
  for (const gate of content.immortalGates ?? []) {
    const chance = gateChance(state, content, gate);
    if (chance > 0 && rng.chance(chance)) {
      return {
        ...state,
        flags: { ...state.flags, [gateFlag(gate)]: true },
        events: { ...state.events, followUps: [{ event: gate.event, atAge: state.character.age }, ...state.events.followUps] },
      };
    }
  }
  return state;
}
