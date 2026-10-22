import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { bodyOf, catchDisease, cureAilment, healthLine, healthYear, injure } from '../src/systems/health';

const content = loadContent();
const cfg = content.balance.ailments!;

function adult(age = 30, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'health' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age }, money: { ...b.money, silver: 500 }, log: [...b.log, { age, lines: [] }], ...patch };
}
const older = (s: GameState, n = 1): GameState => ({ ...s, character: { ...s.character, age: s.character.age + n } });

describe('10.8 sức khỏe', () => {
  it('a named bệnh costs health every year until it passes', () => {
    let s = catchDisease(adult(), content, 'lao');
    expect(bodyOf(s).ailments.map((a) => a.id)).toEqual(['lao']);
    expect(healthLine(s, content)).toContain('Bệnh lao');
    const before = s.stats.health;
    s = healthYear(older(s), content);
    // Lao rarely passes on its own: one year costs health, or it passed.
    expect(s.stats.health < before || bodyOf(s).ailments.length === 0).toBe(true);
  });

  it('cultivators and quỷ tu do not fall ill', () => {
    const b = adult();
    const s = catchDisease({ ...b, cult: { ...b.cult, realm: 'luyen_khi' } }, content, 'phong_han');
    expect(bodyOf(s).ailments).toHaveLength(0);
  });

  it('treatment opens only when sick, and a thuốc quý almost always cures', () => {
    const well = activityViews(adult(), content).map((v) => v.id);
    expect(well).not.toContain('moi_lang_trung');
    let cured = 0;
    for (let i = 0; i < 20; i++) {
      const s = catchDisease(adult(30 + i), content, 'phong_han');
      expect(activityViews(s, content).map((v) => v.id)).toContain('moi_lang_trung');
      if (bodyOf(cureAilment(s, content, 'rare')).ailments.length === 0) cured++;
    }
    expect(cured).toBeGreaterThanOrEqual(17);
  });

  it('a thầy cúng cures less often than a lang trung', () => {
    let doctor = 0, shaman = 0;
    for (let i = 0; i < 60; i++) {
      const s = catchDisease(adult(20 + i), content, 'thuong_han');
      if (bodyOf(cureAilment(s, content, 'doctor')).ailments.length === 0) doctor++;
      if (bodyOf(cureAilment(s, content, 'shaman')).ailments.length === 0) shaman++;
    }
    expect(doctor).toBeGreaterThan(shaman);
  });

  it('a thương tật lasts, moves stats once, and sets its flag', () => {
    const b = adult();
    const s = injure(b, content, 'seo_mat');
    expect(s.flags.seo_mat).toBe(true);
    expect(s.stats.charm).toBeLessThan(b.stats.charm === 0 ? 1 : b.stats.charm);
    expect(injure(s, content, 'seo_mat').stats.charm).toBe(s.stats.charm);
    expect(healthYear(older(s), content).body!.injuries).toContain('seo_mat');
    expect(activityViews(s, content).map((v) => v.id)).toContain('song_chung_thuong_tat');
  });

  it('too many cups make nghiện rượu, which costs every year until quit', () => {
    let s = doActivity(adult(), content, 'tuu_lau')!.state;
    expect(bodyOf(s).drinks).toHaveLength(1);
    s = { ...s, body: { ...bodyOf(s), drinks: Array(cfg.drinkAt).fill(s.character.age) } };
    s = healthYear(s, content);
    expect(s.flags.nghien_ruou).toBe(true);
    const silver = s.money.silver;
    s = healthYear(older(s), content);
    expect(s.money.silver).toBeLessThan(silver);
    expect(activityViews(s, content).map((v) => v.id)).toContain('cai_ruou');
  });

  it('a mortal life meets some named bệnh over many lives', () => {
    let sick = 0;
    for (let i = 0; i < 10; i++) {
      let s = adult(5, { seed: `sick${i}` });
      for (let a = 0; a < 60; a++) { s = healthYear(older(s), content); if (bodyOf(s).ailments.length) { sick++; break; } }
    }
    expect(sick).toBeGreaterThanOrEqual(5);
  });
});
