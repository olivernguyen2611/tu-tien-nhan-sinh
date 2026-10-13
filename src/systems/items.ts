// Items carried (task 2.8). The bag screen and using items by hand come with
// task 3.1; for now pills marked with `breakthrough` are used up automatically
// when they help a breakthrough (PLAN G.2: Tụ Khí Đan +5, Trúc Cơ Đan +25).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook, Item } from '../core/schemas';
import type { GameState, LogLine, Tone } from '../core/types';
import { describeChanges } from './deltas';
import { currentTechnique } from './technique';

/** Đạo thống of this life: chosen lineage, else the main technique's. */
const lineageOf = (state: GameState, content: Content) => state.cult.lineage ?? currentTechnique(state, content)?.lineage ?? null;

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Same as cultivation.addProgress (kept here to avoid an import cycle). */
function addProgress(state: GameState, pct: number): GameState {
  if (state.cult.realm === 'pham_nhan' || pct === 0) return state;
  return { ...state, cult: { ...state.cult, progress: Math.max(0, Math.min(100, state.cult.progress + pct)) } };
}

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

/** 6b.6: a breakthrough pill for a realm this life has already left behind (Trúc Cơ Đan for a Trúc Cơ). */
export function pillOutgrown(state: GameState, content: Content, id: string): boolean {
  const realm = itemById(content, id)?.breakthrough?.realm;
  if (!realm) return false;
  const order = content.cultivation.realms.realms.map((r) => r.id);
  return order.indexOf(state.cult.realm) > order.indexOf(realm);
}

