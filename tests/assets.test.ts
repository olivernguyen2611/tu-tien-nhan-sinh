import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { doActivity } from '../src/systems/activities';
import { resolveChoice } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { assetBlocked, assetMonths, assetsLine, assetsOf, assetsYear, borrow, buyAsset, debtTotal, forecast, inheritAssets, ownedOf, repayDebts, sellAsset, sowCrop } from '../src/systems/assets';
import { monthsLeft } from '../src/systems/timeBudget';

const content = loadContent();
const cfg = content.balance.assets!;

function owner(silver = 1000, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'assets' }, content);
  return {
    ...b, tier: 'pham_gian',
    character: { ...b.character, age: 30 },
    money: { ...b.money, silver },
    log: [...b.log, { age: 30, lines: [] }],
    ...patch,
  };
}

describe('10.4 tài sản', () => {
  it('buys at today\'s price, sells back at resale; a new house sells the old', () => {
    let s = buyAsset(owner(), content, 'leu_tranh')!.state;
    expect(ownedOf(s, content, 'house').map((o) => o.id)).toEqual(['leu_tranh']);
    expect(assetBlocked(s, content, 'leu_tranh')).toContain('Đang ở');
    s = buyAsset(s, content, 'nha_ngoi')!.state;
    expect(ownedOf(s, content, 'house').map((o) => o.id)).toEqual(['nha_ngoi']);
    const before = s.money.silver;
    s = sellAsset(s, content, 'nha_ngoi')!.state;
    expect(s.money.silver - before).toBeGreaterThan(0);
    expect(assetBlocked(owner(5), content, 'nha_ngoi')).toContain('lượng');
    expect(assetBlocked(owner(), content, 'tiem_thuoc')).toContain('bốc thuốc');
  });

  it('keeps the life rng, takes months and shows on the profile', () => {
    const s0 = owner();
    const free = monthsLeft(s0, content);
    let s = buyAsset(s0, content, 'ruong')!.state;
    s = buyAsset(s, content, 'ruong')!.state;
    s = buyAsset(s, content, 'quan_tra')!.state;
    expect(s.rng).toEqual(s0.rng);
    expect(assetMonths(s, content)).toBe(4 + 3);
    expect(monthsLeft(s, content)).toBe(free - 7);
    expect(assetsLine(s, content)).toContain('2 mẫu ruộng');
    expect(meets(s, { asset: { id: 'ruong', count: 2 } }, content)).toBe(true);
    expect(meets(s, { asset: { kind: 'animal', none: true } }, content)).toBe(true);
  });

  it('the right crop for the weather harvests more than the wrong one', () => {
    let s = owner();
    for (let i = 0; i < 5; i++) s = buyAsset(s, content, 'ruong')!.state;
    const w = forecast(s, content)!;
    const right = content.assets!.crops.find((c) => c.weather === (w.actual === 'normal' ? 'any' : w.actual))!;
    const wrong = content.assets!.crops.find((c) => c.weather !== 'any' && c.weather !== w.actual && w.actual !== 'normal');
    const got = (crop: string) => { const y = assetsYear(sowCrop(s, content, crop), content); return y.money.silver; };
    if (wrong) expect(got(right.id)).toBeGreaterThan(got(wrong.id));
    expect(assetsOf(assetsYear(sowCrop(s, content, right.id), content)).crop).toBeNull();
  });

  it('debts grow and, left unpaid, the creditor takes the best asset', () => {
    let s = buyAsset(owner(200), content, 'nha_ngoi')!.state;
    s = borrow(s, content, 'vay_phu_ho')!.state;
    expect(debtTotal(s)).toBe(50);
    expect(s.npcs.some((n) => n.kind === 'chu_no')).toBe(true);
    expect(meets(s, { debt: { any: true } }, content)).toBe(true);
    const once = assetsYear(s, content);
    expect(debtTotal(once)).toBeGreaterThan(50);
    expect(repayDebts(once, content)!.state.assets!.loans).toHaveLength(0);
    for (let i = 0; i < cfg.defaultYears; i++) s = assetsYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(ownedOf(s, content, 'house')).toHaveLength(0);
    expect(debtTotal(s)).toBe(0);
  });

  it('effects, activities and the will', () => {
    let s = buyAsset(owner(), content, 'ruong')!.state;
    s = resolveChoice({ ...s, events: { ...s.events, pending: 'ts_cuong_hao_chiem_ruong' } }, content, 1).state;
    expect(ownedOf(s, content, 'land')).toHaveLength(0);
    s = buyAsset(buyAsset(s, content, 'ruong')!.state, content, 'trau')!.state;
    const old = { ...s, character: { ...s.character, age: 50 } };
    const r = doActivity(old, content, 'lap_di_chuc')!;
    expect(r.state.flags.di_chuc).toBe(true);
    const heir = createLife({ seed: 'heir' }, content);
    expect(assetsOf(inheritAssets(r.state, heir, content)).owned).toHaveLength(2);
  });
});
