import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';

const content = loadContent();

describe('9.W: thế lực giang hồ, tách khỏi tông môn tu tiên', () => {
  it('loads apart from the sects, with no id shared and only real regions', () => {
    const factions = content.jianghuFactions ?? [];
    expect(factions.length).toBeGreaterThanOrEqual(15);
    const sectIds = new Set(content.sects.map((s) => s.id));
    expect(factions.some((f) => sectIds.has(f.id))).toBe(false);
    const regionIds = new Set(content.regions.map((r) => r.id));
    expect(factions.every((f) => regionIds.has(f.region))).toBe(true);
    for (const kind of ['mon_phai', 'the_gia', 'giao_phai']) expect(factions.some((f) => f.kind === kind), kind).toBe(true);
  });

  it('the old giang hồ names are gone from the world', () => {
    const text = JSON.stringify([content.events, content.regions]);
    for (const old of ['Diên Châu', 'Lục Hợp Môn', 'Thính Vũ Kiếm Phái', 'Vô Diện Lâu', 'Thanh Vân châu']) expect(text.includes(old), old).toBe(false);
  });
});
