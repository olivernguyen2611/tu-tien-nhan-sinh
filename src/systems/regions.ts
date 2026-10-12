// Đại vực (task 4.8): the regions of a world open with the realm; each has its own linh khí,
// its own kinds of trouble, and an đại năng who keeps it.
import type { Content } from '../core/content';
import type { Region } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';

/** Why a trip cannot start. */
export type TravelBlock = 'locked' | 'here' | 'movedThisYear' | 'busy';

/** The region the player is in (the world's first when none is set); undefined for a world without regions. */
export function currentRegion(state: GameState, content: Content): Region | undefined {
  return content.regions.find((r) => r.id === state.region.id) ?? content.regions[0];
}

const realmIndex = (content: Content, id: string): number => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** The player's realm is high enough to go there. */
export function regionOpen(state: GameState, content: Content, region: Region): boolean {
  return !region.minRealm || realmIndex(content, state.cult.realm) >= realmIndex(content, region.minRealm);
}

export function travelBlock(state: GameState, content: Content, regionId: string, force = false): TravelBlock | null {
  const region = content.regions.find((r) => r.id === regionId);
  if (!region || (!force && !regionOpen(state, content, region))) return 'locked';
  if (currentRegion(state, content)?.id === regionId) return 'here';
  if (!state.alive || state.events.pending || state.combat || state.fate || state.seclusion) return 'busy';
  if (!force && state.region.movedAt === state.character.age) return 'movedThisYear';
  return null;
}

/** Move to another region: one trip a year. The first visit meets the đại năng who keeps it. `force`: dev mode. */
export function travel(state: GameState, content: Content, regionId: string, force = false): { state: GameState; text: string } | null {
  if (travelBlock(state, content, regionId, force)) return null;
  const region = content.regions.find((r) => r.id === regionId)!;
  const first = !state.region.visited.includes(region.id);
  const text = first ? `${region.enterText} ${region.guardian.text}` : region.enterText;
  const line: LogLine = { text, tone: first ? 'rare' : 'normal' };
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: state.character.age, lines: [line] });
  return {
    state: {
      ...state,
      region: { id: region.id, visited: first ? [...state.region.visited, region.id] : state.region.visited, movedAt: state.character.age },
      log,
    },
    text,
  };
}

/** Linh khí of the region (×1 for a world without regions). */
export function regionQi(state: GameState, content: Content): number {
  return currentRegion(state, content)?.qi ?? 1;
}

/** Event weight × for the region's themes. */
export function regionThemeMultiplier(state: GameState, content: Content, themes: string[]): number {
  const weights = currentRegion(state, content)?.eventWeight ?? {};
  return themes.reduce((mul, t) => mul * (weights[t] ?? 1), 1);
}
