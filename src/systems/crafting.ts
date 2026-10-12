// Luyện đan và luyện khí (task 4.7): turn materials into pills and artifacts.
// Making something takes the year's craft slot (like practice). The chance grows
// with the craft level above the recipe's, Ngộ tính and craft.<id>.success hooks;
// craft.<id>.yield hooks add to the count. A failed alchemy leaves a Phế Đan.
// Recipes in recipes.json, numbers in balance.crafting.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Recipe } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { hookSum } from './cultivation';
import { addItems, itemById, removeItems } from './items';

export interface RecipeView {
  id: string;
  product: string;
  count: number;
  /** "2 Linh tinh hệ Kim · 20 linh thạch". */
  needs: string;
  chance: number;
  blocked: string | null;
}

function level(state: GameState, craft: string): number {
  return state.crafts.skills[craft]?.level ?? 0;
}

export function craftChance(state: GameState, content: Content, recipe: Recipe): number {
  const cfg = content.balance.crafting;
  const p = cfg.base + (level(state, recipe.craft) - recipe.minLevel) * cfg.perLevel
    + (state.aptitudes.comprehension - 50) * cfg.perComprehension
    + hookSum(state, content, `craft.${recipe.craft}.success`) + hookSum(state, content, 'craft.all.success');
  return Math.max(cfg.min, Math.min(cfg.max, p));
}

function itemName(content: Content, id: string): string {
  return itemById(content, id)?.name ?? id;
}

/** Recipes of a craft this life can see (mortals: only phàm dược). */
export function recipeViews(state: GameState, content: Content, craft: string): RecipeView[] {
  const cultivator = state.cult.realm !== 'pham_nhan';
  return content.recipes.recipes
    .filter((r) => r.craft === craft && (cultivator || r.mortal))
    .map((r) => {
      const needs = [
        ...Object.entries(r.materials).map(([id, n]) => `${n} ${itemName(content, id)}`),
        ...(r.cost.spiritStones ? [`${r.cost.spiritStones} linh thạch`] : []),
        ...(r.cost.silver ? [`${r.cost.silver} bạc`] : []),
      ].join(' · ');
      const missing = Object.entries(r.materials).find(([id, n]) => (state.inventory[id] ?? 0) < n);
      let blocked: string | null = null;
      if (!state.alive) blocked = 'Đã hết một đời.';
      else if (level(state, r.craft) < r.minLevel) blocked = `Cần cấp ${r.minLevel}.`;
      else if (state.crafts.lastPractice === state.character.age) blocked = 'Năm nay đã luyện một nghề rồi.';
      else if (missing) blocked = `Thiếu ${itemName(content, missing[0])}.`;
      else if ((r.cost.spiritStones ?? 0) > state.money.spiritStones || (r.cost.silver ?? 0) > state.money.silver) blocked = 'Không đủ tiền.';
      return { id: r.id, product: itemName(content, r.product), count: r.count, needs, chance: craftChance(state, content, r), blocked };
    });
}

/** Make one batch: materials and money are spent either way. */
export function craftRecipe(state: GameState, content: Content, recipeId: string): { state: GameState; text: string; success: boolean } | null {
  const recipe = content.recipes.recipes.find((r) => r.id === recipeId);
  const view = recipe && recipeViews(state, content, recipe.craft).find((v) => v.id === recipeId);
  if (!recipe || !view || view.blocked) return null;
  const cfg = content.balance.crafting;
  const texts = content.recipes.texts;
  const rng = Rng.fromState(state.rng);
  const used = Object.entries(recipe.materials).flatMap(([id, n]) => Array<string>(n).fill(id));
  let s: GameState = removeItems(state, used);
  s = { ...s, money: { silver: s.money.silver - (recipe.cost.silver ?? 0), spiritStones: s.money.spiritStones - (recipe.cost.spiritStones ?? 0) } };
  const success = rng.chance(view.chance);
  const name = itemName(content, recipe.product);
  let line: LogLine;
  if (success) {
    const count = recipe.count + Math.max(0, Math.round(hookSum(s, content, `craft.${recipe.craft}.yield`)));
    s = addItems(s, Array<string>(count).fill(recipe.product));
    line = { text: texts.success.replaceAll('{product}', name).replaceAll('{count}', String(count)), tone: 'good' };
  } else {
    const leftover = cfg.failProduct[recipe.craft];
    if (leftover) s = addItems(s, [leftover]);
    line = { text: (leftover ? texts.failAlchemy : texts.fail).replaceAll('{product}', name), tone: 'bad' };
  }
  const skill = s.crafts.skills[recipe.craft] ?? { level: 0, affinity: 0 };
  const lvl = Math.min(100, skill.level + (success ? cfg.xpSuccess : cfg.xpFail));
  s = { ...s, rng: rng.getState(), crafts: { skills: { ...s.crafts.skills, [recipe.craft]: { ...skill, level: lvl } }, lastPractice: s.character.age } };
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { state: { ...s, log }, text: line.text, success };
}
