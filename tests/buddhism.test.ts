import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { enterFirstRealm, yearlyGain } from '../src/systems/cultivation';
import { resolveChoice } from '../src/systems/events/engine';
import { joinSect, sectEligibility, sectYear } from '../src/systems/sect';
import { learnTechnique } from '../src/systems/technique';

const content = loadContent();
const NONE = { grade: 'none', elements: [], body: null };

function rootless(daoHeart: number, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'phat' }, content);
  return {
    ...b,
    character: { ...b.character, age: 20 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart },
    paths: {},
    traits: [],
    log: [...b.log, { age: 20, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, root: NONE },
    ...patch,
  };
}

describe('Phật duyên (task 3.12)', () => {
  it('Vô Ưu Tự takes the rootless with đạo tâm 70; other sects do not', () => {
    expect(sectEligibility(rootless(70), content, 'vo_uu_tu')).toBeNull();
    expect(sectEligibility(rootless(60), content, 'vo_uu_tu')).toContain('Đạo tâm 70');
    expect(sectEligibility(rootless(90), content, 'bich_lac_tong')).toContain('linh căn');
  });

  it('a rootless monk joins, learns the temple method a year later and cultivates on đạo tâm', () => {
    let s = joinSect(rootless(75), content, 'vo_uu_tu').state;
    s = sectYear({ ...s, character: { ...s.character, age: 21 } }, content);
    expect(s.sect.rank).toBe(1);
    const learned = learnTechnique(s, content, 'vo_uu_thien_tam_phap')!;
    s = enterFirstRealm(learned.state, content);
    expect(s.cult.realm).toBe('luyen_khi');
    expect(s.cult.lineage).toBe('phat');
    expect(yearlyGain(s, content)).toBeCloseTo(25 * 0.7 * 0.8 * 0.9); // main path Thể −10%
    expect(advanceYear(s, content).cult.progress).toBeGreaterThan(0);
  });

  it('killing breaks the precepts: đạo tâm −10, expelled after three breaks', () => {
    let s = joinSect(rootless(80), content, 'vo_uu_tu').state;
    s = { ...s, cult: { ...s.cult, lineage: 'phat', realm: 'luyen_khi', technique: 'vo_uu_thien_tam_phap' } };
    const kill = (x: GameState) => resolveChoice({ ...x, events: { ...x.events, pending: 'ke_bi_thuong_mang_bao' } }, content, 1).state;
    const once = kill(s);
    // −10 precept, −5 from the choice itself.
    expect(once.aptitudes.daoHeart).toBe(80 - 10 - 5);
    expect(once.cult.preceptBreaks).toBe(1);
    const thrice = kill(kill(once));
    expect(thrice.sect.id).toBeNull();
    expect(thrice.sect.left).toContain('vo_uu_tu');
  });

  it('other lineages do not pay the precept cost', () => {
    const s = { ...rootless(80), cult: { ...rootless(80).cult, lineage: 'tien' } };
    const r = resolveChoice({ ...s, events: { ...s.events, pending: 'ke_bi_thuong_mang_bao' } }, content, 1).state;
    expect(r.aptitudes.daoHeart).toBe(75);
    expect(r.cult.preceptBreaks).toBe(0);
  });
});
