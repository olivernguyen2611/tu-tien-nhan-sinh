import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { applyJobCrafts, craftTitle, craftViews, practiceCraft } from '../src/systems/crafts';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();

function mortal(age = 15, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'craft' }, content);
  return {
    ...b,
    character: { ...b.character, age },
    money: { silver: 100, spiritStones: 0 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    log: [...b.log, { age, lines: [] }],
    ...patch,
  };
}

describe('crafts (task 2.12)', () => {
  it('mortals see only Luyện Đan and Linh Thực; cultivators see all six', () => {
    expect(craftViews(mortal(), content).map((c) => c.id)).toEqual(['alchemy', 'farming']);
    const cult = mortal();
    const s = { ...cult, cult: { ...cult.cult, realm: 'luyen_khi' } };
    expect(craftViews(s, content)).toHaveLength(6);
  });

  it('practice raises the level once a year and costs silver', () => {
    const s = mortal();
    const r = practiceCraft(s, content, 'alchemy')!;
    const skill = r.state.crafts.skills.alchemy;
    expect(skill.level).toBeGreaterThanOrEqual(3);
    expect(skill.level).toBeLessThanOrEqual(10);
    expect(r.state.money.silver).toBe(95);
    expect(r.state.log.at(-1)!.lines[0].text).toContain('luyện đan');
    expect(practiceCraft(r.state, content, 'farming')).toBeNull();
    expect(craftViews(r.state, content)[1].blocked).toContain('Năm nay');
  });

  it('is blocked for children, the poor, and non-mortal crafts', () => {
    expect(craftViews(mortal(8), content)[0].blocked).toContain('10 tuổi');
    expect(craftViews(mortal(15, { money: { silver: 2, spiritStones: 0 } }), content)[0].blocked).toContain('5 lượng bạc');
    expect(practiceCraft(mortal(), content, 'forging')).toBeNull();
  });

  it('titles follow the level', () => {
    expect(craftTitle(content, 'alchemy', 0)).toBe('Học đồ luyện đan');
    expect(craftTitle(content, 'alchemy', 45)).toBe('Đan Sư');
    expect(craftTitle(content, 'alchemy', 65)).toBe('Đại Đan Sư');
    expect(craftTitle(content, 'farming', 90)).toBe('Linh Thực Tông');
  });

  it('a practice that crosses a level band logs the new title', () => {
    const s = mortal(15, { crafts: { skills: { alchemy: { level: 19, affinity: 30 } }, lastPractice: null } });
    const lines = practiceCraft(s, content, 'alchemy')!.state.log.at(-1)!.lines;
    expect(lines.some((l) => l.text.includes('Đan Đồ'))).toBe(true);
  });

  it('nghề thuốc starts Luyện Đan at 10; nghề rèn starts Luyện Khí at 10 only with a root', () => {
    const s = applyJobCrafts(mortal(16, { flags: { nghe_thuoc: true, nghe_ren: true } }), content);
    expect(s.crafts.skills.alchemy.level).toBe(10);
    expect(s.crafts.skills.forging).toBeUndefined();
    expect(applyJobCrafts(s, content)).toBe(s);
    const c = { ...s, cult: { ...s.cult, realm: 'luyen_khi' } };
    expect(applyJobCrafts(c, content).crafts.skills.forging.level).toBe(10);
  });

  it('runs inside the yearly step', () => {
    const s = mortal(16, { flags: { nghe_thuoc: true } });
    expect(advanceYear(s, content).crafts.skills.alchemy?.level).toBe(10);
  });

  it('old saves get an empty craft book', () => {
    const { crafts: _c, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life.crafts).toEqual({ skills: {}, lastPractice: null });
  });
});
