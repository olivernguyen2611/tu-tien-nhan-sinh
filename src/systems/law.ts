// 10.9 Phạm pháp, quan phủ, ngục tù (content/crimes.json): a crime works or fails by a check; a success may
// still get out (mức truy nã 0–5 rises, bộ khoái come looking), a failure is caught on the spot. Công đường is
// a two-step event (khai/chối, then nhân chứng / kêu oan / lót tay) whose điểm lightens the sentence: tha bổng,
// phạt bạc, đánh trượng, ngục, lưu đày, tử hình. In ngục only ngục activities and events come; vượt ngục grows
// harder with every failed try. Numbers: balance.law. Rolls use side streams.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { checkChance } from './events/engine';
import { quitJob } from './jobs';

type Law = NonNullable<GameState['law']>;
const EMPTY: Law = { wanted: 0, jail: null, trial: null, convictions: 0, escapes: 0, failedEscapes: 0, lastCrime: null, lastCrimeAge: null };
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
/** The first step at công đường; its choices chain to the second, which gives the verdict. */
export const TRIAL_EVENT = 'pp_cong_duong';
/** Sentenced to death: waiting, a last plea, or friends who break you out. */
export const DEATH_ROW_EVENT = 'pp_an_tu';

export const lawOf = (state: GameState): Law => state.law ?? EMPTY;
export const crimeDef = (content: Content, id: string) => content.crimes?.crimes.find((c) => c.id === id);
export const jailed = (state: GameState): boolean => !!state.law?.jail;

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

const withLaw = (state: GameState, patch: Partial<Law>): GameState => ({ ...state, law: { ...lawOf(state), ...patch } });
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

/** Mức truy nã ± (0…maxWanted). */
export function addWanted(state: GameState, content: Content, d: number): GameState {
  const max = content.balance.law?.maxWanted ?? 5;
  return withLaw(state, { wanted: Math.max(0, Math.min(max, lawOf(state).wanted + d)) });
}

/** Bộ khoái take you to công đường for `crime` (the last one when not given). */
export function arrest(state: GameState, content: Content, crime?: string): GameState {
  const law = lawOf(state);
  const id = crime ?? law.lastCrime ?? content.crimes?.crimes[0]?.id;
  if (!id || law.jail || !content.crimes) return state;
  const s = withLaw(state, { trial: { crime: id, score: 0 } });
  return pushLines({ ...s, events: { ...s.events, pending: s.events.pending ?? TRIAL_EVENT } },
    [{ text: fill(content.crimes.texts.caught, { crime: crimeDef(content, id)?.name.toLowerCase() ?? id }), tone: 'bad' }]);
}

