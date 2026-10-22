// 12.6–12.9 Đế nghiệp (content/throne.json): three roads to the throne and the reign at the end of them.
// - royal (12.6): born a hoàng tử / công chúa (origin with `royal`), with siblings in line. Thánh sủng and thế lực triều
//   thần decide who the emperor names thái tử; nghi kỵ too high brings the cup of wine. Named heir, the throne is yours
//   when the niên hiệu changes; passed over, a lập trữ event offers to accept, rise in a binh biến, or leave.
// - rebel (12.7): a commoner raises a banner in a loạn thế; every year one big decision (an event); cities taken bring
//   the capital in reach; a thịnh thế crushes it; the court may offer chiêu an.
// - usurp (12.8): an official high at court, or a general with troops, plots for years; every plotter raises the chance
//   of discovery; when quyền thế, binh quyền and danh nghĩa are enough, the rising is a three-step chain of events.
// - reign (12.9): quốc khố, dân tâm, binh lực, triều thần drift with the times and the ruler's deeds; a bar near zero
//   brings a threat event, at zero the throne falls. The niên hiệu stays the ruler's while they reign.
// Rolls use side streams. Numbers: balance.throne.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { checkDeath } from './time';
import { quitJob } from './jobs';

type Throne = NonNullable<GameState['throne']>;
type Reign = NonNullable<GameState['reign']>;
type Path = Throne['path'];
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

const follow = (state: GameState, event: string, content: Content): GameState =>
  content.events.some((e) => e.id === event) && !state.events.followUps.some((f) => f.event === event)
    ? { ...state, events: { ...state.events, followUps: [...state.events.followUps, { event, atAge: state.character.age }] } }
    : state;

export const throneOf = (state: GameState): Throne | null => (state.alive ? state.throne ?? null : null);
export const reignOf = (state: GameState): Reign | null => (state.alive ? state.reign ?? null : null);
const royalOrigin = (state: GameState, content: Content) => !!content.origins.find((o) => o.id === state.character.originId)?.royal;

function barsFor(content: Content, path: Path | 'reign'): string[] {
  return Object.keys(content.throne?.bars[path] ?? {});
}

/** A hoàng tử / công chúa's place at birth: siblings in line, the mother's rank. */
export function initRoyal(state: GameState, content: Content): Throne | null {
  const cfg = content.balance.throne;
  if (!cfg || !royalOrigin(state, content)) return null;
  const rng = new Rng(`${state.seed}:throne:royal`);
  const count = rng.int(cfg.rivals[0], cfg.rivals[1]);
  const rank = rng.int(1, count + 1);
  const used = new Set([state.character.name.split(' ').pop()]);
  const rivals = Array.from({ length: count }, () => {
    const pool = content.names.maleGiven.filter((n) => !used.has(n));
    const given = rng.pick(pool.length ? pool : content.names.maleGiven);
    used.add(given);
    return { name: `Hoàng tử ${given}`, favor: rng.int(30, 60), power: rng.int(20, 50), alive: true };
  });
  return {
    path: 'royal', bars: { favor: rng.int(35, 55), power: 10, suspicion: 5 }, since: 0, step: 0,
    rank, mother: rng.chance(0.3) ? 'hau' : 'phi', rivals, heir: null,
  };
}

/** Start the road of a rebel or a plotter (no-op on another road or while reigning). */
export function throneStart(state: GameState, content: Content, path: 'rebel' | 'usurp'): GameState {
  const file = content.throne;
  if (!file || throneOf(state) || reignOf(state) || state.cult.realm !== 'pham_nhan') return state;
  const rng = new Rng(`${state.seed}:throne:start:${state.character.age}`);
  const age = state.character.age;
  if (path === 'rebel') {
    const banner = `${rng.pick(file.banner.first)} ${rng.pick(file.banner.second).toLowerCase()}`;
    const base = rng.pick(file.bases);
    const fame = Math.max(state.social.reputation.lang_xa, state.jianghu?.fame ?? 0);
    const throne: Throne = { path, bars: { people: clamp(30 + fame / 3), troops: 20, grain: 25 }, since: age, step: 0, banner, base, cities: 0 };
    return pushLines({ ...state, throne, army: null, flags: { ...state.flags, tung_khoi_nghia: true } }, [{ text: fill(file.texts.rebelStart, { banner, base }), tone: 'rare' }]);
  }
  const kind = state.army ? 'warlord' : 'minister';
  const rank = state.army?.rank ?? state.career.rung;
  const throne: Throne = { path, bars: { power: clamp(rank * 8), troops: kind === 'warlord' ? clamp(rank * 9) : 5, cause: 10 }, since: age, step: 0, kind, plotters: 1 };
  return pushLines({ ...state, throne, flags: { ...state.flags, tung_muu_phan: true } }, [{ text: file.texts.usurpStart, tone: 'rare' }]);
}

