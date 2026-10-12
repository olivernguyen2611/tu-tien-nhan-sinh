// Cultivation (GĐ 2). Task 2.2: the spirit-root test and how a root is shown.
// Task 2.3: yearly cultivation (PLAN.md G.1), Luyện Khí stages (G.2).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine, SpiritRoot } from '../core/types';
import { extremeHookSum } from './extremes';
import { checkDeath } from './time';
import { difficultyHookSum } from './difficulty';
import { careerHooks } from './career';
import { currentTechnique, learnTechnique, techniqueCapReason, techniqueMul } from './technique';
import { sectHooks } from './sect';
import { offerFate } from './fate';
import { breakthroughItem, carriedHooks, removeItems } from './items';
import { pathSpeedBonus } from './paths';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** One roll: grade by weight, then its elements (or a special body). */
function rollOnce(rng: Rng, content: Content): SpiritRoot {
  const cfg = content.balance.roots;
  const { grades, elements, bodies } = content.cultivation.roots;
  const grade = rng.weighted(grades, (g) => cfg.gradeWeights[g.id] ?? 0);
  const count = cfg.elementCount[grade.id] ?? 0;
  if (grade.special === 'body') return { grade: grade.id, elements: [], body: rng.weighted(bodies, (b) => cfg.bodyWeights[b.id] ?? 0).id };
  const kind = elements.filter((e) => e.variant === (grade.special === 'variant')).map((e) => e.id);
  return { grade: grade.id, elements: pickElements(rng, kind, count), body: null };
}

/** `count` distinct elements, kept in content order (Kim Mộc Thủy Hỏa Thổ). */
function pickElements(rng: Rng, from: string[], count: number): string[] {
  const pool = from.slice();
  const picked: string[] = [];
  while (picked.length < Math.min(count, from.length)) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return from.filter((e) => picked.includes(e));
}

/** Roll `rolls` times and keep the root with the highest cultivation speed. */
export function rollRoot(rng: Rng, content: Content, rolls = 1): SpiritRoot {
  const speed = (r: SpiritRoot) => content.balance.roots.gradeSpeed[r.grade] ?? 0;
  let best = rollOnce(rng, content);
  for (let i = 1; i < rolls; i++) {
    const next = rollOnce(rng, content);
    if (speed(next) > speed(best)) best = next;
  }
  return best;
}

/** Age at which this life meets the root test: from its own seed so other rolls stay unchanged. */
export function rootTestAge(seed: string, content: Content): number {
  const [lo, hi] = content.balance.roots.testAge;
  return new Rng(`${seed}:root-test`).int(lo, hi);
}

/** "Song linh căn (Kim, Hỏa)", "Cửu Dương Thể"… */
export function rootName(root: SpiritRoot, content: Content): string {
  const { grades, elements, bodies } = content.cultivation.roots;
  if (root.body) return bodies.find((b) => b.id === root.body)?.name ?? root.body;
  const grade = grades.find((g) => g.id === root.grade)?.name ?? root.grade;
  // Ngũ linh căn already says "all five".
  if (root.elements.length === 0 || root.elements.length >= 5) return grade;
  const names = root.elements.map((id) => elements.find((e) => e.id === id)?.name ?? id);
  return `${grade} (${names.join(', ')})`;
}

/** What the profile shows for the root. */
export function rootLabel(state: GameState, content: Content): string {
  return state.cult.root ? rootName(state.cult.root, content) : 'Chưa thử';
}

export function rootDescription(root: SpiritRoot, content: Content): string {
  const { grades, bodies } = content.cultivation.roots;
  if (root.body) return bodies.find((b) => b.id === root.body)?.description ?? '';
  return grades.find((g) => g.id === root.grade)?.description ?? '';
}

/**
 * Reveal the spirit root (once per life). A special body's stat and lifespan
 * hooks apply now; its other hooks are read by their systems later.
 */
