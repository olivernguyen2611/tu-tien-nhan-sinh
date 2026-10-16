// Cultivation (GĐ 2). Task 2.2: the spirit-root test and how a root is shown.
// Task 2.3: yearly cultivation (PLAN.md G.1), Luyện Khí stages (G.2).
import { specialHooks } from './specialOrigin';
import { systemHooks } from './heThong';
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine, SpiritRoot } from '../core/types';
import { extremeHasHook, extremeHookSum } from './extremes';
import { checkDeath } from './time';
import { difficultyHookSum } from './difficulty';
import { careerHooks } from './career';
import { currentRegion, regionQi } from './regions';
import { currentTechnique, learnTechnique, techniqueCapReason, techniqueMul, techniqueWall } from './technique';
import { sectHooks } from './sect';
import { ownSectHooks } from './ownSect';
import { chosenHooks } from './chosen';
import { rebirthTalentHooks } from './rebirthTalents';
import { goldenFingerHooks } from './goldenFinger';
import { comboHooks } from './destiny';
import { offerFate } from './fate';
import { breakthroughItem, carriedHooks, removeItems } from './items';
import { pathSpeedBonus } from './paths';
import { startCoreForming } from './goldenCore';
import { soulFormFor } from './nascentSoul';
import { needsHeartDemonTrial, startHeartDemonTrial } from './heartDemon';
import { tribulationPreview, undergoTribulation, type TribulationPreview } from './tribulation';
import { blessingHooks } from './blessings';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** A root test result: the root, plus a special body found at the same test (separate from the root, it only adds effects). */
export interface RootRoll { root: SpiritRoot; bodyId: string | null }

/** One roll: grade by weight, then its elements. `floor`: no grade slower than this one. */
function rollOnce(rng: Rng, content: Content, floor: string | null = null): SpiritRoot {
  const cfg = content.balance.roots;
  const { grades, elements } = content.cultivation.roots;
  const min = floor ? cfg.gradeSpeed[floor] ?? 0 : 0;
  const grade = rng.weighted(grades, (g) => ((cfg.gradeSpeed[g.id] ?? 0) >= min ? cfg.gradeWeights[g.id] ?? 0 : 0));
  const count = cfg.elementCount[grade.id] ?? 0;
  // A variant root draws only variant elements: it never mixes with ordinary ones.
  const kind = elements.filter((e) => e.variant === (grade.special === 'variant')).map((e) => e.id);
  return { grade: grade.id, elements: pickElements(rng, kind, count) };
}

/** A special body is found (or not) apart from the root. */
export function rollBody(rng: Rng, content: Content): string | null {
  const cfg = content.balance.roots;
  if (!rng.chance(cfg.bodyChance)) return null;
  return rng.weighted(content.cultivation.roots.bodies, (b) => cfg.bodyWeights[b.id] ?? 0).id;
}

/** `count` distinct elements, kept in content order (Kim Mộc Thủy Hỏa Thổ). */
function pickElements(rng: Rng, from: string[], count: number): string[] {
  const pool = from.slice();
  const picked: string[] = [];
  while (picked.length < Math.min(count, from.length)) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return from.filter((e) => picked.includes(e));
}

/** Roll `rolls` times and keep the root with the highest cultivation speed. */
export function rollRoot(rng: Rng, content: Content, rolls = 1, floor: string | null = null): RootRoll {
  const speed = (r: SpiritRoot) => content.balance.roots.gradeSpeed[r.grade] ?? 0;
  let best = rollOnce(rng, content, floor);
  for (let i = 1; i < rolls; i++) {
    const next = rollOnce(rng, content, floor);
    if (speed(next) > speed(best)) best = next;
  }
  return { root: best, bodyId: rollBody(rng, content) };
}

/**
 * Playtest 2026-10-12: the strongest Tiên Thiên Khí Vận that helps cultivation, and the weakest
 * root it allows (balance.roots.traitFloor by rarity); null when no trait helps cultivation.
 */
