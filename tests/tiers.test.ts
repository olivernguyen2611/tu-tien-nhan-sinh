import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { meets } from '../src/systems/events/conditions';
import { migrate, type SaveFile } from '../src/systems/save';
import { seeTier, syncTier } from '../src/systems/tiers';

const content = loadContent();

describe('Tầng và lối sống (9.1)', () => {
  it('a mortal is born in Phàm gian, with no screen', () => {
    const s = createLife({ seed: 'a' }, content);
    expect(s.tier).toBe('pham_gian');
    expect(s.tierHistory).toEqual({ pham_gian: 0 });
    expect(s.tierScreen ?? null).toBeNull();
    expect(advanceYear(s, content).tier).toBe('pham_gian');
  });

  it('Luyện Khí tầng 1 moves the life to Tu chân giới once, with the nhập đạo screen; it never drops back', () => {
    const s = createLife({ seed: 'b' }, content);
    const up = syncTier({ ...s, character: { ...s.character, age: 14 }, cult: { ...s.cult, realm: 'luyen_khi', stage: 0 } }, content);
    expect(up.tier).toBe('tu_chan');
    expect(up.tierHistory!.tu_chan).toBe(14);
    expect(up.tierScreen).toBe('tu_chan');
    expect(up.lifestyles!.tu_tien).toEqual({ since: 14, active: true });
    const seen = seeTier(up);
    expect(syncTier(seen, content)).toBe(seen);
    const back = syncTier({ ...seen, cult: { ...seen.cult, realm: 'pham_nhan' } }, content);
    expect(back.tier).toBe('tu_chan');
    // Linh giới is locked.
    expect(content.world.tiers.find((t) => t.id === 'linh_gioi')!.locked).toBe(true);
  });

  it('lối sống follow the career and keep their first age', () => {
    const s = createLife({ seed: 'c' }, content);
    const quan = syncTier({ ...s, character: { ...s.character, age: 20 }, career: { id: 'quan', rung: 0, since: 20 } }, content);
    expect(quan.lifestyles!.quan_truong).toEqual({ since: 20, active: true });
    const left = syncTier({ ...quan, character: { ...quan.character, age: 30 }, career: { id: null, rung: 0, since: 0 } }, content);
    expect(left.lifestyles!.quan_truong).toEqual({ since: 20, active: false });
  });

  it('event conditions read tier and lifestyle', () => {
    const s = createLife({ seed: 'd' }, content);
    expect(meets(s, { tier: ['pham_gian'] } as never, content)).toBe(true);
    expect(meets(s, { minTier: 'tu_chan' } as never, content)).toBe(false);
    expect(meets(s, { maxTier: 'pham_gian' } as never, content)).toBe(true);
    expect(meets(s, { lifestyle: ['giang_ho'] } as never, content)).toBe(false);
    const gh: GameState = syncTier({ ...s, career: { id: 'vo_lam', rung: 0, since: 0 } }, content);
    expect(meets(gh, { lifestyle: ['giang_ho'] } as never, content)).toBe(true);
  });

  it('a v3 save loads as v4 in the right tier, without the screen', () => {
    const base = createLife({ seed: 'e' }, content);
    const strip = (l: GameState) => { const { tier: _t, tierHistory: _h, tierScreen: _s, lifestyles: _l, ...rest } = l; return rest as GameState; };
    const mortal = migrate({ saveVersion: 3, life: strip(base) } as unknown as SaveFile, base).life;
    expect(mortal.tier).toBe('pham_gian');
    const cult = strip({ ...base, character: { ...base.character, age: 40 }, cult: { ...base.cult, realm: 'truc_co' } });
    const up = migrate({ saveVersion: 3, life: cult } as unknown as SaveFile, base).life;
    expect(up.tier).toBe('tu_chan');
    expect(up.tierHistory).toEqual({ pham_gian: 0, tu_chan: 40 });
    expect(up.tierScreen).toBeNull();
  });
});
