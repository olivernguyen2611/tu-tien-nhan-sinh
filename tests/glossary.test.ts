import { describe, expect, it } from 'vitest';
import { GlossarySchema } from '../src/core/schemas';
import { makeTermSplitter } from '../src/systems/glossary';
import glossary from '../content/glossary.json';

const g = GlossarySchema.parse([
  { id: 'khi_van', term: 'Khí vận', definition: 'Số may.', aliases: ['Vận khí'] },
  { id: 'tien_thien_khi_van', term: 'Tiên Thiên Khí Vận', definition: 'Ba điều trời ban.' },
  { id: 'tho_nguyen', term: 'Thọ nguyên', definition: 'Số năm sống.', aliases: ['Thọ'] },
  { id: 'linh_thach', term: 'Linh thạch', definition: 'Tiền tu tiên.' },
]);
const split = makeTermSplitter(g);

describe('glossary splitter', () => {
  it('marks a term ignoring case and keeps the original spelling', () => {
    expect(split('Bạn được ba viên linh thạch.')).toEqual(['Bạn được ba viên ', { id: 'linh_thach', text: 'linh thạch' }, '.']);
  });

  it('marks only the first occurrence of each term', () => {
    const parts = split('Linh thạch, linh thạch, lại linh thạch.');
    expect(parts.filter((p) => typeof p !== 'string')).toHaveLength(1);
  });

  it('prefers the longest term and matches aliases', () => {
    expect(split('Tiên Thiên Khí Vận tốt, vận khí cũng tốt.')).toEqual([
      { id: 'tien_thien_khi_van', text: 'Tiên Thiên Khí Vận' }, ' tốt, ', { id: 'khi_van', text: 'vận khí' }, ' cũng tốt.',
    ]);
  });

  it('only matches whole words', () => {
    expect(split('Thọ nguyên còn dài, sống thọ.')).toEqual([{ id: 'tho_nguyen', text: 'Thọ nguyên' }, ' còn dài, sống thọ.']);
    expect(split('Thoải mái')).toEqual(['Thoải mái']);
  });

  it('returns the text untouched when nothing matches', () => {
    expect(split('Một năm bình lặng trôi qua.')).toEqual(['Một năm bình lặng trôi qua.']);
  });

  it('the shipped glossary has unique ids, terms and aliases', () => {
    const items = GlossarySchema.parse(glossary);
    const ids = items.map((x) => x.id);
    const names = items.flatMap((x) => [x.term, ...x.aliases].map((n) => n.toLocaleLowerCase('vi')));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });
});