export function revealRoot(state: GameState, content: Content): { state: GameState; line: LogLine | null } {
  if (state.cult.root) return { state, line: null };
  const rng = Rng.fromState(state.rng);
  const origin = content.origins.find((o) => o.id === state.character.originId);
  const rolls = origin?.cultivatorClan ? content.balance.roots.clanDescendantRolls : 1;
  const root = rollRoot(rng, content, rolls);

  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespan = state.cult.lifespan;
  const body = root.body ? content.cultivation.roots.bodies.find((b) => b.id === root.body) : undefined;
  for (const e of body?.effects ?? []) {
    if (e.add === undefined) continue;
    if (e.hook.startsWith('stat.')) {
      const k = e.hook.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    } else if (e.hook === 'lifespanPct') {
      // Never below next year, so the reveal itself does not kill.
      lifespan = Math.max(state.character.age + 1, Math.round(lifespan * (1 + e.add)));
    }
  }

  const speed = content.balance.roots.gradeSpeed[root.grade] ?? 0;
  const text = content.cultivation.roots.revealText
    .replace('{root}', rootName(root, content))
    .replace('{description}', rootDescription(root, content));
  const line: LogLine = { text, tone: speed === 0 ? 'bad' : speed >= 1.6 ? 'rare' : speed >= 1 ? 'good' : 'normal' };

  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return {
    state: { ...state, rng: rng.getState(), stats, aptitudes, cult: { ...state.cult, root, lifespan }, log },
    line,
  };
}

// ---------- Task 2.3: yearly cultivation and Luyện Khí stages ----------

type Hook = EffectHook;

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** activeFrom (age) and activeUntil (realm reached → off). */
export function hookActive(e: Hook, state: GameState, content: Content): boolean {
  if (e.activeFrom && state.character.age < e.activeFrom.age) return false;
  if (e.activeUntil && realmIndex(content, state.cult.realm) >= realmIndex(content, e.activeUntil.realm)) return false;
  if (e.activeIf?.minRootElements !== undefined && (state.cult.root?.elements.length ?? 0) < e.activeIf.minRootElements) return false;
  if (e.activeIf?.daoHeartBelow !== undefined && state.aptitudes.daoHeart >= e.activeIf.daoHeartBelow) return false;
  return true;
}

/** Hooks this life carries from traits, its special body, its career, its technique and its sect. */
export function lifeHooks(state: GameState, content: Content): Hook[] {
  const fromTraits = state.traits.flatMap((id) => content.traits.find((t) => t.id === id)?.effects ?? []);
  const body = state.cult.root?.body ? content.cultivation.roots.bodies.find((b) => b.id === state.cult.root!.body) : undefined;
  return [
    ...fromTraits, ...(body?.effects ?? []), ...careerHooks(state, content),
    ...(currentTechnique(state, content)?.effects ?? []), ...sectHooks(state, content),
    ...state.talents.flatMap((id) => content.fateTalents.find((t) => t.id === id)?.effects ?? []),
    // Đạo thống (task 3.8).
    ...(content.lineages.find((l) => l.id === state.cult.lineage)?.effects ?? []),
    // Võ đạo nhập tiên keeps the body's edge (task 3.11).
    ...(state.flags.vo_dao_nhap_tien ? content.martial.ascendEffects : []),
    ...carriedHooks(state, content),
  ];
}

/** Sum of an add-hook from traits, special body, extreme states and difficulty. `lineage.<x>.<hook>` counts for the life's lineage. */
export function hookSum(state: GameState, content: Content, hook: string): number {
  const lineageHook = state.cult.lineage ? `lineage.${state.cult.lineage}.${hook}` : null;
  let sum = extremeHookSum(state, content, hook) + difficultyHookSum(state, content, hook);
  for (const e of lifeHooks(state, content)) {
    if ((e.hook === hook || e.hook === lineageHook) && e.add !== undefined && hookActive(e, state, content)) sum += e.add;
  }
  return sum;
}

