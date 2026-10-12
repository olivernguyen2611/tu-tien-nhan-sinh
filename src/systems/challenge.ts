// Thử thách tuần (task 5b.6): each ISO week has one challenge of the world (challenges.json),
// the same seed and rules for everyone: a fixed origin or difficulty, given Tiên Thiên Khí Vận,
// no thiên phú luân hồi, Phúc báo or Kim Thủ Chỉ from past lives. The goal is a LifeCheck read
// at death; the best result of the week is kept in the save meta.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { ChallengeFile } from '../core/schemas';
import { createLife } from '../core/state';
import type { GameState } from '../core/types';
import { lifeMeets } from './achievements';
import { rollDestiny } from './destiny';
import { rebirthPoints } from './rebirth';

type Challenge = ChallengeFile[number];

/** ISO-8601 week of a date, e.g. "2026-W41" (weeks start on Monday, in UTC). */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** This week's challenge (the same for everyone), or null when the world has none. */
export function weeklyChallenge(content: Content, week: string): Challenge | null {
  if (content.challenges.length === 0) return null;
  return new Rng(`thu_thach:${week}`).pick(content.challenges);
}

export function challengeDef(content: Content, id: string | undefined): Challenge | undefined {
  return content.challenges.find((c) => c.id === id);
}

/** The challenge life, rolled and ready to confirm: the week's seed, given traits locked in place. */
export function startChallenge(content: Content, week: string, attempt = 1, tutorial = false): GameState | null {
  const c = weeklyChallenge(content, week);
  if (!c) return null;
  const life = createLife({ seed: `tuan-${week}`, originId: c.rules.origin, difficulty: c.rules.difficulty, tutorial }, content);
  const given = (c.rules.traits ?? []).filter((t) => content.traits.some((x) => x.id === t));
  const set: GameState = {
    ...life,
    challenge: { week, id: c.id, try: attempt },
    destiny: { ...life.destiny, offered: given, locked: given, maxLocks: given.length, rerollsLeft: c.rules.rerolls ?? 0, slots: content.balance.traits.slots },
  };
  return rollDestiny(set, content);
}

/** Key the life's Luân Hồi points are credited under (every try of the same week has the same seed). */
export function creditKey(state: GameState): string {
  return state.challenge ? `${state.seed}#${state.challenge.try}` : state.seed;
}

/** How the challenge went: goal met, and the score (the life's Luân Hồi points). */
export function challengeResult(state: GameState, content: Content): { done: boolean; score: number } | null {
  const c = challengeDef(content, state.challenge?.id);
  if (!c || state.alive || !state.death) return null;
  return { done: lifeMeets(state, content, c.goal, 1), score: rebirthPoints(state, content).total };
}
