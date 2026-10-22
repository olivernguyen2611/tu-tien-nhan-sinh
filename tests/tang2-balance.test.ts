import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import type { GameState } from '../src/core/types';
import { simulateLife } from '../src/systems/simulate';

const content = loadContent();
// 13.6: a cultivator who keeps the mortal bond and uses the Tu hành activities.
const opts = { profile: 'player' as const, choices: { nd_nhap_dao_lua_chon: 1 }, daoActivities: ['ha_son', 'san_yeu_thu', 'du_luan_dao_hoi', 'hai_linh_duoc', 'kham_pha_di_tich'] };
const life = (seed: string) => {
  let end: GameState | undefined;
  const r = simulateLife(content, seed, { ...opts, observe: (k, s) => { if (k === 'end') end = s; } });
  return { r, s: end! };
};

describe('13.6 chỉ tiêu tầng 2', () => {
  it('a long cultivator life: few quiet years, a home visit, a rival chain that ends', () => {
    const { r, s } = life('m136:14');
    expect(s.tier).toBe('tu_chan');
    expect(r.age).toBeGreaterThanOrEqual(300);
    expect(r.quietShare!).toBeLessThan(0.1);
    expect(Object.keys(s.events.seen ?? {}).some((id) => id.startsWith('sg_ha_son') || id.startsWith('sg2_'))).toBe(true);
    expect(s.flags.kinh_dich_ket).toBe(true);
  }, 120_000);

  it('quiet years stay under 10% across cultivator lives', () => {
    const lives = ['m136:0', 'm136:9', 'm136:11', 'm136:28'].map(life).filter((l) => l.s.tier === 'tu_chan');
    expect(lives.length).toBeGreaterThan(2);
    const mean = lives.reduce((n, l) => n + l.r.quietShare!, 0) / lives.length;
    expect(mean).toBeLessThan(0.1);
  }, 120_000);
});
