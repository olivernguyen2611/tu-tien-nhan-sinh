// 13.1 Nhập đạo là một cột mốc: right after the first step into the Dao the tier's enterEvent asks
// "dứt duyên phàm trần" or "giữ duyên". Cutting leaves the mortal life behind (job, office, army, the
// gia sản goes to the family, a share of the silver is kept) and cultivates faster while kin drift away;
// keeping cultivates a little slower and opens the song giới events. The choice is a flag; its hooks
// and numbers are in balance.daoBond.
import type { Content } from '../core/content';
import type { EffectHook } from '../core/schemas';
import type { GameState } from '../core/types';
import { quitJob } from './jobs';
import { leaveCareer } from './career';
import { officeResign } from './office';
import { armyLeave } from './army';
import { reignEnd } from './throne';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Hooks of the bond chosen at nhập đạo (balance.daoBond.hooks, by flag). */
export function daoBondHooks(state: GameState, content: Content): EffectHook[] {
  const hooks = content.balance.daoBond?.hooks ?? {};
  return Object.entries(hooks).flatMap(([flag, list]) => (state.flags[flag] ? list : []));
}

/** Effect leaveMortal: the mortal life is left behind. */
export function leaveMortalLife(state: GameState, content: Content): GameState {
  let s = state;
  if (s.job?.id) s = quitJob(s, content, 'quit');
  s = officeResign(s, content);
  if (s.army) s = armyLeave(s, content, 'discharge');
  if (s.reign) s = reignEnd(s, content, 'abdicate');
  s = leaveCareer(s);
  const keep = content.balance.daoBond?.silverKeep ?? 1;
  const silver = Math.floor(s.money.silver * keep);
  return {
    ...s,
    money: { ...s.money, silver },
    assets: s.assets ? { ...s.assets, owned: [], loans: [], crop: null } : s.assets,
  };
}

/** Effect familyAffinity: every living parent, sibling and child ±. */
export function familyAffinity(state: GameState, d: number): GameState {
  return { ...state, family: state.family.map((r) => (r.alive ? { ...r, affinity: clamp(r.affinity + d) } : r)) };
}

/** Each year after dứt duyên, kin who stayed mortal drift a little further. */
export function daoBondYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.daoBond;
  if (!cfg || !state.flags[cfg.cutFlag]) return state;
  return familyAffinity(state, -cfg.cutDrift);
}
