import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { combatPower } from '../src/systems/combat';
import { yearlyGain } from '../src/systems/cultivation';
import { boCo, realmTier, rollRealmTier } from '../src/systems/realmGrade';

const content = loadContent();

function at(realm: string, cult: Partial<GameState['cult']> = {}, seed = 'rg'): GameState {
  const b = createLife({ seed }, content);
  return { ...b, character: { ...b.character, age: 200 }, tier: 'tu_chan', cult: { ...b.cult, realm, stage: 0, lifespan: 1000, ...cult } };
}

describe('13.7e Phẩm cấp 4 bậc', () => {
  it('Trúc Cơ and Kim Đan read their tier from đạo cơ and the core grade, capped by the realm before', () => {
    expect(realmTier(at('truc_co', { foundation: 'thuong' }), content, 'truc_co')).toBe(3);
    expect(realmTier(at('kim_dan', { foundation: 'thuong', coreGrade: 1 }), content, 'kim_dan')).toBe(4);
    expect(realmTier(at('kim_dan', { foundation: 'ha', coreGrade: 1 }), content, 'kim_dan')).toBe(2);
    expect(realmTier(at('luyen_khi'), content, 'truc_co')).toBeNull();
  });

  it('an old save in Nguyên Anh or Hóa Thần gets a tier without migration', () => {
    expect(realmTier(at('nguyen_anh', { foundation: 'thuong', coreGrade: 2 }), content, 'nguyen_anh')).toBe(3);
    expect(realmTier(at('hoa_than', { foundation: 'trung', coreGrade: 5 }), content, 'hoa_than')).toBe(2);
  });

  it('only the current tier counts toward power', () => {
    const low = at('kim_dan', { foundation: 'ha', coreGrade: 9 });
    const high = at('kim_dan', { foundation: 'hoan_my', coreGrade: 1 });
    expect(combatPower(high, content) / combatPower(low, content)).toBeCloseTo(1.3 / 0.9, 1);
  });

  it('entering Nguyên Anh rolls a tier no higher than Kim Đan + 1, and the tier sets the speed', () => {
    for (let i = 0; i < 20; i++) {
      const s = at('nguyen_anh', { foundation: 'ha', coreGrade: 9 }, `rg${i}`);
      const r = rollRealmTier(s, content, new Rng(`rg${i}`));
      expect(r.state.cult.grades!.nguyen_anh).toBeLessThanOrEqual(2);
      expect(r.line).not.toBeNull();
    }
    const slow = { ...at('nguyen_anh'), cult: { ...at('nguyen_anh').cult, root: { grade: 'song', elements: ['kim', 'moc'] }, grades: { nguyen_anh: 1 } } };
    const fast = { ...slow, cult: { ...slow.cult, grades: { nguyen_anh: 4 } } };
    expect(yearlyGain(fast, content)).toBeGreaterThan(yearlyGain(slow, content));
  });

  it('Hóa Thần tiers 3–4 need đạo tâm 70', () => {
    for (let i = 0; i < 20; i++) {
      const s = at('hoa_than', { foundation: 'hoan_my', coreGrade: 1, grades: { nguyen_anh: 4 } }, `rh${i}`);
      const r = rollRealmTier({ ...s, aptitudes: { ...s.aptitudes, daoHeart: 40 } }, content, new Rng(`rh${i}`));
      expect(r.state.cult.grades!.hoa_than).toBeLessThanOrEqual(2);
    }
  });

  it('bổ cơ raises the Trúc Cơ tier once', () => {
    const s = at('truc_co', { foundation: 'ha' });
    expect(realmTier(boCo(s, content), content, 'truc_co')).toBe(2);
  });
});
