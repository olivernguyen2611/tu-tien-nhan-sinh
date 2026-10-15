import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { validateContent } from '../src/core/validate';
import { regionLore } from '../src/systems/worldLore';

const content = loadContent();

describe('world lore (9.R7c)', () => {
  it('loads five nations, twelve clans and six peoples, each living in a real region', () => {
    expect(content.nations).toHaveLength(5);
    expect(content.worldClans).toHaveLength(12);
    expect(content.races).toHaveLength(6);
    expect(regionLore(content, 'thanh_van_chau').nations).toContain('Đại Ung vương triều');
    expect(regionLore(content, 'thai_co_chien_truong').races).toContain('Thạch tộc');
  });

  it('a lore entry in an unknown region is an error', () => {
    const regions = [{ id: 'a', name: 'A', description: '.', qi: 1, summary: '.', enterText: '.', guardian: { name: 'x', title: 'y', realm: 'pham_nhan', text: '.' } }];
    const races = [{ id: 'r', name: 'R', regions: ['b'], stance: 'trung_lap', description: '.' }];
    const p = validateContent({ 'worlds/w/regions.json': regions, 'worlds/w/races.json': races });
    expect(p.some((x) => x.file === 'worlds/w/races.json' && x.message.includes('vùng lạ'))).toBe(true);
  });
});
