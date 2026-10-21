// 9.5 Thời cuộc: the living world of world-state.json. World variables (triều cục, mùa màng, trị an, ôn
// dịch, biên ải, chính ma…) drift each year toward the targets of the pha thời thế; the phases follow one
// another (Thịnh thế → Trung suy → Loạn thế → Tân triều); a dynasty reigns under niên hiệu. Everything runs
// on its own seeded stream (seed:times:age), so the life's own dice are untouched. The log names each year
// by its niên hiệu and gets a "Thời cuộc" line only when something big changes.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { WorldStateFile } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';

export type Times = NonNullable<GameState['times']>;
type Phase = WorldStateFile['phases'][number];

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fill = (t: string, ctx: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k: string) => ctx[k] ?? m);

function pickEra(file: WorldStateFile, times: Times | null, rng: Rng): string {
  const used = new Set(times?.eras.map((e) => e.era) ?? []);
  const fresh = file.eraNames.filter((n) => !used.has(n) && n !== times?.era);
  return rng.pick(fresh.length > 0 ? fresh : file.eraNames.filter((n) => n !== times?.era));
}

/** The world as the life is born into it (also for saves from before 9.5, at their current age). */
export function initTimes(seed: string, content: Content, age: number): Times | undefined {
  const file = content.worldState;
  if (!file) return undefined;
  const rng = new Rng(`${seed}:times:init`);
  const phase = rng.pick(file.phases);
  const vars: Record<string, number> = {};
  for (const v of file.vars) vars[v.id] = clamp(rng.int(v.start[0], v.start[1]));
  const era = pickEra(file, null, rng);
  // Born some years into the reign.
  const eraFrom = age - rng.int(0, 20);
  const reign = rng.int(file.reignYears[0], file.reignYears[1]);
  return {
    phase: phase.id, phaseLeft: rng.int(1, phase.years[1]), vars, notes: {},
    dynasty: file.dynasties[0], era, eraFrom, reignLeft: Math.max(1, reign - (age - eraFrom)),
    eras: [{ dynasty: file.dynasties[0], era, from: eraFrom }],
  };
}

export function currentPhase(state: GameState, content: Content): Phase | undefined {
  return content.worldState?.phases.find((p) => p.id === state.times?.phase);
}

