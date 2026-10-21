// 9.7 Dock theo tầng: which buttons the main screen shows (the tier's `dock` in world.json, looks in
// dock.json), which activity groups each sheet lists, and the "Thân phận" line of the profile.
import type { Content } from '../core/content';
import type { ActivityGroup, DockButton } from '../core/schemas';
import type { GameState } from '../core/types';
import { careerDef } from './career';
import { featureOpen } from './knowledge';
import { martialView } from './martial';
import { currentRegion } from './regions';
import { sectLabel } from './sect';
import { currentTier, tierDef } from './tiers';
import { activityViews } from './activities';

export interface DockView {
  id: string;
  glyph: string;
  label: string;
}

/** A button that waits for its tier shows early when its tab is open or one of its lối sống is on. */
function earlyOn(state: GameState, content: Content, b: DockButton): boolean {
  if (!b.early) return false;
  if (b.early.tab && featureOpen(state, content, 'tab', b.early.tab)) return true;
  return b.early.lifestyles.some((l) => state.lifestyles?.[l]?.active);
}

const tierDock = (state: GameState, content: Content) => tierDef(content, currentTier(state, content))?.dock ?? [];

function shownButtons(state: GameState, content: Content): DockButton[] {
  const ids = tierDock(state, content);
  return (content.dock ?? []).filter((b) => ids.includes(b.id) || earlyOn(state, content, b));
}

/** The dock in screen order, split around the +1 năm button in the middle. */
export function dockView(state: GameState, content: Content): { left: DockView[]; right: DockView[] } {
  const ids = tierDock(state, content);
  const views = shownButtons(state, content).map((b) => {
    // The alt look is only for a button shown early, before its tier.
    const closed = b.alt && !ids.includes(b.id) && b.early?.tab && !featureOpen(state, content, 'tab', b.early.tab);
    return { id: b.id, glyph: closed ? b.alt!.glyph : b.glyph, label: closed ? b.alt!.label : b.label };
  });
  const half = Math.floor(views.length / 2);
  return { left: views.slice(0, half), right: views.slice(half) };
}

/** The activity groups a button's sheet lists; the catch-all one also takes groups no shown button has. */
export function dockGroups(state: GameState, content: Content, id: string): ActivityGroup[] {
  const shown = shownButtons(state, content);
  const b = shown.find((x) => x.id === id) ?? content.dock?.find((x) => x.id === id);
  if (!b) return [];
  if (!b.catchAll) return b.groups;
  const taken = new Set(shown.flatMap((x) => x.groups));
  const rest = activityViews(state, content).map((v) => v.group).filter((g) => !taken.has(g));
  return [...new Set([...b.groups, ...rest])];
}

/** "Thân phận": what the world knows the character as (rung of the career, martial stage, sect, lối sống, place). */
export function identityLine(state: GameState, content: Content): string | null {
  const parts: string[] = [];
  const career = careerDef(content, state.career.id);
  if (career) parts.push(career.rungs[state.career.rung]);
  const stage = state.cult.realm === 'pham_nhan' ? martialView(state, content).stage : null;
  if (stage) parts.push(`võ giả ${stage}`);
  const sect = sectLabel(state, content);
  if (sect) parts.push(sect);
  // Lối sống a career already names (quan, thương, y) or the realm shows (tu tiên) would only repeat.
  for (const l of content.world.lifestyles) {
    if (!state.lifestyles?.[l.id]?.active) continue;
    if (l.entry.career && 'id' in l.entry.career) continue;
    if (l.entry.realm) continue;
    parts.push(`người ${l.name.toLowerCase()}`);
  }
  const region = currentRegion(state, content);
  if (region) parts.push(`ở ${region.name}`);
  return parts.length > 0 ? parts.join(', ') : null;
}