/** PLAN.md G.1: percent of the current stage's bar gained in one year. */
export function yearlyGain(state: GameState, content: Content): number {
  const root = state.cult.root;
  const realm = content.balance.realms[state.cult.realm];
  if (!realm || state.cult.realm === 'pham_nhan') return 0;
  const cfg = content.balance.cultivation;
  let rootMul = root ? content.balance.roots.gradeSpeed[root.grade] ?? 0 : 0;
  // Rootless techniques (Phật duyên) cultivate on đạo tâm instead of a root.
  if (rootMul <= 0 && currentTechnique(state, content)?.requires.rootless) {
    rootMul = Math.min(content.balance.techniques.rootlessDaoHeartMax, state.aptitudes.daoHeart / 100);
  }
  const aptitude = cfg.aptitudeBase + (state.aptitudes.physique + state.aptitudes.comprehension) / cfg.aptitudeDivisor;
  const qi = content.world.qi ?? cfg.regionQi;
  const bonus = Math.max(0, 1 + hookSum(state, content, 'cultivationSpeed') + pathSpeedBonus(state, content));
  const injured = state.cult.injuredUntil !== null && state.character.age < state.cult.injuredUntil ? cfg.minorFailure.injurySpeedMul : 1;
  const foundation = state.cult.foundation ? content.balance.majorBreakthrough.foundationSpeed[state.cult.foundation] ?? 1 : 1;
  const buffs = state.cult.buffs.filter((b) => state.character.age < b.until).reduce((m, b) => m * b.mul, 1);
  return realm.speedPct * rootMul * aptitude * qi * techniqueMul(state, content) * bonus * injured * foundation * buffs * bottleneckMul(state, content);
}

/** PLAN G.2 bình cảnh: after N failed big breakthroughs at a realm's peak, cultivation slows. */
export function inBottleneck(state: GameState, content: Content): boolean {
  return (state.cult.fails[`${state.cult.realm}:peak`] ?? 0) >= content.balance.majorBreakthrough.bottleneckFails;
}

function bottleneckMul(state: GameState, content: Content): number {
  if (!inBottleneck(state, content)) return 1;
  return Math.min(1, content.balance.majorBreakthrough.bottleneckSpeedMul + hookSum(state, content, 'bottleneckResist'));
}

/** PLAN.md G.2 in percent, for a breakthrough out of the current stage. `major` = into the next realm. */
export function breakthroughPct(state: GameState, content: Content, basePct: number, major: boolean): number {
  const b = content.balance.cultivation.breakthrough;
  // Big breakthroughs count failures at the realm's peak, stages count their own.
  const fails = state.cult.fails[major ? `${state.cult.realm}:peak` : `${state.cult.realm}:${state.cult.stage}`] ?? 0;
  const pct = basePct
    + (state.aptitudes.comprehension - 50) * b.comprehensionPerPoint
    + (state.aptitudes.daoHeart - 50) * b.daoHeartPerPoint
    + hookSum(state, content, 'breakthroughChance')
    + hookSum(state, content, major ? 'breakthroughChance.major' : 'breakthroughChance.minor')
    + (major ? state.cult.nextBonus : 0)
    + (breakthroughItem(state, content, major)?.breakthrough?.add ?? 0)
    + state.itemUse.nextBreakthrough
    - b.failPenaltyPct * fails;
  return Math.max(b.minPct, Math.min(b.maxPct, pct));
}

/** "Luyện Khí tầng 3"; a mortal is "Phàm Nhân", or "Phàm Nhân · Nhất lưu" on the martial path (task 3.11). */
export function realmLabel(state: GameState, content: Content): string {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  if (!realm) return state.cult.realm;
  if (realm.id === 'pham_nhan') {
    const martial = state.martial.stage >= 0 ? content.martial.stages[state.martial.stage]?.name : null;
    return martial ? `${realm.name} · ${martial}` : realm.name;
  }
  return `${realm.name} ${realm.stages[state.cult.stage] ?? ''}`.trim();
}

const fillRealm = (text: string, state: GameState, content: Content) => {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  return text.replaceAll('{realm}', realm?.name ?? '').replaceAll('{stage}', realm?.stages[state.cult.stage] ?? '');
};

/**
 * Step into a realm at its first stage. Lifespan grows by the gap between the
 * realms' base lifespans (plus variance), scaled by lifespan hooks; hooks that
 * stop at this realm (activeUntil) give back what they took.
 */
