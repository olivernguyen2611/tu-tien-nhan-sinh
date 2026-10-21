// Readable summary of how a step changed the character ("Hạnh phúc −12 · Bạc +30"),
// shown under event outcomes, family actions and life news.
import { APTITUDES, MORTAL_STATS } from '../core/schemas';
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { daoHeartLabel, karmaView } from './statLabels';

export const STAT_LABELS: Record<string, string> = {
  health: 'Sức khỏe', happiness: 'Hạnh phúc', intellect: 'Trí tuệ', charm: 'Mị lực',
  physique: 'Căn cốt', comprehension: 'Ngộ tính', luck: 'Khí vận', daoHeart: 'Đạo tâm',
};

const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

export interface Change { label: string; delta: number }

/** With content, 9.9 names: đạo tâm by the life, and thiện ác left out while nhân quả is still hearsay. */
export function statChanges(before: GameState, after: GameState, content?: Content): Change[] {
  const out: Change[] = [];
  const label = (k: string) => (k === 'daoHeart' && content ? daoHeartLabel(after, content).label : STAT_LABELS[k]);
  const hideKarma = !!content && karmaView(after, content)?.value === null;
  for (const k of MORTAL_STATS) {
    const d = after.stats[k] - before.stats[k];
    if (d) out.push({ label: label(k), delta: d });
  }
  for (const k of APTITUDES) {
    const d = after.aptitudes[k] - before.aptitudes[k];
    if (d) out.push({ label: label(k), delta: d });
  }
  const money: [string, number][] = [
    ['Bạc', after.money.silver - before.money.silver],
    ['Linh thạch', after.money.spiritStones - before.money.spiritStones],
    ['Thiện ác', after.social.karma - before.social.karma],
  ];
  for (const [name, d] of money) if (d && !(hideKarma && name === 'Thiện ác')) out.push({ label: name, delta: d });
  return out;
}

/** "Hạnh phúc −12 · Bạc +30", or '' when nothing changed. */
export function describeChanges(before: GameState, after: GameState, content?: Content): string {
  return statChanges(before, after, content).map((c) => `${c.label} ${signed(c.delta)}`).join(' · ');
}

/** Same format for a single stat, for log lines built inside a system. */
export function describeDelta(label: keyof typeof STAT_LABELS, delta: number): string {
  return delta ? `${STAT_LABELS[label]} ${signed(delta)}` : '';
}
