// 13.7e Phẩm cấp 4 bậc: Trúc Cơ, Kim Đan, Nguyên Anh and Hóa Thần share one scale (Hạ, Trung, Thượng, Cực),
// each realm with its own names. Trúc Cơ's tier comes from the đạo cơ, Kim Đan's from its grade 1–9; Nguyên
// Anh and Hóa Thần roll theirs on entering. A tier is never above the previous realm's + 1. Only the current
// realm's tier counts: power always; speed, lifespan on entering and the next breakthrough where the realm has
// no measure of its own. A realm with nothing recorded (an old save) is read from what the save has, so no
// migration is needed. Bổ cơ (a rare chain) raises the Trúc Cơ tier once. Numbers in balance.realmGrade,
// names in realms.json realmGrades.
import type { Content } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';

const clampTier = (t: number) => Math.max(1, Math.min(4, Math.round(t)));

/** The tier 1–4 of a graded realm the life has reached, or null. */
export function realmTier(state: GameState, content: Content, realm: string): number | null {
  const cfg = content.balance.realmGrade;
  if (!cfg || !cfg.realms.includes(realm)) return null;
  const order = content.cultivation.realms.realms.map((r) => r.id);
  if (order.indexOf(state.cult.realm) < order.indexOf(realm)) return null;
  const i = cfg.realms.indexOf(realm);
  const prev = i > 0 ? realmTier(state, content, cfg.realms[i - 1]) : null;
  const cap = (t: number) => clampTier(prev === null ? t : Math.min(t, prev + 1));
  const stored = state.cult.grades?.[realm];
  if (stored !== undefined) return cap(stored);
  if (realm === 'truc_co') return state.cult.foundation ? clampTier(cfg.foundationTier[state.cult.foundation] ?? cfg.defaultTier) : cfg.defaultTier;
  if (realm === 'kim_dan') return cap(state.cult.coreGrade !== null ? cfg.coreTier[state.cult.coreGrade - 1] ?? cfg.defaultTier : cfg.defaultTier);
  // Migration: a Nguyên Anh from an old save takes its Kim Đan's tier; a Hóa Thần takes defaultTier.
  if (realm === 'nguyen_anh' && prev !== null) return cap(prev);
  return cap(cfg.defaultTier);
}

/** The tier of the realm the life stands in, or null. */
export const currentTier = (state: GameState, content: Content) => realmTier(state, content, state.cult.realm);

export function tierName(content: Content, realm: string, tier: number): string {
  return content.cultivation.realms.realmGrades?.names[realm]?.[tier - 1] ?? content.cultivation.realms.realmGrades?.tiers[tier - 1] ?? '';
}

/** Combat power multiplier of the current realm's tier. */
export function gradePowerMul(state: GameState, content: Content): number {
  const t = currentTier(state, content);
  return t === null ? 1 : content.balance.realmGrade!.power[t - 1] ?? 1;
}

/** Speed multiplier where the realm has no measure of its own (Nguyên Anh, Hóa Thần), or null. */
export function gradeSpeedMul(state: GameState, content: Content): number | null {
  if (state.cult.realm === 'truc_co' || state.cult.realm === 'kim_dan') return null;
  const t = currentTier(state, content);
  return t === null ? null : content.balance.realmGrade!.speed[t - 1] ?? 1;
}

/** Breakthrough points out of Kim Đan and Nguyên Anh (Trúc Cơ has foundationBonus). */
export function gradeBreakthrough(state: GameState, content: Content): number {
  if (state.cult.realm === 'truc_co') return 0;
  const t = currentTier(state, content);
  return t === null ? 0 : content.balance.realmGrade!.breakthrough[t - 1] ?? 0;
}

/** On entering Nguyên Anh or Hóa Thần: roll the tier, add its lifespan, say it. */
export function rollRealmTier(state: GameState, content: Content, rng: Rng): { state: GameState; line: LogLine | null } {
  const cfg = content.balance.realmGrade;
  const realm = state.cult.realm;
  if (!cfg || realm === 'truc_co' || realm === 'kim_dan' || !cfg.realms.includes(realm)) return { state, line: null };
  const i = cfg.realms.indexOf(realm);
  const prev = realmTier(state, content, cfg.realms[i - 1]) ?? cfg.defaultTier;
  const score = rng.int(0, 99) + (state.aptitudes.comprehension + state.aptitudes.daoHeart - 100) * cfg.rollPerPoint + (prev - 2) * cfg.prevBonus;
  let tier = 1 + cfg.thresholds.filter((t) => score >= t).length;
  if (cfg.highDaoHeartRealms.includes(realm) && state.aptitudes.daoHeart < cfg.highDaoHeart) tier = Math.min(tier, 2);
  const capped = tier > prev + 1;
  tier = Math.min(tier, prev + 1);
  const pct = cfg.lifespanPct[tier - 1] ?? 0;
  const s: GameState = { ...state, cult: { ...state.cult, grades: { ...state.cult.grades, [realm]: tier }, lifespan: Math.round(state.cult.lifespan * (1 + pct)) } };
  const texts = content.cultivation.realms.realmGrades;
  const text = [texts?.enter.replaceAll('{grade}', tierName(content, realm, tier)), capped ? texts?.capped : ''].filter(Boolean).join(' ');
  return { state: s, line: text ? { text, tone: tier >= 3 ? 'rare' : 'good' } : null };
}

/** Effect boCo: the Trúc Cơ tier goes up one (once a life: the event sets its own flag). */
export function boCo(state: GameState, content: Content): GameState {
  const t = realmTier(state, content, 'truc_co');
  if (t === null || t >= 4) return state;
  const s: GameState = { ...state, cult: { ...state.cult, grades: { ...state.cult.grades, truc_co: t + 1 } } };
  const text = content.cultivation.realms.realmGrades?.boCo.replaceAll('{grade}', tierName(content, 'truc_co', t + 1));
  if (!text) return s;
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'rare' }] };
  return { ...s, log };
}
