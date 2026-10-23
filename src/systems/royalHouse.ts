// 15.0 Hoàng tộc: a royal life's family IS the court. The father of a hoàng tử is the emperor of court.ts, the brothers
// are the rivals of throne.ts, the thái tử is one of them (or the life), and a death on one side is a death on the other:
// the emperor father dies → a new niên hiệu; the niên hiệu ends (or the dynasty falls) → the father is gone. A thân
// vương's child (vuong) carries the quốc tính and the house's names but not the throne. Texts: throne.json `house`;
// numbers: balance.throne. Older lives are linked lazily in houseYear (no save migration).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Relative } from '../core/types';
import { makeName, splitName } from './names';

type House = NonNullable<Relative['house']>;
type Rank = NonNullable<Relative['rank']>;

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

export const houseOf = (state: GameState, content: Content): House | null =>
  content.origins.find((o) => o.id === state.character.originId)?.house ?? null;

export const relativeOf = (state: GameState, id: string | undefined | null): Relative | undefined =>
  id ? state.family.find((r) => r.id === id) : undefined;

const fatherOf = (state: GameState) => state.family.find((r) => r.role === 'father');

/** Living brothers of a royal life, eldest first. */
export const brothersOf = (state: GameState): Relative[] =>
  state.family.filter((r) => r.role === 'sibling' && r.gender === 'nam' && r.alive).sort((a, b) => b.age - a.age);

/** The quốc tính of a dynasty (undefined: none listed). */
export const royalSurname = (content: Content, dynasty: string | undefined): string | undefined =>
  dynasty ? content.worldState?.royalSurnames[dynasty] : undefined;

/** "Phụ hoàng", "Mẫu hậu", "Hoàng huynh"… for a relative of a royal house (null: an ordinary family). */
export function houseLabel(r: Relative, playerAge: number, content: Content): string | null {
  const l = r.house ? content.throne?.house?.labels[r.house] : undefined;
  if (!l) return null;
  if (r.role === 'father') return l.father;
  if (r.role === 'mother') return r.rank === 'hau' ? l.motherHau : l.mother;
  if (r.role !== 'sibling') return null;
  if (r.age > playerAge) return r.gender === 'nam' ? l.olderBrother : l.olderSister;
  return r.gender === 'nam' ? l.youngerBrother : l.youngerSister;
}

/** "Đương kim hoàng đế", "Thái tử"… shown under the name (null: no rank). */
export const rankLabel = (r: Relative, content: Content): string | null =>
  (r.rank && content.throne?.house?.ranks[r.rank]) || null;

export function setRank(state: GameState, id: string | undefined, rank: Rank | undefined): GameState {
  if (!id || !state.family.some((r) => r.id === id && r.rank !== rank)) return state;
  return { ...state, family: state.family.map((r) => (r.id === id ? { ...r, rank } : r)) };
}

/** A relative dies by the court's hand (a sibling's early death, a fallen emperor); no grief line, the caller says it. */
export function killRelative(state: GameState, id: string | undefined): GameState {
  if (!id || !state.family.some((r) => r.id === id && r.alive)) return state;
  return { ...state, family: state.family.map((r) => (r.id === id ? { ...r, alive: false, lifespan: r.age } : r)) };
}

/** The relative who reigns now (the emperor father, a crowned brother), alive or not. */
export const emperorRelative = (state: GameState): Relative | undefined => relativeOf(state, state.court?.emperor.npcId);

/**
 * Born into a house: the quốc tính for the life, the father and the siblings; the father is the emperor (hoang) of the
 * age balance.throne.emperorAge, the mother a hoàng hậu or a phi, older half-brothers from other consorts fill the life's
 * place in line. Rolls on a side stream, so other lives are untouched.
 */