/** "Thái An năm thứ 12" for an age of this life (null before the world has a calendar). */
export function eraLabel(state: GameState, age: number): string | null {
  const eras = state.times?.eras ?? [];
  const e = [...eras].reverse().find((x) => x.from <= age);
  return e ? `${e.era} năm thứ ${age - e.from + 1}` : null;
}

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** One year of the world. */
export function timesYear(state: GameState, content: Content): GameState {
  const file = content.worldState;
  if (!file) return state;
  const age = state.character.age;
  let t = state.times ?? initTimes(state.seed, content, age)!;
  const rng = new Rng(`${state.seed}:times:${age}`);
  const lines: LogLine[] = [];
  const say = (text: string) => lines.push({ text: `Thời cuộc: ${text}`, tone: 'normal' });

  // Phase and throne.
  if (t.phaseLeft > 1) t = { ...t, phaseLeft: t.phaseLeft - 1 };
  else {
    const cur = file.phases.find((p) => p.id === t.phase) ?? file.phases[0];
    const options = Object.entries(cur.next).filter(([id]) => file.phases.some((p) => p.id === id));
    const nextId = options.length > 0 ? rng.weighted(options, ([, w]) => w)[0] : cur.id;
    const next = file.phases.find((p) => p.id === nextId)!;
    t = { ...t, phase: next.id, phaseLeft: rng.int(next.years[0], next.years[1]) };
    say(fill(file.texts.phase, { phase: next.name, text: next.text }));
    if (next.newDynasty) {
      const old = t.dynasty;
      // A long life outlasts the list: dynasties come back (never the one that just fell).
      const fresh = file.dynasties.filter((d) => d !== old && !t.eras.some((e) => e.dynasty === d));
      const dynasty = rng.pick(fresh.length > 0 ? fresh : file.dynasties.filter((d) => d !== old));
      const era = pickEra(file, t, rng);
      t = { ...t, dynasty, era, eraFrom: age, reignLeft: rng.int(file.reignYears[0], file.reignYears[1]), eras: [...t.eras, { dynasty, era, from: age }] };
      say(fill(file.texts.newDynasty, { old, dynasty, era }));
    }
  }
  if (t.eraFrom !== age) {
    if (t.reignLeft > 1) t = { ...t, reignLeft: t.reignLeft - 1 };
    else {
      const era = pickEra(file, t, rng);
      t = { ...t, era, eraFrom: age, reignLeft: rng.int(file.reignYears[0], file.reignYears[1]), eras: [...t.eras, { dynasty: t.dynasty, era, from: age }] };
      say(fill(file.texts.newEra, { dynasty: t.dynasty, era }));
    }
  }

  // Variables drift toward the phase's targets; crossing a note's line is told once.
  const phase = file.phases.find((p) => p.id === t.phase);
  const vars = { ...t.vars };
  const notes = { ...t.notes };
  for (const v of file.vars) {
    const target = phase?.targets[v.id] ?? v.mean;
    const prev = vars[v.id] ?? v.mean;
    const val = clamp(Math.round(prev + (target - prev) * v.pull + rng.int(-Math.round(v.drift), Math.round(v.drift))));
    vars[v.id] = val;
    if (v.low && val <= v.low.at && notes[v.id] !== 'low') { notes[v.id] = 'low'; say(v.low.text); }
    else if (v.high && val >= v.high.at && notes[v.id] !== 'high') { notes[v.id] = 'high'; say(v.high.text); }
    // Back to ordinary times: the next crossing is news again.
    else if ((!v.low || val > v.low.at + 10) && (!v.high || val < v.high.at - 10)) notes[v.id] = null;
  }
  t = { ...t, vars, notes };
  return { ...state, times: t, log: pushLines(state, lines) };
}

/** Theme multiplier from the pha thời thế. */
export function timesThemeMultiplier(state: GameState, content: Content, themes: string[]): number {
  const p = currentPhase(state, content);
  return p ? themes.reduce((m, th) => m * (p.eventWeight[th] ?? 1), 1) : 1;
}

/** Price multiplier from the world variables (mất mùa, chiến sự…). */
export function timesPriceMul(state: GameState, content: Content): number {
  const file = content.worldState;
  const t = state.times;
  if (!file || !t) return 1;
  return file.prices.reduce((m, p) => {
    const v = t.vars[p.var] ?? 50;
    return m * (p.at0 + ((p.at100 - p.at0) * v) / 100);
  }, 1);
}

/** One line for the market: how dear things are now, or null when prices are ordinary. */
export function priceNote(state: GameState, content: Content): string | null {
  const mul = timesPriceMul(state, content);
  const pct = Math.round((mul - 1) * 100);
  if (Math.abs(pct) < 5) return null;
  const phase = currentPhase(state, content);
  return `Thời giá${phase ? ` (${phase.name})` : ''}: hàng hóa ${pct > 0 ? `đắt hơn thường ${pct}%` : `rẻ hơn thường ${-pct}%`}.`;
}

const COUNT_WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

/** Niên biểu for the end of life: "Sinh năm Thái An thứ 3, mất năm Hưng Vũ thứ 7, trải hai triều." */
export function lifeEraLine(state: GameState): string | null {
  const t = state.times;
  if (!t || t.eras.length === 0) return null;
  const born = eraLabel(state, 0);
  const end = eraLabel(state, state.character.age);
  if (!born || !end) return null;
  const dynasties = [...new Set(t.eras.map((e) => e.dynasty))];
  const n = dynasties.length;
  const reigns = n > 1 ? `, trải ${COUNT_WORDS[n] ?? n} triều (${dynasties.join(', ')})` : `, trọn một đời trong triều ${dynasties[0]}`;
  const verb = state.alive ? 'nay là năm' : 'mất năm';
  return `Sinh năm ${born.replace(' năm thứ ', ' thứ ')}, ${verb} ${end.replace(' năm thứ ', ' thứ ')}${reigns}.`;
}
