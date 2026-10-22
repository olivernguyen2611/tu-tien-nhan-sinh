// 13.7c Ngự thú: one linh thú bound by khế ước. It comes from a Trứng linh thú (hatched) or a capture
// (a try a year that takes the craft slot). It grows with the years and with nội đan fed to it, faster
// the higher the Ngự Thú level, through four stages; each stage adds a share of the master's combat
// power, and some species bring their own hooks. It dies of age. Species in recipes.json `beasts`,
// numbers in balance.spiritBeast.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { removeItems } from './items';
import { monthsShort, spendMonths } from './timeBudget';

const CRAFT = 'beast';
const EGG = 'trung_linh_thu';

const level = (state: GameState) => state.crafts.skills[CRAFT]?.level ?? 0;
const realmIdx = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

function addLine(state: GameState, line: LogLine): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return log;
}

export interface BeastView {
  name: string;
  species: string;
  text: string;
  stage: string;
  /** Exp toward the next stage, 0–100 (100 at the last stage). */
  growth: number;
  years: number;
  feeds: { item: string; name: string; have: number }[];
}

export function beastView(state: GameState, content: Content): BeastView | null {
  const b = state.beast;
  const sp = b && content.recipes.beasts.find((x) => x.id === b.species);
  const cfg = content.balance.spiritBeast;
  if (!b || !sp || !cfg) return null;
  const next = cfg.stageExp[b.stage + 1];
  const from = cfg.stageExp[b.stage];
  const growth = next === undefined ? 100 : Math.round(((b.exp - from) / (next - from)) * 100);
  const feeds = Object.keys(cfg.feedExp).map((item) => ({ item, name: content.items.find((i) => i.id === item)?.name ?? item, have: state.inventory[item] ?? 0 }));
  return { name: b.name, species: sp.name, text: sp.text, stage: content.recipes.beastTexts?.stages[b.stage] ?? '', growth, years: state.character.age - b.since, feeds };
}

export function beastHooks(state: GameState, content: Content): EffectHook[] {
  const b = state.beast;
  const sp = b && content.recipes.beasts.find((x) => x.id === b.species);
  const cfg = content.balance.spiritBeast;
  if (!b || !sp || !cfg) return [];
  return [{ hook: 'combatPower', add: (cfg.stagePower[b.stage] ?? 0) * sp.power }, ...sp.hooks];
}

/** Why a capture or a hatching cannot be done now, or null. */
export function beastBlocked(state: GameState, content: Content, how: 'hatch' | 'capture'): string | null {
  const cfg = content.balance.spiritBeast;
  if (!cfg || state.cult.realm === 'pham_nhan') return 'Chưa tu hành.';
  if (!state.alive) return 'Đã hết một đời.';
  if (state.beast) return 'Đã có linh thú theo bên.';
  if (how === 'hatch') return (state.inventory[EGG] ?? 0) > 0 ? null : 'Không có trứng linh thú.';
  if (level(state) < cfg.captureMin) return `Cần Ngự Thú cấp ${cfg.captureMin}.`;
  if (state.crafts.lastPractice === state.character.age) return 'Năm nay đã luyện một nghề rồi.';
  return monthsShort(state, content, 'craft');
}

export function captureChance(state: GameState, content: Content): number {
  const cfg = content.balance.spiritBeast!;
  return Math.max(0.05, Math.min(0.95, cfg.captureBase + level(state) * cfg.capturePerLevel));
}

function bind(state: GameState, content: Content, speciesId: string, rng: Rng): GameState {
  const name = rng.pick(content.recipes.beastTexts?.names ?? ['Tiểu Hắc']);
  return { ...state, beast: { species: speciesId, name, stage: 0, exp: 0, since: state.character.age } };
}

const reachable = (state: GameState, content: Content, egg: boolean) =>
  content.recipes.beasts.filter((b) => (!egg || b.egg) && realmIdx(content, b.minRealm) <= realmIdx(content, state.cult.realm));

