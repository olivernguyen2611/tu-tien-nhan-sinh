// 10.8 Sức khỏe, bệnh tật, ngoại hình (content/health.json): a mortal catches named bệnh (more as a child and
// when old) that cost health each year until they pass, are cured (lang trung, tiệm thuốc, thầy cúng, one's own
// nghề thuốc, a rare thuốc quý) or kill; some spread through the household. Thương tật last for life and set a
// flag that events and activities read. Too many cups make nghiện rượu. Numbers: balance.ailments. Side streams only.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { tradeOf } from './schooling';

type Body = NonNullable<GameState['body']>;
const EMPTY: Body = { ailments: [], injuries: [], drinks: [] };
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const ROLE_NAMES: Record<string, string> = { father: 'cha', mother: 'mẹ', sibling: 'anh chị em', child: 'con' };

export const bodyOf = (state: GameState): Body => state.body ?? EMPTY;
export const diseaseDef = (content: Content, id: string) => content.health?.diseases.find((d) => d.id === id);
export const injuryDef = (content: Content, id: string) => content.health?.injuries.find((d) => d.id === id);

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

/** A mortal body falls ill; a cultivator's (or a quỷ tu's) does not. */
const canFallIll = (state: GameState) => state.cult.realm === 'pham_nhan' && !state.flags.quy_tu;

