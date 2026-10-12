// Thiên kiếp (task 4.5): a big breakthrough into a realm listed in
// balance.tribulation brings thiên lôi down before the new realm is entered.
// Each strike takes health; armor and protective artifacts (injuryReduce),
// arrays or artifacts made for it (tribulationDefense), Căn cốt and a Lôi root
// soften it; tribulationPct / tribulationPower (stat extremes, Thiên Mệnh Sở Quy)
// make heaven harsher. A Hộ Thân Ngọc Bội breaks and takes the rest of it.
import type { Content } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { hookSum } from './cultivation';
import { removeItems } from './items';

export interface TribulationPreview {
  strikes: number;
  /** Expected health lost in all (before the random factor). */
  damage: number;
  reducePct: number;
}

function reduction(state: GameState, content: Content): number {
  const cfg = content.balance.tribulation;
  const elements = state.cult.root?.elements ?? [];
  const r = hookSum(state, content, 'injuryReduce') + hookSum(state, content, 'tribulationDefense')
    + (state.flags.ho_mach_dan ? cfg.hoMachReduce : 0)
    + (state.aptitudes.physique - 50) * cfg.physiquePerPoint
    + elements.reduce((sum, e) => sum + (cfg.elementReduce[e] ?? 0), 0);
  return Math.max(0, Math.min(cfg.maxReduce, r));
}

function harshness(state: GameState, content: Content): number {
  return Math.max(0, 1 + hookSum(state, content, 'tribulationPct') / 100 + hookSum(state, content, 'tribulationPower'));
}

/** What the next big breakthrough's thiên kiếp would cost, or null if that realm has none. */
export function tribulationPreview(state: GameState, content: Content, realmId: string): TribulationPreview | null {
  const t = content.balance.tribulation.realms[realmId];
  if (!t) return null;
  const cfg = content.balance.tribulation;
  const reduce = reduction(state, content);
  const per = t.power * harshness(state, content) * (1 - reduce);
  const damage = per * (t.strikes - 1) + per * cfg.finalMul;
  return { strikes: t.strikes, damage: Math.round(damage), reducePct: Math.round(reduce * 100) };
}

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Undergo the thiên kiếp for `realmId`. survived=false: the strikes took all health (the caller records the death). */
export function undergoTribulation(state: GameState, content: Content, realmId: string, rng: Rng): { state: GameState; survived: boolean } {
  const t = content.balance.tribulation.realms[realmId];
  if (!t) return { state, survived: true };
  const cfg = content.balance.tribulation;
  const texts = content.cultivation.realms.texts;
  const reduce = reduction(state, content);
  const harsh = harshness(state, content);
  let s = pushLine(state, { text: texts.tribulationStart.replaceAll('{count}', String(t.strikes)), tone: 'bad' });
  for (let n = 1; n <= t.strikes; n++) {
    const variance = cfg.variance[0] + rng.next() * (cfg.variance[1] - cfg.variance[0]);
    const damage = Math.max(1, Math.round(t.power * harsh * variance * (n === t.strikes ? cfg.finalMul : 1) * (1 - reduce)));
    const health = s.stats.health - damage;
    s = pushLine(s, { text: rng.pick(texts.tribulationStrike).replaceAll('{n}', String(n)).replaceAll('{damage}', String(damage)), tone: 'bad' });
    if (health <= 0) {
      // A protective jade breaks instead (trigger.cheatDeath), once.
      const jade = Object.keys(s.inventory).find((id) => s.inventory[id] > 0 && content.items.find((i) => i.id === id)?.carried.some((e) => e.hook === 'trigger.cheatDeath'));
      if (!jade) return { state: { ...s, stats: { ...s.stats, health: 0 } }, survived: false };
      // The jade takes the rest of the tribulation in the player's place.
      s = pushLine(removeItems({ ...s, stats: { ...s.stats, health: 1 } }, [jade]), { text: texts.tribulationJade, tone: 'rare' });
      break;
    }
    s = { ...s, stats: { ...s.stats, health } };
  }
  const physique = Math.min(100, s.aptitudes.physique + cfg.survivePhysique);
  s = { ...s, aptitudes: { ...s.aptitudes, physique } };
  // Hộ Mạch Đan guards one tribulation only.
  if (s.flags.ho_mach_dan) { const flags = { ...s.flags }; delete flags.ho_mach_dan; s = { ...s, flags }; }
  return { state: pushLine(s, { text: texts.tribulationPassed, tone: 'good' }), survived: true };
}
