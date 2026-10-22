// 10.7 Giải trí và đời sống (content/leisure.json): one lễ hội a year opens its own activities; tài nghệ
// (cầm, kỳ, thi, họa) grow with practice; pets are kept, named, and die old; a quẻ or a teahouse rumour names
// an event likely to come (and makes it likelier for a while); too many nights at the sòng bạc make it a habit
// that drains silver every year until it is broken. Numbers: balance.pastime. Rolls use side streams.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Pet } from '../core/types';
import { eventWeight } from './events/engine';

type Pastime = NonNullable<GameState['pastime']>;
const EMPTY: Pastime = { festival: null, arts: {}, pets: [], gambles: [], omen: null, nextUid: 1 };
const clamp = (v: number, hi = 100) => Math.max(0, Math.min(hi, Math.round(v)));

export const pastimeOf = (state: GameState): Pastime => state.pastime ?? EMPTY;
export const petDef = (content: Content, id: string) => content.leisure?.pets.find((p) => p.id === id);

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

function applyStats(state: GameState, fx: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const apts = { ...state.aptitudes };
  for (const [key, d] of Object.entries(fx)) {
    const k = key.replace(/^stat\./, '');
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + d);
    else if (k in apts) apts[k as keyof typeof apts] = clamp(apts[k as keyof typeof apts] + d);
  }
  return { ...state, stats, aptitudes: apts };
}

/** The lễ hội this year (one in turn, so every year feels different). */
export function festivalFor(state: GameState, content: Content): string | null {
  const list = content.leisure?.festivals ?? [];
  if (list.length === 0) return null;
  return new Rng(`${state.seed}:festival:${state.character.age}`).pick(list).id;
}

export function addArt(state: GameState, content: Content, fx: Record<string, number>): GameState {
  const p = pastimeOf(state);
  const max = content.balance.pastime?.artMax ?? 100;
  const arts = { ...p.arts };
  for (const [k, d] of Object.entries(fx)) arts[k] = clamp((arts[k] ?? 0) + d, max);
  return { ...state, pastime: { ...p, arts } };
}

/** Take in a pet, named from its pool (not a name already used). */
export function adoptPet(state: GameState, content: Content, id: string): GameState {
  const def = petDef(content, id);
  if (!def || !content.leisure) return state;
  const p = pastimeOf(state);
  const used = new Set(p.pets.map((x) => x.name));
  const rng = new Rng(`${state.seed}:pet:${p.nextUid}`);
  const free = def.names.filter((n) => !used.has(n));
  const name = rng.pick(free.length ? free : def.names);
  const pet: Pet = { uid: p.nextUid, id, name, since: state.character.age, age: 0 };
  const s: GameState = { ...state, pastime: { ...p, pets: [...p.pets, pet], nextUid: p.nextUid + 1 } };
  return pushLines(s, [{ text: content.leisure.texts.adopted.replace('{pet}', def.name.toLowerCase()).replace('{name}', name), tone: 'good' }]);
}

/** A quẻ / rumour: an event the coming years are likely to bring, which then comes more readily. */
export function castOmen(state: GameState, content: Content): GameState {
  const cfg = content.balance.pastime;
  const t = content.leisure?.texts;
  if (!cfg || !t) return state;
  const rng = new Rng(`${state.seed}:omen:${state.character.age}:${pastimeOf(state).nextUid}`);
  const pool = content.events.filter((e) => e.weight > 0 && !e.npcTrigger && eventWeight(state, content, e) > 0);
  if (pool.length === 0) return pushLines(state, [{ text: t.omenNone, tone: 'normal' }]);
  const picked = rng.weighted(pool, (e) => eventWeight(state, content, e));
  const p = pastimeOf(state);
  const s: GameState = { ...state, pastime: { ...p, omen: { id: picked.id, until: state.character.age + cfg.omenYears }, nextUid: p.nextUid + 1 } };
  return pushLines(s, [{ text: rng.pick(t.omen).replace('{hint}', picked.title.replace(/\{[^}]+\}/g, 'người ấy')), tone: 'rare' }]);
}