export function traitRootFloor(state: GameState, content: Content): { trait: string; grade: string } | null {
  const cfg = content.balance.roots;
  let best: { trait: string; grade: string } | null = null;
  for (const id of state.traits) {
    const grade = traitRootGrade(content, id);
    if (grade && (!best || (cfg.gradeSpeed[grade] ?? 0) > (cfg.gradeSpeed[best.grade] ?? 0))) {
      best = { trait: content.traits.find((x) => x.id === id)!.name, grade };
    }
  }
  return best;
}

/** The weakest root one trait allows, or null when it does not help cultivation. */
export function traitRootGrade(content: Content, traitId: string): string | null {
  const cfg = content.balance.roots;
  const t = content.traits.find((x) => x.id === traitId);
  const helps = t?.effects.some((e) => (e.add ?? 0) > 0 && cfg.cultivationHooks.some((p) => e.hook.startsWith(p)));
  return (helps && cfg.traitFloor[t!.rarity]) || null;
}

/** "Bảo đảm linh căn: Tam linh căn trở lên" for the trait card, or null. */
export function traitRootNote(content: Content, traitId: string): string | null {
  const grade = traitRootGrade(content, traitId);
  if (!grade) return null;
  const name = content.cultivation.roots.grades.find((g) => g.id === grade)?.name ?? grade;
  return `Bảo đảm có linh căn, ít nhất ${name}`;
}

/** Age at which this life meets the root test: from its own seed so other rolls stay unchanged. */
export function rootTestAge(seed: string, content: Content): number {
  const [lo, hi] = content.balance.roots.testAge;
  return new Rng(`${seed}:root-test`).int(lo, hi);
}

/** "Song linh căn (Kim, Hỏa)"… (a special body stands in for the root: see `rootNameOf`). */
export function rootName(root: SpiritRoot, content: Content): string {
  const { grades, elements } = content.cultivation.roots;
  const grade = grades.find((g) => g.id === root.grade)?.name ?? root.grade;
  // Ngũ linh căn already says "all five".
  if (root.elements.length === 0 || root.elements.length >= 5) return grade;
  const name = (id: string) => elements.find((e) => e.id === id)?.name ?? id;
  // A variant shows what it is fused from: "Biến dị linh căn (Lôi: Kim + Hỏa)".
  const names = root.elements.map((id) => {
    const parts = elements.find((e) => e.id === id)?.components;
    return parts?.length ? `${name(id)}: ${parts.map(name).join(' + ')}` : name(id);
  });
  return `${grade} (${names.join(', ')})`;
}

/** The root can cultivate (any grade with speed > 0). */
export function rootUsable(state: GameState, content: Content): boolean {
  return !!state.cult.root && (content.balance.roots.gradeSpeed[state.cult.root.grade] ?? 0) > 0;
}

/** Name of a special body ("Cửu Dương Thể"). */
export function bodyName(bodyId: string, content: Content): string {
  return content.cultivation.roots.bodies.find((b) => b.id === bodyId)?.name ?? bodyId;
}

/** The root line of a person: the root's name, with the special body after it when there is one. */
export function rootNameOf(root: SpiritRoot, bodyId: string | null | undefined, content: Content): string {
  return bodyId ? `${rootName(root, content)}, thể chất ${bodyName(bodyId, content)}` : rootName(root, content);
}

/** What the profile shows for the root (a special body is its own line, see `bodyLabel`). */
export function rootLabel(state: GameState, content: Content): string {
  return state.cult.root ? rootName(state.cult.root, content) : 'Chưa thử';
}

/** What the profile shows for the body (thể chất): the special body, else an ordinary one once tested. */
export function bodyLabel(state: GameState, content: Content): string {
  if (state.cult.bodyId) return bodyName(state.cult.bodyId, content);
  return state.cult.root ? content.cultivation.roots.plainBody : 'Chưa rõ';
}

