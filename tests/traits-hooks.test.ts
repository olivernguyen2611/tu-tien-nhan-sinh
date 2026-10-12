// Task 3.10: hooks the new traits lean on (market discount, tâm ma resistance).
import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { EventSchema } from '../src/core/schemas';
import type { GameState } from '../src/core/types';
import { resolveChoice } from '../src/systems/events/engine';
import { marketOffers } from '../src/systems/market';

const content = loadContent();
const life: GameState = { ...createLife({ seed: 'hooks', originId: 'nong_dan' }, content), traits: [] };
const market = content.markets.find((m) => m.currency === 'silver')!;

describe('priceDiscount (Khéo Mồm, Mắt Tinh)', () => {
  it('stacks and lowers buying prices', () => {
    const plain = marketOffers(life, content, market.id)[0];
    const cheap = marketOffers({ ...life, traits: ['kheo_mom', 'mat_tinh'] }, content, market.id).find((o) => o.item.id === plain.item.id)!;
    expect(cheap.price).toBe(Math.max(1, Math.round(plain.item.price!.silver! * market.priceMul * 0.9)));
  });

  it('is capped by balance.market.maxDiscount', () => {
    const c: Content = { ...content, balance: { ...content.balance, market: { ...content.balance.market, maxDiscount: 0.05 } } };
    const plain = marketOffers(life, c, market.id)[0];
    const cheap = marketOffers({ ...life, traits: ['kheo_mom', 'mat_tinh'] }, c, market.id)[0];
    expect(cheap.price).toBe(Math.max(1, Math.round(plain.item.price!.silver! * market.priceMul * 0.95)));
  });
});

describe('heartDemonResist (Thanh Tâm Như Thủy, Ma Tâm Chủng)', () => {
  const ev = EventSchema.parse({
    id: 't_tam_ma', category: 'test', title: 'Tâm ma', text: '.', weight: 0,
    choices: [{ text: 'Nghĩ quẩn', result: { text: '.', effects: { heartDemon: 20, 'stat.happiness': -1 } } }],
  });
  const c: Content = { ...content, events: [ev] };
  const gain = (traits: string[]) => {
    const s = { ...life, traits, events: { ...life.events, pending: 't_tam_ma' } };
    return resolveChoice(s, c, 0).state.cult.heartDemon - life.cult.heartDemon;
  };

  it('shrinks tâm ma gains, and a negative resist makes them grow', () => {
    expect(gain([])).toBe(20);
    expect(gain(['thanh_tam_nhu_thuy'])).toBe(15);
    expect(gain(['ma_tam_chung'])).toBe(24);
  });
});
