// Thành tựu và huy hiệu cuối đời (task 5b.5): checks on a finished life (achievements.json).
// Thành tựu are kept across lives in the save meta; some unlock a Kim Thủ Chỉ to choose at birth.
// Huy hiệu: the few that fit a life best (priority), for the death screen and the obituary card.
import type { Content } from '../core/content';
import type { AchievementFile, LifeCheck } from '../core/schemas';
import type { GameState } from '../core/types';
import { activeCombos } from './destiny';
import { chosenDisciple } from './chosen';
import { codexOf } from './codex';
import { meets, readValue } from './events/conditions';
import { jobDef } from './jobs';

type Achievement = AchievementFile['achievements'][number];
type Badge = AchievementFile['badges'][number];

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** Does the finished life pass this check? `lives`: lives begun on this browser, this one included. */
export function lifeMeets(state: GameState, content: Content, w: LifeCheck, lives: number): boolean {
  const age = state.death?.age ?? state.character.age;
  const children = state.family.filter((r) => r.role === 'child').length;
  const chosen = chosenDisciple(state);
  if (w.realmMin && realmIndex(content, state.cult.realm) < realmIndex(content, w.realmMin)) return false;
  if (w.mortal !== undefined && (state.cult.realm === 'pham_nhan') !== w.mortal) return false;
  if (w.ageMin !== undefined && age < w.ageMin) return false;
  if (w.ageMax !== undefined && age > w.ageMax) return false;
  if (w.cause && (!state.death || !w.cause.includes(state.death.cause))) return false;
  if (w.karmaMin !== undefined && state.social.karma < w.karmaMin) return false;
  if (w.karmaMax !== undefined && state.social.karma > w.karmaMax) return false;
  if (w.happinessMin !== undefined && state.stats.happiness < w.happinessMin) return false;
  if (w.silverMin !== undefined && state.money.silver < w.silverMin) return false;
  if (w.childrenMin !== undefined && children < w.childrenMin) return false;
  if (w.childrenMax !== undefined && children > w.childrenMax) return false;
  if (w.disciplesMin !== undefined && state.npcs.filter((n) => n.disciple).length < w.disciplesMin) return false;
  if (w.partner !== undefined && !!state.romance.partner !== w.partner) return false;
  if (w.ownSect !== undefined && !!state.ownSect !== w.ownSect) return false;
  if (w.clan !== undefined && !!state.clan !== w.clan) return false;
  if (w.rankMax !== undefined && (state.ranking.rank === null || state.ranking.rank > w.rankMax)) return false;
  if (w.lineage && !w.lineage.includes(state.cult.lineage ?? '')) return false;
  if (w.flagsAll?.some((f) => !state.flags[f])) return false;
  if (w.goldenFinger !== undefined) {
    const g = state.goldenFinger?.id;
    if (typeof w.goldenFinger === 'boolean' ? !!g !== w.goldenFinger : !g || !w.goldenFinger.includes(g)) return false;
  }
  if (w.combosMin !== undefined && activeCombos(state, content).length < w.combosMin) return false;
  if (w.chosenTemplate && (!chosen?.chosen || !w.chosenTemplate.includes(chosen.chosen.template))) return false;
  if (w.chosenRole && (!chosen?.chosen?.role || !w.chosenRole.includes(chosen.chosen.role))) return false;
  if (w.chosenEnding) {
    const ending = codexOf({ ...state, alive: false }, content).stories[0]?.ending;
    if (!ending || !w.chosenEnding.includes(ending)) return false;
  }
  if (w.livesMin !== undefined && lives < w.livesMin) return false;
  if (w.statsMin && Object.entries(w.statsMin).some(([k, v]) => readValue(state, k) < v)) return false;
  if (w.heartDemonMin !== undefined && state.cult.heartDemon < w.heartDemonMin) return false;
  if (w.martialMin !== undefined && state.martial.stage < w.martialMin) return false;
  if (w.martialMax !== undefined && state.martial.stage > w.martialMax) return false;
  if (w.scholarKidsMin !== undefined && state.family.filter((r) => r.role === 'child' && r.scholar).length < w.scholarKidsMin) return false;
  if (w.inSect !== undefined && (!!state.ownSect || !!state.sect.id) !== w.inSect) return false;
  if (w.career !== undefined && !!state.career.id !== w.career) return false;
  if (w.rooted !== undefined && (!!state.cult.root && state.cult.root.grade !== 'none') !== w.rooted) return false;
  // 10.10: the đời phàm.
  if (w.holds && !meets(state, w.holds, content)) return false;
  const job = state.job;
  const held = job ? [...job.past.map((p) => ({ id: p.id, rung: p.rung })), ...(job.id ? [{ id: job.id, rung: job.rung }] : [])] : [];
  if (w.jobsMin !== undefined && new Set(held.map((h) => h.id)).size < w.jobsMin) return false;
  if (w.jobEver && !held.some((h) => w.jobEver!.includes(h.id))) return false;
  if (w.silverMax !== undefined && state.money.silver > w.silverMax) return false;
  if (w.jobTop !== undefined && held.some((h) => h.rung >= (jobDef(content, h.id)?.rungs.length ?? 99) - 1) !== w.jobTop) return false;
  const crimes = state.law?.crimes ?? 0;
  if (w.crimesMin !== undefined && crimes < w.crimesMin) return false;
  if (w.neverCaught !== undefined && (crimes > 0 && (state.law?.convictions ?? 0) === 0) !== w.neverCaught) return false;
  return true;
}

/** Thành tựu this finished life earns (whether already held or not). */
export function earnedAchievements(state: GameState, content: Content, lives: number): Achievement[] {
  if (state.alive || !state.death) return [];
  return content.achievements.achievements.filter((a) => lifeMeets(state, content, a.when, lives));
}

/** Huy hiệu cuối đời: the best-fitting few (balance.badges.max), highest priority first. */
export function lifeBadges(state: GameState, content: Content, lives: number): Badge[] {
  if (state.alive || !state.death) return [];
  const earned = content.achievements.badges
    .filter((b) => lifeMeets(state, content, b.when, lives))
    .sort((a, b) => b.priority - a.priority);
  // Playtest 2: the priority-0 fallback ("Một Đời Bình Thường") only shows when nothing else fits.
  const real = earned.filter((b) => b.priority > 0);
  return (real.length > 0 ? real : earned).slice(0, content.balance.badges.max);
}

/** Kim Thủ Chỉ that held thành tựu let a new life choose (task 5b.5). */
export function unlockedFingers(content: Content, held: string[]): string[] {
  return content.achievements.achievements
    .filter((a) => a.unlockFinger && held.includes(a.id))
    .map((a) => a.unlockFinger!)
    .filter((id, i, all) => all.indexOf(id) === i && content.goldenFingers.fingers.some((f) => f.id === id));
}

/** 6c.8: the di nguyện this life has met so far (or at its end). */
export function wishesMet(state: GameState, content: Content): AchievementFile['wishes'] {
  return content.achievements.wishes.filter((w) => lifeMeets(state, content, w.when, 0));
}

/** 6c.8: the first di nguyện still open, for the goal line once the life has reached Hóa Thần. */
export function openWish(state: GameState, content: Content): AchievementFile['wishes'][number] | null {
  const met = new Set(wishesMet(state, content).map((w) => w.id));
  return content.achievements.wishes.find((w) => !met.has(w.id)) ?? null;
}
