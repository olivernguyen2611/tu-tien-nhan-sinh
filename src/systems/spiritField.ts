// 13.7d Linh thực: a cultivator sows linh dược in a few plots of linh điền (more with a rented cave or a
// sect of one's own). Each herb likes a kind of year (the same weather as the ruộng of 10.4, with its
// rumour): sown in a year that does not suit it, it ripens a year late and yields less. At the ripe year
// it is harvested on its own; the chance grows with the Linh Thực level and craft.farming.success, the
// count with craft.farming.yield (Mảnh vườn thần bí). Sowing takes the year's craft slot and its months.
// Herbs in recipes.json `herbs`, numbers in balance.spiritField.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { forecast } from './assets';
import { hookSum } from './cultivation';
import { addItems } from './items';
import { monthsShort, spendMonths } from './timeBudget';

const CRAFT = 'farming';
const level = (state: GameState) => state.crafts.skills[CRAFT]?.level ?? 0;

function addLine(state: GameState, line: LogLine): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return log;
}

export function plotCount(state: GameState, content: Content): number {
  const cfg = content.balance.spiritField;
  if (!cfg) return 0;
  const cave = state.cult.caveUntil !== null && state.cult.caveUntil > state.character.age;
  return cfg.plots + (cave ? cfg.plotsCave : 0) + (state.ownSect ? cfg.plotsOwnSect : 0);
}

export interface FieldView {
  plots: number;
  growing: { herb: string; ready: number; fit: string }[];
  /** This year's weather rumour (it may be wrong). */
  news: string | null;
  herbs: { id: string; name: string; text: string; seedCost: number; years: number; blocked: string | null }[];
}

export function harvestChance(state: GameState, content: Content): number {
  const cfg = content.balance.spiritField!;
  return Math.max(0.1, Math.min(0.98, cfg.successBase + level(state) * cfg.successPerLevel + hookSum(state, content, `craft.${CRAFT}.success`)));
}

export function fieldView(state: GameState, content: Content): FieldView | null {
  if (!content.balance.spiritField || state.cult.realm === 'pham_nhan') return null;
  const plots = plotCount(state, content);
  const growing = (state.field?.plots ?? []).map((p) => ({ herb: content.recipes.herbs.find((h) => h.id === p.herb)?.name ?? p.herb, ready: p.ready, fit: p.fit }));
  const herbs = content.recipes.herbs.map((h) => {
    let blocked: string | null = null;
    if (!state.alive) blocked = 'Đã hết một đời.';
    else if (level(state) < h.minLevel) blocked = `Cần Linh Thực cấp ${h.minLevel}.`;
    else if (growing.length >= plots) blocked = 'Linh điền đã kín.';
    else if (state.crafts.lastPractice === state.character.age) blocked = 'Năm nay đã luyện một nghề rồi.';
    else if (state.money.spiritStones < h.seedCost) blocked = 'Không đủ linh thạch.';
    else blocked = monthsShort(state, content, 'craft');
    return { id: h.id, name: h.name, text: h.text, seedCost: h.seedCost, years: h.years, blocked };
  });
  return { plots, growing, news: forecast(state, content)?.news ?? null, herbs };
}

/** Sow one herb in a free plot; the year's real weather decides how well it takes. */
export function sowHerb(state: GameState, content: Content, herbId: string): { state: GameState; text: string } | null {
  const h = content.recipes.herbs.find((x) => x.id === herbId);
  const view = fieldView(state, content)?.herbs.find((x) => x.id === herbId);
  const texts = content.recipes.herbTexts;
  if (!h || !view || view.blocked || !texts) return null;
  const actual = forecast(state, content)?.actual ?? 'normal';
  const fit: 'right' | 'normal' | 'wrong' = h.weather === 'any' || actual === 'normal' ? 'normal' : h.weather === actual ? 'right' : 'wrong';
  const age = state.character.age;
  const plot = { herb: h.id, planted: age, ready: age + h.years + (fit === 'wrong' ? 1 : 0), fit };
  let s = spendMonths(state, content, 'craft');
  s = {
    ...s,
    money: { ...s.money, spiritStones: s.money.spiritStones - h.seedCost },
    crafts: { ...s.crafts, lastPractice: age },
    field: { plots: [...(s.field?.plots ?? []), plot] },
  };
  const lines = [texts.sow, fit === 'right' ? texts.sowRight : fit === 'wrong' ? texts.sowWrong : ''].filter(Boolean).map((t) => t.replaceAll('{herb}', h.name));
  const text = lines.join(' ');
  return { state: { ...s, log: addLine(s, { text, tone: fit === 'wrong' ? 'bad' : 'good' }) }, text };
}

/** Yearly: ripe plots are harvested (a side stream, so the life's rng is untouched). */
export function fieldYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.spiritField;
  const texts = content.recipes.herbTexts;
  const plots = state.field?.plots ?? [];
  if (!cfg || !texts || !plots.some((p) => p.ready <= state.character.age)) return state;
  const rng = new Rng(`${state.seed}:field:${state.character.age}`);
  let s: GameState = { ...state, field: { plots: plots.filter((p) => p.ready > state.character.age) } };
  let xp = 0;
  for (const p of plots.filter((x) => x.ready <= state.character.age)) {
    const h = content.recipes.herbs.find((x) => x.id === p.herb);
    if (!h) continue;
    xp += cfg.xp;
    if (!rng.chance(harvestChance(s, content))) {
      s = { ...s, log: addLine(s, { text: texts.fail.replaceAll('{herb}', h.name), tone: 'bad' }) };
      continue;
    }
    const extra = p.fit === 'wrong' ? cfg.wrongYield : p.fit === 'right' ? cfg.rightYield : 0;
    const count = Math.max(1, h.count + extra + Math.max(0, Math.round(hookSum(s, content, `craft.${CRAFT}.yield`))));
    const product = content.items.find((i) => i.id === h.product)?.name ?? h.product;
    s = addItems(s, Array<string>(count).fill(h.product));
    s = { ...s, log: addLine(s, { text: texts.harvest.replaceAll('{count}', String(count)).replaceAll('{product}', product), tone: 'good' }) };
  }
  const skill = s.crafts.skills[CRAFT] ?? { level: 0, affinity: 0 };
  return { ...s, crafts: { ...s.crafts, skills: { ...s.crafts.skills, [CRAFT]: { ...skill, level: Math.min(100, skill.level + xp) } } } };
}
