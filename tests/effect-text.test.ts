import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { describeEffect, describeEffects } from '../src/systems/effectText';

const content = loadContent();

describe('9.R2c: effect lines from hook data', () => {
  it('every khí vận and tổ hợp ẩn hook has a readable line', () => {
    const all = [...content.traits.map((t) => [t.id, t.effects] as const), ...content.traitCombos.combos.map((c) => [c.id, c.effects] as const)];
    for (const [id, effects] of all) {
      for (const e of effects) expect(describeEffect(e, content), `${id}: ${e.hook}`).not.toBeNull();
      expect(describeEffects(effects, content).length).toBeGreaterThan(0);
    }
  });

  it('formats values and marks harm', () => {
    const [speed, bad, zero, mishap, realm] = describeEffects([
      { hook: 'cultivationSpeed', add: 0.12 },
      { hook: 'lifespanPct', add: -0.2 },
      { hook: 'eventWeight.poisoning', mul: 0 },
      { hook: 'eventWeight.mishap', mul: 1.5 },
      { hook: 'breakthroughChance.at.kim_dan', add: 12 },
    ], content);
    expect(speed).toEqual({ text: 'Tốc độ tu luyện +12%', good: true });
    expect(bad).toEqual({ text: 'Thọ nguyên −20%', good: false });
    expect(zero).toEqual({ text: 'Không gặp ngộ độc ăn uống', good: true });
    expect(mishap).toEqual({ text: 'Gặp tai nạn vặt ×1,5', good: false });
    expect(realm.text).toBe('Đột phá khi ở Kim Đan +12%');
  });

  it('a mixed khí vận shows both a gain and a cost', () => {
    const bad: string[] = [];
    for (const t of content.traits.filter((x) => x.nature === 'hon_hop')) {
      const lines = describeEffects(t.effects, content);
      if (!(lines.some((l) => l.good) && lines.some((l) => !l.good))) bad.push(t.id);
    }
    expect(bad).toEqual([]);
  });
});
