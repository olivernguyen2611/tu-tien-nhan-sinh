import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { ItemFileSchema, MarketFileSchema } from '../src/core/schemas';
import type { GameState, SpiritRoot } from '../src/core/types';
import { bargain, bargainChance, buy, canBargain, marketOffers, openMarkets, sell, sellPrice } from '../src/systems/market';

const base = loadContent();
// Priced fixture items; the real prices come from items.json once approved.
const content: Content = {
  ...base,
  items: [
    ...ItemFileSchema.parse([
      { id: 't_bo_khi', name: 'Bổ Khí Tán', kind: 'pill', description: '.', price: { silver: 30 } },
      { id: 't_hoi_xuan', name: 'Hồi Xuân Đan', kind: 'pill', description: '.', price: { spiritStones: 15 } },
      { id: 't_kiem', name: 'Thanh Phong Kiếm', kind: 'artifact', description: '.', price: { spiritStones: 80 } },
    ]),
  ],
  markets: MarketFileSchema.parse([
    { id: 'cho', name: 'Chợ phiên', description: '.', currency: 'silver', kinds: ['pill'], bargainWin: 'Bớt giá.', bargainLose: 'Bị mắng.' },
    { id: 'tien', name: 'Tiên thị', description: '.', needsRoot: true, currency: 'spiritStones', priceMul: 1.2, kinds: ['pill', 'artifact'], bargainWin: 'Bớt giá.', bargainLose: 'Bị mắng.' },
    { id: 'den', name: 'Chợ đen', description: '.', needsRoot: true, currency: 'spiritStones', priceMul: 0.5, fakeChance: 1, kinds: ['pill'], bargainWin: 'Bớt.', bargainLose: 'Mắng.', fakeText: 'Bột mì vo viên.' },
  ]),
};

const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };
// 9.5: no thời cuộc here, so prices are the market's own.
const mortal: GameState = { ...createLife({ seed: 'market', originId: 'nong_dan' }, content), character: { ...createLife({ seed: 'market', originId: 'nong_dan' }, content).character, age: 16 }, money: { silver: 100, spiritStones: 0 }, times: undefined };
const rooted: GameState = { ...mortal, cult: { ...mortal.cult, root: SONG }, money: { silver: 100, spiritStones: 200 } };

describe('market (task 3.2)', () => {
  it('a rootless mortal only sees the mortal market', () => {
    expect(openMarkets(mortal, content).map((m) => m.id)).toEqual(['cho']);
    expect(openMarkets(rooted, content).map((m) => m.id)).toEqual(['cho', 'tien', 'den']);
  });

  it('offers only priced items of the market kinds, with its multiplier', () => {
    expect(marketOffers(mortal, content, 'cho').map((o) => [o.item.id, o.price])).toEqual([['t_bo_khi', 30]]);
    expect(marketOffers(rooted, content, 'tien').map((o) => [o.item.id, o.price])).toEqual([['t_hoi_xuan', 18], ['t_kiem', 96]]);
  });

  it('buying pays, adds the item and logs it; no money, no sale', () => {
    const r = buy(mortal, content, 'cho', 't_bo_khi');
    expect(r.state.money.silver).toBe(70);
    expect(r.state.inventory.t_bo_khi).toBe(1);
    expect(r.state.log.at(-1)!.lines.at(-1)!.text).toContain('Bổ Khí Tán');
    const broke = { ...mortal, money: { silver: 5, spiritStones: 0 } };
    expect(buy(broke, content, 'cho', 't_bo_khi').state).toBe(broke);
    // A mortal cannot shop at a cultivator market.
    expect(buy(mortal, content, 'tien', 't_hoi_xuan').state).toBe(mortal);
  });

  it('a fake pill takes the money and gives nothing', () => {
    const r = buy(rooted, content, 'den', 't_hoi_xuan');
    expect(r.state.money.spiritStones).toBe(200 - 8);
    expect(r.state.inventory.t_hoi_xuan ?? 0).toBe(0);
    expect(r.state.flags.mua_hang_gia).toBe(true);
    expect(r.tone).toBe('bad');
  });

  it('selling gives half the base price', () => {
    expect(sellPrice(content, 'tien', 't_kiem')).toBe(40);
    expect(sellPrice(content, 'cho', 't_kiem')).toBeNull();
    const s = { ...rooted, inventory: { t_kiem: 1 } };
    const r = sell(s, content, 'tien', 't_kiem');
    expect(r.state.money.spiritStones).toBe(240);
    expect(r.state.inventory.t_kiem ?? 0).toBe(0);
    expect(sell(r.state, content, 'tien', 't_kiem').state).toBe(r.state);
  });

  it('bargaining works once a year per market and changes this year\'s prices', () => {
    const r = bargain(mortal, content, 'cho');
    expect(canBargain(r.state, 'cho')).toBe(false);
    expect(bargain(r.state, content, 'cho').state).toBe(r.state);
    const price = marketOffers(r.state, content, 'cho')[0].price;
    expect(price).toBe(r.tone === 'good' ? Math.round(30 * 0.85) : Math.round(30 * 1.1));
    const next = { ...r.state, character: { ...r.state.character, age: r.state.character.age + 1 } };
    expect(canBargain(next, 'cho')).toBe(true);
    expect(marketOffers(next, content, 'cho')[0].price).toBe(30);
  });

  it('charm and intellect raise the bargain chance within bounds', () => {
    const lo = { ...mortal, stats: { ...mortal.stats, charm: 0, intellect: 0 } };
    const hi = { ...mortal, stats: { ...mortal.stats, charm: 100, intellect: 100 } };
    expect(bargainChance(lo, content)).toBe(0.1);
    expect(bargainChance(hi, content)).toBe(0.8);
  });
});

describe('market age', () => {
  it('small children cannot go to market', () => {
    const kid = { ...mortal, character: { ...mortal.character, age: 5 } };
    expect(openMarkets(kid, content)).toEqual([]);
  });
});
