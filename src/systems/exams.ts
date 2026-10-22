// 10.2 Khoa cử: thi huyện → thi viện → thi Hương → thi Hội → thi Đình (bảng tra 9.10).
// Each sitting is a short trường thi mini-game: `rounds` rounds, each picking one of three ways to write,
// maybe one incident (gian lận, vu oan, đề lạ). Levels, đề and texts: content/exams.json; numbers: balance.exams.
// Rolls use side streams (seed:exam:…), so the life's own rng stays where it was.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { ExamSitting, GameState, LogLine } from '../core/types';
import { applyOutcome } from './events/engine';
import { schoolOf } from './schooling';

type Exam = NonNullable<GameState['exam']>;

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fill = (t: string, ctx: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => String(ctx[k] ?? m));

/** A fresh record; `cycle` places the life's calendar so the thi Hương years differ between lives. */
export function freshExam(seed: string): Exam {
  return { rank: -1, fails: 0, placing: null, cycle: new Rng(`${seed}:exam-cal`).int(0, 2), last: {}, sitting: null };
}

export const examOf = (state: GameState): Exam => state.exam ?? freshExam(state.seed);

const levels = (content: Content) => content.exams?.levels ?? [];
export const levelIndex = (content: Content, id: string) => levels(content).findIndex((l) => l.id === id);

/** The next level this life can try (null at the top or without exams). */
export function nextLevel(state: GameState, content: Content) {
  return levels(content)[examOf(state).rank + 1] ?? null;
}

/** The highest level passed, or null. */
export function passedLevel(state: GameState, content: Content) {
  return levels(content)[examOf(state).rank] ?? null;
}

/** Whether a level is held this year, else in how many years (null = not while the times stay so). */
export function examHeld(state: GameState, content: Content, levelId: string): { held: boolean; inYears: number | null } {
  const cfg = content.balance.exams;
  const lv = cfg?.levels[levelId];
  if (!cfg || !lv || lv.interval === 0) return { held: false, inYears: null };
  const phase = state.times?.phase ?? '';
  if (cfg.anKhoaPhases.includes(phase)) return { held: true, inYears: 0 };
  if (cfg.closedPhases.includes(phase) && !cfg.openLevels.includes(levelId)) return { held: false, inYears: null };
  const left = (lv.interval - ((state.character.age + examOf(state).cycle + lv.offset) % lv.interval)) % lv.interval;
  return { held: left === 0, inYears: left };
}

/** Why the next exam cannot be sat this year (null when it can). */
export function examBlocked(state: GameState, content: Content): string | null {
  const cfg = content.balance.exams;
  const lv = nextLevel(state, content);
  if (!cfg || !lv) return 'Đã đỗ tới bậc cao nhất.';
  const n = cfg.levels[lv.id];
  const ex = examOf(state);
  if (!state.alive || state.cult.realm !== 'pham_nhan') return 'Người tu tiên không dự khoa cử.';
  if (ex.sitting) return 'Đang trong trường thi.';
  if (state.character.age < n.minAge) return `Đủ ${n.minAge} tuổi mới dự ${lv.name}.`;
  if (schoolOf(state).grade < n.minGrade) return `Học lực cần ${n.minGrade} mới dự ${lv.name}.`;
  if (ex.last[lv.id] === state.character.age) return `Năm nay đã dự ${lv.name}.`;
  const held = examHeld(state, content, lv.id);
  if (!held.held) return held.inYears === null ? `Thời buổi này triều đình không mở ${lv.name}.` : `${lv.name} còn ${held.inYears} năm nữa mới mở.`;
  if (state.money.silver < n.fee) return `Lộ phí ${n.fee} lạng bạc.`;
  return null;
}

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return log;
}

