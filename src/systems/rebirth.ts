// Luân hồi (task 5b.1): the full end-of-life recap and the Luân Hồi points a life earns.
// Points are kept across lives in the save meta (save.ts creditRebirth); what they buy
// (thiên phú luân hồi, cầu đầu thai…) comes in later tasks.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { careerLabel } from './career';
import { realmLabel } from './cultivation';
import { sectLabel } from './sect';
import { wishesMet } from './achievements';

export interface RecapLine { label: string; value: string }
export interface PointLine { label: string; points: number }

/** Facts of the life for the death screen, beyond the short summary (time.ts lifeSummary). */
export function lifeRecap(state: GameState, content: Content): RecapLine[] {
  const lines: RecapLine[] = [{ label: 'Cảnh giới', value: realmLabel(state, content) }];
  const sect = sectLabel(state, content);
  if (sect) lines.push({ label: 'Tông môn', value: sect });
  if (state.clan) lines.push({ label: 'Gia tộc', value: state.clan.name });
  const partner = state.npcs.find((n) => n.id === state.romance.partner);
  if (partner) lines.push({ label: 'Đạo lữ', value: partner.name });
  const children = state.family.filter((r) => r.role === 'child').length;
  if (children > 0) lines.push({ label: 'Con cái', value: `${children}` });
  const disciples = state.npcs.filter((n) => n.disciple).length;
  if (disciples > 0) lines.push({ label: 'Đệ tử', value: `${disciples}` });
  if (state.ranking.rank !== null) lines.push({ label: 'Thiên kiêu bảng', value: `Hạng ${state.ranking.rank}` });
  const career = careerLabel(state, content);
  if (career) lines.push({ label: 'Đường đời', value: career });
  if (state.money.spiritStones > 0) lines.push({ label: 'Linh thạch', value: `${state.money.spiritStones}` });
  return lines;
}

/**
 * The moments worth remembering, in order of age, at most `max` (6b.12, lỗi #19). A line that came
 * more than once in this life is not memorable. Rare lines and lines that name a realm (a big
 * breakthrough) come first; among equals the later one wins.
 */
export function lifeHighlights(state: GameState, max: number, content?: Content): string[] {
  const realms = (content?.cultivation.realms.realms ?? []).filter((r) => r.id !== 'pham_nhan').map((r) => r.name);
  const count = new Map<string, number>();
  for (const y of state.log) for (const l of y.lines) count.set(l.text, (count.get(l.text) ?? 0) + 1);
  const picks: { age: number; text: string; score: number; order: number }[] = [];
  let order = 0;
  for (const y of state.log) {
    for (const l of y.lines) {
      order++;
      if (count.get(l.text)! > 1) continue;
      const milestone = realms.some((r) => l.text.includes(r));
      if (l.tone !== 'rare' && !(l.tone === 'good' && milestone)) continue;
      picks.push({ age: y.age, text: l.text, score: (l.tone === 'rare' ? 3 : 1) + (milestone ? 3 : 0), order });
    }
  }
  return picks
    .sort((a, b) => b.score - a.score || b.order - a.order)
    .slice(0, max)
    .sort((a, b) => a.order - b.order)
    .map((p) => `${p.age} tuổi: ${p.text}`);
}

/** Luân Hồi points this life earns, line by line (balance.rebirth). */
export function rebirthPoints(state: GameState, content: Content): { lines: PointLine[]; total: number } {
  const b = content.balance.rebirth;
  const age = state.death?.age ?? state.character.age;
  const realms = content.cultivation.realms.realms;
  const realmIndex = Math.max(0, realms.findIndex((r) => r.id === state.cult.realm));
  const raw: PointLine[] = [
    { label: 'Năm tháng đã sống', points: Math.floor(age / b.yearsPerPoint) },
    { label: 'Cảnh giới', points: realmIndex > 0 ? realmIndex * b.perRealm + state.cult.stage * b.perStage : 0 },
    { label: 'Võ đạo', points: realmIndex === 0 ? (state.martial.stage + 1) * b.perMartialStage : 0 },
    { label: 'Đường đời', points: state.career.id ? (state.career.rung + 1) * b.perCareerRung : 0 },
    { label: 'Biến cố đã trải', points: Math.floor(Object.keys(state.events.history).length / b.eventsPerPoint) },
    { label: state.social.karma >= 0 ? 'Đại thiện' : 'Đại ác', points: Math.abs(state.social.karma) >= b.karmaAt ? b.karmaPoints : 0 },
    { label: 'Con cái', points: state.family.filter((r) => r.role === 'child').length * b.perChild },
    { label: 'Khai tông lập phái', points: state.ownSect ? b.ownSect : 0 },
    { label: 'Lập gia tộc', points: state.clan && state.clan.founder === state.character.name ? b.clan : 0 },
    { label: 'Lên Thiên kiêu bảng', points: state.ranking.rank !== null ? b.ranked : 0 },
  ];
  // 6c.8: each di nguyện fulfilled.
  for (const w of wishesMet(state, content)) raw.push({ label: `Di nguyện: ${w.name}`, points: b.wish });
  const lines = raw.filter((l) => l.points > 0);
  return { lines, total: lines.reduce((s, l) => s + l.points, 0) };
}

export interface OriginOption { id: string; cost: number; affordable: boolean }

/** Task 5b.9 Cầu đầu thai: what choosing each origin costs, given the points kept. */
export function originOptions(content: Content, points: number): OriginOption[] {
  return content.origins.map((o) => ({ id: o.id, cost: o.rebirthCost ?? 0, affordable: (o.rebirthCost ?? 0) <= points }));
}

/** Points a new life costs: only a chosen origin with a price (leaving it to fate is free). */
export function newLifeCost(content: Content, originId: string | undefined): number {
  return originId ? content.origins.find((o) => o.id === originId)?.rebirthCost ?? 0 : 0;
}
