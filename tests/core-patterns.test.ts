// Task 4.2: đan văn from the strands placed during kết đan.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { validateContent } from '../src/core/validate';
import corePatterns from '../content/core-patterns.json';
import { applyGainHooks, hookSum } from '../src/systems/cultivation';
import { corePatternFor } from '../src/systems/goldenCore';

const content = loadContent();
const id = (placed: string[], cracks = 0) => corePatternFor(content, placed, cracks)?.id;

describe('đan văn (task 4.2)', () => {
  it('a crack wins over everything', () => {
    expect(id(['moc', 'hoa', 'tho'], 1)).toBe('liet_van');
  });

  it('three strands each flowing from the last make Tam Sinh Tuần Hoàn', () => {
    expect(id(['moc', 'hoa', 'tho'])).toBe('tam_sinh_tuan_hoan');
  });

  it('one element three times is Thuần Nhất', () => {
    expect(id(['thuy', 'thuy', 'thuy'])).toBe('thuan_nhat');
  });

  it('a variant strand gives its own pattern', () => {
    expect(id(['kim', 'loi', 'kim'])).toBe('loi_van');
  });

  it('otherwise the element placed most, ties to the later strand', () => {
    expect(id(['hoa', 'kim', 'hoa'])).toBe('ly_hoa_van');
    expect(id(['tho', 'tho', 'thuy'])).toBe('hau_tho_van');
    expect(id(['kim', 'tho', 'moc'])).toBe('thanh_moc_van');
  });

  it('the pattern adds its hooks to the life', () => {
    const life = createLife({ seed: 'dv', originId: 'nong_dan' }, content);
    const before = hookSum(life, content, 'cultivationSpeed');
    const withPattern = { ...life, cult: { ...life.cult, corePattern: 'tam_sinh_tuan_hoan' } };
    expect(hookSum(withPattern, content, 'cultivationSpeed')).toBeCloseTo(before + 0.1);
  });

  it('stat and lifespan hooks land once, when the pattern forms', () => {
    const life = createLife({ seed: 'dv', originId: 'nong_dan' }, content);
    const liet = content.corePatterns.find((p) => p.id === 'liet_van')!;
    expect(applyGainHooks(life, liet.effects).aptitudes.daoHeart).toBe(Math.min(100, life.aptitudes.daoHeart + 5));
    const moc = content.corePatterns.find((p) => p.id === 'thanh_moc_van')!;
    expect(applyGainHooks(life, moc.effects).cult.lifespan).toBe(Math.round(life.cult.lifespan * 1.1));
  });

  it('breakthrough hooks are in percentage points, like every other source', () => {
    for (const p of content.corePatterns) {
      for (const e of p.effects.filter((x) => x.hook.startsWith('breakthroughChance'))) expect(Math.abs(e.add ?? 0)).toBeGreaterThanOrEqual(1);
    }
  });

  it('every basic element has a pattern and the file validates', () => {
    for (const e of ['kim', 'moc', 'thuy', 'hoa', 'tho']) expect(content.corePatterns.some((p) => p.when.element === e)).toBe(true);
    expect(validateContent({ 'core-patterns.json': corePatterns }).filter((p) => p.level === 'error')).toEqual([]);
  });
});
