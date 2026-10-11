// Does a life meet an event's (or a choice's) conditions? Pure, no RNG.
import type { Content } from '../../core/content';
import type { GameEvent } from '../../core/schemas';
import type { GameState } from '../../core/types';
import { sectEligibility } from '../sect';

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
  if (c.realm && !realmInRange(state, c.realm, content)) return false;
  // Regions arrive in GĐ 3; until then nobody is in one.
  if (c.region && c.region.length > 0) return false;
  if (c.sect && content) {
    const s = c.sect;
    if (s.member !== undefined && !!state.sect.id !== s.member) return false;
    if (s.id !== undefined && state.sect.id !== s.id) return false;
    if (s.minRank !== undefined && (!state.sect.id || state.sect.rank < s.minRank)) return false;
    if (s.maxRank !== undefined && (!state.sect.id || state.sect.rank > s.maxRank)) return false;
    if (s.eligible !== undefined && sectEligibility(state, content, s.eligible)) return false;
  }
  if (c.root) {
    const root = state.cult.root;
    if (c.root.tested !== undefined && !!root !== c.root.tested) return false;
    if (c.root.usable !== undefined) {
      const usable = !!root && (content?.balance.roots.gradeSpeed[root.grade] ?? 0) > 0;
      if (!root || usable !== c.root.usable) return false;
    }
  }
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
  return true;
}

/** realm.min / realm.max by the order in realms.json. Without content only Phàm Nhân is known. */
function realmInRange(state: GameState, realm: NonNullable<Conditions['realm']>, content?: Content): boolean {
  const order = content?.cultivation.realms.realms.map((r) => r.id) ?? ['pham_nhan'];
  const at = order.indexOf(state.cult.realm);
  if (realm.min && at < order.indexOf(realm.min)) return false;
  if (realm.max && order.indexOf(realm.max) >= 0 && at > order.indexOf(realm.max)) return false;
  return true;
}
