// 12.1 Triều đại và đại sự (content/worlds/<id>/court.json): the throne behind the thời cuộc of 9.5. Each reign has a
// hoàng đế named by the niên hiệu ("Thái An đế") with a temper (minh quân … bạo quân) that pulls the world variables
// and sets the base sưu thuế; a thái tử is named in time; a quyền thần may rise and fall. When the niên hiệu changes
// (9.5) the emperor is dead: the heir takes the throne, or a tranh ngôi starts if none is grown. Đại sự (affairs:
// thiên tai, ôn dịch, ngoại xâm, khởi nghĩa, tăng thuế, quyền thần chuyên quyền…) start from the world variables and
// last some years; while they run they raise the sưu thuế a mortal pays, the prices, the pay of some trades, and may
// call men to the army. Everything rolls on side streams (seed:court:age). Numbers: balance.court.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';

type Court = NonNullable<GameState['court']>;
type Affair = NonNullable<Content['court']>['affairs'][number];
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

const personName = (content: Content, rng: Rng) => {
  const n = content.names;
  return `${rng.pick(n.surnames)} ${rng.pick(n.maleGiven)}`;
};

function newEmperor(content: Content, rng: Rng, era: string, age?: number): Court['emperor'] {
  const file = content.court!;
  const temper = rng.weighted(file.tempers, (t) => t.weight).id;
  return { name: fill(file.texts.emperorName, { era }), age: age ?? rng.int(18, 50), temper };
}

/** The court as a life is born into it (also for older saves). */
export function initCourt(state: GameState, content: Content): Court | undefined {
  if (!content.court || !state.times) return undefined;
  const rng = new Rng(`${state.seed}:court:init`);
  const emperor = newEmperor(content, rng, state.times.era, rng.int(25, 55));
  const heir = rng.chance(0.6) ? { name: fill(content.court.texts.heirName, { name: rng.pick(content.names.maleGiven) }), age: rng.int(5, 25) } : null;
  return { emperor, heir, minister: null, affairs: [], started: {} };
}

export const courtOf = (state: GameState, content: Content): Court | undefined => state.court ?? initCourt(state, content);
export const affairDef = (content: Content, id: string) => content.court?.affairs.find((a) => a.id === id);
export const temperDef = (content: Content, id: string) => content.court?.tempers.find((t) => t.id === id);
const activeDefs = (court: Court | undefined, content: Content): Affair[] =>
  (court?.affairs ?? []).map((a) => affairDef(content, a.id)).filter((a): a is Affair => !!a);

/** Sưu thuế this year, 0–100: the emperor's base plus every affair running. */
export function courtTax(state: GameState, content: Content): number {
  const c = state.court;
  if (!c) return 0;
  return clamp((temperDef(content, c.emperor.temper)?.tax ?? 0) + activeDefs(c, content).reduce((s, a) => s + (a.tax ?? 0), 0));
}

/** Price multiplier from the affairs running (worldState folds it into thời giá). */
export function courtPriceMul(state: GameState, content: Content): number {
  return activeDefs(state.court, content).reduce((m, a) => m * (a.priceMul ?? 1), 1);
}

/** Pay multiplier for a trade group (nghề nào phất nghề nào lụn). */
export function courtJobMul(state: GameState, content: Content, group: string): number {
  return activeDefs(state.court, content).reduce((m, a) => m * (a.jobs[group] ?? 1), 1);
}

/** Is the army calling men this year? */
export const courtDraft = (state: GameState, content: Content): boolean => activeDefs(state.court, content).some((a) => a.draft);

function affairFits(court: Court, vars: Record<string, number>, phase: string, a: Affair): boolean {
  const w = a.when;
  if (w.phases && !w.phases.includes(phase)) return false;
  if (w.below) for (const [k, v] of Object.entries(w.below)) if ((vars[k] ?? 50) > v) return false;
  if (w.above) for (const [k, v] of Object.entries(w.above)) if ((vars[k] ?? 50) < v) return false;
  if (w.minister && !court.minister) return false;
  if (w.tempers && !w.tempers.includes(court.emperor.temper)) return false;
  return !w.onDeath;
}

