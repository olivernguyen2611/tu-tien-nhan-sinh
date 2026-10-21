import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { dockGroups, dockView, identityLine } from '../src/systems/dock';
import { validateContent } from '../src/core/validate';

const content = loadContent();
const life = (patch: Partial<GameState> = {}): GameState => {
  const s = createLife({ seed: 'dock' }, content);
  return { ...s, destiny: { ...s.destiny, confirmed: true }, character: { ...s.character, age: 20 }, ...patch };
};
const ids = (s: GameState) => { const d = dockView(s, content); return [...d.left, ...d.right].map((b) => b.id); };

describe('Dock theo tầng (9.7)', () => {
  it('a mortal sees the four mortal buttons, split two and two around +1 năm', () => {
    const s = life({ cult: { ...life().cult, root: null } });
    const d = dockView(s, content);
    expect(d.left.map((b) => b.id)).toEqual(['ban_than', 'hoat_dong']);
    expect(d.right.map((b) => b.id)).toEqual(['quan_he', 'gia_san']);
    expect([...d.left, ...d.right].map((b) => b.label)).toEqual(['Bản thân', 'Hành sự', 'Nhân duyên', 'Gia sản']);
  });

  it('a cultivator adds Tu luyện and Tông môn, three a side', () => {
    const base = life();
    const s = { ...base, tier: 'tu_chan', cult: { ...base.cult, realm: 'luyen_khi' } };
    const d = dockView(s, content);
    expect(d.left.length).toBe(3);
    expect(ids(s)).toEqual(['ban_than', 'tu_luyen', 'hoat_dong', 'tong_mon', 'quan_he', 'gia_san']);
  });

  it('a mortal on the giang hồ road gets the Giang hồ look of the Tông môn button', () => {
    const base = life({ cult: { ...life().cult, root: null } });
    const s = { ...base, lifestyles: { giang_ho: { since: 15, active: true } } };
    const b = [...dockView(s, content).left, ...dockView(s, content).right].find((x) => x.id === 'tong_mon')!;
    expect(b.label).toBe('Giang hồ');
  });

  it('Hành sự also lists groups no shown button takes', () => {
    const s = life({ cult: { ...life().cult, root: null } });
    expect(dockGroups(s, content, 'hoat_dong')).toEqual(expect.arrayContaining(['giai_tri', 'pham_phap', 'giang_ho']));
    expect(dockGroups(s, content, 'ban_than')).toContain('suc_khoe');
    expect(dockGroups(s, content, 'hoat_dong')).not.toContain('suc_khoe');
  });

  it('Thân phận names the place, and the validator catches an unknown dock button', () => {
    const line = identityLine(life(), content);
    if (content.regions.length > 0) expect(line).toMatch(/ở /);
    const world = { ...content.world, tiers: [{ id: 'pham_gian', name: 'P', dock: ['khong_co'] }] };
    const msgs = validateContent({ 'dock.json': [{ id: 'ban_than', glyph: '身', label: 'Bản thân' }], 'worlds/x/world.json': { ...world, id: 'x' } })
      .map((p) => p.message);
    expect(msgs.some((m) => m.includes('khong_co'))).toBe(true);
  });
});
