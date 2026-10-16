// 9.V1: thước sức mạnh võ đạo ↔ tu tiên. Pure formula from balance (no life needed): how often a martial
// artist at each stage wins a best-of-3 against a cultivator at a realm and sub-stage, both with Căn cốt 50
// and no technique, artifact or hook. Used by `npm run simulate -- --duel` and its test.
import type { Content } from '../core/content';

export interface DuelRow {
  martial: string;
  foe: string;
  /** Win chance of one round and of the whole fight (two rounds of three). */
  round: number;
  match: number;
}

/** Chance to take two rounds of three when each round is won with chance p. */
export const matchChance = (p: number) => p * p * (3 - 2 * p);

export function duelTable(content: Content, physique = 50): DuelRow[] {
  const c = content.balance.combat;
  const fit = c.physiqueBase + physique / c.physiqueDivisor;
  const realms = content.cultivation.realms.realms.filter((r) => r.id !== 'pham_nhan');
  const rows: DuelRow[] = [];
  content.martial.stages.forEach((stage, i) => {
    const a = (content.balance.martial.combatPower[i] ?? 0) * fit;
    for (const r of realms) {
      const base = content.balance.realms[r.id]?.combatPower ?? 0;
      r.stages.forEach((sub, s) => {
        const b = base * (1 + c.stagePct * s) * fit;
        const round = a ** c.k / (a ** c.k + b ** c.k);
        rows.push({ martial: stage.name, foe: `${r.name} ${sub}`, round, match: matchChance(round) });
      });
    }
  });
  return rows;
}