/** Bars of the current road ± (unknown names are ignored). */
export function addThroneBars(state: GameState, content: Content, d: Record<string, number>): GameState {
  const t = throneOf(state);
  if (!t) return state;
  const bars = { ...t.bars };
  // Near the top every gain comes harder (a royal's thánh sủng and thế lực).
  const cap = content.balance.throne?.softCap ?? 0;
  const soft = (k: string, v: number) => (cap > 0 && v > 0 && t.path === 'royal' && k !== 'suspicion' ? Math.max(0.15, 1 - bars[k] / cap) * v : v);
  for (const [k, v] of Object.entries(d)) if (k in bars) bars[k] = clamp(bars[k] + soft(k, v));
  // A plot that grows its quyền thế pulls in more people.
  const plotters = t.path === 'usurp' && (d.power ?? 0) > 0 ? (t.plotters ?? 1) + 1 : t.plotters;
  return { ...state, throne: { ...t, bars, plotters } };
}

/** The strongest living sibling in line (royal road). */
export const strongestRival = (t: Throne) =>
  (t.rivals ?? []).filter((r) => r.alive).sort((a, b) => b.favor + b.power - (a.favor + a.power))[0];

/** Strike the sibling in the way: the named thái tử if it is not you, else the strongest. A thái tử whose thánh sủng
 *  falls below deposeBelow is phế. */
export function hitRival(state: GameState, content: Content, d: number, dies = false): GameState {
  const t = throneOf(state);
  const living = (t?.rivals ?? []).filter((r) => r.alive);
  const top = t && (living.find((r) => r.name === t.heir) ?? strongestRival(t));
  if (!t || !top) return state;
  const hit = { ...top, alive: dies ? false : top.alive, favor: clamp(top.favor + d), power: clamp(top.power + d) };
  const rivals = t.rivals!.map((r) => (r === top ? hit : r));
  const deposed = t.heir === top.name && (dies || hit.favor < (content.balance.throne?.deposeBelow ?? 20));
  const lines: LogLine[] = deposed && !dies && content.throne ? [{ text: fill(content.throne.texts.heirDeposed, { name: top.name }), tone: 'good' }] : [];
  return pushLines({ ...state, throne: { ...t, rivals, heir: deposed ? null : t.heir } }, lines);
}

export function setThroneStep(state: GameState, step: number | 'reset'): GameState {
  const t = throneOf(state);
  return t ? { ...state, throne: { ...t, step: step === 'reset' ? 0 : t.step + step } } : state;
}

/** Score for lập trữ: thánh sủng, thế lực, the eldest, the empress's child; a woman needs more. */
function heirScore(content: Content, favor: number, power: number, first: boolean, queen: boolean): number {
  const w = content.balance.throne!.heirWeights;
  return favor * w.favor + power * w.power + (first ? w.first : 0) + (queen ? w.queen : 0);
}

/** Who the emperor names: a lottery weighted by score^heirPower, so the front-runner is likely but never sure.
 *  Yours: thánh sủng, thế lực, the eldest, the empress's child, less nghi kỵ, less for a woman. */
