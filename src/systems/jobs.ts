// 10.3 Việc làm: ~30 nghề in 8 nhóm (content/jobs.json), each a short ladder. Hiệu suất (0–100) drifts toward
// what the main stats make of it and is pushed by work activities; high hiệu suất earns a rung, low gets the
// life fired. The boss and đồng liêu are real acquaintances. A job's top rung leads onto the matching đường đời
// of 2.11 (its peak). Numbers: balance.jobs. Yearly rolls use the stream seed:job:age.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { careerDef, careerIncome } from './career';
import { hookSum } from './cultivation';
import { meets } from './events/conditions';
import { extremeHasHook } from './extremes';
import { meetAside, schoolOf } from './schooling';

type Job = NonNullable<GameState['job']>;
const EMPTY_JOB: Job = { id: null, rung: 0, perf: 0, years: 0, boss: null, mates: [], since: 0, past: [] };
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fill = (t: string, ctx: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => String(ctx[k] ?? m));

export const jobOf = (state: GameState): Job => state.job ?? EMPTY_JOB;
export const jobDef = (content: Content, id: string | null | undefined) => content.jobs?.jobs.find((j) => j.id === id);
export const jobGroup = (content: Content, id: string | null | undefined) => content.jobs?.groups.find((g) => g.id === id);

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return log;
}

function value(state: GameState, key: string): number {
  return key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];
}

/** Why this job is closed to the life now (null = open). */
export function jobBlocked(state: GameState, content: Content, jobId: string): string | null {
  const def = jobDef(content, jobId);
  const cfg = content.balance.jobs;
  if (!def || !cfg) return 'Không có nghề này.';
  if (!state.alive) return 'Đã hết một đời.';
  if (state.cult.realm !== 'pham_nhan') return 'Đã bước vào tu tiên, chuyện phàm trần gác lại.';
  if (jobOf(state).id === jobId) return 'Đang làm nghề này.';
  if (extremeHasHook(state, content, 'cannotWork')) return 'Thân thể thế này, chưa làm nổi việc gì.';
  if (schoolOf(state).at) return 'Đang đi học.';
  if (state.law?.jail) return 'Đang ở trong ngục.';
  if ((state.law?.convictions ?? 0) > 0 && content.balance.law?.recordBars.includes(jobId)) return 'Có tiền án, nghề này không nhận.';
  const hurt = (state.body?.injuries ?? []).map((i) => content.health?.injuries.find((x) => x.id === i)).find((d) => d?.bars.includes(jobId));
  if (hurt) return `${hurt.name}, nghề này không làm được.`;
  const fired = jobOf(state).past.find((p) => p.id === jobId && p.why === 'fired' && state.character.age - p.left < cfg.rehireYears);
  if (fired) return 'Mới bị đuổi, người trong nghề chưa ai chịu nhận lại.';
  if (!meets(state, def.requires, content)) return def.requiresText ?? 'Chưa đủ điều kiện.';
  return null;
}

export interface JobView { id: string; name: string; group: string; description: string; pay: number; months: number; current: boolean; blocked: string | null }

/** Every job, in jobs.json order, with why it is closed. */
export function jobViews(state: GameState, content: Content): JobView[] {
  return (content.jobs?.jobs ?? []).map((j) => ({
    id: j.id, name: j.name, group: j.group, description: j.description, pay: j.pay[0], months: j.months,
    current: jobOf(state).id === j.id, blocked: jobOf(state).id === j.id ? null : jobBlocked(state, content, j.id),
  }));
}

/** Leave the job held now (quit, retire or fired). */
export function quitJob(state: GameState, content: Content, why: 'quit' | 'retire' | 'fired'): GameState {
  const j = jobOf(state);
  const def = jobDef(content, j.id);
  if (!def || !j.id) return state;
  const s: GameState = { ...state, job: { ...EMPTY_JOB, past: [...j.past, { id: j.id, rung: j.rung, left: state.character.age, why }] } };
  const text = content.jobs!.texts[why];
  return { ...s, log: pushLines(s, [{ text: fill(text, { job: def.name, rung: def.rungs[j.rung] }), tone: why === 'fired' ? 'bad' : 'normal' }]) };
}

/** Take a job: the boss and đồng liêu become acquaintances. Null when it is closed. */
export function takeJob(state: GameState, content: Content, jobId: string): { state: GameState; text: string } | null {
  const def = jobDef(content, jobId);
  const cfg = content.balance.jobs;
  if (!def || !cfg || jobBlocked(state, content, jobId)) return null;
  let s = jobOf(state).id ? quitJob(state, content, 'quit') : state;
  const rng = new Rng(`${state.seed}:job-in:${state.character.age}:${jobId}`);
  const boss = meetAside(s, content, rng, { role: def.bossRole, kind: 'chu', age: state.character.age + rng.int(5, 25), affinity: 45, root: false });
  s = boss.state;
  const mates: string[] = [];
  for (let i = 0; i < cfg.colleagues; i++) {
    const m = meetAside(s, content, rng, { role: def.mateRole, kind: 'dong_lieu', peer: true, affinity: rng.int(40, 60), root: false });
    s = m.state;
    mates.push(m.id);
  }
  s = { ...s, job: { ...jobOf(s), id: jobId, rung: 0, perf: cfg.perfStart, years: 0, boss: boss.id, mates, since: s.character.age } };
  const text = fill(content.jobs!.texts.hired, { job: def.name, rung: def.rungs[0], boss: s.npcs.find((n) => n.id === boss.id)?.name ?? '' });
  return { state: { ...s, log: pushLines(s, [{ text, tone: 'good' }]) }, text };
}

