// Phường thị (task 3.2): buy and sell at the world's markets, bargain once a
// year per market. Prices come from items.json; multipliers from markets.json
// and balance.market. Playtest 2: markets belong to regions, sell local
// specialities and technique scrolls, rotate their stall yearly, and some are
// auction houses (one bid a year).
import type { Content } from '../core/content';
import { Rng, hashSeed } from '../core/rng';
import type { Item, Market } from '../core/schemas';
import type { GameState, LogLine, Tone } from '../core/types';
import { hookSum } from './cultivation';
import { addItems, itemById, removeItems } from './items';
import { currentRegion } from './regions';
import { worldPriceMul } from './worldEvents';
import { gainScroll, techniqueById } from './technique';

export type Currency = 'silver' | 'spiritStones';
export const CURRENCY_LABEL: Record<Currency, string> = { silver: 'lượng bạc', spiritStones: 'linh thạch' };

export interface Offer { item: Item; price: number }
export interface TradeResult { state: GameState; text: string; tone: Tone }

const hasRoot = (state: GameState) => state.cult.root !== null && state.cult.root.grade !== 'none';

/** Markets this life can walk into. */
export function openMarkets(state: GameState, content: Content): Market[] {
  if (!state.alive || state.character.age < content.balance.market.minAge) return [];
  return content.markets.filter((m) => (!m.needsRoot || hasRoot(state) || state.cult.realm !== 'pham_nhan')
    && (!m.regions || m.regions.includes(currentRegion(state, content)?.id ?? '')));
}

/** A stable per-year order (seed + age + market), so stalls and lots change yearly without using the RNG. */
function yearPick<T>(state: GameState, marketId: string, list: T[], key: (x: T) => string, n: number | undefined): T[] {
  if (n === undefined || list.length <= n) return list;
  const h = (x: T) => hashSeed(`${state.seed}|${state.character.age}|${marketId}|${key(x)}`);
  return list.slice().sort((a, b) => h(a) - h(b)).slice(0, n);
}