function pickHeir(state: GameState, content: Content, t: Throne, rng: Rng): string {
  const cfg = content.balance.throne!;
  const self = heirScore(content, t.bars.favor, t.bars.power, t.rank === 1, t.mother === 'hau') - (state.character.gender === 'nu' ? cfg.womanNeeds : 0) - t.bars.suspicion * cfg.heirWeights.suspicion;
  const living = (t.rivals ?? []).filter((r) => r.alive);
  const field = [{ name: 'self', score: self }, ...living.map((r, i) => ({ name: r.name, score: heirScore(content, r.favor, r.power, i === 0 && t.rank !== 1, false) }))];
  const w = field.map((f) => Math.pow(Math.max(1, f.score), cfg.heirPower));
  let roll = rng.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < field.length; i++) if ((roll -= w[i]) <= 0) return field[i].name;
  return field[field.length - 1].name;
}

/** Rebel/usurp: attack a city with the troops against its garrison. */
export function throneBattle(state: GameState, content: Content): GameState {
  const file = content.throne;
  const cfg = content.balance.throne;
  const t = throneOf(state);
  if (!file || !cfg || !t || t.path === 'royal') return state;
  const rng = new Rng(`${state.seed}:throne:battle:${state.character.age}:${t.cities ?? 0}:${t.bars.troops}`);
  const garrison = cfg.garrison + (t.cities ?? 0) * cfg.garrisonPerCity * (state.times?.phase === 'thinh_the' ? 1.5 : 1);
  const lead = (state.stats.intellect + (state.martial.stage + 1) * 8) / 2;
  // Dân tâm opens gates; an army without grain fights badly.
  const own = t.bars.troops + lead / 4 + (t.bars.people ?? 0) / 10 + (t.bars.grain < 15 ? -15 : 0);
  const p = Math.max(0.1, Math.min(0.85, 0.5 + (own - garrison) / 80));
  if (rng.chance(p)) {
    const w = cfg.battleWin;
    const s = addThroneBars({ ...state, throne: { ...t, cities: (t.cities ?? 0) + 1 } }, content, { troops: w.troops, grain: w.grain, people: w.people });
    return pushLines(s, [{ text: fill(file.texts.cityWon, { banner: t.banner ?? '' }), tone: 'good' }]);
  }
  const s = addThroneBars(state, content, { troops: -cfg.battleLoss, people: -3 });
  return pushLines({ ...s, stats: { ...s.stats, health: Math.max(1, s.stats.health - 5) } }, [{ text: file.texts.cityLost, tone: 'bad' }]);
}

/** The road ends: put to death, exiled, made a commoner (royal), or let go. */
export function throneFail(state: GameState, content: Content, how: 'death' | 'exile' | 'commoner' | 'quiet'): GameState {
  const file = content.throne;
  if (!file || !throneOf(state)) return state;
  let s: GameState = { ...state, throne: null };
  s = pushLines(s, [{ text: file.texts[how], tone: how === 'quiet' ? 'normal' : 'bad' }]);
  if (how === 'death') return checkDeath({ ...s, flags: { ...s.flags, bi_tru_di: true } }, content, 'execution');
  if (how === 'exile') s = { ...s, flags: { ...s.flags, tha_huong: true, luu_day: true } };
  if (how === 'commoner') s = { ...s, money: { ...s.money, silver: Math.round(s.money.silver / 10) }, flags: { ...s.flags, bi_phe_thu_dan: true } };
  return s;
}

