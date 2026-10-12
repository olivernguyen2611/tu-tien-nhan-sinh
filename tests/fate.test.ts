import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { attemptMajorBreakthrough, breakthroughPct, yearlyGain } from '../src/systems/cultivation';
import { chooseFate, drawFate, fateRarityWeights, fitTags, offerFate, rerollFate } from '../src/systems/fate';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();

function tc(patch: Partial<GameState['cult']> = {}, luck = 50, extra: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'fate' }, content);
  return {
    ...b,
    character: { ...b.character, age: 30 },
    aptitudes: { physique: 50, comprehension: 50, luck, daoHeart: 50 },
    traits: [],
    log: [...b.log, { age: 30, lines: [] }],
    events: { ...b.events, followUps: [] },
    cult: { ...b.cult, realm: 'truc_co', root: { grade: 'song', elements: ['kim', 'hoa'] }, technique: 'dan_khi_quyet', lineage: 'tien', learned: [], foundation: 'trung', lifespan: 200, ...patch },
    ...extra,
  };
}
const rarityOf = (id: string) => content.fateTalents.find((t) => t.id === id)!.rarity;

describe('Nghịch Thiên Cải Mệnh (task 2.7)', () => {
  it('24 talents are loaded', () => {
    expect(content.fateTalents).toHaveLength(24);
  });

  it('rarity odds follow the foundation and khí vận shifts them up', () => {
    expect(fateRarityWeights(tc({ foundation: 'ha' }), content)).toEqual({ luong: 60, uu: 30, tuyet: 10 });
    expect(fateRarityWeights(tc({ foundation: 'hoan_my' }, 80), content)).toEqual({ tuyet: 44, thien: 40, than: 16 });
  });

  it('draws 3 distinct talents, never owned ones nor another lineage\'s', () => {
    const owned = tc({}, 50, { talents: ['linh_khi_than_hoa'] });
    for (let i = 0; i < 200; i++) {
      const ids = drawFate(owned, content, new Rng(`d${i}`));
      expect(new Set(ids).size).toBe(3);
      expect(ids).not.toContain('linh_khi_than_hoa');
      expect(ids).not.toContain('huyet_hai_bat_kho');
      expect(ids).not.toContain('bo_de_tam');
    }
    const ma = tc({ lineage: 'ma', foundation: 'thuong' });
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) drawFate(ma, content, new Rng(`m${i}`)).forEach((id) => seen.add(id));
    expect(seen.has('huyet_hai_bat_kho')).toBe(true);
  });

  it('a Hạ foundation never shows Thiên or Thần', () => {
    for (let i = 0; i < 200; i++) {
      for (const id of drawFate(tc({ foundation: 'ha' }), content, new Rng(`h${i}`))) expect(['luong', 'uu', 'tuyet']).toContain(rarityOf(id));
    }
  });

  it('the first slot prefers a talent fitting the build', () => {
    const sword = tc({ technique: 'tang_phong_kiem_kinh' });
    expect(fitTags(sword, content).has('sword')).toBe(true);
    let fits = 0;
    for (let i = 0; i < 100; i++) {
      const first = drawFate(sword, content, new Rng(`s${i}`))[0];
      if (content.fateTalents.find((t) => t.id === first)!.fits.includes('sword')) fits++;
    }
    expect(fits).toBe(100);
  });

  it('a successful Trúc Cơ breakthrough opens the choice and the year waits for it', () => {
    let opened: GameState | null = null;
    for (let i = 0; i < 300 && !opened; i++) {
      const s = tc({ realm: 'luyen_khi', stage: 8, progress: 100, foundation: null, lifespan: 130 }, 50, { rng: new Rng(`b${i}`).getState() });
      const r = attemptMajorBreakthrough(s, content)!;
      if (r.success) opened = r.state;
    }
    expect(opened!.fate?.offered).toHaveLength(3);
    expect(advanceYear(opened!, content)).toBe(opened);
    const chosen = chooseFate(opened!, content, opened!.fate!.offered[0]);
    expect(chosen.fate).toBeNull();
    expect(chosen.talents).toEqual([opened!.fate!.offered[0]]);
    expect(advanceYear(chosen, content)).not.toBe(chosen);
  });

  it('refreshes: one, plus one with khí vận 70; developer mode unlimited', () => {
    expect(offerFate(tc(), content).fate?.refreshesLeft).toBe(1);
    const lucky = offerFate(tc({}, 75), content);
    expect(lucky.fate?.refreshesLeft).toBe(2);
    const once = rerollFate(offerFate(tc(), content), content);
    expect(once.fate?.refreshesLeft).toBe(0);
    expect(rerollFate(once, content)).toBe(once);
    expect(rerollFate(once, content, true).fate?.refreshesLeft).toBe(0);
  });

  it('talents work: stats now, other hooks through the life', () => {
    const s = { ...tc(), fate: { offered: ['ngo_dao_thien_tu', 'linh_khi_than_hoa', 'dao_co_kien_co'], refreshesLeft: 0 } };
    expect(chooseFate(s, content, 'ngo_dao_thien_tu').aptitudes.comprehension).toBe(65);
    const fast = chooseFate(s, content, 'linh_khi_than_hoa');
    expect(yearlyGain(fast, content) / yearlyGain(tc(), content)).toBeCloseTo(1.1);
    const minor = chooseFate(s, content, 'dao_co_kien_co');
    expect(breakthroughPct(minor, content, 70, false) - breakthroughPct(tc(), content, 70, false)).toBeCloseTo(8);
    expect(breakthroughPct(minor, content, 20, true)).toBeCloseTo(breakthroughPct(tc(), content, 20, true));
    expect(chooseFate(s, content, 'kiem_khai_thien_mon')).toBe(s);
  });

  it('old saves have no talents', () => {
    const { talents: _t, fate: _f, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life).toMatchObject({ talents: [], fate: null });
  });
});
