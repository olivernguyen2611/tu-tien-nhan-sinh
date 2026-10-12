import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { yearlyGain } from '../src/systems/cultivation';
import { addPathAffinity, mainPath, pathAffinity, pathSpeedBonus } from '../src/systems/paths';
import { learnTechnique } from '../src/systems/technique';
import { migrate } from '../src/systems/save';

const content = loadContent();
const SONG = { grade: 'song', elements: ['kim', 'hoa'] };

function cultivator(paths: Record<string, number>, patch: Partial<GameState['cult']> = {}): GameState {
  const b = createLife({ seed: 'paths' }, content);
  return {
    ...b,
    character: { ...b.character, age: 20 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 60 },
    traits: [],
    paths,
    log: [...b.log, { age: 20, lines: [] }],
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130, ...patch },
  };
}

describe('đạo thống × con đường (task 3.8)', () => {
  it('each life rolls five path aptitudes in the balance range, from the seed', () => {
    const a = createLife({ seed: 'p1' }, content);
    expect(Object.keys(a.paths).sort()).toEqual(['arts', 'body', 'spell', 'sword', 'weapon']);
    for (const v of Object.values(a.paths)) expect(v).toBeGreaterThanOrEqual(5), expect(v).toBeLessThanOrEqual(30);
    expect(createLife({ seed: 'p1' }, content).paths).toEqual(a.paths);
  });

  it('the main path is the highest aptitude and tunes cultivation speed', () => {
    const even = cultivator({});
    expect(mainPath(even, content).id).toBe('');
    const base = yearlyGain(even, content);
    const sword = cultivator({ sword: 30, body: 10 });
    expect(mainPath(sword, content).id).toBe('sword');
    expect(yearlyGain(sword, content) / base).toBeCloseTo(1.1 / 1);
    const body = cultivator({ sword: 10, body: 30 });
    expect(yearlyGain(body, content) / base).toBeCloseTo(0.9);
    // Mortals get no path bonus.
    expect(pathSpeedBonus({ ...sword, cult: { ...sword.cult, realm: 'pham_nhan' } }, content)).toBe(0);
  });

  it('technique hooks add to the aptitude: Tàng Phong Kiếm Kinh makes Kiếm the main path', () => {
    const s = cultivator({ sword: 10, body: 20 });
    expect(mainPath(s, content).id).toBe('body');
    const t = learnTechnique({ ...s, aptitudes: { ...s.aptitudes, daoHeart: 60 } }, content, 'tang_phong_kiem_kinh')!.state;
    expect(pathAffinity(t, content, 'sword')).toBe(25);
    expect(mainPath(t, content).id).toBe('sword');
    expect(addPathAffinity(t, { sword: 200 }).paths.sword).toBe(100);
  });

  it('Phật đạo gives đạo tâm once; Quỷ đạo wears health and Ma đạo stains karma each year', () => {
    const s = cultivator({ sword: 20 });
    const monk = learnTechnique(s, content, 'vo_uu_thien_tam_phap')!.state;
    expect(monk.cult.lineage).toBe('phat');
    expect(monk.aptitudes.daoHeart).toBe(65);
    expect(monk.cult.lineagesAdopted).toContain('phat');
    const ghost = cultivator({ sword: 20 }, { lineage: 'quy' });
    expect(advanceYear(ghost, content).stats.health).toBeLessThan(advanceYear(cultivator({ sword: 20 }), content).stats.health);
    const ma = cultivator({ sword: 20 }, { lineage: 'ma' });
    expect(advanceYear(ma, content).social.karma).toBe(ma.social.karma - 1);
  });

  it('old saves get empty paths and keep their lineage as adopted', () => {
    const s = cultivator({ sword: 20 });
    const { paths: _p, ...old } = s;
    const cult = { ...old.cult } as Partial<GameState['cult']>;
    delete cult.lineagesAdopted;
    const m = migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: { ...old, cult } as unknown as GameState });
    expect(m.life.paths).toEqual({});
    expect(m.life.cult.lineagesAdopted).toEqual(['tien']);
  });
});
