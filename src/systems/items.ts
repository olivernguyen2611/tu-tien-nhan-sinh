// Items carried (task 2.8). The bag screen and using items by hand come with
// task 3.1; for now pills marked with `breakthrough` are used up automatically
// when they help a breakthrough (PLAN G.2: Tụ Khí Đan +5, Trúc Cơ Đan +25).
import type { Content } from '../core/content';
import type { Item } from '../core/schemas';
import type { GameState } from '../core/types';

export function itemById(content: Content, id: string): Item | undefined {
  return content.items.find((i) => i.id === id);
}

export function addItems(state: GameState, ids: string[]): GameState {
  if (ids.length === 0) return state;
  const inventory = { ...state.inventory };
  for (const id of ids) inventory[id] = (inventory[id] ?? 0) + 1;
  return { ...state, inventory };
}

export function removeItems(state: GameState, ids: string[]): GameState {
  if (ids.length === 0) return state;
  const inventory = { ...state.inventory };
  for (const id of ids) {
    if (!inventory[id]) continue;
    inventory[id] -= 1;
    if (inventory[id] <= 0) delete inventory[id];
  }
  return { ...state, inventory };
}

/** The pill that would help this breakthrough (out of the current realm), if carried. */
export function breakthroughItem(state: GameState, content: Content, major: boolean): Item | undefined {
  return content.items
    .filter((i) => i.breakthrough && i.breakthrough.realm === state.cult.realm && i.breakthrough.major === major && (state.inventory[i.id] ?? 0) > 0)
    .sort((a, b) => (b.breakthrough!.add - a.breakthrough!.add))[0];
}

/** "Tụ Khí Đan ×2, Trúc Cơ Đan" for the profile. */
export function inventoryLabel(state: GameState, content: Content): string | null {
  const parts = Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${itemById(content, id)?.name ?? id}${n > 1 ? ` ×${n}` : ''}`);
  return parts.length ? parts.join(', ') : null;
}
