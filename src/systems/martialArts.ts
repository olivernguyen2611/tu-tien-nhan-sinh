// 11.3 Võ học phàm tục (content/martial-arts.json): bí kíp (quyền, cước, đao, kiếm, thương, ám khí, khinh công, nội công)
// learned and practised level by level, each adding chiến lực and pulling toward one of the five combat paths; phàm
// binh khí bought or won, a better fit with an art of its kind; nội thương from heavy defeats that costs thọ nguyên and
// chiến lực until it heals; tẩu hỏa nhập ma when practising a fake tàn quyển, a tà công, or with a weak will.
// The võ đạo stages themselves (Tam lưu … Ngũ khí) stay in martial.ts. Numbers: balance.arts. Rolls use side streams.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { readValue } from './events/conditions';

type Arts = NonNullable<GameState['martialArts']>;
const EMPTY: Arts = { known: [], weapon: null, wound: 0 };
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

export const artsOf = (state: GameState): Arts => state.martialArts ?? EMPTY;
export const artDef = (content: Content, id: string) => content.martialArts?.arts.find((a) => a.id === id);
export const weaponDef = (content: Content, id: string | null | undefined) => content.martialArts?.weapons.find((w) => w.id === id);

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}
const withArts = (state: GameState, patch: Partial<Arts>): GameState => ({ ...state, martialArts: { ...artsOf(state), ...patch } });

/** Whether the body and mind are up to this art's needs. */
export function artFits(state: GameState, content: Content, id: string): boolean {
  const def = artDef(content, id);
  return !!def && Object.entries(def.needs).every(([k, v]) => readValue(state, k) >= v);
}

/** Learn an art (an id, or one drawn from these grades / kinds); its path grows a little. */
export function learnArt(state: GameState, content: Content, spec: string | { grades?: number[]; kinds?: string[]; evil?: boolean }): GameState {
  const file = content.martialArts;
  const cfg = content.balance.arts;
  if (!file || !cfg) return state;
  const a = artsOf(state);
  let id: string | undefined;
  if (typeof spec === 'string') id = spec;
  else {
    const rng = new Rng(`${state.seed}:art-draw:${state.character.age}:${a.known.length}`);
    const pool = file.arts.filter((x) => !a.known.some((k) => k.id === x.id) && !x.fake && (spec.evil === undefined || !!x.evil === spec.evil)
      && (!spec.grades || spec.grades.includes(x.grade)) && (!spec.kinds || spec.kinds.includes(x.kind)));
    id = pool.length ? rng.pick(pool).id : undefined;
  }
  const def = id ? artDef(content, id) : undefined;
  if (!def) return state;
  if (a.known.some((k) => k.id === def.id)) return pushLines(state, [{ text: fill(file.texts.known, { art: def.name }), tone: 'normal' }]);
  if (!artFits(state, content, def.id)) return pushLines(state, [{ text: fill(file.texts.unfit, { art: def.name }), tone: 'normal' }]);
  const path = file.kinds[def.kind]?.path;
  const paths = path && path in state.paths ? { ...state.paths, [path]: Math.min(100, state.paths[path] + cfg.pathAffinity) } : state.paths;
  const s = withArts({ ...state, paths }, { known: [...a.known, { id: def.id, level: 1, xp: 0 }] });
  return pushLines(s, [{ text: fill(file.texts.learned, { art: def.name, kind: file.kinds[def.kind]?.name ?? def.kind, text: def.text }), tone: 'good' }]);
}

/** Practise: the least advanced art not yet at its peak gains xp, a level when enough; tẩu hỏa may strike. */
export function practiseArt(state: GameState, content: Content): GameState {
  const file = content.martialArts;
  const cfg = content.balance.arts;
  if (!file || !cfg) return state;
  const a = artsOf(state);
  const open = a.known.filter((k) => (artDef(content, k.id)?.maxLevel ?? 0) > k.level).sort((x, y) => x.level - y.level);
  if (a.known.length === 0) return pushLines(state, [{ text: file.texts.nothing, tone: 'normal' }]);
  if (open.length === 0) return pushLines(state, [{ text: fill(file.texts.maxed, { art: artDef(content, a.known[0].id)?.name ?? '' }), tone: 'normal' }]);
  const k = open[0];
  const def = artDef(content, k.id)!;
  const rng = new Rng(`${state.seed}:art-practise:${state.character.age}:${k.id}:${k.xp}:${k.level}`);
  const lines: LogLine[] = [{ text: fill(rng.pick(file.texts.practice), { art: def.name }), tone: 'normal' }];
  // Tẩu hỏa nhập ma: a fake tàn quyển (above its real levels), a tà công, a weak will.
  const d = cfg.deviation;
  const fakeDeep = def.fake && k.level >= d.fakeFrom;
  const chance = d.base + (fakeDeep ? d.fake : 0) + (def.evil ? d.evil : 0) + (state.aptitudes.daoHeart < d.lowWillBelow ? d.lowWill : 0);
  if (rng.chance(chance)) {
    let s = withArts(state, { known: a.known.map((x) => (x.id === k.id ? { ...x, level: Math.max(1, x.level - 1), xp: 0 } : x)), wound: Math.min(100, a.wound + d.wound) });
    s = { ...s, stats: { ...s.stats, health: Math.max(0, s.stats.health + d.health) } };
    lines.push({ text: fill(fakeDeep ? file.texts.fakeExposed : file.texts.deviation, { art: def.name }), tone: 'bad' });
    // A fake one is useless past where its pages stop.
    if (fakeDeep) s = withArts(s, { known: artsOf(s).known.filter((x) => x.id !== k.id) });
    return pushLines(s, lines);
  }
  const need = k.level + def.grade;
  const xp = k.xp + 1;
  const up = xp >= need;
  const known = a.known.map((x) => (x.id === k.id ? { ...x, level: up ? x.level + 1 : x.level, xp: up ? 0 : xp } : x));
  let s = withArts(state, { known });
  if (up) {
    lines.push({ text: fill(file.texts.levelUp, { art: def.name, level: k.level + 1, max: def.maxLevel }), tone: 'good' });
    // A nội công trained to its peak adds thọ nguyên once.
    if (def.lifespan && k.level + 1 === def.maxLevel) s = { ...s, cult: { ...s.cult, lifespan: s.cult.lifespan + def.lifespan } };
  }
  return pushLines(s, lines);
}