export function bornIntoHouse(state: GameState, content: Content): GameState {
  const house = houseOf(state, content);
  const cfg = content.balance.throne;
  if (!house || state.family.length === 0) return state;
  const rng = new Rng(`${state.seed}:house:birth`);
  const surname = royalSurname(content, state.times?.dynasty) ?? splitName(state.character.name, content.names).surname;
  const rename = (name: string) => `${surname} ${splitName(name, content.names).given}`;
  const name = rename(state.character.name);
  let family = state.family.map((r): Relative => ({ ...r, house, name: r.role === 'mother' ? r.name : rename(r.name) }));
  if (house === 'hoang' && cfg) {
    const mother = rng.chance(0.3) ? 'hau' : 'phi';
    const fatherAge = rng.int(cfg.emperorAge[0], cfg.emperorAge[1]);
    family = family.map((r) => {
      if (r.role === 'father') return { ...r, age: fatherAge, lifespan: Math.max(r.lifespan, fatherAge + 5), rank: 'emperor' as const };
      if (r.role === 'mother') return { ...r, rank: mother };
      return r;
    });
    // Older brothers from other consorts, so the life has a place in line (balance.throne.rivals).
    const want = rng.int(1, rng.int(cfg.rivals[0], cfg.rivals[1]) + 1) - 1;
    const taken = [name, ...family.map((r) => r.name)];
    for (let i = family.filter((r) => r.role === 'sibling' && r.gender === 'nam').length; i < want; i++) {
      const brother = makeName(rng, content.names, 'nam', { surname, taken });
      taken.push(brother);
      const age = Math.min(fatherAge - 16, rng.int(1, 4) + i * rng.int(1, 3));
      if (age < 1) break;
      family.push({
        id: `sibling_half_${i}`, role: 'sibling', gender: 'nam', name: brother, age, alive: true, house,
        lifespan: content.balance.lifespan.mortalBase + rng.int(-content.balance.lifespan.mortalVariance, content.balance.lifespan.mortalVariance),
        affinity: rng.int(30, 55), lastActions: {},
      });
    }
  }
  return { ...state, character: { ...state.character, name }, family };
}

/** The emperor of a royal life at birth: the father (court.ts initCourt). */
export function houseEmperor(state: GameState, content: Content): { age: number; npcId: string } | null {
  const f = fatherOf(state);
  return houseOf(state, content) === 'hoang' && f?.alive && f.rank === 'emperor' ? { age: f.age, npcId: f.id } : null;
}

/**
 * Before the world's year (timesYear): an emperor of the family who died this year ends the niên hiệu now; one who
 * lives keeps it (the reign's countdown waits for him). Older royal lives are linked here once.
 */
export function houseYear(state: GameState, content: Content): GameState {
  let s = linkOldLife(state, content);
  const t = s.times;
  // Before the court's first year the father who reigns is not linked yet.
  const emp = emperorRelative(s) ?? (s.court ? undefined : relativeOf(s, houseEmperor(s, content)?.npcId));
  if (!t || !emp || s.reign) return s;
  if (!emp.alive && t.eraFrom !== s.character.age) s = { ...s, times: { ...t, reignLeft: 1 } };
  else if (emp.alive && t.reignLeft <= 1) s = { ...s, times: { ...t, reignLeft: 2 } };
  return s;
}

/** A life from before 15.0: the father reigns if the niên hiệu has not changed since birth, else he has retired. */
function linkOldLife(state: GameState, content: Content): GameState {
  const house = houseOf(state, content);
  if (!house || state.family.length === 0 || state.family.some((r) => r.house)) return state;
  let s: GameState = { ...state, family: state.family.map((r) => ({ ...r, house })) };
  const f = fatherOf(s);
  if (house !== 'hoang' || !f?.alive || !s.court) return s;
  const reigning = (s.times?.eras ?? []).every((e) => e.from <= 0) && !s.court.emperor.npcId;
  if (reigning) s = { ...s, court: { ...s.court, emperor: { ...s.court.emperor, age: f.age, npcId: f.id } } };
  s = setRank(s, f.id, reigning ? 'emperor' : 'retired');
  // Rivals by name become the brothers in the family, in order.
  const t = s.throne;
  if (t?.path === 'royal' && t.rivals?.some((r) => !r.npcId)) {
    const free = s.family.filter((r) => r.role === 'sibling' && r.gender === 'nam');
    const renamed: Record<string, string> = {};
    const rivals = t.rivals.map((r) => {
      if (r.npcId) return r;
      const b = free.shift();
      if (!b) return r;
      renamed[r.name] = b.name;
      return { ...r, npcId: b.id, name: b.name, alive: r.alive && b.alive };
    });
    s = { ...s, throne: { ...t, rivals, heir: t.heir && renamed[t.heir] ? renamed[t.heir] : t.heir } };
  }
  return s;
}

/** The lines a royal life hears about its house (emperor dies, fallen, a brother named or crowned). */
export function houseLine(content: Content, key: 'emperorDies' | 'fallen' | 'heirNamed' | 'crowned' | 'born', v: Record<string, string | number>): LogLine | null {
  const t = content.throne?.house?.texts[key];
  return t ? { text: fill(t, v), tone: key === 'born' ? 'good' : key === 'crowned' || key === 'heirNamed' ? 'normal' : 'bad' } : null;
}

/** A brother of a royal life to name thái tử when the life is out of the race (eldest living), or null. */
export const eldestBrother = (state: GameState): Relative | undefined => brothersOf(state)[0];
