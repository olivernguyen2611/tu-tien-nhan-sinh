import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { ItemFileSchema } from '../src/core/schemas';
import type { GameState, SpiritRoot } from '../src/core/types';
import { breakthroughPct, enterRealm, hookSum } from '../src/systems/cultivation';
import { addItems, carriedHooks, consumeItem, useBlocker } from '../src/systems/items';
import { Rng } from '../src/core/rng';

const base = loadContent();
// Test items shaped like the 3.1 draft; the real list comes from items.json once approved.
const content: Content = {
  ...base,
  items: [
    ...base.items,
    ...ItemFileSchema.parse([
      { id: 't_hoi_xuan', name: 'Hồi Xuân Đan', kind: 'pill', description: '.', use: { text: 'Mặt hồng hào.', effects: [{ hook: 'stat.health', add: 30 }], mortalOk: true } },
      { id: 't_tay_tuy', name: 'Tẩy Tủy Đan', kind: 'pill', description: '.', use: { text: 'Đau thấu xương.', effects: [{ hook: 'stat.physique', add: 5 }, { hook: 'stat.health', add: -10 }], oncePerLife: true, repeatEffects: [{ hook: 'stat.health', add: -10 }] } },
      { id: 't_tu_khi', name: 'Tụ Khí', kind: 'pill', description: '.', use: { text: 'Linh khí tụ lại.', effects: [{ hook: 'cultivationProgress', add: 10 }] } },
      { id: 't_pha_chuong', name: 'Phá Chướng Đan', kind: 'pill', description: '.', use: { text: 'Nứt sẵn.', effects: [{ hook: 'breakthroughNext', add: 10 }] } },
      { id: 't_tru_nhan', name: 'Trú Nhan Đan', kind: 'pill', description: '.', use: { text: 'Giữ dung nhan.', effects: [{ hook: 'noAgingCharm' }], mortalOk: true } },
      { id: 't_phe_dan', name: 'Phế Đan', kind: 'pill', description: '.', use: { text: 'Nuốt liều.', mortalOk: true, random: [
        { weight: 1, text: 'Không có gì.', effects: [] },
        { weight: 1, text: 'Đau bụng.', effects: [{ hook: 'stat.health', add: -5 }] },
      ] } },
      { id: 't_bua', name: 'Bùa bình an', kind: 'talisman', description: '.', carried: [{ hook: 'stat.luck', add: 2 }] },
      { id: 't_kiem_a', name: 'Kiếm A', kind: 'artifact', description: '.', carried: [{ hook: 'combatPower', add: 5 }] },
      { id: 't_kiem_b', name: 'Kiếm B', kind: 'artifact', description: '.', carried: [{ hook: 'combatPower', add: 10 }] },
      { id: 't_hoa_cau', name: 'Hỏa Cầu Phù', kind: 'talisman', description: '.', use: { text: 'Lửa.', effects: [{ hook: 'combatPowerNext', add: 10 }], combatOnly: true } },
    ]),
  ],
};

const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'], body: null };
const mortal = createLife({ seed: 'bag', originId: 'nong_dan' }, content);
const cultivator = (): GameState => {
  const s = { ...mortal, cult: { ...mortal.cult, root: SONG } };
  return enterRealm(s, content, content.cultivation.realms.realms[1].id, Rng.fromState(s.rng));
};
const lastLine = (s: GameState) => s.log.at(-1)!.lines.at(-1)!.text;