/** How much a quẻ makes this event likelier now (1 = not named). */
export function omenMul(state: GameState, content: Content, eventId: string): number {
  const o = state.pastime?.omen;
  return o && o.id === eventId && state.character.age <= o.until ? content.balance.pastime?.omenMul ?? 1 : 1;
}

export function noteGamble(state: GameState): GameState {
  const p = pastimeOf(state);
  return { ...state, pastime: { ...p, gambles: [...p.gambles, state.character.age] } };
}

/** A year: the lễ hội, pets growing old, the sòng bạc habit. */
export function pastimeYear(state: GameState, content: Content): GameState {
  const file = content.leisure;
  const cfg = content.balance.pastime;
  if (!file || !cfg || !state.alive) return state;
  const age = state.character.age;
  const lines: LogLine[] = [];
  let s = state;
  let p = pastimeOf(s);
  const festival = festivalFor(s, content);
  // Pets.
  const pets: Pet[] = [];
  for (const pet of p.pets) {
    const def = petDef(content, pet.id);
    const grown = { ...pet, age: pet.age + 1 };
    if (!def) continue;
    if (grown.age >= def.lifespan) {
      s = applyStats(s, { 'stat.happiness': cfg.petDeathHappiness });
      lines.push({ text: file.texts.petDied.replace('{pet}', def.name.toLowerCase()).replace('{name}', pet.name), tone: 'bad' });
      continue;
    }
    if (grown.age % cfg.petEvery === 0) s = applyStats(s, def.stats);
    pets.push(grown);
  }
  // The sòng bạc habit: too many nights within a few years and it takes hold.
  let recent = p.gambles.filter((a) => age - a < cfg.addictYears);
  let flags = s.flags;
  if (!flags.nghien_bac && recent.length >= cfg.addictAt) {
    flags = { ...flags, nghien_bac: true };
    // The habit is the flag now: breaking it (cai_bac) starts the count afresh.
    recent = [];
    lines.push({ text: file.texts.addicted, tone: 'bad' });
  } else if (flags.nghien_bac) {
    s = applyStats({ ...s, money: { ...s.money, silver: Math.max(0, s.money.silver + cfg.addictSilver) } }, { 'stat.happiness': cfg.addictHappiness });
    lines.push({ text: file.texts.addictedYear, tone: 'bad' });
  }
  p = { ...pastimeOf(s), festival, pets, gambles: recent, omen: p.omen && p.omen.until >= age ? p.omen : null };
  return pushLines({ ...s, flags, pastime: p }, lines);
}

/** "Tết Trung thu: Trăng rằm tháng tám…" for the Hành sự sheet (the year's own activities). */
export function festivalLine(state: GameState, content: Content): string | null {
  const f = content.leisure?.festivals.find((x) => x.id === festivalFor(state, content));
  return f && content.leisure ? content.leisure.texts.festival.replace('{festival}', f.name).replace('{text}', f.text) : null;
}

/** "Đàn 32 · Thơ 15" for the profile. */
export function artsLine(state: GameState, content: Content): string | null {
  const arts = pastimeOf(state).arts;
  const parts = (content.leisure?.arts ?? []).filter((a) => (arts[a.id] ?? 0) > 0).map((a) => `${a.name} ${Math.round(arts[a.id])}`);
  return parts.length ? parts.join(' · ') : null;
}

/** "Chó Mực (3 tuổi) · Mèo Mướp" for the profile. */
export function petsLine(state: GameState, content: Content): string | null {
  const parts = pastimeOf(state).pets.map((p) => `${petDef(content, p.id)?.name ?? p.id} ${p.name} (${p.age} tuổi)`);
  return parts.length ? parts.join(' · ') : null;
}
