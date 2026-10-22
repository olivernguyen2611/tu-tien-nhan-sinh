// Family (PLAN.md task 1.7): parents and siblings with affinity, who age and die.
import { drawText } from './textPool';
import type { TextPool } from '../core/schemas';
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, Gender, LogLine, Relative, Tone } from '../core/types';
import { describeDelta } from './deltas';
import { makeName, splitName } from './names';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const between = (rng: Rng, [a, b]: readonly [number, number]) => rng.int(a, b);

function relativeLifespan(rng: Rng, content: Content): number {
  const l = content.balance.lifespan;
  return l.mortalBase + rng.int(-l.mortalVariance, l.mortalVariance);
}

/** Family at birth. Orphans (no_parents) start with nobody. */
export function createFamily(rng: Rng, content: Content, surname: string, noParents: boolean, playerName: string): Relative[] {
  if (noParents) return [];
  const cfg = content.balance.family;
  // Nobody in the family shares a given name with the player or each other.
  const taken = [playerName];
  const person = (role: Relative['role'], gender: Gender, family: string | undefined, age: number, n: number): Relative => {
    const name = makeName(rng, content.names, gender, { surname: family, taken });
    taken.push(name);
    return {
      id: `${role}_${n}`,
      role,
      gender,
      name,
      age,
      alive: true,
      lifespan: relativeLifespan(rng, content),
      affinity: between(rng, cfg.affinityStart),
      lastActions: {},
    };
  };
  const father = person('father', 'nam', surname, between(rng, cfg.fatherAge), 0);
  const mother = person('mother', 'nu', undefined, between(rng, cfg.motherAge), 0);
  const family = [father, mother];
  const older = between(rng, cfg.olderSiblings);
  // Older siblings, never born before the mother was old enough.
  const maxAge = mother.age - cfg.motherMinAgeForChild;
  const ages = new Set<number>();
  for (let i = 0; i < older; i++) {
    const age = Math.min(between(rng, cfg.olderSiblingGap) + i, maxAge);
    if (age < 1 || ages.has(age)) continue;
    ages.add(age);
    family.push(person('sibling', rng.chance(0.5) ? 'nam' : 'nu', surname, age, i));
  }
  return family;
}

/** What the player calls this relative: cha, mẹ, anh, chị, em trai, em gái. */
export function relationLabel(r: Relative, playerAge: number): string {
  if (r.role === 'father') return 'Cha';
  if (r.role === 'mother') return 'Mẹ';
  if (r.role === 'child') return r.gender === 'nam' ? 'Con trai' : 'Con gái';
  if (r.age > playerAge) return r.gender === 'nam' ? 'Anh' : 'Chị';
  return r.gender === 'nam' ? 'Em trai' : 'Em gái';
}

/** 10.5: the temper a rearing tally grows into (relations.json tempers, first whose range holds). */
export function temperFor(content: Content, rearing: number) {
  return content.relations?.tempers.find((t) => (t.min === undefined || rearing >= t.min) && (t.max === undefined || rearing <= t.max));
}