/** "Tụ Khí Đan ×2, Trúc Cơ Đan" for the profile. */
export function inventoryLabel(state: GameState, content: Content): string | null {
  const parts = Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${itemById(content, id)?.name ?? id}${n > 1 ? ` ×${n}` : ''}`);
  return parts.length ? parts.join(', ') : null;
}

// ---------- Task 3.1: using items from the bag, and what carried items do ----------

type UseEffect = NonNullable<Item['use']>['effects'][number];

/** Why this item cannot be used now, or null when it can. */
export function useBlocker(state: GameState, content: Content, id: string): string | null {
  const item = itemById(content, id);
  if (!state.alive) return 'Đã qua đời';
  if (!item?.use) return item?.kind === 'material' ? 'Nguyên liệu, không dùng trực tiếp' : 'Mang theo là có tác dụng';
  if ((state.inventory[id] ?? 0) <= 0) return 'Không còn trong túi';
  if (item.use.combatOnly) return 'Chỉ dùng khi giao chiến';
  if (item.use.lineage && lineageOf(state, content) !== item.use.lineage) return `Chỉ người tu ${content.cultivation.realms.lineageNames[item.use.lineage] ?? item.use.lineage} dùng được`;
  if (state.itemUse.lastAge[id] === state.character.age) return 'Năm nay đã dùng (kháng thuốc)';
  return null;
}

/** Hooks from carried items: per hook only the strongest item counts. */
export function carriedHooks(state: GameState, content: Content): EffectHook[] {
  const best = new Map<string, EffectHook>();
  for (const [id, n] of Object.entries(state.inventory)) {
    if (n <= 0) continue;
    for (const e of itemById(content, id)?.carried ?? []) {
      const prev = best.get(e.hook);
      const strength = (h: EffectHook) => Math.abs(h.add ?? (h.mul !== undefined ? h.mul - 1 : 0));
      if (!prev || strength(e) > strength(prev)) best.set(e.hook, e);
    }
  }
  return [...best.values()];
}

function applyUseEffect(state: GameState, e: UseEffect): GameState {
  const add = e.add ?? 0;
  if (e.hook.startsWith('stat.')) {
    const key = e.hook.slice(5);
    if (key in state.stats) {
      const k = key as keyof GameState['stats'];
      return { ...state, stats: { ...state.stats, [k]: clamp(state.stats[k] + add) } };
    }
    const k = key as keyof GameState['aptitudes'];
    return { ...state, aptitudes: { ...state.aptitudes, [k]: clamp(state.aptitudes[k] + add) } };
  }
  switch (e.hook) {
    case 'cultivationProgress': return addProgress(state, add);
    case 'breakthroughNext': return { ...state, itemUse: { ...state.itemUse, nextBreakthrough: state.itemUse.nextBreakthrough + add } };
    case 'karma': return { ...state, social: { ...state.social, karma: Math.max(-100, Math.min(100, state.social.karma + add)) } };
    case 'lifespanYears': return { ...state, cult: { ...state.cult, lifespan: state.cult.lifespan + add } };
    case 'heartDemon': return { ...state, cult: { ...state.cult, heartDemon: Math.max(0, state.cult.heartDemon + add) } };
    case 'lifespanPct': return { ...state, cult: { ...state.cult, lifespan: state.cult.lifespan + Math.round(state.cult.lifespan * add) } };
    case 'noAgingCharm': return { ...state, flags: { ...state.flags, no_aging_charm: true } };
    // Taken before a fight: lasts the whole next fight. Used during a fight it is the current round (combat.ts).
    case 'combatPowerNext': return { ...state, itemUse: { ...state.itemUse, nextCombat: state.itemUse.nextCombat + add } };
    default:
      if (e.hook.startsWith('setFlag.')) return { ...state, flags: { ...state.flags, [e.hook.slice('setFlag.'.length)]: true } };
      if (e.hook.startsWith('clearFlag.')) {
        const flags = { ...state.flags };
        delete flags[e.hook.slice('clearFlag.'.length)];
        return { ...state, flags };
      }
      return state;
  }
}

export interface UseResult { state: GameState; text: string; tone: Tone }

/** Use one item from the bag: apply its effects, log a line, take it out of the bag. */
export function consumeItem(state: GameState, content: Content, id: string): UseResult {
  const item = itemById(content, id);
  if (!item?.use || useBlocker(state, content, id)) return { state, text: '', tone: 'normal' };
  const use = item.use;
  const rng = Rng.fromState(state.rng);
  let s = removeItems(state, [id]);
  s = { ...s, itemUse: { ...s.itemUse, lastAge: { ...s.itemUse.lastAge, [id]: state.character.age } } };

  let text = use.text;
  let tone: Tone = 'good';
  const own = lineageOf(state, content);
  let effects: UseEffect[] = (own && use.lineageEffects[own]) || use.effects;
  const rootless = state.cult.realm === 'pham_nhan' && !state.cult.root;
  if (rootless && !use.mortalOk) {
    // A mortal swallowing a cultivator's pill: nothing happens.
    text = rng.pick(content.lifeTexts.itemMortal);
    effects = [];
    tone = 'normal';
  } else if (use.oncePerLife && s.itemUse.spent.includes(id)) {
    effects = use.repeatEffects;
    text = `${use.text} ${rng.pick(content.lifeTexts.itemRepeat)}`;
    tone = 'normal';
  } else if (use.random.length > 0) {
    const pick = rng.weighted(use.random, (r) => r.weight);
    text = `${use.text} ${pick.text}`;
    effects = [...use.effects, ...pick.effects];
    tone = pick.effects.length === 0 ? 'normal' : 'good';
  }
  if (use.oncePerLife && !s.itemUse.spent.includes(id) && effects === use.effects) {
    s = { ...s, itemUse: { ...s.itemUse, spent: [...s.itemUse.spent, id] } };
  }

  const before = s;
  for (const e of effects) s = applyUseEffect(s, e);
  const changes = describeChanges(before, s);
  const line: LogLine = { text: `${item.name}: ${text}${changes ? ` ${changes}.` : ''}`, tone };
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === s.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: s.character.age, lines: [line] });
  return { state: { ...s, rng: rng.getState(), log }, text, tone };
}