export function enterRealm(state: GameState, content: Content, realmId: string, rng: Rng): GameState {
  const prev = content.balance.realms[state.cult.realm];
  const next = content.balance.realms[realmId];
  const mortal = content.balance.lifespan.mortalBase;
  const prevBase = prev?.lifespan ?? mortal;
  const variance = next?.lifespanVariance ?? 0;
  const gain = Math.max(0, (next?.lifespan ?? mortal) - prevBase) + rng.int(-variance, variance);
  const moved: GameState = { ...state, cult: { ...state.cult, realm: realmId, stage: 0, progress: 0 } };

  let lifespan = state.cult.lifespan + Math.round(gain * Math.max(0, 1 + hookSum(state, content, 'lifespanPct')));
  for (const e of lifeHooks(state, content)) {
    if (e.hook === 'lifespanPct' && e.add !== undefined && e.activeUntil && hookActive(e, state, content) && !hookActive(e, moved, content)) {
      lifespan = Math.round(lifespan / Math.max(0.05, 1 + e.add));
    }
  }
  return { ...moved, cult: { ...moved.cult, lifespan: Math.max(state.character.age + 1, lifespan) } };
}

/** First steps after the root test: a root (not "none") starts at Luyện Khí 1. */
export function startCultivating(state: GameState, content: Content): { state: GameState; line: LogLine | null } {
  const root = state.cult.root;
  if (!root || state.cult.realm !== 'pham_nhan' || (content.balance.roots.gradeSpeed[root.grade] ?? 0) <= 0) return { state, line: null };
  const first = content.cultivation.realms.realms[1];
  if (!first) return { state, line: null };
  const rng = Rng.fromState(state.rng);
  const entered = enterRealm(state, content, first.id, rng);
  // The tiên sư leaves the default technique (Dẫn Khí Quyết); the start line already says so.
  let next = learnTechnique(entered, content, content.balance.techniques.default, { quiet: true })?.state ?? entered;
  // Sects come recruiting a few years later (task 2.5).
  const recruit = content.world.sectRecruitEvent;
  if (recruit) {
    const [lo, hi] = content.balance.sects.recruitAfterYears;
    next = { ...next, events: { ...next.events, followUps: [...next.events.followUps, { event: recruit, atAge: next.character.age + rng.int(lo, hi) }] } };
  }
  const line: LogLine = { text: fillRealm(content.cultivation.realms.texts.start, next, content), tone: 'good' };
  return { state: { ...next, rng: rng.getState(), log: pushLine(next.log, line) }, line };
}

function pushLine(log: GameState['log'], line: LogLine): GameState['log'] {
  const out = log.slice();
  const last = out[out.length - 1];
  if (last) out[out.length - 1] = { ...last, lines: [...last.lines, line] };
  return out;
}