export function addPerf(state: GameState, delta: number): GameState {
  const j = jobOf(state);
  return j.id ? { ...state, job: { ...j, perf: clamp(j.perf + delta) } } : state;
}

/** One rung up; the top rung opens the job's peak đường đời. */
export function promoteJob(state: GameState, content: Content): GameState {
  const j = jobOf(state);
  const def = jobDef(content, j.id);
  if (!def || j.rung >= def.rungs.length - 1) return state;
  const rung = j.rung + 1;
  let s: GameState = { ...state, job: { ...j, rung, years: 0 } };
  const lines: LogLine[] = [{ text: fill(content.jobs!.texts.promoted, { job: def.name, rung: def.rungs[rung] }), tone: 'good' }];
  const peak = def.peak;
  const career = peak ? careerDef(content, peak.career) : undefined;
  if (rung === def.rungs.length - 1 && peak && career && !(s.career.id === peak.career && s.career.rung >= peak.rung)) {
    s = { ...s, career: { id: peak.career, rung: Math.min(peak.rung, career.rungs.length - 1), since: s.character.age } };
    lines.push({ text: fill(content.jobs!.texts.peak, { career: career.name, rung: career.rungs[s.career.rung] }), tone: 'rare' });
  }
  return { ...s, log: pushLines(s, lines) };
}

export function jobPay(state: GameState, content: Content): number {
  const j = jobOf(state);
  const def = jobDef(content, j.id);
  if (!def) return 0;
  const base = def.pay[Math.min(j.rung, def.pay.length - 1)];
  return Math.max(0, Math.round(base * (1 + hookSum(state, content, 'incomePct'))));
}

/** Months the job takes this year. */
export function jobMonths(state: GameState, content: Content): number {
  return state.cult.realm === 'pham_nhan' ? jobDef(content, jobOf(state).id)?.months ?? 0 : 0;
}

/** The hiệu suất the job settles at with these stats. */
export function perfTarget(state: GameState, content: Content): number {
  const def = jobDef(content, jobOf(state).id);
  const cfg = content.balance.jobs;
  if (!def || !cfg) return 0;
  const avg = def.mainStats.reduce((sum, k) => sum + value(state, k), 0) / def.mainStats.length;
  return cfg.targetBase + avg * cfg.targetWeight;
}

/** A year at work: pay, upkeep, hiệu suất drift, maybe a rung up or the sack. */
export function jobYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.jobs;
  const j = jobOf(state);
  const def = jobDef(content, j.id);
  if (!cfg || !def || !state.alive) return state;
  if (state.cult.realm !== 'pham_nhan') return quitJob(state, content, 'quit');
  // The job and the đường đời are one livelihood: the larger pay of the two.
  let s: GameState = { ...state, money: { ...state.money, silver: state.money.silver + Math.max(jobPay(state, content), careerIncome(state, content)) } };
  const stats = { ...s.stats };
  const apts = { ...s.aptitudes };
  // What the work does to body and mind shows every few years, not every year.
  const upkeep = (j.years + 1) % cfg.upkeepEvery === 0 ? def.upkeep : {};
  for (const [key, d] of Object.entries(upkeep)) {
    const k = key.replace(/^stat\./, '');
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + d);
    else if (k in apts) apts[k as keyof typeof apts] = clamp(apts[k as keyof typeof apts] + d);
  }
  s = { ...s, stats, aptitudes: apts };
  let perf = j.perf + (perfTarget(s, content) - j.perf) * cfg.drift;
  if (s.stats.health < cfg.sickHealth) perf += cfg.sickPerf;
  s = { ...s, job: { ...jobOf(s), perf: clamp(perf), years: j.years + 1 } };
  const rng = new Rng(`${s.seed}:job:${s.character.age}`);
  const now = jobOf(s);
  if (now.perf >= cfg.promoteAt && now.years >= cfg.yearsPerRung && now.rung < def.rungs.length - 1 && rng.chance(cfg.promoteChance)) return promoteJob(s, content);
  if (now.perf <= cfg.fireAt && rng.chance(cfg.fireChance)) return quitJob(s, content, 'fired');
  if (now.perf <= cfg.fireAt + 10) return { ...s, log: pushLines(s, [{ text: fill(content.jobs!.texts.warn, { job: def.name }), tone: 'bad' }]) };
  return s;
}

/** "Thợ rèn · Thợ cả · hiệu suất 62 · 30 lượng/năm" for the profile. */
export function jobLine(state: GameState, content: Content): string | null {
  const j = jobOf(state);
  const def = jobDef(content, j.id);
  return def ? `${def.name} · ${def.rungs[j.rung]} · hiệu suất ${Math.round(j.perf)} · ${jobPay(state, content)} lượng/năm` : null;
}
