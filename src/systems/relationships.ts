// Family (PLAN.md task 1.7): parents and siblings with affinity, who age and die.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, Gender, LogLine, Relative } from '../core/types';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const between = (rng: Rng, [a, b]: readonly [number, number]) => rng.int(a, b);

function relativeLifespan(rng: Rng, content: Content): number {
  const l = content.balance.lifespan;
  return l.mortalBase + rng.int(-l.mortalVariance, l.mortalVariance);
}

/** Family at birth. Orphans (no_parents) start with nobody. */
export function createFamily(rng: Rng, content: Content, surname: string, noParents: boolean): Relative[] {
  if (noParents) return [];
  const cfg = content.balance.family;
  const { surnames, male, female } = content.names;
  const person = (role: Relative['role'], gender: Gender, family: string, age: number, n: number): Relative => ({
    id: `${role}_${n}`,
    role,
    gender,
    name: `${family} ${rng.pick(gender === 'nam' ? male : female)}`,
    age,
    alive: true,
    lifespan: relativeLifespan(rng, content),
    affinity: between(rng, cfg.affinityStart),
    chattedAt: null,
  });
  const father = person('father', 'nam', surname, between(rng, cfg.fatherAge), 0);
  const mother = person('mother', 'nu', rng.pick(surnames), between(rng, cfg.motherAge), 0);
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
  if (r.age > playerAge) return r.gender === 'nam' ? 'Anh' : 'Chị';
  return r.gender === 'nam' ? 'Em trai' : 'Em gái';
}

/** One year for the family (called after the player ages). */
export function ageFamily(state: GameState, content: Content): GameState {
  if (state.family.length === 0) return state;
  const cfg = content.balance.family;
  const rng = Rng.fromState(state.rng);
  const lines: LogLine[] = [];
  let happiness = state.stats.happiness;
  const surname = state.character.name.split(' ')[0];

  const family = state.family.map((r) => {
    if (!r.alive) return r;
    const age = r.age + 1;
    if (age >= r.lifespan) {
      lines.push({ text: `${relationLabel(r, state.character.age)} ${r.name} qua đời, hưởng thọ ${age} tuổi.`, tone: 'bad' });
      happiness += cfg.deathHappiness * (r.affinity / 100);
      return { ...r, age, alive: false };
    }
    return { ...r, age, affinity: clamp(r.affinity - cfg.affinityDecay) };
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
      name: `${surname} ${rng.pick(gender === 'nam' ? content.names.male : content.names.female)}`,
      age: 0,
      alive: true,
      lifespan: relativeLifespan(rng, content),
      affinity: between(rng, cfg.affinityStart),
      chattedAt: null,
    };
    family.push(baby);
    lines.push({ text: `Nhà có thêm ${gender === 'nam' ? 'một em trai' : 'một em gái'}: ${baby.name}.`, tone: 'good' });
  }

  // When both parents are gone, events that need parents stop (flag no_parents, task 1.6).
  const parentsGone = family.filter((r) => r.role !== 'sibling').every((r) => !r.alive);
  const flags = parentsGone ? { ...state.flags, no_parents: true } : state.flags;

  const log = state.log.slice();
  const last = log[log.length - 1];
  if (lines.length > 0) {
    if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
    else log.push({ age: state.character.age, lines });
  }

  return { ...state, rng: rng.getState(), family, flags, stats: { ...state.stats, happiness: clamp(happiness) }, log };
}

/** "Hỏi han": once a year per relative, a little affinity and happiness. */
export function chatWith(state: GameState, content: Content, relativeId: string): GameState {
  const cfg = content.balance.family;
  const r = state.family.find((x) => x.id === relativeId);
  if (!r || !r.alive || r.chattedAt === state.character.age) return state;
  const rng = Rng.fromState(state.rng);
  const gain = between(rng, cfg.chatAffinity);
  return {
    ...state,
    rng: rng.getState(),
    family: state.family.map((x) => (x.id === relativeId ? { ...x, affinity: clamp(x.affinity + gain), chattedAt: state.character.age } : x)),
    stats: { ...state.stats, happiness: clamp(state.stats.happiness + cfg.chatHappiness) },
  };
}