/** One year of cultivation: fill the bar; a full bar tries the next stage (only inside a realm). */
export function cultivateYear(state: GameState, content: Content): GameState {
  if (!state.alive || state.cult.realm === 'pham_nhan' || (!state.cult.root && !currentTechnique(state, content))) return state;
  const texts = content.cultivation.realms.texts;
  const cfg = content.balance.cultivation.minorFailure;
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  if (!realm) return state;
  const rng = Rng.fromState(state.rng);
  let s = state;
  let log = s.log;

  if (s.cult.injuredUntil !== null && s.character.age >= s.cult.injuredUntil) {
    s = { ...s, cult: { ...s.cult, injuredUntil: null } };
    log = pushLine(log, { text: texts.injuryHealed, tone: 'good' });
  }

  if (s.cult.buffs.some((b) => s.character.age >= b.until)) {
    s = { ...s, cult: { ...s.cult, buffs: s.cult.buffs.filter((b) => s.character.age < b.until) } };
  }
  const wasFull = s.cult.progress >= 100;
  const progress = Math.min(100, s.cult.progress + yearlyGain(s, content));
  s = { ...s, cult: { ...s.cult, progress } };
  const lastStage = s.cult.stage >= realm.stages.length - 1;

  if (progress >= 100 && lastStage) {
    // Peak of the realm: waits for the big breakthrough (task 2.6). Say it once.
    if (!wasFull) log = pushLine(log, { text: fillRealm(texts.peak, s, content), tone: 'good' });
  } else if (progress >= 100) {
    const base = s.cult.realm === 'luyen_khi'
      ? content.balance.realmStages.luyenKhiLevelUpChance
      : content.balance.realmStages.minorStageChance;
    const key = `${s.cult.realm}:${s.cult.stage}`;
    const chance = breakthroughPct(s, content, base * 100, false) / 100;
    const pill = breakthroughItem(s, content, false);
    if (pill) s = removeItems(s, [pill.id]);
    s = { ...s, itemUse: { ...s.itemUse, nextBreakthrough: 0 } }; // Phá Chướng Đan is spent on this try
    if (rng.chance(chance)) {
      s = { ...s, cult: { ...s.cult, stage: s.cult.stage + 1, progress: 0 } };
      log = pushLine(log, { text: fillRealm(rng.pick(texts.stageUp), s, content), tone: 'good' });
    } else {
      const fails = { ...s.cult.fails, [key]: (s.cult.fails[key] ?? 0) + 1 };
      const kind = rng.weighted(['lose', 'injury', 'lifespan'] as const, (k) => cfg.weights[k]);
      if (kind === 'lose') {
        s = { ...s, cult: { ...s.cult, fails, progress: Math.max(0, 100 - cfg.loseProgress) } };
        log = pushLine(log, { text: texts.failLose, tone: 'bad' });
      } else if (kind === 'injury') {
        // Bar stays full: it tries again next year, harder (fail penalty).
        s = {
          ...s,
          stats: { ...s.stats, health: clamp(s.stats.health + cfg.injuryHealth) },
          cult: { ...s.cult, fails, injuredUntil: s.character.age + cfg.injuryYears },
        };
        log = pushLine(log, { text: texts.failInjury, tone: 'bad' });
      } else {
        const lifespan = Math.max(s.character.age + 1, Math.round(s.cult.lifespan * (1 - cfg.lifespanLossPct / 100)));
        s = { ...s, cult: { ...s.cult, fails, lifespan } };
        log = pushLine(log, { text: texts.failLifespan, tone: 'bad' });
      }
    }
  }
  return { ...s, rng: rng.getState(), log };
}

// ---------- Task 2.6: big breakthrough (Luyện Khí → Trúc Cơ) ----------

export interface MajorBreakthroughInfo {
  /** Realm it would break into. */
  target: { id: string; name: string };
  chancePct: number;
  /** Why it cannot be tried now, if so. */
  blocked: string | null;
}

/** The big breakthrough open to this life now, or null when there is none to show. */
export function majorBreakthroughInfo(state: GameState, content: Content): MajorBreakthroughInfo | null {
  const realms = content.cultivation.realms.realms;
  const i = realmIndex(content, state.cult.realm);
  const realm = realms[i];
  const next = realms[i + 1];
  if (!state.alive || !realm || !next || state.cult.realm === 'pham_nhan') return null;
  if (!content.balance.majorBreakthrough.openRealms.includes(next.id)) return null;
  const base = (content.balance.realms[next.id]?.breakthroughChance ?? 0) * 100;
  const info = { target: { id: next.id, name: next.name }, chancePct: breakthroughPct(state, content, base, true) };
  const atPeak = state.cult.stage >= realm.stages.length - 1 && state.cult.progress >= 100;
  if (!atPeak) return { ...info, blocked: `Cần tu tới ${realm.name} ${realm.stages[realm.stages.length - 1]}, đầy thanh tu vi.` };
  const cap = techniqueCapReason(state, content, next.id);
  if (cap) return { ...info, blocked: cap };
  if (state.cult.lastMajorAttempt === state.character.age) return { ...info, blocked: 'Năm nay đã thử rồi, đợi sang năm.' };
  return { ...info, blocked: null };
}

export interface BreakthroughResult {
  state: GameState;
  success: boolean;
  text: string;
  tone: 'good' | 'bad' | 'rare';
}

