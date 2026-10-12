// Phường thị (task 3.2): buy and sell at the world's markets, bargain once a
// year per market. Prices come from items.json; multipliers from markets.json
// and balance.market.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Item, Market } from '../core/schemas';
import type { GameState, LogLine, Tone } from '../core/types';
import { addItems, itemById, removeItems } from './items';

export type Currency = 'silver' | 'spiritStones';
export const CURRENCY_LABEL: Record<Currency, string> = { silver: 'lượng bạc', spiritStones: 'linh thạch' };

export interface Offer { item: Item; price: number }
export interface TradeResult { state: GameState; text: string; tone: Tone }

const hasRoot = (state: GameState) => state.cult.root !== null && state.cult.root.grade !== 'none';

/** Markets this life can walk into. */
export function openMarkets(state: GameState, content: Content): Market[] {
  if (!state.alive || state.character.age < content.balance.market.minAge) return [];
  return content.markets.filter((m) => !m.needsRoot || hasRoot(state) || state.cult.realm !== 'pham_nhan');
}

/** This year's price multiplier at a market after bargaining (1 when none). */
function bargainMul(state: GameState, marketId: string): number {
  const b = state.bargains[marketId];
  return b && b.age === state.character.age ? b.mul : 1;
}

const basePrice = (item: Item, currency: Currency) => item.price?.[currency];

/** What a market sells and for how much this year. */
export function marketOffers(state: GameState, content: Content, marketId: string): Offer[] {
  const m = content.markets.find((x) => x.id === marketId);
  if (!m) return [];
  const mul = m.priceMul * bargainMul(state, marketId);
  return content.items
    .filter((i) => i.forSale && m.kinds.includes(i.kind) && basePrice(i, m.currency) !== undefined)
    .map((item) => ({ item, price: Math.max(1, Math.round(basePrice(item, m.currency)! * mul)) }));
}

/** What the bag's item fetches when sold here, or null if this market does not buy it. */
export function sellPrice(content: Content, marketId: string, itemId: string): number | null {
  const m = content.markets.find((x) => x.id === marketId);
  const item = itemById(content, itemId);
  const base = item && m ? basePrice(item, m.currency) : undefined;
  if (base === undefined) return null;
  return Math.max(1, Math.floor(base * content.balance.market.sellShare));
}

function log(state: GameState, line: LogLine): GameState['log'] {
  const out = state.log.slice();
  const last = out[out.length - 1];
  if (last && last.age === state.character.age) out[out.length - 1] = { ...last, lines: [...last.lines, line] };
  else out.push({ age: state.character.age, lines: [line] });
  return out;
}

const pay = (state: GameState, currency: Currency, amount: number): GameState =>
  ({ ...state, money: { ...state.money, [currency]: Math.max(0, state.money[currency] + amount) } });

export function buy(state: GameState, content: Content, marketId: string, itemId: string): TradeResult {
  const m = content.markets.find((x) => x.id === marketId);
  const offer = marketOffers(state, content, marketId).find((o) => o.item.id === itemId);
  if (!m || !offer || !openMarkets(state, content).includes(m) || state.money[m.currency] < offer.price) {
    return { state, text: '', tone: 'normal' };
  }
  const rng = Rng.fromState(state.rng);
  let s = pay(state, m.currency, -offer.price);
  const fake = offer.item.kind === 'pill' && m.fakeChance > 0 && rng.chance(m.fakeChance);
  let text = `Mua ${offer.item.name} ở ${m.name}, trả ${offer.price} ${CURRENCY_LABEL[m.currency]}.`;
  let tone: Tone = 'normal';
  if (fake) {
    // The pill turns out to be flour and honey (event #36 of task 3.9 follows up on this flag).
    text = `${text} ${m.fakeText ?? ''}`.trim();
    tone = 'bad';
    s = { ...s, flags: { ...s.flags, mua_hang_gia: true } };
  } else {
    s = addItems(s, [itemId]);
  }
  return { state: { ...s, rng: rng.getState(), log: log(s, { text, tone }) }, text, tone };
}

export function sell(state: GameState, content: Content, marketId: string, itemId: string): TradeResult {
  const m = content.markets.find((x) => x.id === marketId);
  const price = sellPrice(content, marketId, itemId);
  if (!m || price === null || (state.inventory[itemId] ?? 0) <= 0 || !openMarkets(state, content).includes(m)) {
    return { state, text: '', tone: 'normal' };
  }
  let s = pay(removeItems(state, [itemId]), m.currency, price);
  const text = `Bán ${itemById(content, itemId)!.name} ở ${m.name}, được ${price} ${CURRENCY_LABEL[m.currency]}.`;
  s = { ...s, log: log(s, { text, tone: 'normal' }) };
  return { state: s, text, tone: 'normal' };
}

/** Chance a bargain works, from charm and intellect. */
export function bargainChance(state: GameState, content: Content): number {
  const b = content.balance.market;
  const skill = (state.stats.charm + state.stats.intellect) / 2;
  return Math.max(b.bargainMin, Math.min(b.bargainMax, b.bargainBase + (skill - 50) * b.bargainPerPoint));
}

/** Once a year per market: win a discount for the year, or annoy the seller into a higher price. */
export function bargain(state: GameState, content: Content, marketId: string): TradeResult {
  const m = content.markets.find((x) => x.id === marketId);
  if (!m || state.bargains[marketId]?.age === state.character.age || !openMarkets(state, content).includes(m)) {
    return { state, text: '', tone: 'normal' };
  }
  const rng = Rng.fromState(state.rng);
  const won = rng.chance(bargainChance(state, content));
  const cfg = content.balance.market;
  const text = won ? m.bargainWin : m.bargainLose;
  const tone: Tone = won ? 'good' : 'bad';
  const s: GameState = {
    ...state,
    rng: rng.getState(),
    bargains: { ...state.bargains, [marketId]: { age: state.character.age, mul: won ? cfg.bargainWinMul : cfg.bargainLoseMul } },
  };
  return { state: { ...s, log: log(s, { text, tone }) }, text, tone };
}

export function canBargain(state: GameState, marketId: string): boolean {
  return state.bargains[marketId]?.age !== state.character.age;
}
