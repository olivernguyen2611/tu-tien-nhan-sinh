// 9.9 Một bộ chỉ số, đổi nhãn theo tầng (nguyên tắc B): no new 0–100 stats. The same đạo tâm number reads
// Tâm tính / Ý chí / Đạo tâm by the life; faction reputation shows only where the life is involved; nội lực
// is the progress bar of the martial stage; nhân quả is hearsay until the life enters the Dao or meets a
// cao tăng. Names and rules: content/stat-labels.json.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { meets } from './events/conditions';
import { martialView } from './martial';

/** The name đạo tâm goes by in this life. */
export function daoHeartLabel(state: GameState, content: Content): { label: string; term?: string } {
  const list = content.statLabels?.daoHeart ?? [];
  return list.find((l) => meets(state, l.when, content)) ?? { label: 'Đạo tâm', term: 'dao_tam' };
}

export interface ReputationView { key: string; name: string; value: number }

/** Faction reputations the life is involved in: their place holds, or the number is not 0. */
export function reputationViews(state: GameState, content: Content): ReputationView[] {
  const out: ReputationView[] = [];
  for (const r of content.statLabels?.reputation ?? []) {
    const value = Math.round(state.social.reputation[r.key] ?? 0);
    if (value === 0 && !(r.when && meets(state, r.when, content))) continue;
    out.push({ key: r.key, name: value < 0 && r.negName ? r.negName : r.name, value });
  }
  return out;
}

/** Nhân quả: a number once seen for what it is, else what people say. */
export function karmaView(state: GameState, content: Content): { label: string; value: number | null; text: string | null } | null {
  const k = content.statLabels?.karma;
  if (!k) return null;
  if (meets(state, k.showWhen, content)) return { label: k.label, value: Math.round(state.social.karma), text: null };
  const rumor = k.rumors.find((r) => state.social.karma >= r.min) ?? k.rumors.at(-1)!;
  return { label: k.label, value: null, text: rumor.text };
}

/** Nội lực: progress toward the next martial stage, for a mortal on the martial path (null otherwise). */
export function innerForce(state: GameState, content: Content): { label: string; term?: string; pct: number; stage: string | null } | null {
  if (state.cult.realm !== 'pham_nhan' || (state.martial.stage < 0 && state.martial.years === 0)) return null;
  const m = martialView(state, content);
  const label = content.statLabels?.innerForce ?? { label: 'Nội lực' };
  const pct = m.next ? Math.min(100, Math.round((m.years / Math.max(1, m.need)) * 100)) : 100;
  return { ...label, pct, stage: m.stage };
}