/** Foundation grade from a d100 roll shifted by comprehension and đạo tâm. */
function rollFoundation(state: GameState, content: Content, rng: Rng): string {
  const cfg = content.balance.majorBreakthrough;
  const score = rng.int(0, 99)
    + (state.aptitudes.comprehension - 50) * cfg.foundationPerPoint
    + (state.aptitudes.daoHeart - 50) * cfg.foundationPerPoint;
  const grades = content.cultivation.realms.foundations;
  let grade = grades[0].id;
  for (const g of grades) {
    const min = cfg.foundationThresholds[g.id];
    if (min !== undefined && score >= min) grade = g.id;
  }
  return grade;
}

/** The player tries the big breakthrough (PLAN G.2); one attempt a year. */
export function attemptMajorBreakthrough(state: GameState, content: Content): BreakthroughResult | null {
  const info = majorBreakthroughInfo(state, content);
  if (!info || info.blocked) return null;
  const texts = content.cultivation.realms.texts;
  const cfg = content.balance.majorBreakthrough;
  const minor = content.balance.cultivation.minorFailure;
  const rng = Rng.fromState(state.rng);
  let s: GameState = { ...state, cult: { ...state.cult, lastMajorAttempt: state.character.age, nextBonus: 0 } };
  const pill = breakthroughItem(state, content, true);
  if (pill) s = removeItems(s, [pill.id]);
  s = { ...s, itemUse: { ...s.itemUse, nextBreakthrough: 0 } };

  if (rng.chance(info.chancePct / 100)) {
    const foundation = info.target.id === 'truc_co' ? rollFoundation(s, content, rng) : null;
    s = enterRealm(s, content, info.target.id, rng);
    const perfect = foundation === 'hoan_my' ? content.balance.realmStages.perfectFoundationLifespan : 0;
    const fails = Object.fromEntries(Object.entries(s.cult.fails).filter(([k]) => !k.startsWith(`${state.cult.realm}:`)));
    s = { ...s, cult: { ...s.cult, foundation, fails, lifespan: s.cult.lifespan + perfect } };
    const grade = content.cultivation.realms.foundations.find((g) => g.id === foundation);
    const text = texts.majorSuccess
      .replaceAll('{realm}', info.target.name)
      .replaceAll('{grade}', grade ? `${grade.name}. ${grade.description}` : '');
    const tone = foundation === 'hoan_my' || foundation === 'thuong' ? 'rare' : 'good';
    // Nghịch Thiên Cải Mệnh: choose a fate talent before the next year (task 2.7).
    const done = offerFate({ ...s, rng: rng.getState(), log: pushLine(s.log, { text, tone }) }, content);
    return { state: done, success: true, text, tone };
  }

  const key = `${state.cult.realm}:peak`;
  const failCount = (s.cult.fails[key] ?? 0) + 1;
  s = { ...s, cult: { ...s.cult, fails: { ...s.cult.fails, [key]: failCount } } };
  const kind = rng.weighted(['lose', 'injury', 'lifespan', 'deviation', 'death'] as const, (k) => cfg.failureWeights[k]);
  let text: string;
  if (kind === 'lose') {
    s = { ...s, cult: { ...s.cult, progress: Math.max(0, 100 - minor.loseProgress) } };
    text = texts.failLose;
  } else if (kind === 'injury') {
    s = { ...s, stats: { ...s.stats, health: clamp(s.stats.health + minor.injuryHealth) }, cult: { ...s.cult, injuredUntil: s.character.age + minor.injuryYears } };
    text = texts.failInjury;
  } else if (kind === 'lifespan') {
    s = { ...s, cult: { ...s.cult, lifespan: Math.max(s.character.age + 1, Math.round(s.cult.lifespan * (1 - minor.lifespanLossPct / 100))) } };
    text = texts.failLifespan;
  } else if (kind === 'deviation') {
    s = {
      ...s,
      stats: { ...s.stats, health: clamp(s.stats.health + cfg.deviationHealth) },
      aptitudes: { ...s.aptitudes, daoHeart: clamp(s.aptitudes.daoHeart + cfg.deviationDaoHeart) },
      cult: { ...s.cult, progress: Math.max(0, 100 - minor.loseProgress), injuredUntil: s.character.age + minor.injuryYears },
      // Kept for the "Tẩu hỏa nhập ma" event chain in a later task.
      flags: { ...s.flags, tau_hoa_nhap_ma: true },
    };
    text = texts.majorDeviation;
  } else {
    const dead = checkDeath({ ...s, rng: rng.getState() }, content, 'breakthrough');
    const line = dead.log.at(-1)?.lines.at(-1)?.text ?? '';
    return { state: dead, success: false, text: line, tone: 'bad' };
  }
  let log = pushLine(s.log, { text, tone: 'bad' });
  if (failCount === cfg.bottleneckFails) {
    log = pushLine(log, { text: texts.bottleneck, tone: 'bad' });
    text = `${text} ${texts.bottleneck}`;
  }
  return { state: checkDeath({ ...s, rng: rng.getState(), log }, content), success: false, text, tone: 'bad' };
}

