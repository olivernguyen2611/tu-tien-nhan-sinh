// Does a life meet an event's (or a choice's) conditions? Pure, no RNG.
import type { Content } from '../../core/content';
import type { GameEvent } from '../../core/schemas';
import type { GameState } from '../../core/types';

type Conditions = Partial<GameEvent['conditions']>;

/** Numeric value an event can read: stat.<name>, silver, spiritStones, karma, age. */
export function readValue(state: GameState, key: string): number {
  if (key.startsWith('stat.')) {
    const k = key.slice(5);
    if (k in state.stats) return state.stats[k as keyof GameState['stats']];
    if (k in state.aptitudes) return state.aptitudes[k as keyof GameState['aptitudes']];
    return 0;
  }
  switch (key) {
    case 'silver': return state.money.silver;
    case 'spiritStones': return state.money.spiritStones;
    case 'karma': return state.social.karma;
    case 'age': return state.character.age;
    default: return 0;
  }
}

export function meets(state: GameState, c: Conditions | undefined, content?: Content): boolean {
  if (!c) return true;
  const age = state.character.age;
  if (c.age?.min !== undefined && age < c.age.min) return false;
  if (c.age?.max !== undefined && age > c.age.max) return false;
  // Realms and regions arrive in GĐ 2/3; until then everyone is a mortal with no region.
  if (c.realm?.min && c.realm.min !== 'pham_nhan') return false;
  if (c.region && c.region.length > 0) return false;
  if (c.flagsAll?.some((f) => !state.flags[f])) return false;
  if (c.flagsNone?.some((f) => state.flags[f])) return false;
  if (c.traitsAny?.length && !c.traitsAny.some((t) => state.traits.includes(t))) return false;
  if (c.traitsAll?.some((t) => !state.traits.includes(t))) return false;
  if (c.traitsNone?.some((t) => state.traits.includes(t))) return false;
  if (c.goldenFinger) return false;
  for (const s of c.stats ?? []) {
    const v = readValue(state, s.stat);
    if (s.gte !== undefined && v < s.gte) return false;
    if (s.lte !== undefined && v > s.lte) return false;
  }
  void content;
  return true;
}