describe('bag (task 3.1)', () => {
  it('using a pill applies it, logs the change and takes it from the bag', () => {
    let s = addItems({ ...mortal, stats: { ...mortal.stats, health: 40 } }, ['t_hoi_xuan', 't_hoi_xuan']);
    const r = consumeItem(s, content, 't_hoi_xuan');
    expect(r.state.stats.health).toBe(70);
    expect(r.state.inventory.t_hoi_xuan).toBe(1);
    expect(lastLine(r.state)).toContain('Sức khỏe +30');
    s = r.state;
    // One use per kind a year.
    expect(useBlocker(s, content, 't_hoi_xuan')).toContain('kháng thuốc');
    expect(consumeItem(s, content, 't_hoi_xuan').state).toBe(s);
    s = { ...s, character: { ...s.character, age: s.character.age + 1 } };
    expect(useBlocker(s, content, 't_hoi_xuan')).toBeNull();
  });

  it('a cultivator pill does nothing for a rootless mortal', () => {
    const s = addItems(mortal, ['t_tay_tuy']);
    const r = consumeItem(s, content, 't_tay_tuy');
    expect(r.state.aptitudes.physique).toBe(mortal.aptitudes.physique);
    expect(r.state.inventory.t_tay_tuy).toBeUndefined();
  });

  it('once-per-life pills only work the first time', () => {
    let s = addItems(cultivator(), ['t_tay_tuy', 't_tay_tuy']);
    s = { ...s, aptitudes: { ...s.aptitudes, physique: 50 }, stats: { ...s.stats, health: 80 } };
    s = consumeItem(s, content, 't_tay_tuy').state;
    expect(s.aptitudes.physique).toBe(55);
    s = consumeItem({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content, 't_tay_tuy').state;
    expect(s.aptitudes.physique).toBe(55);
    expect(s.stats.health).toBe(60);
  });

  it('cultivation pills fill the bar; Phá Chướng Đan helps the next breakthrough once', () => {
    let s = addItems(cultivator(), ['t_tu_khi', 't_pha_chuong']);
    s = consumeItem(s, content, 't_tu_khi').state;
    expect(s.cult.progress).toBe(10);
    const before = breakthroughPct(s, content, 50, false);
    s = consumeItem(s, content, 't_pha_chuong').state;
    expect(breakthroughPct(s, content, 50, false)).toBe(Math.min(content.balance.cultivation.breakthrough.maxPct, before + 10));
  });

  it('Trú Nhan Đan stops old-age charm loss; random pills pick one outcome', () => {
    const s = consumeItem(addItems(mortal, ['t_tru_nhan']), content, 't_tru_nhan').state;
    expect(s.flags.no_aging_charm).toBe(true);
    const outcomes = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const life = createLife({ seed: `phe-${i}`, originId: 'nong_dan' }, content);
      outcomes.add(consumeItem(addItems({ ...life, stats: { ...life.stats, health: 50 } }, ['t_phe_dan']), content, 't_phe_dan').state.stats.health);
    }
    expect([...outcomes].sort()).toEqual([45, 50]);
  });

  it('carried items work from the bag; the same hook counts only the strongest', () => {
    const s = addItems(cultivator(), ['t_bua', 't_kiem_a', 't_kiem_b']);
    expect(carriedHooks(s, content).find((h) => h.hook === 'combatPower')?.add).toBe(10);
    expect(hookSum(s, content, 'combatPower') - hookSum(cultivator(), content, 'combatPower')).toBe(10);
    expect(useBlocker(s, content, 't_bua')).toBe('Mang theo là có tác dụng');
    expect(useBlocker(addItems(s, ['t_hoa_cau']), content, 't_hoa_cau')).toBe('Chỉ dùng khi giao chiến');
  });
});

describe('approved items (task 3.1)', () => {
  it('no item can open a spirit root, and Nội đan is for ma tu only', () => {
    for (const it of base.items) {
      const hooks = [...(it.use?.effects ?? []), ...it.carried].map((e) => e.hook);
      expect(hooks.some((h) => /root/i.test(h))).toBe(false);
    }
    const s = addItems(cultivator(), ['noi_dan_1']);
    expect(useBlocker(s, base, 'noi_dan_1')).toContain('Ma đạo');
  });

  it('Huyết Đan hits karma and works harder for ma tu', () => {
    const s = addItems(cultivator(), ['huyet_dan']);
    const r = consumeItem(s, base, 'huyet_dan');
    expect(r.state.social.karma).toBe(s.social.karma - 10);
    expect(r.state.cult.progress).toBeGreaterThan(s.cult.progress);
  });

  it('the better Trúc Cơ pill is the one spent', () => {
    const s = addItems(cultivator(), ['truc_co_dan', 'truc_co_dan_thuong_pham']);
    expect(breakthroughPct(s, base, 30, true)).toBe(breakthroughPct(addItems(cultivator(), ['truc_co_dan']), base, 30, true) + 10);
  });
});
