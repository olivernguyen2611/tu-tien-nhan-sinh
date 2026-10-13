// Task 2.9: the "Mục tiêu hiện tại" line and first-life tips, both from content/tutorial.json.
import type { Content } from '../core/content';
import type { TutorialWhen } from '../core/schemas';
import type { GameState } from '../core/types';
import { techniqueWall } from './technique';

function atPeak(state: GameState, content: Content): boolean {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  return !!realm && state.cult.realm !== 'pham_nhan' && state.cult.stage >= realm.stages.length - 1 && state.cult.progress >= 100;
}

export function tutorialMatches(state: GameState, content: Content, when: TutorialWhen): boolean {
  const root = state.cult.root;
  const usable = !!root && (content.balance.roots.gradeSpeed[root.grade] ?? 0) > 0;
  if (when.minAge !== undefined && state.character.age < when.minAge) return false;
  if (when.minEvents !== undefined && Object.keys(state.events.history).length < when.minEvents) return false;
  if (when.rootTested !== undefined && !!root !== when.rootTested) return false;
  if (when.hasRoot !== undefined && (!root || usable !== when.hasRoot)) return false;
  if (when.realm !== undefined && state.cult.realm !== when.realm) return false;
  if (when.atPeak !== undefined && atPeak(state, content) !== when.atPeak) return false;
  if (when.techniqueWall !== undefined && !!techniqueWall(state, content) !== when.techniqueWall) return false;
  if (when.inSect !== undefined && !!state.sect.id !== when.inSect) return false;
  return true;
}

/** The first goal that fits this life now. */
export function currentGoal(state: GameState, content: Content): string | null {
  if (!state.alive) return null;
  const text = content.tutorial.goals.find((g) => tutorialMatches(state, content, g.when))?.text;
  if (!text) return null;
  const wall = techniqueWall(state, content);
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm)?.name ?? '';
  return text.replaceAll('{technique}', wall?.technique ?? '').replaceAll('{realm}', wall?.realm ?? realm).replaceAll('{next}', wall?.next ?? '');
}

/** Next tip to show (first life only), or null. */
export function pendingTip(state: GameState, content: Content): { id: string; text: string } | null {
  if (!state.tutorial.enabled || !state.alive) return null;
  return content.tutorial.tips.find((t) => !state.tutorial.seen.includes(t.id) && tutorialMatches(state, content, t.when)) ?? null;
}

export function dismissTip(state: GameState, id: string): GameState {
  if (state.tutorial.seen.includes(id)) return state;
  return { ...state, tutorial: { ...state.tutorial, seen: [...state.tutorial.seen, id] } };
}

export function disableTutorial(state: GameState): GameState {
  return { ...state, tutorial: { ...state.tutorial, enabled: false } };
}