/** Buy at the lò rèn: the best weapon the purse allows (an id buys that one), better than the one carried. */
export function buyWeapon(state: GameState, content: Content, which: string): GameState {
  const file = content.martialArts;
  if (!file) return state;
  const current = weaponDef(content, artsOf(state).weapon)?.power ?? 0;
  const list = which === 'best' ? file.weapons.filter((w) => w.price <= state.money.silver).sort((x, y) => y.power - x.power) : file.weapons.filter((w) => w.id === which);
  const w = list[0];
  if (!w || w.price > state.money.silver) return pushLines(state, [{ text: file.texts.poor, tone: 'normal' }]);
  if (w.power <= current) return pushLines(state, [{ text: file.texts.better, tone: 'normal' }]);
  const s = withArts({ ...state, money: { ...state.money, silver: state.money.silver - w.price } }, { weapon: w.id });
  return pushLines(s, [{ text: fill(file.texts.bought, { silver: w.price, weapon: w.name, text: w.text }), tone: 'good' }]);
}

/** A weapon won or given (no bạc changes hands); kept only when better. */
export function gainWeapon(state: GameState, content: Content, id: string): GameState {
  const w = weaponDef(content, id);
  if (!w || w.power <= (weaponDef(content, artsOf(state).weapon)?.power ?? 0)) return state;
  return withArts(state, { weapon: w.id });
}

/** Nội thương ±: a new wound also costs thọ nguyên. */
export function addWound(state: GameState, content: Content, d: number): GameState {
  const cfg = content.balance.arts;
  const file = content.martialArts;
  if (!cfg || !file) return state;
  const a = artsOf(state);
  const wound = Math.max(0, Math.min(100, a.wound + d));
  let s = withArts(state, { wound });
  if (d > 0) {
    s = { ...s, cult: { ...s.cult, lifespan: s.cult.lifespan - cfg.woundLifespan } };
    s = pushLines(s, [{ text: file.texts.wounded, tone: 'bad' }]);
  } else if (d < 0 && a.wound > 0) s = pushLines(s, [{ text: file.texts.healed, tone: 'good' }]);
  return s;
}

/** A heavy defeat (the fight was lost) leaves nội thương on a mortal fighter; the line goes with the fight's. */
export function woundFromDefeat(state: GameState, content: Content): { state: GameState; line: LogLine | null } {
  const cfg = content.balance.arts;
  const file = content.martialArts;
  if (!cfg || !file || state.cult.realm !== 'pham_nhan' || state.stats.health <= 0) return { state, line: null };
  const a = artsOf(state);
  const s = withArts({ ...state, cult: { ...state.cult, lifespan: state.cult.lifespan - cfg.woundLifespan } }, { wound: Math.min(100, a.wound + cfg.woundPerLoss) });
  return { state: s, line: { text: file.texts.wounded, tone: 'bad' } };
}

/** Chiến lực from võ học, binh khí (more with an art of its kind) and nội thương, added to a mortal's combatPower bonus. */
export function artsBonus(state: GameState, content: Content): number {
  const cfg = content.balance.arts;
  const a = state.martialArts;
  // Phàm võ học only counts for a mortal: past Luyện Khí, linh lực outweighs any chiêu thức.
  if (!cfg || !a || state.cult.realm !== 'pham_nhan') return 0;
  const arts = a.known.reduce((sum, k) => sum + (artDef(content, k.id)?.power ?? 0) * k.level, 0);
  const w = weaponDef(content, a.weapon);
  const fit = w && a.known.some((k) => artDef(content, k.id)?.kind === w.kind) ? cfg.weaponFit : 1;
  return Math.min(cfg.maxBonus, arts) + (w ? w.power * fit : 0) - a.wound * cfg.woundPower;
}

/** A year: nội thương slowly mends, and a deep one hurts. */
export function artsYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.arts;
  const file = content.martialArts;
  const a = state.martialArts;
  if (!cfg || !file || !a || a.wound <= 0 || !state.alive) return state;
  let s = withArts(state, { wound: Math.max(0, a.wound - cfg.woundHeal) });
  if (a.wound >= cfg.woundHurtAt) {
    s = { ...s, stats: { ...s.stats, health: Math.max(0, s.stats.health + cfg.woundHurt) } };
    s = pushLines(s, [{ text: file.texts.woundHurt, tone: 'bad' }]);
  }
  return s;
}

/** "Mãnh Hổ Quyền 3/5 · Thanh cương kiếm · nội thương 24" for the profile. */
export function martialArtsLine(state: GameState, content: Content): string | null {
  const a = state.martialArts;
  if (!a || (a.known.length === 0 && !a.weapon && a.wound <= 0)) return null;
  const parts = a.known.map((k) => { const d = artDef(content, k.id); return d ? `${d.name} ${k.level}/${d.maxLevel}` : k.id; });
  const w = weaponDef(content, a.weapon);
  if (w) parts.push(w.name);
  if (a.wound > 0) parts.push(`nội thương ${Math.round(a.wound)}`);
  return parts.join(' · ');
}
