// 6b.9: tư chất is mostly innate. Ordinary sources (missions, sect life, everyday events) still nudge
// căn cốt / ngộ tính / khí vận up, but less and less as they climb (balance.aptitudeGain); kỳ ngộ
// (rare events, items, khí vận, thể chất) are not scaled. Losses are never scaled.
import type { Content } from '../core/content';
import type { Rng } from '../core/rng';

/** The aptitude after an ordinary gain of `add`; fractions round up with their own chance. */
export function ordinaryAptitude(key: string, current: number, add: number, content: Content, rng: Rng): number {
  const cfg = content.balance.aptitudeGain;
  let gain = add;
  if (add > 0 && (cfg.stats as string[]).includes(key)) {
    const mul = current >= cfg.hardAt ? cfg.hardMul : current >= cfg.softAt ? cfg.softMul : 1;
    const raw = add * mul;
    gain = Math.floor(raw) + (rng.chance(raw - Math.floor(raw)) ? 1 : 0);
  }
  return Math.max(0, Math.min(100, Math.round(current + gain)));
}

/**
 * 6c.4: happiness, trí tuệ and mị lực also climb less and less in ordinary play, so they stop sitting at 100
 * for most of a life. Only ordinary gains are scaled (events, missions); losses and kỳ ngộ are not.
 */
export function ordinaryStat(key: string, current: number, add: number, content: Content, rng: Rng): number {
  const cfg = content.balance.statGain;
  let gain = add;
  if (add > 0 && (cfg.stats as string[]).includes(key)) {
    const mul = current >= cfg.hardAt ? cfg.hardMul : current >= cfg.softAt ? cfg.softMul : 1;
    const raw = add * mul;
    const frac = raw - Math.floor(raw);
    gain = Math.floor(raw) + (frac > 0 && rng.chance(frac) ? 1 : 0);
  }
  return Math.max(0, Math.min(100, Math.round(current + gain)));
}
