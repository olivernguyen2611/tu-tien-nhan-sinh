// Thân phận: a thiên tử or a quan does not get the errands of a thường dân (a neighbour asking to mind the house, a
// lý trưởng's bắt lính). balance.standing names the categories / themes / ids muted (or thinned) for each standing.
import type { Content } from '../core/content';
import type { Activity, GameEvent } from '../core/schemas';
import type { GameState } from '../core/types';
import { classOf } from './socialClass';

type Standing = 'reign' | 'office' | 'army';

function standingsOf(state: GameState, content: Content): Standing[] {
  const out: Standing[] = [];
  if (state.reign) out.push('reign');
  if (content.office && state.career.id === content.office.career && state.cult.realm === 'pham_nhan') out.push('office');
  if (state.army && state.cult.realm === 'pham_nhan') out.push('army');
  return out;
}

/** 15.1: the giai cấp's own mute list (balance.classes), when the life has one. */
const classCfg = (state: GameState, content: Content) => {
  const id = classOf(state, content);
  return id ? content.balance.classes?.[id] : undefined;
};

/** Weight factor of this event for the life's standing now (1 = untouched, 0 = never). */
export function standingMul(state: GameState, content: Content, event: Pick<GameEvent, 'id' | 'category' | 'themes'>): number {
  const cfg = content.balance.standing;
  const lists = [...(cfg ? standingsOf(state, content).map((k) => cfg[k]) : []), classCfg(state, content)];
  let mul = 1;
  for (const s of lists) {
    if (!s) continue;
    if (s.ids.includes(event.id) || s.categories.includes(event.category) || event.themes.some((t) => s.themes.includes(t))) mul *= s.mul;
  }
  return mul;
}

/** False when this activity is closed to the life's standing (one whose conditions name the standing stays open). */
export function standingAllows(state: GameState, content: Content, a: Pick<Activity, 'id' | 'group' | 'conditions'>): boolean {
  // 15.1: closed to the giai cấp, unless the activity names its classes itself.
  const cls = classCfg(state, content);
  if (cls && !a.conditions.classes?.length && (cls.activityIds.includes(a.id) || cls.activityGroups.includes(a.group))) return false;
  const cfg = content.balance.standing;
  if (!cfg) return true;
  return standingsOf(state, content).every((k) => {
    const s = cfg[k];
    if (!s || k in a.conditions || (k === 'reign' && 'throne' in a.conditions)) return true;
    return !s.activityIds.includes(a.id) && !s.activityGroups.includes(a.group);
  });
}
