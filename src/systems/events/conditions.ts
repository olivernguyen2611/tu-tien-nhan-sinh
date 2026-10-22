// Does a life meet an event's (or a choice's) conditions? Pure, no RNG.
import { lifeStage, schoolOf, tradeOf } from '../schooling';
import { examBlocked, examOf, levelIndex } from '../exams';
import { jobDef, jobOf } from '../jobs';
import { debtTotal, ownedOf } from '../assets';
import type { Content } from '../../core/content';
import type { GameEvent } from '../../core/schemas';
import type { GameState } from '../../core/types';
import { sectEligibility } from '../sect';
import { fittingTechniques } from '../technique';
import { actor, isMasked } from '../npcs';
import { romanceMeets } from '../romance';
import { currentRegion } from '../regions';
import { chosenMeets } from '../chosen';
import { goldenFingerMeets } from '../goldenFinger';
import { pastSectMeets } from '../pastSect';
import { hasUsableInnateRoot } from '../cultivation';
import { bornKnowing } from '../knowledge';

export type Conditions = Partial<GameEvent['conditions']>;

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
    case 'reputation.chinh': case 'reputation.ma': case 'reputation.tan_tu': case 'reputation.yeu': case 'reputation.trieu_dinh': case 'reputation.giang_ho':
      return state.social.reputation[key.slice(11) as keyof GameState['social']['reputation']];
    default: return 0;
  }
}

