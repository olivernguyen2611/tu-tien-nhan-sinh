// 13.7b Bày trận: a cultivator with a place (a rented cave, a sect, or a sect of their own) lays a trận
// by placing trận kỳ along the tương sinh cycle. The stones go into the trận eyes either way; a won game
// gives the trận's hooks for its years, a lost one only a little craft xp. Laying takes the year's craft
// slot and its months. Trận in recipes.json `formations`, numbers in balance.formation.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { FormationGame, GameState, LogLine } from '../core/types';
import { monthsShort, spendMonths } from './timeBudget';

const CRAFT = 'formation';

export interface FormationView {
  id: string;
  name: string;
  text: string;
  cost: number;
  years: number;
  blocked: string | null;
}

const level = (state: GameState) => state.crafts.skills[CRAFT]?.level ?? 0;

function addLine(state: GameState, line: LogLine): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return log;
}

const hasPlace = (state: GameState) =>
  (state.cult.caveUntil !== null && state.cult.caveUntil > state.character.age) || !!state.sect.id || !!state.ownSect;

/** The trận under way and the year it lasts to, or null. */
export function activeFormation(state: GameState, content: Content): { name: string; until: number } | null {
  const a = state.formation?.active;
  const def = a && a.until > state.character.age ? content.recipes.formations.find((f) => f.id === a.id) : undefined;
  return def ? { name: def.name, until: a!.until } : null;
}

export function formationHooks(state: GameState, content: Content): EffectHook[] {
  const a = state.formation?.active;
  if (!a || a.until <= state.character.age) return [];
  return content.recipes.formations.find((f) => f.id === a.id)?.hooks ?? [];
}

export function formationViews(state: GameState, content: Content): FormationView[] {
  if (state.cult.realm === 'pham_nhan') return [];
  const texts = content.recipes.formationTexts;
  return content.recipes.formations.map((f) => {
    let blocked: string | null = null;
    if (!state.alive) blocked = 'Đã hết một đời.';
    else if (state.formation?.game) blocked = 'Đang bày trận.';
    else if (level(state) < f.minLevel) blocked = `Cần Trận Pháp cấp ${f.minLevel}.`;
    else if (!hasPlace(state)) blocked = texts?.noPlace ?? 'Chưa có chỗ bày trận.';
    else if (state.crafts.lastPractice === state.character.age) blocked = 'Năm nay đã luyện một nghề rồi.';
    else if (state.money.spiritStones < f.cost) blocked = 'Không đủ linh thạch.';
    else blocked = monthsShort(state, content, 'craft');
    return { id: f.id, name: f.name, text: f.text, cost: f.cost, years: f.years, blocked };
  });
}

/** The five basic elements, as trận kỳ to place. */
export function formationSymbols(content: Content): { id: string; name: string }[] {
  return content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => ({ id: e.id, name: e.name }));
}

/** Pay and open the trận kỳ game. */
export function beginFormation(state: GameState, content: Content, id: string): GameState | null {
  const def = content.recipes.formations.find((f) => f.id === id);
  const view = formationViews(state, content).find((v) => v.id === id);
  const cfg = content.balance.formation;
  if (!def || !view || view.blocked || !cfg) return null;
  const rng = Rng.fromState(state.rng);
  const gen = content.balance.coreForming.generates;
  const target = [rng.pick(formationSymbols(content)).id];
  while (target.length < def.length) target.push(gen[target[target.length - 1]]);
  const given = [0];
  if (def.length >= cfg.secondGivenAt) given.push(rng.int(1, def.length - 1));
  const game: FormationGame = { id, target, given, input: [], mistakes: 0, allowed: cfg.allowedBase + Math.floor(level(state) / cfg.perLevel) };
  const s = spendMonths(state, content, 'craft');
  return {
    ...s,
    rng: rng.getState(),
    money: { ...s.money, spiritStones: s.money.spiritStones - def.cost },
    crafts: { ...s.crafts, lastPractice: s.character.age },
    formation: { active: s.formation?.active ?? null, game },
  };
}

/** The slots still to fill, in order. */
export function openSlots(game: FormationGame): number[] {
  return game.target.map((_, i) => i).filter((i) => !game.given.includes(i));
}

function finish(state: GameState, content: Content, win: boolean): { state: GameState; text: string } {
  const game = state.formation!.game!;
  const def = content.recipes.formations.find((f) => f.id === game.id)!;
  const cfg = content.balance.formation!;
  const texts = content.recipes.formationTexts;
  const skill = state.crafts.skills[CRAFT] ?? { level: 0, affinity: 0 };
  const crafts = { ...state.crafts, skills: { ...state.crafts.skills, [CRAFT]: { ...skill, level: Math.min(100, skill.level + (win ? cfg.xpWin : cfg.xpLose)) } } };
  const age = state.character.age;
  const text = win
    ? (texts?.win ?? '{name}').replaceAll('{name}', def.name).replaceAll('{years}', String(def.years))
    : texts?.lose ?? '';
  const active = win ? { id: def.id, until: age + def.years } : state.formation!.active;
  const s: GameState = { ...state, crafts, formation: { active, game: null } };
  return { state: { ...s, log: addLine(s, { text, tone: win ? 'good' : 'bad' }) }, text };
}

/** Place one trận kỳ in the next open slot: a wrong one costs a mistake. */
export function formationInput(state: GameState, content: Content, symbol: string): { state: GameState; done: boolean; text: string } {
  const g = state.formation?.game;
  if (!g) return { state, done: false, text: '' };
  const slot = openSlots(g)[g.input.length];
  const right = g.target[slot] === symbol;
  const game: FormationGame = right ? { ...g, input: [...g.input, symbol] } : { ...g, mistakes: g.mistakes + 1 };
  const next: GameState = { ...state, formation: { active: state.formation!.active, game } };
  const lost = game.mistakes > game.allowed;
  const won = game.input.length >= openSlots(game).length;
  if (!lost && !won) return { state: next, done: false, text: '' };
  return { ...finish(next, content, won && !lost), done: true };
}

/** Pull up the trận kỳ: counts as a failed trận. */
export function formationQuit(state: GameState, content: Content): { state: GameState; text: string } {
  if (!state.formation?.game) return { state, text: '' };
  return finish(state, content, false);
}

/** Yearly: a trận whose years are spent falls, with a line. */
export function formationYear(state: GameState, content: Content): GameState {
  const a = state.formation?.active;
  if (!a || a.until > state.character.age) return state;
  const def = content.recipes.formations.find((f) => f.id === a.id);
  const text = (content.recipes.formationTexts?.ended ?? '').replaceAll('{name}', def?.name ?? '');
  const s: GameState = { ...state, formation: { ...state.formation!, active: null } };
  return text ? { ...s, log: addLine(s, { text, tone: 'normal' }) } : s;
}