/** Start an affair (no-op if running); `say` gets its opening line. */
function startAffair(court: Court, a: Affair, age: number, rng: Rng, say: (t: string) => void, ctx: Record<string, string>): Court {
  if (court.affairs.some((x) => x.id === a.id)) return court;
  say(fill(a.text, ctx));
  return { ...court, affairs: [...court.affairs, { id: a.id, until: age + rng.int(a.years[0], a.years[1]) }], started: { ...court.started, [a.id]: age } };
}

/** One year at court, after the thời cuộc (9.5) has moved. */
export function courtYear(state: GameState, content: Content): GameState {
  const file = content.court;
  const cfg = content.balance.court;
  const t = state.times;
  if (!file || !cfg || !t) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:court:${age}`);
  let c = courtOf(state, content)!;
  const lines: LogLine[] = [];
  const say = (text: string) => lines.push({ text: `Triều đình: ${text}`, tone: 'normal' });
  let s = state;

  // A new niên hiệu this year: the old emperor is gone.
  const changed = t.eraFrom === age && t.eras.length > 1 && c.emperor.name !== fill(file.texts.emperorName, { era: t.era });
  if (changed) {
    const newDynasty = t.eras[t.eras.length - 2]?.dynasty !== t.dynasty;
    const old = c.emperor.name;
    if (newDynasty) {
      c = { ...c, emperor: newEmperor(content, rng, t.era, rng.int(30, 50)), heir: null, minister: null, affairs: [] };
      say(fill(file.texts.founder, { emperor: c.emperor.name, dynasty: t.dynasty }));
    } else {
      const heir = c.heir;
      const grown = heir && heir.age >= cfg.heirAdult;
      c = { ...c, emperor: { ...newEmperor(content, rng, t.era, heir?.age), name: fill(file.texts.emperorName, { era: t.era }) }, heir: null };
      say(fill(heir ? file.texts.heirCrowned : file.texts.crowned, { old, heir: heir?.name ?? '', emperor: c.emperor.name }));
      const succession = file.affairs.find((a) => a.when.onDeath);
      if (succession && (!grown || rng.chance(cfg.contestChance))) c = startAffair(c, succession, age, rng, say, { emperor: c.emperor.name });
      // A new emperor purges the quyền thần, or keeps him.
      if (c.minister && rng.chance(cfg.purgeChance)) { say(fill(file.texts.ministerFall, { minister: c.minister.name })); c = { ...c, minister: null }; }
    }
    const temper = temperDef(content, c.emperor.temper);
    if (temper) say(fill(file.texts.temper, { emperor: c.emperor.name, temper: temper.name }));
    // Đại xá thiên hạ: the gates of the ngục open.
    if (rng.chance(cfg.amnestyChance) && s.law?.jail) {
      s = { ...s, law: { ...s.law, jail: null } };
      lines.push({ text: file.texts.amnesty, tone: 'good' });
    }
  } else {
    c = { ...c, emperor: { ...c.emperor, age: c.emperor.age + 1 }, heir: c.heir ? { ...c.heir, age: c.heir.age + 1 } : null };
  }

  // A thái tử is named in time.
  if (!c.heir && c.emperor.age >= cfg.heirFrom && rng.chance(cfg.heirChance)) {
    c = { ...c, heir: { name: fill(file.texts.heirName, { name: rng.pick(content.names.maleGiven) }), age: rng.int(8, 18) } };
    say(fill(file.texts.heirNamed, { heir: c.heir!.name, emperor: c.emperor.name }));
  }

  // The quyền thần: rises at a weak throne, grows under a poor emperor, falls at 0.
  const temper = temperDef(content, c.emperor.temper);
  if (!c.minister && rng.chance(cfg.ministerChance * (temper?.ministerMul ?? 1))) {
    c = { ...c, minister: { name: personName(content, rng), sway: rng.int(40, 65) } };
    say(fill(file.texts.ministerRise, { minister: c.minister!.name }));
  } else if (c.minister) {
    const sway = clamp(c.minister.sway + (temper?.ministerDrift ?? 0) + rng.int(-4, 4));
    if (sway <= 0) { say(fill(file.texts.ministerFall, { minister: c.minister.name })); c = { ...c, minister: null }; }
    else c = { ...c, minister: { ...c.minister, sway } };
  }

  // Đại sự end, and new ones start from the world as it stands.
  const ended = c.affairs.filter((a) => a.until < age);
  for (const a of ended) { const d = affairDef(content, a.id); if (d?.endText) say(d.endText); }
  c = { ...c, affairs: c.affairs.filter((a) => a.until >= age) };
  for (const a of file.affairs) {
    if (c.affairs.length >= cfg.maxAffairs) break;
    const last = c.started[a.id];
    if (last !== undefined && age - last < cfg.affairGap) continue;
    if (affairFits(c, t.vars, t.phase, a) && rng.chance(a.chance)) c = startAffair(c, a, age, rng, say, { minister: c.minister?.name ?? '', emperor: c.emperor.name });
  }

  // The emperor's temper and the affairs pull the world.
  const vars = { ...t.vars };
  const pulls = [temper?.vars ?? {}, ...activeDefs(c, content).map((a) => a.vars)];
  for (const p of pulls) for (const [k, v] of Object.entries(p)) if (k in vars) vars[k] = clamp(vars[k] + v);
  s = { ...s, court: c, times: { ...t, vars } };

  // Sưu thuế, paid by a grown mortal who is not in ngục; quan lại are exempt from both sưu thuế and bắt lính.
  const tax = courtTax(s, content);
  const official = !!content.office && s.career.id === content.office.career;
  if (s.cult.realm === 'pham_nhan' && age >= cfg.taxAge && !s.law?.jail && !s.reign && !s.throne && !official && tax > 0 && s.alive) {
    const due = Math.min(s.money.silver, Math.round((tax / 100) * cfg.taxSilver));
    if (due > 0) {
      s = { ...s, money: { ...s.money, silver: s.money.silver - due } };
      const say = file.texts.tax;
      const text = typeof say === 'string' ? say : new Rng(`${s.seed}:tax:${age}`).pick(say);
      lines.push({ text: fill(text, { silver: due }), tone: 'normal', ledger: true });
    }
  }
  // The army calls: a grown man gets the bắt lính event once per affair.
  const draft = activeDefs(c, content).find((a) => a.draft);
  if (draft && file.draftEvent && s.character.gender === 'nam' && s.cult.realm === 'pham_nhan' && age >= cfg.draftAge[0] && age <= cfg.draftAge[1]
    && !s.law?.jail && !s.reign && !s.throne && !official && !s.army && !s.flags[`bat_linh_${draft.id}_${c.started[draft.id]}`] && content.events.some((e) => e.id === file.draftEvent)) {
    s = { ...s, flags: { ...s.flags, [`bat_linh_${draft.id}_${c.started[draft.id]}`]: true }, events: { ...s.events, followUps: [...s.events.followUps, { event: file.draftEvent, atAge: age }] } };
  }
  return pushLines(s, lines);
}

/** "Thái An đế (minh quân) · Thái tử Minh · quyền thần Lý Hùng · đại sự: Ngoại xâm, Tăng thuế · sưu thuế 35" */
export function courtLine(state: GameState, content: Content): string | null {
  const c = state.court;
  if (!c || !content.court) return null;
  const parts = [`${c.emperor.name} (${temperDef(content, c.emperor.temper)?.name ?? ''})`];
  if (c.heir) parts.push(c.heir.name);
  if (c.minister) parts.push(`quyền thần ${c.minister.name}`);
  const affairs = activeDefs(c, content).map((a) => a.name);
  if (affairs.length) parts.push(`đại sự: ${affairs.join(', ')}`);
  parts.push(`sưu thuế ${courtTax(state, content)}`);
  return parts.join(' · ');
}
