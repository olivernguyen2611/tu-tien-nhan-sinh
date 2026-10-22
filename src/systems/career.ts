// Mortal life paths (task 2.11, mortal-path.md mục 1 and 2.3): Quan, Thương,
// Võ lâm, Y, plus Tạp dịch tông môn for the rootless. Each has rungs climbed by
// stat checks every few years, a yearly income, and a title at the top.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { hookSum } from './cultivation';
import { extremeHasHook } from './extremes';
import { examOf, examTitle, levelIndex, passedLevel } from './exams';
import { officeSalary } from './office';
import { reignTitle } from './throne';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function careerDef(content: Content, id: string | null) {
  return id ? content.careers.careers.find((c) => c.id === id) : undefined;
}

/** Hooks from the life's current career (e.g. Tạp dịch: kỳ vật events ×3). */
export function careerHooks(state: GameState, content: Content): EffectHook[] {
  return careerDef(content, state.career.id)?.effects ?? [];
}

function value(state: GameState, key: string): number {
  return key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];
}

const usableRoot = (state: GameState, content: Content) =>
  !!state.cult.root && (content.balance.roots.gradeSpeed[state.cult.root.grade] ?? 0) > 0;

export interface CareerView {
  id: string;
  name: string;
  description: string;
  current: boolean;
  blocked: string | null;
}

export function careerViews(state: GameState, content: Content): CareerView[] {
  const [minAge, maxAge] = content.balance.careers.joinAge;
  return content.careers.careers.map((c) => {
    const current = state.career.id === c.id;
    let blocked: string | null = null;
    if (!state.alive) blocked = 'Đã hết một đời.';
    else if (state.cult.realm !== 'pham_nhan') blocked = 'Đã bước vào tu tiên, chuyện phàm trần gác lại.';
    else if (current) blocked = null;
    else if (extremeHasHook(state, content, 'cannotWork')) blocked = 'Thân thể thế này, chưa làm nổi việc gì.';
    else if (state.character.age < minAge) blocked = `Đủ ${minAge} tuổi mới chọn được đường đời.`;
    else if (state.character.age > maxAge) blocked = 'Tuổi đã cao, khó bắt đầu lại.';
    else if (c.requires.rootless && (!state.cult.root || usableRoot(state, content))) blocked = 'Chỉ dành cho người đã thử mà không có linh căn.';
    else if (c.requires.examRank && examOf(state).rank < levelIndex(content, c.requires.examRank)) blocked = `Phải đỗ ${content.exams?.levels.find((l) => l.id === c.requires.examRank)?.title ?? 'khoa cử'} mới đi được đường này.`;
    return { id: c.id, name: c.name, description: c.description, current, blocked };
  });
}

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** 10.2: the rung a career starts at (a Tiến sĩ enters Quan lộ higher). */
export function entryRung(state: GameState, content: Content, careerId: string): number {
  const career = careerDef(content, careerId);
  const passed = passedLevel(state, content);
  const rung = passed && career ? career.entryByExam[passed.id] ?? 0 : 0;
  return Math.min(rung, (career?.rungs.length ?? 1) - 1);
}

/** Take up a career (leaving the current one starts over). Null when not allowed now. */
export function joinCareer(state: GameState, content: Content, careerId: string): { state: GameState; text: string } | null {
  const view = careerViews(state, content).find((v) => v.id === careerId);
  const career = careerDef(content, careerId);
  if (!view || view.blocked || view.current || !career) return null;
  const texts = content.careers;
  const lines: LogLine[] = [];
  const old = careerDef(content, state.career.id);
  if (old) lines.push({ text: texts.leaveText.replaceAll('{career}', old.name), tone: 'normal' });
  const rung = entryRung(state, content, careerId);
  lines.push({ text: texts.joinText.replaceAll('{career}', career.name).replaceAll('{rung}', career.rungs[rung]), tone: 'good' });
  const next: GameState = { ...state, career: { id: careerId, rung, since: state.character.age } };
  return { state: { ...next, log: addLines(next, lines) }, text: lines.map((l) => l.text).join(' ') };
}

/** Promotion chance at the current rung (0 when at the top or too soon). */
export function promotionChance(state: GameState, content: Content): number {
  const career = careerDef(content, state.career.id);
  const cfg = content.balance.careers;
  if (!career || state.career.rung >= career.rungs.length - 1) return 0;
  // 12.2: quan trường promotes by chính tích (office.ts).
  if (career.id === content.office?.career) return 0;
  if (state.character.age - state.career.since < cfg.yearsPerRung) return 0;
  const avg = career.mainStats.reduce((sum, k) => sum + value(state, k), 0) / career.mainStats.length;
  const difficulty = cfg.difficulty[Math.min(state.career.rung, cfg.difficulty.length - 1)];
  const bonus = career.bonusFlags.some((f) => state.flags[f]) || career.bonusOrigins.includes(state.character.originId) ? cfg.bonusChance : 0;
  const p = cfg.promoteBase + (avg - difficulty) * cfg.promotePerPoint + bonus;
  return Math.max(cfg.promoteMin, Math.min(cfg.promoteMax, p));
}