/** Take the throne: a new niên hiệu (and a new dynasty for a rebel or a usurper), the court's emperor is the life now. */
export function throneAscend(state: GameState, content: Content): GameState {
  const file = content.throne;
  const cfg = content.balance.throne;
  const ws = content.worldState;
  const t = throneOf(state);
  if (!file || !cfg || !t || reignOf(state)) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:throne:ascend:${age}`);
  const times = state.times;
  const used = new Set(times?.eras.map((e) => e.era) ?? []);
  const eras = (ws?.eraNames ?? ['Tân Thịnh']).filter((n) => !used.has(n));
  // An heir crowned the year the old niên hiệu ended keeps the new one the times already gave.
  const fresh = !!times && times.eraFrom === age && t.path === 'royal';
  const era = fresh ? times!.era : rng.pick(eras.length ? eras : ws?.eraNames ?? ['Tân Thịnh']);
  const founder = t.path !== 'royal';
  const usedDyn = new Set(times?.eras.map((e) => e.dynasty) ?? []);
  const dyns = file.dynastyNames.filter((d) => !usedDyn.has(d));
  const dynasty = founder ? rng.pick(dyns.length ? dyns : file.dynastyNames) : times?.dynasty ?? file.dynastyNames[0];
  const woman = state.character.gender === 'nu';
  const name = fill(woman ? file.texts.empressName : file.texts.emperorName, { era });
  const lines: LogLine[] = [{ text: fill(woman ? file.texts.crownedWoman : file.texts.crowned, { era }), tone: 'rare' }];
  if (founder) lines.push({ text: fill(file.texts.newDynasty, { dynasty, era }), tone: 'rare' });
  const newTimes = !times || fresh ? times : { ...times, dynasty, era, eraFrom: age, eras: [...times.eras, { dynasty, era, from: age }] };
  // The emperor of 12.1 is the life now: same name scheme, so the court sees no new reign next year.
  const court = state.court && content.court ? {
    ...state.court, emperor: { name: fill(content.court.texts.emperorName, { era }), age, temper: 'trung_quan' }, heir: null,
    minister: t.path === 'usurp' ? null : state.court.minister,
    affairs: state.court.affairs.filter((a) => !['tranh_ngoi', 'khoi_nghia'].includes(a.id)),
  } : state.court;
  const reign: Reign = { since: age, dynasty, era, how: t.path, bars: { ...cfg.reignStart[t.path] }, good: 0, bad: 0, founder };
  const base = state.job?.id ? quitJob(state, content, 'quit') : state;
  const s: GameState = {
    ...base, times: newTimes, court, reign, throne: null, army: null, office: undefined, career: { id: null, rung: 0, since: 0 },
    flags: { ...base.flags, len_ngoi: true, ...(woman ? { nu_hoang: true } : {}), ...(founder ? { khai_quoc: true } : {}) },
  };
  return pushLines(s, [...lines, { text: `Từ nay thiên hạ gọi ngươi là ${name}.`, tone: 'rare' }]);
}

/** Reign bars ± (and the court's temper follows the deeds). */
export function addReignBars(state: GameState, d: Record<string, number>): GameState {
  const r = reignOf(state);
  if (!r) return state;
  const bars = { ...r.bars };
  for (const [k, v] of Object.entries(d)) if (k in bars) bars[k] = clamp(bars[k] + v);
  return { ...state, reign: { ...r, bars } };
}

export function reignDeed(state: GameState, content: Content, deed: 'good' | 'bad'): GameState {
  const r = reignOf(state);
  if (!r) return state;
  const next = { ...r, good: r.good + (deed === 'good' ? 1 : 0), bad: r.bad + (deed === 'bad' ? 1 : 0) };
  const margin = content.balance.throne?.deedTitle ?? 5;
  const temper = next.good - next.bad >= margin ? 'minh_quan' : next.bad - next.good >= margin ? 'bao_quan' : 'trung_quan';
  return { ...state, reign: next, court: state.court ? { ...state.court, emperor: { ...state.court.emperor, temper } } : state.court };
}

/** The reign ends: killed, driven out (the dynasty falls), or handing the throne on. */
export function reignEnd(state: GameState, content: Content, how: 'death' | 'exile' | 'abdicate'): GameState {
  const file = content.throne;
  const r = reignOf(state);
  if (!file || !r) return state;
  const s: GameState = { ...state, reign: null, flags: { ...state.flags, ...(how !== 'abdicate' ? { mat_nuoc: true } : { thai_thuong_hoang: true }) } };
  // The throne passes on: a new niên hiệu starts next year (a fallen dynasty is replaced by the times).
  const times = s.times ? { ...s.times, reignLeft: 1 } : s.times;
  const out = pushLines({ ...s, times }, [{ text: how === 'abdicate' ? file.texts.abdicate : file.texts.fallen, tone: how === 'abdicate' ? 'normal' : 'bad' }]);
  return how === 'death' ? checkDeath(out, content, 'execution') : out;
}

/** One year on a road to the throne, or on the throne (after the court year). */
export function throneYear(state: GameState, content: Content): GameState {
  const file = content.throne;
  const cfg = content.balance.throne;
  if (!file || !cfg || !state.alive) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:throne:${age}`);
  const lines: LogLine[] = [];
  let s = state;
  if (!s.throne && !s.reign && royalOrigin(s, content) && !s.flags.bi_phe_thu_dan && !s.flags.roi_cung && !s.flags.len_ngoi) {
    const t = initRoyal(s, content);
    if (t) s = { ...s, throne: { ...t, since: age } };
  }
  // A road to the throne is a mortal's: one who steps onto the tiên lộ leaves it.
  if (s.throne && s.cult.realm !== 'pham_nhan') s = { ...s, throne: null, flags: { ...s.flags, roi_cung: true } };
  const t = s.throne;

  if (t?.path === 'royal') {
    const bars: Record<string, number> = { ...t.bars, suspicion: clamp(t.bars.suspicion + cfg.suspicionDrift + (t.bars.power > 50 ? 3 : 0)) };
    // Siblings drift; one may die young.
    const rivals = (t.rivals ?? []).map((r) => {
      if (!r.alive) return r;
      if (rng.chance(cfg.siblingDeath)) { lines.push({ text: fill(file.texts.siblingDies, { name: r.name }), tone: 'normal' }); return { ...r, alive: false }; }
      const [lo, hi] = cfg.rivalGrowth;
      return { ...r, favor: clamp(r.favor + rng.int(lo, hi)), power: clamp(r.power + rng.int(lo, hi)) };
    });
    let next: Throne = { ...t, bars, rivals };
    // Lập trữ: an emperor past heirAge names one.
    const emperorAge = s.court?.emperor.age ?? 0;
    if (!next.heir && age >= cfg.adultAge && emperorAge >= cfg.heirAge && rng.chance(cfg.heirChance)) {
      const heir = pickHeir(s, content, next, rng);
      next = { ...next, heir };
      if (heir === 'self') lines.push({ text: file.texts.heirSelf, tone: 'rare' });
      else {
        lines.push({ text: fill(file.texts.heirOther, { name: heir }), tone: 'bad' });
        s = follow(s, file.events.heirLost, content);
      }
    }
    s = { ...s, throne: next };
    if (bars.suspicion >= cfg.banAt) s = follow(s, file.events.banned, content);
    // The emperor is gone (a new niên hiệu this year): the named heir takes the throne.
    const t2 = s.times;
    if (t2 && t2.eraFrom === age && age > (next.since ?? 0)) {
      // A new dynasty took the land: the old royal house is nothing now.
      const prev = t2.eras[t2.eras.length - 2];
      if (prev && prev.dynasty !== t2.dynasty) {
        lines.push({ text: fill(file.texts.dynastyFell, { dynasty: prev.dynasty }), tone: 'bad' });
        return throneFail(pushLines({ ...s, throne: next }, lines), content, age >= cfg.adultAge && rng.chance(cfg.fallDeath) ? 'death' : 'commoner');
      }
      // No thái tử named: the strongest in the palace takes it.
      if (!next.heir) {
        // A child is passed over while a grown sibling lives.
        const grown = strongestRival(next);
        next = { ...next, heir: age < cfg.adultAge && grown ? grown.name : pickHeir(s, content, next, rng) };
      }
      if (next.heir === 'self') return throneAscend(pushLines({ ...s, throne: next }, lines), content);
      lines.push({ text: fill(file.texts.siblingCrowned, { name: next.heir! }), tone: 'bad' });
      return pushLines({ ...s, throne: null, flags: { ...s.flags, nhan_vuong: true } }, lines);
    }
  }

  if (t?.path === 'rebel') {
    // Upkeep: an army eats (hungry men leave); a rising outside a loạn thế is crushed; the court may offer chiêu an;
    // enough cities and the capital is in reach.
    // Dân tâm brings men and grain every year.
    const draw = (t.bars.people ?? 0) * cfg.rebelDraw;
    s = addThroneBars(s, content, { grain: draw - cfg.rebelUpkeep, troops: draw - (t.bars.grain <= 0 ? cfg.rebelUpkeep : 0) });
    const phase = s.times?.phase ?? '';
    if (!cfg.rebelPhases.includes(phase) && rng.chance(cfg.crushChance)) {
      lines.push({ text: file.texts.crushed, tone: 'bad' });
      return throneFail(pushLines(s, lines), content, rng.chance(cfg.crushDeath) ? 'death' : 'quiet');
    }
    const r = throneOf(s)!;
    if (r.bars.troops <= 0) {
      lines.push({ text: file.texts.crushed, tone: 'bad' });
      return throneFail(pushLines(s, lines), content, rng.chance(cfg.crushDeath) ? 'death' : 'quiet');
    }
    // Most years bring the big decision; the rest leave room for the road's other events.
    const next = (r.cities ?? 0) >= cfg.capitalCities ? file.events.capital : rng.chance(cfg.amnestyChance) ? file.events.amnesty : rng.chance(cfg.rebelDecision) ? file.events.rebelYear : null;
    if (next) s = follow(s, next, content);
  }

  if (t?.path === 'usurp') {
    const p = cfg.discoverBase + (t.plotters ?? 1) * cfg.discoverPerPlotter;
    if (rng.chance(p)) s = follow(s, file.events.discovered, content);
  }

  const r = reignOf(s);
  if (r && r.since < age) {
    const bars = { ...r.bars };
    const drift = (d: Record<string, number> | undefined) => { for (const [k, v] of Object.entries(d ?? {})) if (k in bars) bars[k] = clamp(bars[k] + v); };
    drift(cfg.phaseDrift[s.times?.phase ?? '']);
    for (const a of s.court?.affairs ?? []) drift(cfg.affairDrift[a.id]);
    for (const k of Object.keys(bars)) bars[k] = clamp(bars[k] + rng.int(-cfg.reignDrift, cfg.reignDrift));
    s = { ...s, reign: { ...r, bars } };
    lines.push({ text: fill(file.texts.report, bars), tone: 'normal' });
    const fallen = Object.keys(bars).find((k) => bars[k] <= 0);
    if (fallen) s = follow(s, file.events.deposed, content);
    else for (const [k, ev] of Object.entries(file.events.threats)) if ((bars[k] ?? 100) <= cfg.dangerAt) { s = follow(s, ev, content); break; }
  }
  return pushLines(s, lines);
}

