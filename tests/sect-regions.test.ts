import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { sectDirectory, sectEligibility } from '../src/systems/sect';

const content = loadContent();
const born = createLife({ seed: 'sect-regions', originId: 'nong_dan' }, content);
const life = (region: string | null): GameState => ({
  ...born,
  character: { ...born.character, age: 20 },
  cult: { ...born.cult, root: { grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'] } },
  aptitudes: { ...born.aptitudes, physique: 80, comprehension: 80, daoHeart: 80 },
  stats: { ...born.stats, intellect: 80, charm: 80 },
  region: { ...born.region, id: region },
});

describe('sects by region (9.R7d)', () => {
  it('every region has at least three sects or giang hồ forces', () => {
    for (const r of content.regions) {
      const n = content.sects.filter((s) => s.region === r.id).length + (content.jianghuFactions ?? []).filter((f) => f.region === r.id).length;
      expect(n, r.id).toBeGreaterThanOrEqual(3);
    }
    expect(content.sects.length).toBeGreaterThanOrEqual(38);
  });

  it('a sect takes only those who come to its region, unless it recruits everywhere', () => {
    expect(sectEligibility(life(null), content, 'bich_ba_cac')).toContain('Đông Hải');
    expect(sectEligibility(life('dong_hai'), content, 'bich_ba_cac')).toBeNull();
    expect(sectEligibility(life(null), content, 'bich_lac_tong')).toBeNull();
    const dir = sectDirectory(life(null), content);
    expect(dir.here.map((s) => s.id)).toContain('thanh_khe_kiem_phai');
    expect(dir.here.map((s) => s.id)).not.toContain('bich_ba_cac');
    expect(dir.here.map((s) => s.id)).not.toContain('long_tich_dao');
    expect(dir.here).toHaveLength(9);
    expect(dir.elsewhere.some((g) => g.sects.some((s) => s.id === 'bich_ba_cac'))).toBe(true);
  });
});