/** Hatch an egg (free, any time) or try a capture (takes the craft slot and months). */
export function gainBeast(state: GameState, content: Content, how: 'hatch' | 'capture'): { state: GameState; text: string } | null {
  if (beastBlocked(state, content, how)) return null;
  const texts = content.recipes.beastTexts!;
  const rng = Rng.fromState(state.rng);
  const pool = reachable(state, content, how === 'hatch');
  if (!pool.length) return null;
  const sp = rng.pick(pool);
  let s: GameState = state;
  let text: string;
  if (how === 'hatch') {
    s = bind(removeItems(s, [EGG]), content, sp.id, rng);
    text = texts.hatch.replaceAll('{beast}', sp.name);
  } else {
    s = { ...spendMonths(s, content, 'craft'), crafts: { ...s.crafts, lastPractice: s.character.age } };
    const ok = rng.chance(captureChance(state, content));
    if (ok) s = bind(s, content, sp.id, rng);
    else s = { ...s, stats: { ...s.stats, health: Math.max(0, s.stats.health - 5) } };
    text = (ok ? texts.capture : texts.captureFail).replaceAll('{beast}', sp.name);
  }
  s = { ...s, rng: rng.getState() };
  return { state: { ...s, log: addLine(s, { text, tone: s.beast ? 'good' : 'bad' }) }, text };
}

/** Exp gained, then any stages passed (with a line each). */
function grow(state: GameState, content: Content, exp: number): { state: GameState; lines: LogLine[] } {
  const cfg = content.balance.spiritBeast!;
  const b = state.beast!;
  const total = b.exp + exp * (1 + level(state) * cfg.levelExpMul);
  let stage = b.stage;
  const lines: LogLine[] = [];
  while (cfg.stageExp[stage + 1] !== undefined && total >= cfg.stageExp[stage + 1]) {
    stage++;
    lines.push({ text: (content.recipes.beastTexts?.grow ?? '').replaceAll('{name}', b.name).replaceAll('{stage}', content.recipes.beastTexts?.stages[stage] ?? ''), tone: 'rare' });
  }
  return { state: { ...state, beast: { ...b, exp: total, stage } }, lines };
}

/** Feed one nội đan (no time cost). */
export function feedBeast(state: GameState, content: Content, item: string): { state: GameState; text: string } | null {
  const exp = content.balance.spiritBeast?.feedExp[item];
  if (!state.beast || exp === undefined || (state.inventory[item] ?? 0) < 1) return null;
  const g = grow(removeItems(state, [item]), content, exp);
  const itemName = content.items.find((i) => i.id === item)?.name ?? item;
  const lines = [{ text: (content.recipes.beastTexts?.feed ?? '').replaceAll('{name}', state.beast.name).replaceAll('{item}', itemName), tone: 'good' as const }, ...g.lines];
  let s = g.state;
  for (const l of lines) s = { ...s, log: addLine(s, l) };
  return { state: s, text: lines.map((l) => l.text).join(' ') };
}

export function releaseBeast(state: GameState, content: Content): { state: GameState; text: string } | null {
  if (!state.beast) return null;
  const text = (content.recipes.beastTexts?.release ?? '').replaceAll('{name}', state.beast.name);
  const s: GameState = { ...state, beast: null, stats: { ...state.stats, happiness: Math.max(0, state.stats.happiness - 3) } };
  return { state: { ...s, log: addLine(s, { text, tone: 'normal' }) }, text };
}

/** Yearly: the beast grows a little, or dies of age. */
export function beastYear(state: GameState, content: Content): GameState {
  const b = state.beast;
  const cfg = content.balance.spiritBeast;
  const sp = b && content.recipes.beasts.find((x) => x.id === b.species);
  if (!b || !cfg || !sp || !state.alive) return state;
  const years = state.character.age - b.since;
  if (years >= sp.lifespan) {
    const text = (content.recipes.beastTexts?.old ?? '').replaceAll('{name}', b.name).replaceAll('{years}', String(years));
    const s: GameState = { ...state, beast: null, stats: { ...state.stats, happiness: Math.max(0, Math.min(100, state.stats.happiness + cfg.oldHappiness)) } };
    return { ...s, log: addLine(s, { text, tone: 'bad' }) };
  }
  const g = grow(state, content, cfg.yearExp);
  let s = g.state;
  for (const l of g.lines) s = { ...s, log: addLine(s, l) };
  return s;
}
