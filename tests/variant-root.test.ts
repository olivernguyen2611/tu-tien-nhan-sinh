import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import type { SpiritRoot } from '../src/core/types';
import { rootName } from '../src/systems/cultivation';
import { rootAffinities, techniqueMatches } from '../src/systems/technique';

const content = loadContent();
const loi: SpiritRoot = { grade: 'bien_di', elements: ['loi'] };

describe('linh căn biến dị = tổ hợp 2 hành (playtest 2026-10-12)', () => {
  it('every variant is two distinct basic elements', () => {
    for (const e of content.cultivation.roots.elements.filter((x) => x.variant)) {
      expect(e.components).toHaveLength(2);
      for (const c of e.components!) expect(content.cultivation.roots.elements.find((x) => x.id === c)?.variant).toBe(false);
    }
  });

  it('a Lôi root fits Lôi, Kim and Hỏa, and says so', () => {
    expect(rootAffinities(loi, content).sort()).toEqual(['hoa', 'kim', 'loi']);
    expect(rootName(loi, content)).toBe('Biến dị linh căn (Lôi: Kim + Hỏa)');
  });

  it('techniques of either basic element (and five-element ones) suit a variant root', () => {
    const tech = (elements: string[] | 'five') => ({ ...content.techniques[0], elements }) as (typeof content.techniques)[number];
    expect(techniqueMatches(tech(['hoa']), loi, content)).toBe(true);
    expect(techniqueMatches(tech(['kim']), loi, content)).toBe(true);
    expect(techniqueMatches(tech(['loi']), loi, content)).toBe(true);
    expect(techniqueMatches(tech(['thuy']), loi, content)).toBe(false);
    expect(techniqueMatches(tech('five'), loi, content)).toBe(true);
  });
});
