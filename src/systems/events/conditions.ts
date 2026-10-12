// Does a life meet an event's (or a choice's) conditions? Pure, no RNG.
import type { Content } from '../../core/content';
import type { GameEvent } from '../../core/schemas';
import type { GameState } from '../../core/types';
import { sectEligibility } from '../sect';
import { actor, isMasked } from '../npcs';

type Conditions = Partial<GameEvent['conditions']>;

/** Numeric value an event can read: stat.<name>, silver, spiritStones, karma, age. */
export function readValue(state: GameState, key: string): number {
  if (key.startsWith('stat.')) {
    const k = key.slice(5);
    if (k in state.stats) return state.stats[k as keyof GameState['stats']];
    if (k in state.aptitudes) return state.aptitudes[k as keyof GameState['aptitudes']];
    return 0;
  }
  if (key.startsWith('craft.')) return state.crafts.skills[key.slice(6)]?.level ?? 0;
  switch (key) {
    case 'sect.contribution': return state.sect.id ? state.sect.contribution : 0;
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
  if (c.anyOf && !c.anyOf.some((sub) => meets(state, sub, content))) return false;
  if (c.stage?.min !== undefined && state.cult.stage < c.stage.min) return false;
  if (c.stage?.max !== undefined && state.cult.stage > c.stage.max) return false;
  if (c.career) {
    const k = c.career;
    if (k.member !== undefined && !!state.career.id !== k.member) return false;
    if (k.id !== undefined && state.career.id !== k.id) return false;
    if (k.minRung !== undefined && (!state.career.id || state.career.rung < k.minRung)) return false;
    if (k.maxRung !== undefined && (!state.career.id || state.career.rung > k.maxRung)) return false;
  }
  if (c.peakFails && (state.cult.fails[`${state.cult.realm}:peak`] ?? 0) < c.peakFails.min) return false;
  if (c.martial?.min !== undefined && state.martial.stage < c.martial.min) return false;
  if (c.martial?.max !== undefined && state.martial.stage > c.martial.max) return false;
  if (c.martial?.ready !== undefined && content) {
    const step = content.balance.martial.steps[state.martial.stage + 1];
    if ((!!step && state.martial.years >= step.years) !== c.martial.ready) return false;
  }
  if (c.origins?.length && !c.origins.includes(state.character.originId)) return false;
  if (c.talentsAny?.length && !c.talentsAny.some((t) => state.talents.includes(t))) return false;
  if (c.sect && content) {
    const s = c.sect;
    if (s.notId !== undefined && state.sect.id === s.notId) return false;
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
  if (c.npc && !npcMeets(state, c.npc, content)) return false;
  for (const s of c.stats ?? []) {
    const v = readValue(state, s.stat);
    if (s.gte !== undefined && v < s.gte) return false;
    if (s.lte !== undefined && v > s.lte) return false;
  }
  return true;
}

/** Task 3.4: conditions on the event's NPC. */
function npcMeets(state: GameState, c: NonNullable<Conditions['npc']>, content?: Content): boolean {
  const n = actor(state);
  const here = !!n && n.alive;
  if (c.present !== undefined) return here === c.present && (!here || npcMeets(state, { ...c, present: undefined }, content));
  if (!n || !here) return false;
  if (c.minGrudge !== undefined && n.grudge < c.minGrudge) return false;
  if (c.minFavor !== undefined && n.favor < c.minFavor) return false;
  if (c.heir !== undefined && !!n.heirOf !== c.heir) return false;
  if (c.natureKnown !== undefined && n.natureKnown !== c.natureKnown) return false;
  if (c.masked !== undefined && (!content || isMasked(content, n) !== c.masked)) return false;
  if (c.minRealmGap !== undefined || c.maxRealmGap !== undefined) {
    const order = content?.cultivation.realms.realms.map((r) => r.id) ?? ['pham_nhan'];
    const gap = order.indexOf(n.realm) - order.indexOf(state.cult.realm);
    if (c.minRealmGap !== undefined && gap < c.minRealmGap) return false;
    if (c.maxRealmGap !== undefined && gap > c.maxRealmGap) return false;
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
