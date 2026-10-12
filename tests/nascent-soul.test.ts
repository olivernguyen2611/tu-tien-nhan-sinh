// Task 4.3: Hình thái Nguyên Anh.
import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { hookSum, majorBreakthroughInfo, majorSuccess } from '../src/systems/cultivation';
import { soulFormFor } from '../src/systems/nascentSoul';

const content = loadContent();
const base = createLife({ seed: 'anh', originId: 'nong_dan' }, content);
const kimDan: GameState = {
  ...base,
  character: { ...base.character, age: 200 },
  cult: { ...base.cult, realm: 'kim_dan', stage: 3, progress: 100, lifespan: 600, coreGrade: 5, root: { grade: 'song', elements: ['kim', 'hoa'] } },
  paths: Object.fromEntries(content.cultivation.aptitudes.paths.map((p) => [p.id, 10])),
};
const form = (s: GameState) => soulFormFor(s, content)?.id;

describe('Hình thái Nguyên Anh (task 4.3)', () => {
  it('a top-grade core gives Đạo Anh whatever the road', () => {
    expect(form({ ...kimDan, cult: { ...kimDan.cult, coreGrade: 2, lineage: 'ma' } })).toBe('dao_anh');
  });

  it('then the đạo thống decides', () => {
    expect(form({ ...kimDan, cult: { ...kimDan.cult, lineage: 'ma' } })).toBe('huyet_anh');
    expect(form({ ...kimDan, cult: { ...kimDan.cult, lineage: 'phat' } })).toBe('xa_loi_anh');
  });

  it('then the main fighting path, else Thanh Liên', () => {
    expect(form({ ...kimDan, paths: { ...kimDan.paths, sword: 80 } })).toBe('kiem_anh');
    expect(form(kimDan)).toBe('thanh_lien_anh');
  });

  it('the Nguyên Anh breakthrough is open and forms the soul with its hooks', () => {
    expect(majorBreakthroughInfo(kimDan, content)?.target.id).toBe('nguyen_anh');
    // No thiên kiếp here, so the test is about the form only.
    const calm: Content = { ...content, balance: { ...content.balance, tribulation: { ...content.balance.tribulation, realms: {} } } };
    const s = { ...kimDan, paths: { ...kimDan.paths, sword: 80 } };
    const r = majorSuccess(s, s, calm, Rng.fromState(s.rng), { id: 'nguyen_anh', name: 'Nguyên Anh' }, null);
    expect(r.state.cult.realm).toBe('nguyen_anh');
    expect(r.state.cult.soulForm).toBe('kiem_anh');
    expect(r.text).toContain('Kiếm Anh');
    expect(hookSum(r.state, content, 'path.sword.power')).toBeGreaterThanOrEqual(0.25);
  });

  it('a Phật soul adds its Đạo tâm once, when it forms', () => {
    const calm: Content = { ...content, balance: { ...content.balance, tribulation: { ...content.balance.tribulation, realms: {} } } };
    const monk: GameState = { ...kimDan, aptitudes: { ...kimDan.aptitudes, daoHeart: 60 }, cult: { ...kimDan.cult, lineage: 'phat' } };
    const r = majorSuccess(monk, monk, calm, Rng.fromState(monk.rng), { id: 'nguyen_anh', name: 'Nguyên Anh' }, null);
    expect(r.state.cult.soulForm).toBe('xa_loi_anh');
    expect(r.state.aptitudes.daoHeart).toBe(70);
  });

  it('every hook a soul form uses has an effect in the game', () => {
    const inert = ['divineSense', 'charmResist'];
    for (const f of content.nascentSouls.forms) {
      for (const e of f.effects) {
        expect(inert).not.toContain(e.hook);
        if (e.hook.startsWith('breakthroughChance')) expect(Math.abs(e.add ?? 0)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