export function careerIncome(state: GameState, content: Content): number {
  if (!careerDef(content, state.career.id)) return 0;
  // 12.2: an official is paid by rank (office.ts).
  if (state.career.id === content.office?.career) return Math.max(0, Math.round(officeSalary(state, content) * (1 + hookSum(state, content, 'incomePct'))));
  const income = content.balance.careers.income;
  const base = income[Math.min(state.career.rung, income.length - 1)];
  return Math.max(0, Math.round(base * (1 + hookSum(state, content, 'incomePct'))));
}

/** Yearly step for mortals in a career: income, maybe a promotion, Tạp dịch eavesdropping. */
export function careerYear(state: GameState, content: Content): GameState {
  const career = careerDef(content, state.career.id);
  if (!state.alive || !career || state.cult.realm !== 'pham_nhan') return state;
  const rng = Rng.fromState(state.rng);
  const lines: LogLine[] = [];
  // 10.3: while the life holds a job, the job pays (the larger of the two, see jobYear).
  const income = state.job?.id ? 0 : careerIncome(state, content);
  let s: GameState = { ...state, money: { ...state.money, silver: state.money.silver + income } };

  if (rng.chance(promotionChance(s, content))) {
    const rung = s.career.rung + 1;
    s = { ...s, career: { ...s.career, rung, since: s.character.age } };
    lines.push({ text: career.promoteText.replaceAll('{rung}', career.rungs[rung]), tone: rung === career.rungs.length - 1 ? 'rare' : 'good' });
  }
  if (career.requires.rootless && rng.chance(content.balance.careers.eavesdropChance)) {
    s = { ...s, aptitudes: { ...s.aptitudes, comprehension: clamp(s.aptitudes.comprehension + 1) } };
    lines.push({ text: content.careers.eavesdropText, tone: 'good' });
  }
  return { ...s, rng: rng.getState(), log: addLines(s, lines) };
}

/** "Tú tài", "Phú hộ"… for the profile; null without a career. */
export function careerLabel(state: GameState, content: Content): string | null {
  const career = careerDef(content, state.career.id);
  return career ? `${career.name} · ${career.rungs[state.career.rung]}` : null;
}

/** End-of-life titles (death screen): top of a ladder, a long mortal life. */
export function lifeTitles(state: GameState, content: Content): string[] {
  const out: string[] = [];
  const career = careerDef(content, state.career.id);
  if (career?.title && state.career.rung >= career.rungs.length - 1) out.push(career.title);
  const crown = reignTitle(state, content);
  if (crown) out.push(crown);
  const placed = examTitle(state, content);
  if (placed) out.push(placed);
  if (state.cult.realm === 'pham_nhan' && state.character.age >= content.balance.careers.longLifeAge) out.push(content.careers.longLifeTitle);
  return out;
}

// ---------- Task 2.8: event effects on careers ----------

/** Put the life on a career path from an event (the join-age window does not apply). */
export function forceJoinCareer(state: GameState, content: Content, careerId: string): GameState {
  const career = careerDef(content, careerId);
  if (!career || state.career.id === careerId || state.cult.realm !== 'pham_nhan') return state;
  if (career.requires.rootless && (!state.cult.root || usableRoot(state, content))) return state;
  const rung = entryRung(state, content, careerId);
  const text = content.careers.joinText.replaceAll('{career}', career.name).replaceAll('{rung}', career.rungs[rung]);
  const next: GameState = { ...state, career: { id: careerId, rung, since: state.character.age } };
  return { ...next, log: addLines(next, [{ text, tone: 'good' }]) };
}

/** One rung up the current career (exams, a shop, a cure…). */
export function promoteCareer(state: GameState, content: Content): GameState {
  const career = careerDef(content, state.career.id);
  if (!career || state.career.rung >= career.rungs.length - 1) return state;
  const rung = state.career.rung + 1;
  const next: GameState = { ...state, career: { ...state.career, rung, since: state.character.age } };
  return { ...next, log: addLines(next, [{ text: career.promoteText.replaceAll('{rung}', career.rungs[rung]), tone: 'good' }]) };
}

export function leaveCareer(state: GameState): GameState {
  return state.career.id ? { ...state, career: { id: null, rung: 0, since: 0 } } : state;
}