/** "Hoàng thất tranh ngôi · Thánh sủng 55 · Thế lực 30 · Nghi kỵ 10 · thái tử: Hoàng tử Minh" or the reign's bars. */
export function throneLine(state: GameState, content: Content): string | null {
  const file = content.throne;
  if (!file) return null;
  const r = reignOf(state);
  if (r) {
    const bars = barsFor(content, 'reign').map((k) => `${file.bars.reign?.[k] ?? k} ${r.bars[k] ?? 0}`);
    return [`${r.dynasty} · ${r.era} năm thứ ${state.character.age - r.since + 1}`, ...bars].join(' · ');
  }
  const t = throneOf(state);
  if (!t) return null;
  const parts = [file.pathNames[t.path], ...barsFor(content, t.path).map((k) => `${file.bars[t.path]?.[k] ?? k} ${t.bars[k] ?? 0}`)];
  if (t.path === 'royal') parts.push(`thái tử: ${t.heir === 'self' ? 'ngươi' : t.heir ?? 'chưa lập'}`);
  if (t.path === 'rebel') parts.push(`${t.banner} · ${t.cities ?? 0} thành`);
  if (t.path === 'usurp') parts.push(`${t.plotters ?? 1} người biết chuyện`);
  return parts.join(' · ');
}

/** Death-screen title of a ruler. */
export function reignTitle(state: GameState, content: Content): string | null {
  const file = content.throne;
  if (!file || !state.flags.len_ngoi) return null;
  const r = state.reign;
  const margin = content.balance.throne?.deedTitle ?? 5;
  if (state.flags.mat_nuoc) return file.titles.lost;
  if (r && r.good - r.bad >= margin) return file.titles.good;
  if (r && r.bad - r.good >= margin) return file.titles.bad;
  if (state.flags.khai_quoc) return file.titles.founder;
  return file.titles.plain;
}
