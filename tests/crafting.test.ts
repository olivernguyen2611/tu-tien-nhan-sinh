import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { craftChance, craftRecipe, recipeViews } from '../src/systems/crafting';
import { addItems } from '../src/systems/items';

const content = loadContent();
const cfg = content.balance.crafting;
const recipe = (id: string) => content.recipes.recipes.find((r) => r.id === id)!;

function crafter(alchemy: number, forging = 0, realm = 'luyen_khi'): GameState {
  const b = createLife({ seed: 'craft' }, content);
  return {
    ...b,
    character: { ...b.character, age: 30 },
    aptitudes: { ...b.aptitudes, comprehension: 50 },
    traits: [], talents: [], inventory: {},
    money: { silver: 100, spiritStones: 200 },
    log: [...b.log, { age: 30, lines: [] }],
    crafts: { skills: { alchemy: { level: alchemy, affinity: 20 }, forging: { level: forging, affinity: 20 } }, lastPractice: null },
    cult: { ...b.cult, realm, root: { grade: 'song', elements: ['moc', 'hoa'] }, technique: 'dan_khi_quyet', lineage: 'tien' },
  };
}

describe('luyện đan, luyện khí (task 4.7)', () => {
  it('every recipe uses and makes real items', () => {
    for (const r of content.recipes.recipes) {
      expect(content.items.some((i) => i.id === r.product), r.id).toBe(true);
      for (const m of Object.keys(r.materials)) expect(content.items.some((i) => i.id === m), m).toBe(true);
    }
  });

  it('mortals see only phàm dược; level, materials and money gate the rest', () => {
    expect(recipeViews(crafter(20, 0, 'pham_nhan'), content, 'alchemy').map((r) => r.id)).toEqual(['bo_khi_tan']);
    const views = recipeViews(crafter(20), content, 'alchemy');
    expect(views.find((v) => v.id === 'truc_co_dan')!.blocked).toBe('Cần cấp 50.');
    expect(views.find((v) => v.id === 'hoi_xuan_dan')!.blocked).toContain('Thiếu');
    expect(recipeViews(addItems(crafter(20), ['linh_thao_tram_nam']), content, 'alchemy').find((v) => v.id === 'hoi_xuan_dan')!.blocked).toBeNull();
  });

  it('the chance grows with level above the recipe', () => {
    expect(craftChance(crafter(60), content, recipe('hoi_xuan_dan'))).toBeGreaterThan(craftChance(crafter(10), content, recipe('hoi_xuan_dan')));
    expect(craftChance(crafter(10), content, recipe('hoi_xuan_dan'))).toBeCloseTo(cfg.base);
  });

  it('success makes the product; failure leaves a Phế Đan; materials and money are spent; the year’s slot is used', () => {
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < 40; i++) {
      const s = { ...addItems(crafter(10), ['linh_thao_tram_nam']), rng: new Rng(`c${i}`).getState() };
      const r = craftRecipe(s, content, 'hoi_xuan_dan')!;
      expect(r.state.inventory.linh_thao_tram_nam ?? 0).toBe(0);
      expect(r.state.money.spiritStones).toBe(200 - 5);
      expect(r.state.crafts.lastPractice).toBe(30);
      expect(craftRecipe(r.state, content, 'bo_khi_tan')).toBeNull();
      if (r.success) {
        ok++;
        expect(r.state.inventory.hoi_xuan_dan).toBe(1);
        expect(r.state.crafts.skills.alchemy!.level).toBe(10 + cfg.xpSuccess);
      } else {
        fail++;
        expect(r.state.inventory.phe_dan).toBe(1);
      }
    }
    expect(ok).toBeGreaterThan(0);
    expect(fail).toBeGreaterThan(0);
  });

  it('luyện khí forges artifacts from linh tinh', () => {
    for (let i = 0; i < 20; i++) {
      const s = { ...addItems(crafter(0, 40), ['linh_tinh_kim', 'linh_tinh_kim']), rng: new Rng(`f${i}`).getState() };
      const r = craftRecipe(s, content, 'thanh_phong_kiem')!;
      if (r.success) {
        expect(r.state.inventory.thanh_phong_kiem).toBe(1);
        return;
      }
      expect(r.state.inventory.phe_dan ?? 0).toBe(0);
    }
    throw new Error('no forging success in 20 tries');
  });
});
