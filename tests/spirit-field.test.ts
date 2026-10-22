import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { fieldView, fieldYear, sowHerb } from '../src/systems/spiritField';

const content = loadContent();

function farmer(seed: string, level = 10, age = 40): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    cult: { ...b.cult, realm: 'truc_co', stage: 1, lifespan: 220 },
    money: { silver: 0, spiritStones: 200 },
    crafts: { skills: { farming: { level, affinity: 0 } }, lastPractice: null },
  };
}

describe('13.7d Linh thực', () => {
  it('a mortal has no linh điền', () => {
    expect(fieldView(createLife({ seed: 'sf0' }, content), content)).toBeNull();
  });

  it('sowing takes a plot, the seed price and the craft slot; high herbs wait for the level', () => {
    const s = farmer('sf1');
    const view = fieldView(s, content)!;
    expect(view.herbs.find((h) => h.id === 'gieo_linh_chi')!.blocked).toContain('cấp 60');
    const r = sowHerb(s, content, 'gieo_linh_thao')!;
    expect(r.state.money.spiritStones).toBe(192);
    expect(r.state.field!.plots).toHaveLength(1);
    expect(fieldView(r.state, content)!.herbs[0].blocked).toContain('nghề');
  });

  it('a ripe plot is harvested on its own', () => {
    let got = 0;
    for (let i = 0; i < 12; i++) {
      const s = sowHerb(farmer(`sf2${i}`), content, 'gieo_linh_thao')!.state;
      const p = s.field!.plots[0];
      expect([43, 44]).toContain(p.ready);
      const later = fieldYear({ ...s, character: { ...s.character, age: p.ready } }, content);
      expect(later.field!.plots).toHaveLength(0);
      if ((later.inventory.linh_thao_tram_nam ?? 0) > 0) got++;
    }
    expect(got).toBeGreaterThan(6);
  });
});