function priceMul(state: GameState, content: Content, m: Market): number {
  // Task 3.10: priceDiscount hooks (Khéo Mồm, Mắt Tinh) make buying cheaper, up to balance.market.maxDiscount.
  const discount = Math.max(0, Math.min(content.balance.market.maxDiscount, hookSum(state, content, 'priceDiscount')));
  return m.priceMul * bargainMul(state, m.id) * (1 - discount) * worldPriceMul(state, content);
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
  const mul = priceMul(state, content, m);
  const wares = content.items
    .filter((i) => ((i.forSale && m.kinds.includes(i.kind)) || m.items.includes(i.id)) && basePrice(i, m.currency) !== undefined);
  return yearPick(state, m.id, wares, (i) => i.id, m.stock)
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

export interface ScrollOffer { id: string; name: string; grade: string; price: number; blocked: string | null }

/** Technique scrolls on sale here (playtest 2). */
export function techniqueOffers(state: GameState, content: Content, marketId: string): ScrollOffer[] {
  const m = content.markets.find((x) => x.id === marketId);
  if (!m) return [];
  const mul = priceMul(state, content, m);
  return m.techniques.flatMap((t) => {
    const tech = techniqueById(content, t.id);
    if (!tech) return [];
    const price = Math.max(1, Math.round(t.price * mul));
    const owned = state.cult.scrolls.includes(t.id) || state.cult.technique === t.id || state.cult.learned.includes(t.id);
    return [{
      id: t.id, name: tech.name, grade: content.cultivation.realms.gradeNames[tech.grade] ?? tech.grade, price,
      blocked: owned ? 'Đã có bí tịch này.' : state.money[m.currency] < price ? `Không đủ ${CURRENCY_LABEL[m.currency]}.` : null,
    }];
  });
}

export function buyScroll(state: GameState, content: Content, marketId: string, techId: string): TradeResult {
  const m = content.markets.find((x) => x.id === marketId);
  const offer = techniqueOffers(state, content, marketId).find((o) => o.id === techId);
  if (!m || !offer || offer.blocked || !openMarkets(state, content).includes(m)) return { state, text: '', tone: 'normal' };
  const got = gainScroll(pay(state, m.currency, -offer.price), content, techId);
  if (!got) return { state, text: '', tone: 'normal' };
  const text = `Mua bí tịch ${offer.name} ở ${m.name}, trả ${offer.price} ${CURRENCY_LABEL[m.currency]}. ${got.text}`;
  return { state: got.state, text, tone: 'rare' };
}

export interface LotView {
  key: string;
  name: string;
  /** Item or technique summary. */
  note: string;
  start: number;
  bids: { price: number; chance: number }[];
}

/** This year's lots at an auction house, and the open bids on each (playtest 2). */
export function auctionLots(state: GameState, content: Content, marketId: string): LotView[] {
  const m = content.markets.find((x) => x.id === marketId);
  if (!m?.auction) return [];
  const cfg = content.balance.market;
  const [lo, hi] = cfg.auctionRival;
  const indexed = m.auction.lots.map((lot, i) => ({ lot, key: String(i) }));
  return yearPick(state, m.id, indexed, (x) => x.key, m.auction.lotsPerYear).flatMap(({ lot, key }) => {
    const item = lot.item ? itemById(content, lot.item) : undefined;
    const tech = lot.technique ? techniqueById(content, lot.technique) : undefined;
    if (!item && !tech) return [];
    const name = item ? item.name : `Bí tịch ${tech!.name}`;
    const note = item ? item.summary ?? item.description : `${content.cultivation.realms.gradeNames[tech!.grade] ?? tech!.grade} phẩm. ${tech!.flavor}`;
    const bids = cfg.auctionBids.map((mul) => ({
      price: Math.round(lot.start * mul),
      chance: Math.max(0, Math.min(1, hi === lo ? (mul >= lo ? 1 : 0) : (mul - lo) / (hi - lo))),
    }));
    return [{ key, name, note, start: lot.start, bids }];
  });
}

/** Why the player cannot bid here this year, or null. */
export function auctionBlocked(state: GameState, content: Content, marketId: string): string | null {
  const m = content.markets.find((x) => x.id === marketId);
  if (!m?.auction || !openMarkets(state, content).includes(m)) return 'Không có hội đấu giá ở đây.';
  if (state.auctions?.[marketId] === state.character.age) return 'Năm nay đã ra giá một lần rồi.';
  return null;
}

/** One bid: rivals' top bid is drawn; the higher price takes the lot. Win or lose, that is this year's bid. */
export function placeBid(state: GameState, content: Content, marketId: string, lotKey: string, bidIndex: number): TradeResult {
  const m = content.markets.find((x) => x.id === marketId);
  const lotView = auctionLots(state, content, marketId).find((l) => l.key === lotKey);
  const bid = lotView?.bids[bidIndex];
  const lot = m?.auction?.lots[Number(lotKey)];
  if (!m?.auction || !lotView || !bid || !lot || auctionBlocked(state, content, marketId) || state.money[m.currency] < bid.price) {
    return { state, text: '', tone: 'normal' };
  }
  const rng = Rng.fromState(state.rng);
  const [lo, hi] = content.balance.market.auctionRival;
  const rival = Math.round(lot.start * (lo + rng.next() * (hi - lo)));
  let s: GameState = { ...state, rng: rng.getState(), auctions: { ...state.auctions, [marketId]: state.character.age } };
  const won = bid.price >= rival;
  const fill = (t: string, price: number) => t.replace('{lot}', lotView.name).replace('{price}', `${price} ${CURRENCY_LABEL[m.currency]}`);
  if (!won) {
    const text = fill(m.auction.loseText, Math.max(rival, bid.price + 1));
    return { state: { ...s, log: log(s, { text, tone: 'bad' }) }, text, tone: 'bad' };
  }
  s = pay(s, m.currency, -bid.price);
  const text = fill(m.auction.winText, bid.price);
  if (lot.technique) {
    const got = gainScroll({ ...s, log: log(s, { text, tone: 'rare' }) }, content, lot.technique);
    // Already owned: the scroll sells back at once for what was paid (nothing lost, nothing gained).
    if (!got) return { state: pay(s, m.currency, bid.price), text: `${text} Bí tịch này ngươi đã có, đành bán lại.`, tone: 'normal' };
    return { state: got.state, text: `${text} ${got.text}`, tone: 'rare' };
  }
  s = addItems(s, [lot.item!]);
  return { state: { ...s, log: log(s, { text, tone: 'rare' }) }, text, tone: 'rare' };
}