export function rootDescription(root: SpiritRoot, content: Content): string {
  return content.cultivation.roots.grades.find((g) => g.id === root.grade)?.description ?? '';
}

/** A special body's one-time stat and lifespan gains (its other hooks are read by their systems later). */
function bodyGains(state: GameState, content: Content, bodyId: string | null) {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespan = state.cult.lifespan;
  const body = bodyId ? content.cultivation.roots.bodies.find((b) => b.id === bodyId) : undefined;
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
  return { stats, aptitudes, lifespan };
}

/**
 * Thức tỉnh thể chất: a latent body wakes in someone who already has a usable root (never in a
 * rootless mortal: roots stay innate). The body only adds its effects; the root is untouched.
 */
export function awakenBody(state: GameState, content: Content, bodyId: string): { state: GameState; text: string } {
  const root = state.cult.root;
  const body = content.cultivation.roots.bodies.find((b) => b.id === bodyId);
  if (!state.alive || !body || !root || state.cult.bodyId || (content.balance.roots.gradeSpeed[root.grade] ?? 0) <= 0) return { state, text: '' };
  const gains = bodyGains(state, content, bodyId);
  const text = content.cultivation.roots.awakenText.replace('{body}', body.name).replace('{description}', body.description);
  const next: GameState = { ...state, ...gains, cult: { ...state.cult, bodyId, lifespan: gains.lifespan }, log: pushLine(state.log, { text, tone: 'rare' }) };
  return { state: next, text };
}

/**
 * 9.R4a linh căn ẩn: the root a life is born with, fixed by its seed and destiny (its own RNG stream),
 * whether or not anyone ever tests it. revealRoot shows it; hint events read it before that.
 */
export function innateRoot(state: GameState, content: Content): RootRoll {
  const rng = new Rng(`${state.seed}:root`);
  const origin = content.origins.find((o) => o.id === state.character.originId);
  // Phúc báo Đại thiện nhân (task 5b.8): rootReroll adds rolls, best kept.
  const rolls = (origin?.cultivatorClan ? content.balance.roots.clanDescendantRolls : 1) + Math.max(0, Math.round(hookSum(state, content, 'rootReroll')));
  return rollRoot(rng, content, rolls, traitRootFloor(state, content)?.grade ?? null);
}

/** 9.R4a: the innate root's name, for developer mode (null once tested: the real root shows instead). */
export function innateRootLabel(state: GameState, content: Content): string | null {
  if (state.cult.root) return null;
  const { root, bodyId } = innateRoot(state, content);
  return rootNameOf(root, bodyId, content);
}

/** 9.R4a: does the untested innate root let this life cultivate? */
export function hasUsableInnateRoot(state: GameState, content: Content): boolean {
  if (state.cult.root) return false;
  return (content.balance.roots.gradeSpeed[innateRoot(state, content).root.grade] ?? 0) > 0;
}

/**
 * Reveal the spirit root (once per life). A special body's stat and lifespan
 * hooks apply now; its other hooks are read by their systems later.
 */
