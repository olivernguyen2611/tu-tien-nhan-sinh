// 11.5 Võ lâm đại hội và minh chủ (content/wulin.json): every balance.wulin.every years (the cycle set by the
// life's seed) the võ lâm holds a đại hội. A known fighter may contest it: vòng loại, đấu bảng, chung kết, each a
// contest of chiến lực against a stronger field; the one left standing is minh chủ. A minh chủ draws a stipend and
// holds uy vọng (0–100), which events raise or lower; at 0 the minh chủ is deposed, and the seat must be defended
// at the next đại hội or it passes on. Rolls use side streams. Numbers: balance.wulin.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { combatPower } from './combat';
import { addRenown } from './jianghu';

type Wulin = NonNullable<GameState['wulin']>;
const EMPTY: Wulin = { last: null, best: 0, leader: null, held: 0 };
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

export const wulinOf = (state: GameState): Wulin => state.wulin ?? EMPTY;

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

/** The year of the cycle this life's world holds its đại hội in (0 … every−1). */
function cycleOffset(state: GameState, every: number): number {
  return new Rng(`${state.seed}:wulin:cycle`).int(0, every - 1);
}

/** Is a đại hội held this year? */
export function wulinOpen(state: GameState, content: Content): boolean {
  const cfg = content.balance.wulin;
  return !!cfg && (state.character.age + cycleOffset(state, cfg.every)) % cfg.every === 0;
}

/** The field's chiến lực in round i (a võ giả of balance.wulin.foeStage[i], times foeMul[i]). */
export function foePower(content: Content, round: number): number {
  const cfg = content.balance.wulin!;
  const c = content.balance.combat;
  const base = content.balance.martial.combatPower[cfg.foeStage[round] ?? 0] ?? 1;
  return base * (c.physiqueBase + 50 / c.physiqueDivisor) * (cfg.foeMul[round] ?? 1);
}

/** Chance to win round i: p^k / (p^k + f^k). */
export function roundChance(state: GameState, content: Content, round: number): number {
  const k = content.balance.wulin!.sharpness;
  const p = Math.pow(combatPower(state, content), k);
  const f = Math.pow(foePower(content, round), k);
  return p / (p + f);
}

/** Contest the đại hội: rounds until the first defeat; all won makes (or keeps) the minh chủ. */
export function wulinTournament(state: GameState, content: Content): GameState {
  const cfg = content.balance.wulin;
  const file = content.wulin;
  if (!cfg || !file) return state;
  const age = state.character.age;
  const w = wulinOf(state);
  if (w.last === age) return state;
  const rng = new Rng(`${state.seed}:wulin:${age}`);
  const lines: LogLine[] = [];
  let wins = 0;
  for (let i = 0; i < file.rounds.length; i++) {
    const won = rng.chance(roundChance(state, content, i));
    const pool = won ? file.texts.roundWin : file.texts.roundLose;
    lines.push({ text: fill(rng.pick(pool), { round: file.rounds[i] }), tone: won ? 'good' : 'bad' });
    if (!won) break;
    wins++;
  }
  let s: GameState = { ...state, money: { ...state.money, silver: state.money.silver + (cfg.silver[wins] ?? 0) } };
  s = { ...s, stats: { ...s.stats, health: Math.max(1, s.stats.health - (wins < file.rounds.length ? cfg.loseHealth : 0)), happiness: Math.min(100, Math.max(0, s.stats.happiness + (cfg.happiness[wins] ?? 0))) } };
  s = addRenown(s, content, cfg.fame[wins] ?? 0, 0);
  const champion = wins === file.rounds.length;
  const wasLeader = !!w.leader;
  const leader = champion ? { since: age, prestige: wasLeader ? Math.max(w.leader!.prestige, cfg.prestigeStart) : cfg.prestigeStart } : w.leader;
  s = { ...s, wulin: { last: age, best: Math.max(w.best, wins), leader, held: w.held + (champion && !wasLeader ? 1 : 0) } };
  if (champion) lines.push({ text: wasLeader ? file.texts.defended : file.texts.champion, tone: 'rare' });
  return pushLines(s, lines);
}

/** Uy vọng ±; at 0 the minh chủ is deposed. */
export function addPrestige(state: GameState, content: Content, d: number): GameState {
  const w = wulinOf(state);
  const file = content.wulin;
  if (!w.leader || !file) return state;
  const prestige = Math.max(0, Math.min(100, w.leader.prestige + d));
  if (prestige <= 0) return pushLines({ ...state, wulin: { ...w, leader: null } }, [{ text: file.texts.deposed, tone: 'bad' }]);
  return { ...state, wulin: { ...w, leader: { ...w.leader, prestige } } };
}

/** Step down from the seat (in peace: some hiệp danh stays). */
export function wulinResign(state: GameState, content: Content): GameState {
  const w = wulinOf(state);
  const file = content.wulin;
  const cfg = content.balance.wulin;
  if (!w.leader || !file || !cfg) return state;
  return pushLines(addRenown({ ...state, wulin: { ...w, leader: null } }, content, cfg.stepDownFame, 0), [{ text: file.texts.stepDown, tone: 'normal' }]);
}

/** A minh chủ's year: the stipend, uy vọng drifting, the yearly report; a term not defended ends. */
export function wulinYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.wulin;
  const file = content.wulin;
  const w = state.wulin;
  if (!cfg || !file || !w?.leader || !state.alive) return state;
  const age = state.character.age;
  if (age - w.leader.since > cfg.every) {
    // The đại hội came and went without the minh chủ on the đài.
    return pushLines({ ...state, wulin: { ...w, leader: null } }, [{ text: file.texts.termOver, tone: 'normal' }]);
  }
  const rng = new Rng(`${state.seed}:wulin-year:${age}`);
  let s: GameState = { ...state, money: { ...state.money, silver: state.money.silver + cfg.stipend } };
  s = addPrestige(s, content, cfg.prestigeDrift);
  if (!s.wulin?.leader) return s;
  return pushLines(s, [{ text: fill(rng.pick(file.texts.report), { prestige: s.wulin.leader.prestige, silver: cfg.stipend }), tone: 'normal', ledger: true }]);
}

/** "Minh chủ võ lâm (uy vọng 64)" / "Đại hội: vào tới Chung kết" for the profile. */
export function wulinLine(state: GameState, content: Content): string | null {
  const w = state.wulin;
  const file = content.wulin;
  if (!w || !file) return null;
  if (w.leader) return `Minh chủ võ lâm, uy vọng ${w.leader.prestige}${w.held > 1 ? ` (lần thứ ${w.held})` : ''}`;
  if (w.held > 0) return `Từng làm minh chủ võ lâm ${w.held} lần`;
  if (w.last !== null) return `Đại hội võ lâm: ${w.best > 0 ? `qua ${file.rounds[w.best - 1]}` : 'bị loại ở vòng đầu'}`;
  return null;
}