/** Fall ill: this bệnh, or one fitting the age ("random"). Nothing if already sick with it or with too many. */
export function catchDisease(state: GameState, content: Content, id: string): GameState {
  const file = content.health;
  const cfg = content.balance.ailments;
  if (!file || !cfg || !canFallIll(state)) return state;
  const b = bodyOf(state);
  if (b.ailments.length >= cfg.maxAilments) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:disease:${age}:${b.ailments.length}`);
  const fits = file.diseases.filter((d) => (d.minAge ?? 0) <= age && age <= (d.maxAge ?? 999) && !b.ailments.some((a) => a.id === d.id));
  const def = id === 'random' ? (fits.length ? rng.weighted(fits, (d) => d.weight) : undefined) : fits.find((d) => d.id === id);
  if (!def) return state;
  const s: GameState = { ...state, body: { ...b, ailments: [...b.ailments, { id: def.id, since: age }] } };
  return pushLines(s, [{ text: rng.pick(def.onset), tone: 'bad' }]);
}

/** Try to cure the worst bệnh. The lang trung may be good or a quack; a thầy cúng may do harm. */
export function cureAilment(state: GameState, content: Content, how: 'doctor' | 'shop' | 'shaman' | 'self' | 'rare'): GameState {
  const file = content.health;
  const cfg = content.balance.ailments;
  if (!file || !cfg) return state;
  const b = bodyOf(state);
  const worst = b.ailments.map((a) => diseaseDef(content, a.id)).filter((d) => d !== undefined)
    .sort((x, y) => y.health[1] - x.health[1])[0];
  if (!worst) return pushLines(state, [{ text: file.texts.noAilment, tone: 'normal' }]);
  const rng = new Rng(`${state.seed}:cure:${state.character.age}:${how}:${b.ailments.length}`);
  const lines: LogLine[] = [];
  let chance = worst.cure[how];
  if (how === 'doctor') {
    const good = rng.chance(cfg.doctorGoodShare);
    chance *= good ? cfg.doctorGood : cfg.doctorBad;
    lines.push({ text: rng.pick(good ? file.texts.doctorGood : file.texts.doctorBad), tone: 'normal' });
  }
  if (how === 'self') chance *= 1 + tradeOf(state).level * cfg.selfPerLevel;
  let s = state;
  if (rng.chance(Math.min(0.97, chance))) {
    s = { ...s, body: { ...b, ailments: b.ailments.filter((a) => a.id !== worst.id) } };
    lines.push({ text: worst.healed.replace('{disease}', worst.name.toLowerCase()), tone: 'good' });
  } else {
    lines.push({ text: rng.pick(file.texts.cureFail).replace('{disease}', worst.name.toLowerCase()), tone: 'bad' });
    if (how === 'shaman' && rng.chance(0.5)) {
      s = applyStats(s, { 'stat.health': -cfg.shamanHarm });
      lines.push({ text: file.texts.shamanHarm, tone: 'bad' });
    }
  }
  return pushLines(s, lines);
}

/** A thương tật for life: stats move once, its flag is set. */
export function injure(state: GameState, content: Content, id: string): GameState {
  const def = injuryDef(content, id);
  const b = bodyOf(state);
  if (!def || b.injuries.includes(id)) return state;
  const s = applyStats({ ...state, body: { ...b, injuries: [...b.injuries, id] }, flags: { ...state.flags, [def.flag]: true } }, def.stats);
  return pushLines(s, [{ text: def.text, tone: 'bad' }]);
}

export function noteDrink(state: GameState): GameState {
  const b = bodyOf(state);
  return { ...state, body: { ...b, drinks: [...b.drinks, state.character.age] } };
}

/** A year: new bệnh, old ones wear on, pass or spread; the drinking habit. */
export function healthYear(state: GameState, content: Content): GameState {
  const file = content.health;
  const cfg = content.balance.ailments;
  if (!file || !cfg || !state.alive) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:health:${age}`);
  const lines: LogLine[] = [];
  let s = state;
  // Falling ill: children and the old most.
  if (canFallIll(s)) {
    const chance = age < 12 ? cfg.childChance : cfg.adultChance + Math.max(0, age - cfg.oldFrom) * cfg.oldPerYear;
    if (rng.chance(chance)) s = catchDisease(s, content, 'random');
  }
  // Each bệnh: passes, or costs this year; a lây one may spread to the household.
  let b = bodyOf(s);
  const kept: Body['ailments'] = [];
  let health = 0, happiness = 0;
  for (const a of b.ailments) {
    const def = diseaseDef(content, a.id);
    if (!def) continue;
    if (a.since < age && rng.chance(def.selfHeal)) {
      lines.push({ text: def.healed.replace('{disease}', def.name.toLowerCase()), tone: 'good' });
      continue;
    }
    kept.push(a);
    if (a.since < age) {
      health -= rng.int(def.health[0], def.health[1]);
      happiness -= def.happiness;
      lines.push({ text: rng.pick(file.texts.worse).replace('{disease}', def.name.toLowerCase()), tone: 'bad' });
    }
    if (def.contagious && rng.chance(cfg.contagion)) {
      const near = s.family.filter((r) => r.alive);
      if (near.length) {
        const r = rng.pick(near);
        const frail = r.age >= 60 || r.age <= 5;
        const dies = frail && rng.chance(cfg.contagionDeath);
        const text = (dies ? file.texts.spreadDied : file.texts.spread)
          .replace('{who}', ROLE_NAMES[r.role] ?? r.role).replace('{name}', r.name).replace('{disease}', def.name.toLowerCase());
        lines.push({ text, tone: 'bad' });
        happiness -= dies ? 6 : 2;
        // The relative dies next year turn (ageFamily handles the death and its grief).
        if (dies) s = { ...s, family: s.family.map((x) => (x.id === r.id ? { ...x, lifespan: Math.min(x.lifespan, x.age + 1) } : x)) };
      }
    }
  }
  b = { ...bodyOf(s), ailments: kept };
  // The drinking habit.
  let drinks = b.drinks.filter((d) => age - d < cfg.drinkYears);
  let flags = s.flags;
  if (!flags.nghien_ruou && drinks.length >= cfg.drinkAt) {
    flags = { ...flags, nghien_ruou: true };
    drinks = [];
    lines.push({ text: file.texts.drunk, tone: 'bad' });
  } else if (flags.nghien_ruou) {
    health += cfg.drinkHealth;
    happiness += cfg.drinkHappiness;
    s = { ...s, money: { ...s.money, silver: Math.max(0, s.money.silver + cfg.drinkSilver) } };
    lines.push({ text: file.texts.drunkYear, tone: 'bad' });
  }
  s = applyStats({ ...s, flags, body: { ...b, drinks } }, { 'stat.health': health, 'stat.happiness': happiness });
  return pushLines(s, lines);
}

/** "Phong hàn · Què chân · Nghiện rượu" for the profile. */
export function healthLine(state: GameState, content: Content): string | null {
  const b = bodyOf(state);
  const parts = [
    ...b.ailments.map((a) => diseaseDef(content, a.id)?.name ?? a.id),
    ...b.injuries.map((i) => injuryDef(content, i)?.name ?? i),
    ...(state.flags.nghien_ruou ? ['Nghiện rượu'] : []),
  ];
  return parts.length ? parts.join(' · ') : null;
}