export function revealRoot(state: GameState, content: Content): { state: GameState; line: LogLine | null } {
  if (state.cult.root) return { state, line: null };
  const floor = traitRootFloor(state, content);
  const { root, bodyId } = innateRoot(state, content);

  const { stats, aptitudes, lifespan } = bodyGains(state, content, bodyId);

  const speed = content.balance.roots.gradeSpeed[root.grade] ?? 0;
  const bodyText = bodyId
    ? ` ${content.cultivation.roots.revealBodyText.replace('{body}', bodyName(bodyId, content)).replace('{description}', content.cultivation.roots.bodies.find((b) => b.id === bodyId)?.description ?? '')}`
    : '';
  const text = content.cultivation.roots.revealText.replace('{root}', rootName(root, content)).replace('{description}', rootDescription(root, content)) + bodyText;
  const intro = floor ? `${content.cultivation.roots.traitGuaranteeText.replace('{trait}', floor.trait)} ` : '';
  const line: LogLine = { text: intro + text, tone: speed === 0 ? 'bad' : speed >= 1.6 ? 'rare' : speed >= 1 ? 'good' : 'normal' };

  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return {
    state: { ...state, stats, aptitudes, cult: { ...state.cult, root, bodyId, lifespan }, log },
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
  const body = state.cult.bodyId ? content.cultivation.roots.bodies.find((b) => b.id === state.cult.bodyId) : undefined;
  // The root grade can carry hooks too (Ngũ khí).
  const grade = state.cult.root ? content.cultivation.roots.grades.find((g) => g.id === state.cult.root!.grade) : undefined;
  return [
    ...fromTraits, ...(body?.effects ?? []), ...(grade?.effects ?? []), ...careerHooks(state, content),
    ...(currentTechnique(state, content)?.effects ?? []), ...sectHooks(state, content), ...ownSectHooks(state, content),
    ...state.talents.flatMap((id) => content.fateTalents.find((t) => t.id === id)?.effects ?? []),
    // Đạo thống (task 3.8).
    ...(content.lineages.find((l) => l.id === state.cult.lineage)?.effects ?? []),
    // Võ đạo nhập tiên keeps the body's edge (task 3.11).
    ...(state.flags.vo_dao_nhap_tien ? content.martial.ascendEffects : []),
    // Dưỡng Nguyên Vận Thể Công, the manual a rootless Hóa cảnh martial artist cultivates instead.
    ...(state.martial.manual && state.cult.realm === 'pham_nhan' ? [{ hook: 'combatPower', add: content.martial.manual.power }] : []),
    ...carriedHooks(state, content),
    // Đan văn of the golden core (task 4.2).
    ...(content.corePatterns.find((p) => p.id === state.cult.corePattern)?.effects ?? []),
    // Hình thái Nguyên Anh (task 4.3).
    ...(content.nascentSouls.forms.find((f) => f.id === state.cult.soulForm)?.effects ?? []),
    // Đại vực (task 4.8).
    ...(currentRegion(state, content)?.effects ?? []),
    // The master's role towards a khí vận chi tử (task 5.6).
    ...chosenHooks(state, content),
    // Phúc báo from the last life (task 5b.8).
    ...blessingHooks(state, content),
    // Thiên phú luân hồi (task 5b.1).
    ...rebirthTalentHooks(state, content),
    // Kim Thủ Chỉ (task 5b.2).
    ...goldenFingerHooks(state, content),
    // Tổ hợp ẩn (task 5b.3).
    ...comboHooks(state, content),
    // Tình tiết đặc biệt hiếm (9.S1).
    ...specialHooks(state, content),
    ...systemHooks(state, content),
  ];
}

/**
 * Hooks that change the character once, when gained from something that forms mid-life (đan văn,
 * Nguyên Anh): stat.<x> is added to the stat, lifespanPct to the current lifespan. Others act through lifeHooks.
 */
export function applyGainHooks(state: GameState, effects: EffectHook[]): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespan = state.cult.lifespan;
  for (const e of effects) {
    if (e.add === undefined) continue;
    if (e.hook.startsWith('stat.')) {
      const k = e.hook.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    } else if (e.hook === 'lifespanPct') {
      lifespan = Math.max(state.character.age + 1, Math.round(lifespan * (1 + e.add)));
    }
  }
  return { ...state, stats, aptitudes, cult: { ...state.cult, lifespan } };
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

/** A flag hook (no number: agingSlow, ignoreElementWeakness…) this life carries now, from anywhere hookSum reads. */
export function hasHook(state: GameState, content: Content, hook: string): boolean {
  return lifeHooks(state, content).some((e) => e.hook === hook && hookActive(e, state, content)) || extremeHasHook(state, content, hook);
}

/** PLAN.md G.1: percent of the current stage's bar gained in one year. */
/** Căn cốt + Ngộ tính → speed factor (playtest 2026-10-12: grows fast with talent). */
export function aptitudeFactor(state: GameState, content: Content): number {
  const cfg = content.balance.cultivation;
  return Math.max(cfg.aptitudeMin, cfg.aptitudeGrowth ** ((state.aptitudes.physique + state.aptitudes.comprehension - 100) / 100));
}

export function yearlyGain(state: GameState, content: Content): number {
  const root = state.cult.root;
  const realm = content.balance.realms[state.cult.realm];
  if (!realm || state.cult.realm === 'pham_nhan') return 0;
  const cfg = content.balance.cultivation;
  let rootMul = root ? content.balance.roots.gradeSpeed[root.grade] ?? 0 : 0;
  // Rootless techniques (Phật duyên) and quỷ tu (task 4.12) cultivate on đạo tâm instead of a root.
  if (rootMul <= 0 && (currentTechnique(state, content)?.requires.rootless || state.flags.quy_tu)) {
    rootMul = Math.min(content.balance.techniques.rootlessDaoHeartMax, state.aptitudes.daoHeart / 100);
  }
  const aptitude = aptitudeFactor(state, content);
  // Đại vực (task 4.8): the region's linh khí multiplies the world's.
  const qi = (content.world.qi ?? cfg.regionQi) * regionQi(state, content);
  const bonus = Math.max(0, 1 + hookSum(state, content, 'cultivationSpeed') + pathSpeedBonus(state, content));
  // Song tu with a cultivating đạo lữ (task 3.7, PLAN G.1 ×1.3).
  const partner = state.romance.partner ? state.npcs.find((n) => n.id === state.romance.partner) : undefined;
  const dual = partner?.alive && partner.realm !== 'pham_nhan' ? content.balance.romance.dualCultivationMul : 1;
  // Bế quan (task 4.1, PLAN G.1 ×1.5).
  const secluded = state.seclusion ? content.balance.seclusion.speedMul : 1;
  const injured = state.cult.injuredUntil !== null && state.character.age < state.cult.injuredUntil ? cfg.minorFailure.injurySpeedMul : 1;
  // The Trúc Cơ foundation sets the pace in Trúc Cơ; from Kim Đan on, the core's grade does (task 4.2).
  const coreGrade = state.cult.coreGrade;
  const foundation = state.cult.realm === 'truc_co' && state.cult.foundation
    ? content.balance.majorBreakthrough.foundationSpeed[state.cult.foundation] ?? 1
    : coreGrade !== null ? content.balance.coreForming.gradeSpeed[coreGrade - 1] ?? 1 : 1;
  const buffs = state.cult.buffs.filter((b) => state.character.age < b.until).reduce((m, b) => m * b.mul, 1);
  // 9.R4d: a body set by martial training cultivates a little slower (the Ngũ khí root has its own bonus).
  const conv = content.balance.martial.conversion;
  const martialBody = conv && state.cult.root?.grade !== content.martial.ascend.rootGrade && conv.entries.some((e) => e.stage <= state.martial.stage) ? conv.speedMul : 1;
  return realm.speedPct * rootMul * aptitude * qi * techniqueMul(state, content) * bonus * dual * secluded * injured * foundation * buffs * martialBody * bottleneckMul(state, content);
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
  // 6c.1: bonuses pile up with diminishing returns, and a big breakthrough has a ceiling on them.
  const bonus = (state.aptitudes.comprehension - 50) * b.comprehensionPerPoint
    + (state.aptitudes.daoHeart - 50) * b.daoHeartPerPoint
    + hookSum(state, content, 'breakthroughChance')
    + hookSum(state, content, major ? 'breakthroughChance.major' : 'breakthroughChance.minor')
    + hookSum(state, content, `breakthroughChance.at.${state.cult.realm}`)
    + (major ? state.cult.nextBonus : 0)
    + state.itemUse.nextBreakthrough;
  // A pill is a one-off the player spends, so it is added at face value; only the ceiling limits it.
  const pill = breakthroughItem(state, content, major)?.breakthrough?.add ?? 0;
  let shaped = (bonus > b.modifierKnee ? b.modifierKnee + (bonus - b.modifierKnee) * b.modifierShare : bonus) + pill;
  if (major) {
    const realms = content.cultivation.realms.realms;
    const target = realms[realmIndex(content, state.cult.realm) + 1]?.id;
    const cap = target ? b.majorModifierCap[target] : undefined;
    if (cap !== undefined) shaped = Math.min(shaped, cap);
  }
  const pct = basePct + shaped - b.failPenaltyPct * fails;
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
  const texts = content.cultivation.realms.texts;
  const rng = Rng.fromState(state.rng);
  let next = state;
  // Sects come recruiting a few years later (task 2.5).
  const recruit = content.world.sectRecruitEvent;
  if (recruit) {
    const [lo, hi] = content.balance.sects.recruitAfterYears;
    next = { ...next, events: { ...next.events, followUps: [...next.events.followUps, { event: recruit, atAge: next.character.age + rng.int(lo, hi) }] } };
  }
  // 9.R4c: no technique is handed out by default any more. A clan child gets the family's entry manual;
  // anyone else waits for a sect, a market or a kỳ ngộ to bring one (learning it enters the first realm).
  const clan = content.origins.find((o) => o.id === state.character.originId)?.cultivatorClan;
  if (!currentTechnique(next, content) && clan) next = learnTechnique(next, content, content.balance.techniques.default, { quiet: true })?.state ?? next;
  if (!currentTechnique(next, content)) {
    const line: LogLine | null = texts.needTechnique ? { text: texts.needTechnique, tone: 'normal' } : null;
    return { state: { ...next, rng: rng.getState(), log: line ? pushLine(next.log, line) : next.log }, line };
  }
  next = enterRealm(next, content, first.id, rng);
  const converted = martialEntry(next, content, rng);
  const line: LogLine = converted !== next && texts.martialEntry
    ? { text: fillRealm(texts.martialEntry, converted, content), tone: 'rare' }
    : { text: fillRealm((clan && texts.startClan) || texts.start, converted, content), tone: 'good' };
  next = converted;
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
    // Playtest 2: each year spent at the peak builds up a little for the big breakthrough (tích lũy), capped.
    const mb = content.balance.majorBreakthrough;
    if (mb.openRealms.includes(s.cult.realm) || s.cult.realm === 'luyen_khi') {
      s = { ...s, cult: { ...s.cult, nextBonus: Math.min(mb.peakWaitMax, s.cult.nextBonus + mb.peakWaitPerYear) } };
    }
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
  // 6b.4: remember since when the technique has shut the next realm (for the guaranteed kỳ ngộ and the goal line).
  const wall = !!techniqueWall(s, content);
  if (wall !== (s.cult.wallSince !== null)) s = { ...s, cult: { ...s.cult, wallSince: wall ? s.character.age : null } };
  return { ...s, rng: rng.getState(), log };
}

// ---------- Task 2.6: big breakthrough (Luyện Khí → Trúc Cơ) ----------

export interface MajorBreakthroughInfo {
  /** Realm it would break into. */
  target: { id: string; name: string };
  chancePct: number;
  /** Why it cannot be tried now, if so. */
  blocked: string | null;
  /** Thiên kiếp waiting on success (task 4.5), or null. */
  tribulation: TribulationPreview | null;
  /** Tâm ma chiến comes first (task 4.4). */
  heartDemon: boolean;
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
  const info = { target: { id: next.id, name: next.name }, chancePct: breakthroughPct(state, content, base, true), tribulation: tribulationPreview(state, content, next.id), heartDemon: needsHeartDemonTrial(state, content, next.id) };
  const atPeak = state.cult.stage >= realm.stages.length - 1 && state.cult.progress >= 100;
  if (!atPeak) return { ...info, blocked: `Cần tu tới ${realm.name} ${realm.stages[realm.stages.length - 1]}, đầy thanh tu vi.` };
  const cap = techniqueCapReason(state, content, next.id);
  if (cap) return { ...info, blocked: cap };
  if (state.cult.lastMajorAttempt === state.character.age) return { ...info, blocked: 'Năm nay đã thử rồi, đợi sang năm.' };
  return { ...info, blocked: null };
}

export interface BreakthroughResult {
  state: GameState;
  /** null: kết đan started, the outcome comes after its rounds (task 4.2). */
  success: boolean | null;
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
  const rng = Rng.fromState(state.rng);
  let s: GameState = { ...state, cult: { ...state.cult, lastMajorAttempt: state.character.age, nextBonus: 0 } };
  const pill = breakthroughItem(state, content, true);
  if (pill) s = removeItems(s, [pill.id]);
  s = { ...s, itemUse: { ...s.itemUse, nextBreakthrough: 0 } };
  // Tâm ma chiến comes first when the heart is clouded (task 4.4).
  if (needsHeartDemonTrial(s, content, info.target.id)) {
    const started = startHeartDemonTrial({ ...s, rng: rng.getState() }, content, info.chancePct, info.target.id);
    return { state: started, success: null, text: content.heartDemon.intro, tone: 'bad' };
  }
  // Kết đan is played out over three rounds first (task 4.2); the chance is decided at the end.
  if (info.target.id === content.balance.coreForming.realm) {
    const started = startCoreForming({ ...s, rng: rng.getState() }, content, info.chancePct);
    return { state: started, success: null, text: content.cultivation.realms.texts.coreStart, tone: 'good' };
  }
  if (rng.chance(info.chancePct / 100)) return majorSuccess(state, s, content, rng, info.target, null);
  return majorFailure(state, s, content, rng);
}

/**
 * Into the next realm after a successful big breakthrough: Trúc Cơ rolls its foundation, Kim Đan takes
 * the grade from kết đan. Then Nghịch Thiên Cải Mệnh (task 2.7).
 */
export function majorSuccess(before: GameState, s0: GameState, content: Content, rng: Rng, target: { id: string; name: string }, coreGrade: number | null): BreakthroughResult {
  const texts = content.cultivation.realms.texts;
  // Thiên kiếp before the new realm (task 4.5).
  const trial = undergoTribulation(s0, content, target.id, rng);
  if (!trial.survived) {
    const dead = checkDeath({ ...trial.state, rng: rng.getState() }, content, 'tribulation');
    return { state: dead, success: false, text: dead.log.at(-1)?.lines.at(-1)?.text ?? '', tone: 'bad' };
  }
  let s = trial.state;
  const foundation = target.id === 'truc_co' ? rollFoundation(s, content, rng) : null;
  s = enterRealm(s, content, target.id, rng);
  const perfect = foundation === 'hoan_my' ? content.balance.realmStages.perfectFoundationLifespan : 0;
  // Kim Đan above Ngũ phẩm lives longer (realmStages.goldenCoreLifespanPerGradeAbove5).
  const coreLife = coreGrade !== null ? Math.max(0, 5 - coreGrade) * content.balance.realmStages.goldenCoreLifespanPerGradeAbove5 : 0;
  const fails = Object.fromEntries(Object.entries(s.cult.fails).filter(([k]) => !k.startsWith(`${before.cult.realm}:`)));
  s = { ...s, cult: { ...s.cult, foundation: foundation ?? s.cult.foundation, coreGrade: coreGrade ?? s.cult.coreGrade, fails, lifespan: s.cult.lifespan + perfect + coreLife } };
  let text: string;
  let tone: BreakthroughResult['tone'];
  if (coreGrade !== null) {
    text = texts.coreSuccess.replaceAll('{grade}', content.cultivation.realms.coreGradeNames[coreGrade - 1]);
    tone = coreGrade <= 3 ? 'rare' : 'good';
  } else {
    const grade = content.cultivation.realms.foundations.find((g) => g.id === foundation);
    text = texts.majorSuccess
      .replaceAll('{realm}', target.name)
      .replaceAll('{grade}', grade ? `${grade.name}. ${grade.description}` : '');
    tone = foundation === 'hoan_my' || foundation === 'thuong' ? 'rare' : 'good';
  }
  // Hình thái Nguyên Anh (task 4.3): the shattered core takes a form from the road walked.
  let log = pushLine(s.log, { text, tone });
  const form = target.id === content.nascentSouls.realm ? soulFormFor(s, content) : undefined;
  if (form) {
    const line = texts.soulForm.replaceAll('{form}', form.name).replaceAll('{text}', form.text);
    log = pushLine(log, { text: line, tone: 'rare' });
    // Stat and lifespan hooks land once, now (as for đan văn).
    s = applyGainHooks({ ...s, cult: { ...s.cult, soulForm: form.id } }, form.effects);
    text = `${text} ${line}`;
  }
  // Nghịch Thiên Cải Mệnh: choose a fate talent before the next year (task 2.7).
  const done = offerFate({ ...s, rng: rng.getState(), log }, content);
  return { state: done, success: true, text, tone };
}

/** A failed big breakthrough: lose progress, injury, lifespan, deviation or death (G.2). */
export function majorFailure(before: GameState, s0: GameState, content: Content, rng: Rng, lead?: string): BreakthroughResult {
  const texts = content.cultivation.realms.texts;
  const cfg = content.balance.majorBreakthrough;
  const minor = content.balance.cultivation.minorFailure;
  let s = s0;
  const key = `${before.cult.realm}:peak`;
  const failCount = (s.cult.fails[key] ?? 0) + 1;
  s = { ...s, cult: { ...s.cult, fails: { ...s.cult.fails, [key]: failCount } } };
  const target = content.cultivation.realms.realms[realmIndex(content, before.cult.realm) + 1]?.id ?? '';
  const weights = cfg.failureWeightsByRealm[target] ?? cfg.failureWeights;
  const kind = rng.weighted(['lose', 'injury', 'lifespan', 'deviation', 'death'] as const, (k) => weights[k]);
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
    const dead = checkDeath({ ...s, rng: rng.getState(), log: lead ? pushLine(s.log, { text: lead, tone: 'bad' }) : s.log }, content, 'breakthrough');
    const line = dead.log.at(-1)?.lines.at(-1)?.text ?? '';
    return { state: dead, success: false, text: line, tone: 'bad' };
  }
  if (lead) text = `${lead} ${text}`;
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
  const withRoot: GameState = { ...hurt, rng: rng.getState(), cult: { ...hurt.cult, root: { grade, elements } } };
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
  const next = martialEntry(enterRealm(state, content, first.id, rng), content, rng);
  return { ...next, rng: rng.getState() };
}

/**
 * 9.R4d Tiên Võ song tu: a martial artist just in Luyện Khí 1 moves up to the level its martial stage
 * earns (balance.martial.conversion): Tuyệt đỉnh tầng 2, Hóa cảnh tầng 4, Tam hoa tầng 7, Ngũ khí Trúc Cơ.
 */
export function martialEntry(state: GameState, content: Content, rng: Rng): GameState {
  const entries = content.balance.martial.conversion?.entries ?? [];
  const entry = entries.filter((e) => e.stage <= state.martial.stage).sort((a, b) => b.stage - a.stage)[0];
  if (!entry || state.cult.realm !== content.cultivation.realms.realms[1]?.id || state.cult.stage !== 0) return state;
  const moved = entry.realm !== state.cult.realm ? enterRealm(state, content, entry.realm, rng) : state;
  return { ...moved, cult: { ...moved.cult, stage: entry.realmStage, foundation: entry.foundation ?? moved.cult.foundation } };
}