/** Commit a crime: the check decides; a success may still get out, a failure is caught at once. */
export function commitCrime(state: GameState, content: Content, id: string): GameState {
  const def = crimeDef(content, id);
  const file = content.crimes;
  if (!def || !file || jailed(state)) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:crime:${age}:${id}:${lawOf(state).convictions + lawOf(state).escapes}`);
  let s = withLaw(state, { lastCrime: id, lastCrimeAge: age, crimes: (lawOf(state).crimes ?? 0) + 1 });
  s = { ...s, social: { ...s.social, karma: s.social.karma + def.karma } };
  if (!rng.chance(checkChance(state, content, def.stat, def.difficulty))) {
    s = pushLines(s, [{ text: rng.pick(def.fail), tone: 'bad' }]);
    return arrest(addWanted(s, content, 1), content, id);
  }
  const loot = rng.int(def.loot[0], def.loot[1]);
  s = { ...s, money: { ...s.money, silver: s.money.silver + loot } };
  const lines: LogLine[] = [{ text: rng.pick(def.success).replace('{silver}', String(loot)), tone: 'normal' }];
  if (rng.chance(def.expose)) {
    s = addWanted(s, content, def.heat);
    lines.push({ text: rng.pick(file.texts.exposed), tone: 'bad' });
  }
  return pushLines(s, lines);
}

/** Lót tay quan: costs bạc; a thanh liêm quan holds it against you. */
export function bribe(state: GameState, content: Content): GameState {
  const cfg = content.balance.law;
  const t = content.crimes?.texts;
  const law = lawOf(state);
  if (!cfg || !t || !law.trial) return state;
  if (state.money.silver < cfg.bribeCost) return pushLines(withLaw(state, { trial: { ...law.trial, score: law.trial.score - 1 } }), [{ text: t.poor, tone: 'bad' }]);
  const rng = new Rng(`${state.seed}:bribe:${state.character.age}:${law.convictions}`);
  const honest = rng.chance(cfg.bribeHonest);
  const s = { ...state, money: { ...state.money, silver: state.money.silver - cfg.bribeCost } };
  return pushLines(withLaw(s, { trial: { ...law.trial, score: law.trial.score + (honest ? -cfg.bribeScore : cfg.bribeScore) } }),
    [{ text: honest ? t.bribeHonest : t.bribeOk, tone: honest ? 'bad' : 'normal' }]);
}

/** The verdict: the crime's severity less the điểm earned at công đường. */
export function sentence(state: GameState, content: Content): GameState {
  const cfg = content.balance.law;
  const file = content.crimes;
  const law = lawOf(state);
  if (!cfg || !file || !law.trial) return state;
  const def = crimeDef(content, law.trial.crime);
  const name = def?.name.toLowerCase() ?? law.trial.crime;
  const level = Math.max(0, Math.min(5, Math.round((def?.severity ?? 1) - law.trial.score)));
  const rng = new Rng(`${state.seed}:verdict:${state.character.age}:${law.convictions}`);
  let s = withLaw(state, { trial: null });
  if (level === 0) return pushLines(s, [{ text: fill(file.verdicts.acquit, { crime: name }), tone: 'good' }]);
  s = withLaw(s, { convictions: law.convictions + 1, wanted: 0 });
  s = { ...s, flags: { ...s.flags, tien_an: true } };
  if (level === 1) {
    const silver = rng.int(cfg.fine[0], cfg.fine[1]);
    s = { ...s, money: { ...s.money, silver: Math.max(0, s.money.silver - silver) } };
    return pushLines(s, [{ text: fill(file.verdicts.fine, { crime: name, silver }), tone: 'bad' }]);
  }
  if (level === 2) {
    s = { ...s, stats: { ...s.stats, health: clamp(s.stats.health + cfg.beatingHealth) } };
    return pushLines(s, [{ text: fill(file.verdicts.beating, { crime: name }), tone: 'bad' }]);
  }
  if (level === 5) {
    s = { ...s, events: { ...s.events, pending: DEATH_ROW_EVENT } };
    return pushLines(s, [{ text: fill(file.verdicts.death, { crime: name }), tone: 'bad' }]);
  }
  const years = level === 4 ? cfg.exileYears : rng.int(cfg.jailYears[0], cfg.jailYears[1]);
  s = imprison(s, content, law.trial.crime, years);
  if (level === 4) s = { ...s, flags: { ...s.flags, tha_huong: true } };
  return pushLines(s, [{ text: fill(level === 4 ? file.verdicts.exile : file.verdicts.jail, { crime: name, years }), tone: 'bad' }]);
}

/** Into ngục for `years` (a job is lost). */
export function imprison(state: GameState, content: Content, crime: string, years: number): GameState {
  let s = state.job?.id ? quitJob(state, content, 'fired') : state;
  s = withLaw(s, { jail: { until: s.character.age + Math.max(1, years), crime }, trial: null });
  return s;
}

/** Years of ngục ± (a bribe to the cai ngục, a fight that went wrong). */
export function addJailYears(state: GameState, d: number): GameState {
  const j = lawOf(state).jail;
  if (!j) return state;
  return withLaw(state, { jail: { ...j, until: Math.max(state.character.age, j.until + d) } });
}

/** Vượt ngục: harder with every failed try; a failure adds years, a success makes you most wanted. */
export function tryEscape(state: GameState, content: Content): GameState {
  const cfg = content.balance.law;
  const t = content.crimes?.texts;
  const law = lawOf(state);
  if (!cfg || !t || !law.jail) return state;
  const rng = new Rng(`${state.seed}:escape:${state.character.age}:${law.escapes + law.failedEscapes}`);
  const chance = Math.max(cfg.escapeMin, cfg.escapeBase - law.failedEscapes * cfg.escapePerFail);
  if (rng.chance(chance)) {
    const s = withLaw(state, { jail: null, escapes: law.escapes + 1, wanted: cfg.maxWanted });
    return pushLines({ ...s, flags: { ...s.flags, vuot_nguc: true } }, [{ text: t.escaped, tone: 'rare' }]);
  }
  const s = withLaw(state, { failedEscapes: law.failedEscapes + 1, jail: { ...law.jail, until: law.jail.until + cfg.escapeFailYears } });
  return pushLines(s, [{ text: t.escapeFail.replace('{years}', String(cfg.escapeFailYears)), tone: 'bad' }]);
}

/** Trốn đi thật xa: mức truy nã drops, quê quán thành tha hương. */
export function fleeLaw(state: GameState, content: Content): GameState {
  const cfg = content.balance.law;
  const t = content.crimes?.texts;
  if (!cfg || !t) return state;
  const s = addWanted(state, content, -cfg.fleeWanted);
  return pushLines({ ...s, flags: { ...s.flags, tha_huong: true } }, [{ text: t.fled, tone: 'normal' }]);
}

/** A year: ngục ends, mức truy nã cools when no crime has been done for a while. */
export function lawYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.law;
  const t = content.crimes?.texts;
  if (!cfg || !t || !state.alive || !state.law) return state;
  const age = state.character.age;
  const law = lawOf(state);
  const lines: LogLine[] = [];
  let s = state;
  if (law.jail && age >= law.jail.until) {
    s = withLaw(s, { jail: null });
    lines.push({ text: t.released, tone: 'good' });
  }
  const quiet = law.lastCrimeAge === null ? 0 : age - law.lastCrimeAge;
  if (!law.jail && law.wanted > 0 && quiet > 0 && quiet % cfg.decayEvery === 0) {
    s = addWanted(s, content, -1);
    lines.push({ text: t.cooled, tone: 'normal' });
  }
  return pushLines(s, lines);
}

/** "Truy nã: Bị dán cáo thị · Tiền án 2 · Trong ngục tới năm 34 tuổi" for the profile. */
export function lawLine(state: GameState, content: Content): string | null {
  const law = state.law;
  const t = content.crimes?.texts;
  if (!law || !t) return null;
  const parts: string[] = [];
  if (law.jail) parts.push(`Trong ngục tới năm ${law.jail.until} tuổi`);
  if (law.wanted > 0) parts.push(t.wanted[Math.min(law.wanted, t.wanted.length - 1)]);
  if (law.convictions > 0) parts.push(`Tiền án ${law.convictions}`);
  if (law.escapes > 0) parts.push(`Vượt ngục ${law.escapes} lần`);
  return parts.length ? parts.join(' · ') : null;
}
