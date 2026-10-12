import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { aptitudeFactor } from '../src/systems/cultivation';
import { eventWeight, findEvent } from '../src/systems/events/engine';

const content = loadContent();
const base = createLife({ seed: 'spd' }, content);
const apt = (physique: number, comprehension: number, luck = 50): GameState => ({ ...base, character: { ...base.character, age: 20 }, aptitudes: { ...base.aptitudes, physique, comprehension, luck } });

describe('tốc độ tu tiên và kỳ ngộ theo tư chất (playtest 2026-10-12)', () => {
  it('Căn cốt and Ngộ tính scale cultivation strongly', () => {
    expect(aptitudeFactor(apt(50, 50), content)).toBeCloseTo(1);
    expect(aptitudeFactor(apt(100, 100), content)).toBeCloseTo(content.balance.cultivation.aptitudeGrowth);
    expect(aptitudeFactor(apt(95, 95), content)).toBeGreaterThan(2.5);
    expect(aptitudeFactor(apt(0, 0), content)).toBeGreaterThanOrEqual(content.balance.cultivation.aptitudeMin);
  });

  it('kỳ ngộ come more often with high Khí vận', () => {
    const kyNgo = content.events.find((e) => content.balance.events.luckCategories.includes(e.category) && eventWeight(apt(50, 50, 50), content, e) > 0)!;
    expect(kyNgo).toBeDefined();
    const ratio = eventWeight(apt(50, 50, 95), content, kyNgo) / eventWeight(apt(50, 50, 50), content, kyNgo);
    expect(ratio).toBeCloseTo(1 + 45 * content.balance.events.luckPerPoint);
    expect(eventWeight(apt(50, 50, 10), content, kyNgo)).toBeLessThan(eventWeight(apt(50, 50, 50), content, kyNgo) / 2);
    expect(findEvent(content, kyNgo.id)).toBeDefined();
  });
});