export function meets(state: GameState, c: Conditions | undefined, content?: Content): boolean {
  if (!c) return true;
  const age = state.character.age;
  if (c.age?.min !== undefined && age < c.age.min) return false;
  if (c.age?.max !== undefined && age > c.age.max) return false;
  if (c.realm && !realmInRange(state, c.realm, content)) return false;
  // Task 4.8: in one of these đại vực.
  if (c.region && c.region.length > 0 && (!content || !c.region.includes(currentRegion(state, content)?.id ?? ''))) return false;
  if (c.anyOf && !c.anyOf.some((sub) => meets(state, sub, content))) return false;
  if (c.stage?.min !== undefined && state.cult.stage < c.stage.min) return false;
  // 9.1: tầng and lối sống.
  if (c.tier?.length || c.minTier || c.maxTier) {
    const order = content?.world.tiers.map((t) => t.id) ?? [];
    const at = order.indexOf(state.tier ?? order[0] ?? '');
    if (c.tier?.length && !c.tier.includes(state.tier ?? order[0] ?? '')) return false;
    if (c.minTier && at < order.indexOf(c.minTier)) return false;
    if (c.maxTier && order.indexOf(c.maxTier) >= 0 && at > order.indexOf(c.maxTier)) return false;
  }
  if (c.lifestyle?.length && !c.lifestyle.some((l) => state.lifestyles?.[l]?.active)) return false;
  if (c.stage?.max !== undefined && state.cult.stage > c.stage.max) return false;
  if (c.career) {
    const k = c.career;
    if (k.member !== undefined && !!state.career.id !== k.member) return false;
    if (k.id !== undefined && state.career.id !== k.id) return false;
    if (k.minRung !== undefined && (!state.career.id || state.career.rung < k.minRung)) return false;
    if (k.maxRung !== undefined && (!state.career.id || state.career.rung > k.maxRung)) return false;
  }
  if (c.peakFails && (state.cult.fails[`${state.cult.realm}:peak`] ?? 0) < c.peakFails.min) return false;
  if (c.techniqueWall && (state.cult.wallSince === null || state.character.age - state.cult.wallSince < c.techniqueWall.minYears
    || (content && fittingTechniques(state, content).length === 0))) return false;
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
      // 9.R4a: usable false also holds for an untested life born without a usable root.
      const rootless = root ? !usable : !!content && !hasUsableInnateRoot(state, content);
      if (c.root.usable ? !usable : !rootless) return false;
    }
    if (c.root.minElements !== undefined && (root?.elements.length ?? 0) < c.root.minElements) return false;
    if (c.root.innate !== undefined && (!content || root || hasUsableInnateRoot(state, content) !== c.root.innate)) return false;
  }
  // 9.R5b: doors open on what the life was born knowing (past lives), see knowledge.ts bornKnowing.
  if (c.knowledge?.all?.some((k) => !bornKnowing(state).includes(k))) return false;
  if (c.knowledge?.none?.some((k) => bornKnowing(state).includes(k))) return false;
  if (c.worldEvent) {
    const a = state.world?.active;
    if (!a || !c.worldEvent.id.includes(a.id) || (c.worldEvent.phase !== undefined && c.worldEvent.phase !== a.phase)) return false;
  }
  // 9.5 Thời cuộc.
  if (c.worldPhase?.length && !c.worldPhase.includes(state.times?.phase ?? '')) return false;
  if (c.worldVars?.some((w) => {
    const v = state.times?.vars[w.id];
    return v === undefined || (w.gte !== undefined && v < w.gte) || (w.lte !== undefined && v > w.lte);
  })) return false;
  // 10.1 Học đường, học nghề.
  if (c.lifeStage?.length && content && !c.lifeStage.includes(lifeStage(content, state.character.age)?.id ?? '')) return false;
  if (c.school) {
    const sc = schoolOf(state);
    if (c.school.enrolled !== undefined && c.school.enrolled !== !!sc.at) return false;
    if (c.school.at !== undefined && sc.at !== c.school.at) return false;
    if (c.school.ever !== undefined && c.school.ever !== sc.ever) return false;
    if (c.school.gradeMin !== undefined && sc.grade < c.school.gradeMin) return false;
    if (c.school.gradeMax !== undefined && sc.grade > c.school.gradeMax) return false;
  }
  if (c.trade) {
    const t = tradeOf(state);
    if (c.trade.any !== undefined && c.trade.any !== !!t.id) return false;
    if (c.trade.id !== undefined && t.id !== c.trade.id) return false;
    if (c.trade.learning !== undefined && c.trade.learning !== t.learning) return false;
    if (c.trade.levelMin !== undefined && (!t.id || t.level < c.trade.levelMin)) return false;
  }
  if (c.gender !== undefined && state.character.gender !== c.gender) return false;
  if (c.job) {
    const j = jobOf(state);
    const def = content ? jobDef(content, j.id) : undefined;
    if (c.job.any !== undefined && c.job.any !== !!j.id) return false;
    if (c.job.id !== undefined && j.id !== c.job.id) return false;
    if (c.job.group !== undefined && def?.group !== c.job.group) return false;
    if (c.job.rungMin !== undefined && (!j.id || j.rung < c.job.rungMin)) return false;
    if (c.job.perfMin !== undefined && (!j.id || j.perf < c.job.perfMin)) return false;
    if (c.job.perfMax !== undefined && (!j.id || j.perf > c.job.perfMax)) return false;
    if (c.job.top !== undefined && (!def || (j.rung >= def.rungs.length - 1) !== c.job.top)) return false;
  }
  if (c.asset && content) {
    const owned = ownedOf(state, content, c.asset.kind, c.asset.id).length;
    if (c.asset.none ? owned > 0 : owned < (c.asset.count ?? 1)) return false;
  }
  if (c.debt) {
    const owed = debtTotal(state);
    if (c.debt.any !== undefined && (owed > 0) !== c.debt.any) return false;
    if (c.debt.min !== undefined && owed < c.debt.min) return false;
  }
  if (c.exam && content) {
    const ex = examOf(state);
    if (c.exam.passed !== undefined && ex.rank < levelIndex(content, c.exam.passed)) return false;
    if (c.exam.notPassed !== undefined && ex.rank >= levelIndex(content, c.exam.notPassed)) return false;
    if (c.exam.failsMin !== undefined && ex.fails < c.exam.failsMin) return false;
    if (c.exam.canSit !== undefined && (examBlocked(state, content) === null) !== c.exam.canSit) return false;
    if (c.exam.placing?.length && !c.exam.placing.includes(ex.placing ?? '')) return false;
  }
  if (c.flagsAll?.some((f) => !state.flags[f])) return false;
  if (c.itemsAll?.some((i) => !(state.inventory[i] > 0))) return false;
  if (c.flagsNone?.some((f) => state.flags[f])) return false;
  if (c.traitsAny?.length && !c.traitsAny.some((t) => state.traits.includes(t))) return false;
  if (c.traitsAll?.some((t) => !state.traits.includes(t))) return false;
  if (c.traitsNone?.some((t) => state.traits.includes(t))) return false;
  if (c.goldenFinger && !goldenFingerMeets(state, c.goldenFinger)) return false;
  if (c.pastSect && !pastSectMeets(state, c.pastSect)) return false;
  if (c.npc && !npcMeets(state, c.npc, content)) return false;
  if (c.romance && (!content || !romanceMeets(state, c.romance, content))) return false;
  if (c.chosen && !chosenMeets(state, c.chosen)) return false;
  if (c.ownSect) {
    const own = state.ownSect;
    if (c.ownSect.has !== undefined && !!own !== c.ownSect.has) return false;
    if ((c.ownSect.minMembers !== undefined || c.ownSect.maxMembers !== undefined || c.ownSect.building) && !own) return false;
    if (own && c.ownSect.minMembers !== undefined && own.members < c.ownSect.minMembers) return false;
    if (own && c.ownSect.maxMembers !== undefined && own.members > c.ownSect.maxMembers) return false;
    if (own && c.ownSect.building && (own.buildings[c.ownSect.building.id] ?? 0) < c.ownSect.building.min) return false;
  }
  if (c.family) {
    if (c.family.deadAny !== undefined && state.family.some((r) => !r.alive) !== c.family.deadAny) return false;
    if (c.family.parentAlive !== undefined && state.family.some((r) => r.alive && (r.role === 'father' || r.role === 'mother')) !== c.family.parentAlive) return false;
    const ca = c.family.childAge;
    if (ca && !state.family.some((r) => r.alive && r.role === 'child' && (ca.min === undefined || r.age >= ca.min) && (ca.max === undefined || r.age <= ca.max))) return false;
    if (c.family.siblingAlive !== undefined && state.family.some((r) => r.alive && r.role === 'sibling') !== c.family.siblingAlive) return false;
  }
  if (c.lifespan) {
    const left = state.cult.lifespan - state.character.age;
    if (c.lifespan.maxLeft !== undefined && left > c.lifespan.maxLeft) return false;
    if (c.lifespan.nearEnd !== undefined && content && (left <= state.cult.lifespan * content.balance.lifespan.pressureLeftPct) !== c.lifespan.nearEnd) return false;
  }
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
  if (c.minAffinity !== undefined && n.affinity < c.minAffinity) return false;
  if (c.maxAffinity !== undefined && n.affinity > c.maxAffinity) return false;
  if (c.heir !== undefined && !!n.heirOf !== c.heir) return false;
  if (c.pastLife && (!n.pastLife || !c.pastLife.includes(n.pastLife.kind))) return false;
  if (c.natureKnown !== undefined && n.natureKnown !== c.natureKnown) return false;
  // 9.6: kind of relation, what they do now, kỷ niệm shared.
  if (c.kinds?.length && !c.kinds.includes(n.kind ?? '')) return false;
  if (c.occupation?.length && !c.occupation.includes(n.occupation ?? '')) return false;
  if (c.minMemories !== undefined && (n.memories?.length ?? 0) < c.minMemories) return false;
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
