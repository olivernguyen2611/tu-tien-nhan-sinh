// Readable summary of how a step changed the character ("Hạnh phúc −12 · Bạc +30"),
// shown under event outcomes, family actions and life news.
import { APTITUDES, MORTAL_STATS } from '../core/schemas';
import type { GameState } from '../core/types';

const LABELS: Record<string, string> = {
  health: 'Sức khỏe', happiness: 'Hạnh phúc', intellect: 'Trí tuệ', charm: 'Mị lực',
  physique: 'Căn cốt', comprehension: 'Ngộ tính', luck: 'Khí vận', daoHeart: 'Đạo tâm',
};

const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

export interface Change { label: string; delta: number }

export function statChanges(before: GameState, after: GameState): Change[] {
  const out: Change[] = [];
  for (const k of MORTAL_STATS) {
    const d = after.stats[k] - before.stats[k];
    if (d) out.push({ label: LABELS[k], delta: d });
  }
  for (const k of APTITUDES) {
    const d = after.aptitudes[k] - before.aptitudes[k];
    if (d) out.push({ label: LABELS[k], delta: d });
  }
  const money: [string, number][] = [
    ['Bạc', after.money.silver - before.money.silver],
    ['Linh thạch', after.money.spiritStones - before.money.spiritStones],
    ['Thiện ác', after.social.karma - before.social.karma],
  ];
  for (const [label, d] of money) if (d) out.push({ label, delta: d });
  return out;
}

/** "Hạnh phúc −12 · Bạc +30", or '' when nothing changed. */
export function describeChanges(before: GameState, after: GameState): string {
  return statChanges(before, after).map((c) => `${c.label} ${signed(c.delta)}`).join(' · ');
}

/** Same format for a single stat, for log lines built inside a system. */
export function describeDelta(label: keyof typeof LABELS, delta: number): string {
  return delta ? `${LABELS[label]} ${signed(delta)}` : '';
}