function open(state: GameState, content: Content, levelId: string): GameState {
  const cfg = content.balance.exams!;
  const file = content.exams!;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:exam:${age}:${levelId}`);
  const prompts = rng.shuffle(file.prompts.slice()).slice(0, cfg.rounds);
  const fits = file.incidents.filter((i) => i.levels.length === 0 || i.levels.includes(levelId));
  const incident = fits.length && rng.chance(cfg.incidentChance) ? rng.pick(fits).id : null;
  const sitting: ExamSitting = { level: levelId, round: 0, score: 0, prompts, incident, incidentRound: rng.int(0, cfg.rounds - 1), lines: [] };
  const ex = examOf(state);
  const name = levels(content).find((l) => l.id === levelId)?.name ?? levelId;
  const s: GameState = { ...state, exam: { ...ex, sitting, last: { ...ex.last, [levelId]: age } } };
  return { ...s, log: pushLines(s, [{ text: fill(file.texts.begin, { level: name }), tone: 'normal' }]) };
}

/** Lều chõng đi thi: pay the lộ phí and open the trường thi (the year waits for it). */
export function beginExam(state: GameState, content: Content): GameState {
  const lv = nextLevel(state, content);
  if (!lv || examBlocked(state, content)) return state;
  const fee = content.balance.exams!.levels[lv.id].fee;
  return open({ ...state, money: { ...state.money, silver: state.money.silver - fee } }, content, lv.id);
}

function value(state: GameState, key: string): number {
  if (key === 'grade') return schoolOf(state).grade;
  if (key in state.stats) return state.stats[key as keyof GameState['stats']];
  return state.aptitudes[key as keyof GameState['aptitudes']] ?? 0;
}

/** Chance (0–1) that an approach scores in the sitting in progress. */
export function approachChance(state: GameState, content: Content, approachId: string): number {
  const cfg = content.balance.exams;
  const sit = examOf(state).sitting;
  const a = cfg?.approaches[approachId];
  if (!cfg || !sit || !a) return 0;
  const sum = Object.entries(a.weights).reduce((acc, [k, w]) => acc + w * value(state, k), a.base);
  const p = sum - cfg.levels[sit.level].penalty - (cfg.phasePenalty[state.times?.phase ?? ''] ?? 0);
  return Math.max(cfg.chanceMin, Math.min(cfg.chanceMax, p));
}

/** What the trường thi card shows. */
export function examView(state: GameState, content: Content) {
  const sit = examOf(state).sitting;
  const file = content.exams;
  const cfg = content.balance.exams;
  if (!sit || !file || !cfg) return null;
  const level = levels(content).find((l) => l.id === sit.level)!;
  const incident = sit.incident && sit.round === sit.incidentRound ? file.incidents.find((i) => i.id === sit.incident) ?? null : null;
  return {
    level, round: sit.round, total: cfg.rounds, score: sit.score, passScore: cfg.levels[sit.level].passScore,
    prompt: fill(sit.prompts[sit.round] ?? '', { level: level.name }), lines: sit.lines, incident,
    approaches: file.approaches.map((a) => ({ id: a.id, name: a.name, hint: a.hint, win: cfg.approaches[a.id].win, lose: cfg.approaches[a.id].lose, pct: Math.round(approachChance(state, content, a.id) * 100) })),
  };
}

export interface ExamStep { state: GameState; text: string; done: boolean }

/** Answer this round with one way of writing. */
export function answerExam(state: GameState, content: Content, approachId: string): ExamStep | null {
  const view = examView(state, content);
  const sit = examOf(state).sitting;
  const a = content.exams?.approaches.find((x) => x.id === approachId);
  if (!view || !sit || view.incident || !a) return null;
  const cfg = content.balance.exams!.approaches[approachId];
  const rng = new Rng(`${state.seed}:exam:${state.character.age}:${sit.level}:${sit.round}`);
  const won = rng.chance(approachChance(state, content, approachId));
  const result = rng.pick(won ? a.winText : a.loseText);
  const line = fill(content.exams!.texts.round, { round: sit.round + 1, approach: a.name, result });
  const next: ExamSitting = { ...sit, round: sit.round + 1, score: sit.score + (won ? cfg.win : cfg.lose), lines: [...sit.lines, line] };
  const s: GameState = { ...state, exam: { ...examOf(state), sitting: next } };
  return next.round >= content.balance.exams!.rounds ? finish(s, content, false, line) : { state: s, text: line, done: false };
}

/** Answer the incident in this round (it comes before the round's writing). */
export function resolveIncident(state: GameState, content: Content, index: number): ExamStep | null {
  const view = examView(state, content);
  const sit = examOf(state).sitting;
  const choice = view?.incident?.choices[index];
  if (!view || !sit || !choice) return null;
  const rng = new Rng(`${state.seed}:exam-inc:${state.character.age}:${sit.level}`);
  const outcome = choice.risk && rng.chance(choice.risk.chance) ? choice.risk.outcome : choice.outcome;
  const applied = applyOutcome(state, content, { text: outcome.text, effects: outcome.effects }, rng);
  const next: ExamSitting = { ...sit, incident: null, score: sit.score + outcome.score, lines: [...sit.lines, applied.text] };
  const s: GameState = { ...applied.state, rng: state.rng, exam: { ...examOf(applied.state), sitting: next } };
  return outcome.disqualify ? finish(s, content, true, applied.text) : { state: s, text: applied.text, done: false };
}

/** Close the sitting: pass (title, flag, rewards; thi Hội leads straight into thi Đình) or fail. */
function finish(state: GameState, content: Content, disqualified: boolean, lastLine: string): ExamStep {
  const ex = examOf(state);
  const sit = ex.sitting!;
  const cfg = content.balance.exams!;
  const file = content.exams!;
  const idx = levelIndex(content, sit.level);
  const level = levels(content)[idx];
  const n = cfg.levels[sit.level];
  const passed = !disqualified && sit.score >= n.passScore;
  let s: GameState = state;
  const lines: LogLine[] = [];
  if (passed) {
    s = {
      ...s,
      exam: { ...ex, rank: Math.max(ex.rank, idx), sitting: null },
      flags: { ...s.flags, [level.flag]: true },
      money: { ...s.money, silver: s.money.silver + n.reward.silver },
      stats: { ...s.stats, happiness: clamp(s.stats.happiness + n.reward.happiness) },
      social: { ...s.social, reputation: { ...s.social.reputation, lang_xa: s.social.reputation.lang_xa + n.reward.reputation } },
    };
    lines.push({ text: fill(file.texts.pass, { level: level.name, title: level.title }), tone: 'good' });
    // The last level ranks the top three.
    if (idx === levels(content).length - 1) {
      const place = cfg.placings.find((p) => sit.score >= p.minScore);
      const def = file.placings.find((p) => p.id === place?.id);
      if (def) {
        s = { ...s, exam: { ...examOf(s), placing: def.id } };
        lines.push({ text: fill(file.texts.placing, { placing: def.name, hometown: s.character.hometown }), tone: 'rare' });
      }
    }
  } else {
    s = { ...s, exam: { ...ex, fails: ex.fails + 1, sitting: null }, stats: { ...s.stats, happiness: clamp(s.stats.happiness + cfg.failHappiness) } };
    lines.push({ text: fill(disqualified ? file.texts.disqualified : file.texts.fail, { level: level.name }), tone: 'bad' });
  }
  s = { ...s, log: pushLines(s, lines) };
  const after = levels(content)[idx + 1];
  // Thi Đình (interval 0) follows the thi Hội at once.
  if (passed && after && cfg.levels[after.id]?.interval === 0) s = open(s, content, after.id);
  return { state: s, text: [lastLine, ...lines.map((l) => l.text)].join(' '), done: !s.exam?.sitting };
}

/** "Cử nhân · trượt 2 lần" for the profile; null before any exam. */
export function examLine(state: GameState, content: Content): string | null {
  const ex = examOf(state);
  const lv = passedLevel(state, content);
  const place = content.exams?.placings.find((p) => p.id === ex.placing);
  const fails = ex.fails ? ` · trượt ${ex.fails} lần` : '';
  if (lv) return `${lv.title}${place ? ` (${place.name})` : ''}${fails}`;
  return ex.fails ? `Chưa đỗ khoa nào${fails}` : null;
}

/** End-of-life title of a Đình placing. */
export function examTitle(state: GameState, content: Content): string | null {
  const ex = examOf(state);
  return content.exams?.placings.find((p) => p.id === ex.placing)?.title ?? null;
}