/** "Tính nết: Hiếu thuận · đã thành gia" for a child, or null. */
export function childTemperLabel(content: Content, r: Relative): string | null {
  const name = r.temper ? content.relations?.tempers.find((t) => t.id === r.temper)?.name : undefined;
  const parts = [name ? `Tính nết: ${name}` : null, r.married ? 'đã thành gia' : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** One year for the family (called after the player ages). */
export function ageFamily(state: GameState, content: Content): GameState {
  if (state.family.length === 0) return state;
  const cfg = content.balance.family;
  const rng = Rng.fromState(state.rng);
  const lines: LogLine[] = [];
  let happiness = state.stats.happiness;
  let daoHeart = state.aptitudes.daoHeart;
  const { surname } = splitName(state.character.name, content.names);

  // 10.10–10.11: a parent's death brings the tang lễ (and, for the father, the phân gia) this year.
  const funerals: string[] = [];
  const family = state.family.map((r) => {
    if (!r.alive) return r;
    const age = r.age + 1;
    if (age >= r.lifespan) {
      if (r.role === 'father' || r.role === 'mother') funerals.push(r.role);
      // Grief: even a relative you drifted from hurts; a close one hurts most.
      const [distant, close] = cfg.grief[r.role];
      const loss = Math.round(distant + (close - distant) * (r.affinity / 100));
      const before = clamp(happiness);
      happiness = clamp(happiness + loss);
      let change = describeDelta('happiness', happiness - before);
      if ((r.role === 'father' || r.role === 'mother') && cfg.grief.parentDaoHeart) {
        const d = clamp(daoHeart + cfg.grief.parentDaoHeart) - daoHeart;
        daoHeart += d;
        const dao = describeDelta('daoHeart', d);
        change = [change, dao].filter(Boolean).join(' · ');
      }
      lines.push({ text: `${relationLabel(r, state.character.age)} ${r.name} qua đời, hưởng thọ ${age} tuổi.${change ? ` ${change}.` : ''}`, tone: 'bad' });
      return { ...r, age, alive: false };
    }
    const grown = { ...r, age, affinity: clamp(r.affinity - cfg.affinityDecay) };
    // 10.5: a child shows the temper their upbringing made.
    const temper = r.role === 'child' && !r.temper && age === content.balance.kinship?.temperAge ? temperFor(content, r.rearing ?? 0) : undefined;
    if (!temper) return grown;
    lines.push({ text: temper.text.replace(/\{child\}/g, r.name), tone: temper.affinity >= 0 ? 'good' : 'normal' });
    return { ...grown, temper: temper.id, affinity: clamp(grown.affinity + temper.affinity) };
  });

  // A younger sibling may be born while both parents live and the mother is young enough.
  const father = family.find((r) => r.role === 'father');
  const mother = family.find((r) => r.role === 'mother');
  const siblings = family.filter((r) => r.role === 'sibling').length;
  if (father?.alive && mother?.alive && mother.age <= cfg.motherMaxAgeForChild && siblings < cfg.maxSiblings && rng.chance(cfg.youngerSiblingChance)) {
    const gender: Gender = rng.chance(0.5) ? 'nam' : 'nu';
    const baby: Relative = {
      id: `sibling_${siblings}_${state.character.age}`,
      role: 'sibling',
      gender,
      name: makeName(rng, content.names, gender, { surname, taken: [state.character.name, ...family.map((r) => r.name)] }),
      age: 0,
      alive: true,
      lifespan: relativeLifespan(rng, content),
      affinity: between(rng, cfg.affinityStart),
      lastActions: {},
    };
    family.push(baby);
    lines.push({ text: `Nhà có thêm ${gender === 'nam' ? 'một em trai' : 'một em gái'}: ${baby.name}.`, tone: 'good' });
  }

  // Events that need a parent stop once that parent is gone (no_father / no_mother; both = no_parents).
  const gone = (role: Relative['role']) => !family.some((r) => r.role === role && r.alive);
  const flags = { ...state.flags };
  if (gone('father')) flags.no_father = true;
  if (gone('mother')) flags.no_mother = true;
  if (flags.no_father && flags.no_mother) flags.no_parents = true;

  const log = state.log.slice();
  const last = log[log.length - 1];
  if (lines.length > 0) {
    if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
    else log.push({ age: state.character.age, lines });
  }

  const after = content.balance.leaving && state.character.age >= content.balance.leaving.funeralAge
    ? funerals.map((role) => ({ event: content.balance.leaving!.funeralEvents[role], atAge: state.character.age })).filter((f) => !!f.event)
    : [];
  // 10.11: the year after the father dies, the phân gia (when brothers and sisters live).
  const split = content.balance.kin?.splitEvent;
  if (split && funerals.includes('father') && !state.kin?.split && family.some((r) => r.role === 'sibling' && r.alive) && state.character.age >= (content.balance.leaving?.funeralAge ?? 0)) {
    after.push({ event: split, atAge: state.character.age + 1 });
  }
  const events = after.length ? { ...state.events, followUps: [...state.events.followUps, ...after] } : state.events;
  return { ...state, rng: rng.getState(), family, flags, events, stats: { ...state.stats, happiness: clamp(happiness) }, aptitudes: { ...state.aptitudes, daoHeart }, log };
}

export interface ActionView {
  id: string;
  name: string;
  cost: number;
  /** Already done with this relative this year, or not enough silver. */
  disabled: boolean;
  reason: string | null;
}

/** Actions the player can do with this relative right now. */
export function availableActions(state: GameState, content: Content, r: Relative): ActionView[] {
  if (!r.alive || !state.alive) return [];
  const age = state.character.age;
  return content.familyActions
    .filter((a) => age >= a.minAge && (a.maxAge === undefined || age <= a.maxAge))
    .filter((a) => a.roles.length === 0 || a.roles.includes(r.role))
    .filter((a) => a.minTargetAge === undefined || r.age >= a.minTargetAge)
    .filter((a) => !a.marry || !r.married)
    // 10.5: rearing a child ends once their temper has set.
    .filter((a) => !a.rearing || !r.temper)
    .filter((a) => (r.role !== 'sibling' && r.role !== 'child') || r.age >= 3 || a.id === 'hoi_han')
    .map((a) => {
      const done = r.lastActions[a.id] === age;
      const poor = state.money.silver < a.cost;
      return { id: a.id, name: a.name, cost: a.cost, disabled: done || poor, reason: done ? 'Năm nay đã làm' : poor ? 'Không đủ bạc' : null };
    });
}

export interface ActionResult { state: GameState; text: string; tone: Tone }

function applyNumbers(state: GameState, effects: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  const money = { ...state.money };
  const social = { ...state.social };
  for (const [key, v] of Object.entries(effects)) {
    const k = key.slice(5);
    if (key.startsWith('stat.') && k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else if (key.startsWith('stat.') && k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
    else if (key === 'silver' || key === 'spiritStones') money[key] = Math.max(0, money[key] + v);
    else if (key === 'karma') social.karma = Math.max(-100, Math.min(100, social.karma + v));
  }
  return { ...state, stats, aptitudes, money, social };
}

/** Do one family action (once a year per relative); logs the outcome in this year's block. */
export function performFamilyAction(state: GameState, content: Content, relativeId: string, actionId: string): ActionResult {
  const r = state.family.find((x) => x.id === relativeId);
  const action = content.familyActions.find((a) => a.id === actionId);
  const view = r && availableActions(state, content, r).find((a) => a.id === actionId);
  if (!r || !action || !view || view.disabled) return { state, text: '', tone: 'normal' };

  const rng = Rng.fromState(state.rng);
  let outcome: { affinity: readonly [number, number]; effects: Record<string, number>; texts: TextPool } = action;
  let key = `family.${actionId}`;
  let tone: Tone = 'good';
  let silver = 0;
  if (action.needAffinity !== undefined && r.affinity < action.needAffinity && action.refused) {
    outcome = action.refused;
    key += '.refused';
    tone = 'bad';
  } else if (action.mishap && rng.chance(action.mishapChance)) {
    outcome = action.mishap;
    key += '.mishap';
    tone = 'normal';
  } else if (action.silver) {
    silver = between(rng, action.silver);
  }
  const gain = between(rng, outcome.affinity);
  if (gain < 0 && tone === 'good') tone = 'normal';

  const label = relationLabel(r, state.character.age).toLowerCase();
  const drawn = drawText(state, content, key, outcome.texts, { affinity: r.affinity, relation: r.role }, rng);
  const text = drawn.text
    .replace(/\{Rel\}/g, label.charAt(0).toUpperCase() + label.slice(1))
    .replace(/\{rel\}/g, label)
    .replace(/\{relName\}/g, r.name);

  let next = applyNumbers(drawn.state, { ...outcome.effects, silver: silver - action.cost });
  next = {
    ...next,
    rng: rng.getState(),
    family: next.family.map((x) => (x.id === relativeId
      ? { ...x, affinity: clamp(x.affinity + gain), lastActions: { ...x.lastActions, [actionId]: state.character.age }, ...(action.rearing ? { rearing: (x.rearing ?? 0) + action.rearing } : {}), ...(action.marry && tone !== 'bad' ? { married: true } : {}) }
      : x)),
  };
  const log = next.log.slice();
  const last = log[log.length - 1];
  const line: LogLine = { text, tone };
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: state.character.age, lines: [line] });
  return { state: { ...next, log }, text, tone };
}
