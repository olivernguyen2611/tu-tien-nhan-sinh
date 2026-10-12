// Phúc báo (task 5b.8, mortal-path.md 3.1): what a good mortal life earns for the next one.
// Earned at death (earnedBlessings), kept in the save meta, given to the next new life.
import type { Content } from '../core/content';
import type { EffectHook } from '../core/schemas';
import type { GameState } from '../core/types';

/** Phúc báo this finished life earns (blessings.json, all `earn` conditions met). */
export function earnedBlessings(state: GameState, content: Content): GameState['blessings'] {
  const file = content.blessings;
  if (!state.death || (file.mortalOnly && state.cult.realm !== 'pham_nhan')) return [];
  const out: GameState['blessings'] = [];
  for (const b of file.blessings) {
    const e = b.earn;
    if (e.karmaMin !== undefined && state.social.karma < e.karmaMin) continue;
    if (e.ageMin !== undefined && state.death.age < e.ageMin) continue;
    if (e.deathFlag && !state.flags[e.deathFlag]) continue;
    if (e.careerRung !== undefined && !(state.career.id && state.career.rung >= e.careerRung)) continue;
    out.push(e.careerRung !== undefined && state.career.id ? { id: b.id, career: state.career.id } : { id: b.id });
  }
  return out;
}

const defs = (list: GameState['blessings'], content: Content) =>
  list.map((x) => ({ x, b: content.blessings.blessings.find((b) => b.id === x.id) })).filter((p) => !!p.b);

/** Extra Tiên Thiên Khí Vận rerolls from Phúc báo. */
export function blessingRerolls(list: GameState['blessings'], content: Content): number {
  return defs(list, content).reduce((n, { b }) => n + (b!.destinyRerolls ?? 0), 0);
}

/** Hooks of this life's Phúc báo, read by their systems (rootReroll at the root test). */
export function blessingHooks(state: GameState, content: Content): EffectHook[] {
  return defs(state.blessings ?? [], content).flatMap(({ b }) => b!.effects);
}

/** One-time gains given when the life's destiny is confirmed: effects plus the career's main stat. */
export function blessingGains(state: GameState, content: Content): EffectHook[] {
  return defs(state.blessings ?? [], content).flatMap(({ x, b }) => {
    const stat = x.career ? content.careers.careers.find((c) => c.id === x.career)?.mainStats[0] : undefined;
    return stat && b!.careerMainStat ? [...b!.effects, { hook: `stat.${stat}`, add: b!.careerMainStat }] : b!.effects;
  });
}

/** Names for the log and the death screen. */
export function blessingNames(list: GameState['blessings'], content: Content): string[] {
  return defs(list, content).map(({ b }) => b!.name);
}