// ---------- Task 2.11: Thiên địa kỳ vật gives a rootless mortal a root ----------

/**
 * A rootless (tested) mortal takes a heaven-and-earth treasure: a Ngũ (sometimes
 * Tứ) linh căn, at a heavy cost to the body; past safeAge it can kill.
 */
export function grantRoot(state: GameState, content: Content): { state: GameState; text: string } {
  const root = state.cult.root;
  if (!state.alive || !root || (content.balance.roots.gradeSpeed[root.grade] ?? 0) > 0 || state.cult.realm !== 'pham_nhan') {
    return { state, text: '' };
  }
  const cfg = content.balance.kyVat;
  const rng = Rng.fromState(state.rng);
  const grade = rng.chance(cfg.tuChance) ? 'tu' : 'ngu';
  const basic = content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id);
  const elements = pickElements(rng, basic, content.balance.roots.elementCount[grade] ?? 0);
  const deathChance = Math.min(cfg.deathMax, Math.max(0, state.character.age - cfg.safeAge) * cfg.deathPerYear);
  const hurt: GameState = { ...state, rng: rng.getState(), stats: { ...state.stats, health: clamp(state.stats.health + cfg.healthLoss) } };
  if (rng.chance(deathChance)) {
    const dead = checkDeath({ ...hurt, rng: rng.getState() }, content, 'ordeal');
    return { state: dead, text: dead.log.at(-1)?.lines.at(-1)?.text ?? '' };
  }
  const withRoot: GameState = { ...hurt, rng: rng.getState(), cult: { ...hurt.cult, root: { grade, elements, body: null } } };
  const text = content.cultivation.roots.revealText
    .replace('{root}', rootName(withRoot.cult.root!, content))
    .replace('{description}', rootDescription(withRoot.cult.root!, content));
  const revealed = { ...withRoot, log: pushLine(withRoot.log, { text, tone: 'rare' as const }) };
  const started = startCultivating(revealed, content);
  return { state: started.state, text: [text, started.line?.text].filter(Boolean).join(' ') };
}

// ---------- Task 2.8: event effects on cultivation ----------

/** Add (or take) % of the current bar; a full bar at a realm's peak stays capped at 100. */
export function addProgress(state: GameState, pct: number): GameState {
  if (state.cult.realm === 'pham_nhan' || pct === 0) return state;
  return { ...state, cult: { ...state.cult, progress: Math.max(0, Math.min(100, state.cult.progress + pct)) } };
}

export function addSpeedBuff(state: GameState, mul: number, years: number): GameState {
  return { ...state, cult: { ...state.cult, buffs: [...state.cult.buffs, { mul, until: state.character.age + years }] } };
}

export function reducePeakFails(state: GameState, n: number): GameState {
  const key = `${state.cult.realm}:peak`;
  const now = state.cult.fails[key] ?? 0;
  if (now === 0) return state;
  return { ...state, cult: { ...state.cult, fails: { ...state.cult.fails, [key]: Math.max(0, now - n) } } };
}

/** A mortal who took up a rootless technique (Phật duyên) steps into the first realm. */
export function enterFirstRealm(state: GameState, content: Content): GameState {
  const first = content.cultivation.realms.realms[1];
  if (state.cult.realm !== 'pham_nhan' || !first || !currentTechnique(state, content)) return state;
  const rng = Rng.fromState(state.rng);
  const next = enterRealm(state, content, first.id, rng);
  return { ...next, rng: rng.getState() };
}
