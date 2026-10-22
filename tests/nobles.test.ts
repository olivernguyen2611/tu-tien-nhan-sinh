import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { meets } from '../src/systems/events/conditions';
import { newLifeCost, originOptions } from '../src/systems/rebirth';

const content = loadContent();
const ids = ['quy_toc', 'hoang_than'];

describe('Xuất thân hoàng tộc và quý tộc (12.4)', () => {
  it('two rich origins, priced at Cầu đầu thai and rarely rolled', () => {
    for (const id of ids) {
      const o = content.origins.find((x) => x.id === id)!;
      expect(o.rebirthCost).toBeGreaterThan(0);
      expect(o.weight).toBeLessThanOrEqual(3);
      expect(newLifeCost(content, id)).toBe(o.rebirthCost);
    }
    expect(originOptions(content, 30).find((o) => o.id === 'hoang_than')!.affordable).toBe(false);
    const prince = createLife({ seed: 'hoang-than', originId: 'hoang_than' }, content);
    const farmer = createLife({ seed: 'hoang-than', originId: 'nong_dan' }, content);
    expect(prince.money.silver).toBeGreaterThan(farmer.money.silver);
    expect(prince.stats.charm).toBeGreaterThan(farmer.stats.charm);
  });

  it('each origin has its own events (cung đấu, chỉ hôn, gia biến…) that others never see', () => {
    for (const id of ids) {
      const own = content.events.filter((e) => e.category === 'noble' && e.conditions.origins?.includes(id));
      expect(own.length).toBeGreaterThanOrEqual(6);
    }
    const ev = content.events.find((e) => e.id === 'ht_chi_hon')!;
    const s = createLife({ seed: 'chi-hon', originId: 'hoang_than' }, content);
    const grown = { ...s, character: { ...s.character, age: 20 } };
    expect(meets(grown, ev.conditions, content)).toBe(true);
    expect(meets({ ...grown, character: { ...grown.character, age: 16 } }, ev.conditions, content)).toBe(false);
    const other = createLife({ seed: 'chi-hon', originId: 'nong_dan' }, content);
    expect(meets({ ...other, character: { ...other.character, age: 20 } }, ev.conditions, content)).toBe(false);
  });
});
