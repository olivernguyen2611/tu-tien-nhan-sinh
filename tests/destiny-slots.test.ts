import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { hookSum } from '../src/systems/cultivation';
import { activeCombos, confirmDestiny, lockCost, rerollDestiny, rollDestiny, toggleLock } from '../src/systems/destiny';

const content = loadContent();

describe('ô khí vận, khóa ô, tổ hợp ẩn (task 5b.3)', () => {
  it('has at least 60 traits and 10 hidden combos', () => {
    expect(content.traits.length).toBeGreaterThanOrEqual(60);
    expect(content.traitCombos.combos.length).toBeGreaterThanOrEqual(10);
  });

  it('thiên phú luân hồi add slots up to the maximum', () => {
    expect(rollDestiny(createLife({ seed: 'o' }, content), content).destiny.offered).toHaveLength(3);
    const five = rollDestiny(createLife({ seed: 'o', rebirthTalents: { menh_ban_them_o: 2 } }, content), content);
    expect(five.destiny.offered).toHaveLength(5);
    expect(new Set(five.destiny.offered).size).toBe(5);
  });

  it('a locked slot survives rerolls; locks are limited and cost points', () => {
    let s = rollDestiny(createLife({ seed: 'khoa' }, content), content);
    const keep = s.destiny.offered[1];
    s = toggleLock(s, keep);
    expect(toggleLock(s, s.destiny.offered[0]).destiny.locked).toEqual([keep]);
    expect(lockCost(s, content)).toBe(content.balance.traits.lockCost);
    for (let i = 0; i < 5; i++) {
      s = rerollDestiny(s, content, true);
      expect(s.destiny.offered[1]).toBe(keep);
      expect(new Set(s.destiny.offered).size).toBe(3);
    }
    expect(toggleLock(s, keep).destiny.locked).toEqual([]);
    const two = toggleLock(toggleLock(rollDestiny(createLife({ seed: 'k2', rebirthTalents: { dinh_menh_an: 1 } }, content), content), 'x'), 'y');
    expect(two.destiny.maxLocks).toBe(2);
  });

  it('a combo wakes on confirm: logged, one-time stats, life-long hooks', () => {
    const base = rollDestiny(createLife({ seed: 'combo' }, content), content);
    const plain = confirmDestiny({ ...base, destiny: { ...base.destiny, offered: ['khoai_cuoc', 'kheo_mom', 'thiet_vi'] } }, content);
    const both = confirmDestiny({ ...base, destiny: { ...base.destiny, offered: ['khoai_cuoc', 'phong_cot', 'thiet_vi'] } }, content);
    expect(activeCombos(both, content).map((c) => c.id)).toEqual(['truy_phong']);
    expect(both.log[0].lines.some((l) => l.text.startsWith('Tổ hợp ẩn · Truy Phong'))).toBe(true);
    expect(hookSum(both, content, 'escapeChance') - hookSum(plain, content, 'escapeChance')).toBeCloseTo(0.1 + 0.2);
    const health = confirmDestiny({ ...base, destiny: { ...base.destiny, offered: ['thiet_vi', 'an_khoe', 'kheo_mom'] } }, content);
    const noCombo = confirmDestiny({ ...base, destiny: { ...base.destiny, offered: ['thiet_vi', 'kheo_mom', 'mat_ca'] } }, content);
    expect(health.stats.health - noCombo.stats.health).toBe(Math.min(100, noCombo.stats.health + 15) - noCombo.stats.health);
  });
});
