import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { craftRecipe, recipeViews } from '../src/systems/crafting';
import { marketOffers } from '../src/systems/market';

const content = loadContent();

function crafter(seed: string, craft: string, level: number): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    cult: { ...b.cult, realm: 'truc_co', stage: 1, lifespan: 220 },
    money: { silver: 0, spiritStones: 500 },
    inventory: { phu_chi: 20, linh_chu_sa: 20, linh_tinh_tho: 4, linh_tinh_moc: 4, linh_tinh_kim: 4 },
    crafts: { skills: { [craft]: { level, affinity: 0 } }, lastPractice: null },
  };
}

describe('13.7a Phù lục, Trận pháp', () => {
  it('a talisman batch makes several talismans with its own lines', () => {
    let made = 0;
    for (let i = 0; i < 10; i++) {
      const s = crafter(`tl${i}`, 'talisman', 10);
      const r = craftRecipe(s, content, 've_hoa_cau_phu')!;
      expect(r.state.inventory.phu_chi).toBe(17);
      if (r.success) {
        made++;
        expect(r.state.inventory.hoa_cau_phu).toBeGreaterThanOrEqual(3);
        expect(r.text).toContain('chu sa');
      } else expect(r.text).toContain('Vẽ');
    }
    expect(made).toBeGreaterThan(3);
  });

  it('higher talismans and trận bàn wait for the craft level', () => {
    const low = crafter('tl-low', 'talisman', 10);
    expect(recipeViews(low, content, 'talisman').find((r) => r.id === 've_thien_loi_phu')!.blocked).toContain('cấp 55');
    const f = crafter('tl-f', 'formation', 40);
    const views = recipeViews(f, content, 'formation');
    expect(views.find((r) => r.id === 'tran_ho_phu')!.blocked).toBeNull();
    expect(views.find((r) => r.id === 'tran_pha_kiep')!.blocked).toContain('cấp 60');
  });

  it('a market keeps phù chỉ and chu sa on the stall every year', () => {
    for (const age of [30, 31, 32]) {
      const s = { ...crafter('tl-m', 'talisman', 0), character: { ...crafter('tl-m', 'talisman', 0).character, age } };
      const ids = marketOffers(s, content, 'kim_thiem').map((o) => o.item.id);
      expect(ids).toEqual(expect.arrayContaining(['phu_chi', 'linh_chu_sa']));
    }
  });
});

describe('13.7b Bày trận', () => {
  const at = (lvl: number) => ({ ...crafter('fm', 'formation', lvl), cult: { ...crafter('fm', 'formation', lvl).cult, caveUntil: 60 } });

  it('needs a place to lay a trận', async () => {
    const { formationViews } = await import('../src/systems/formation');
    const s = crafter('fm0', 'formation', 40);
    expect(formationViews({ ...s, sect: { ...s.sect, id: null } }, content)[0].blocked).toContain('động phủ');
  });

  it('placing the trận kỳ right lays the trận and its hooks', async () => {
    const { beginFormation, formationInput, openSlots, formationHooks } = await import('../src/systems/formation');
    let s = beginFormation(at(40), content, 'me_tung_tran')!;
    expect(s.money.spiritStones).toBe(420);
    const g = s.formation!.game!;
    for (const i of openSlots(g)) s = formationInput(s, content, g.target[i]).state;
    expect(s.formation!.game).toBeNull();
    expect(s.formation!.active!.until).toBe(50);
    expect(formationHooks(s, content).some((h) => h.hook === 'escapeChance')).toBe(true);
  });

  it('too many wrong trận kỳ make the trận fall', async () => {
    const { beginFormation, formationInput, openSlots } = await import('../src/systems/formation');
    let s = beginFormation(at(10), content, 'tu_linh_tran')!;
    const g = s.formation!.game!;
    const wrong = g.target[openSlots(g)[0]] === 'kim' ? 'moc' : 'kim';
    let done = false;
    for (let i = 0; i <= g.allowed && !done; i++) { const r = formationInput(s, content, wrong); s = r.state; done = r.done; }
    expect(done).toBe(true);
    expect(s.formation!.active).toBeNull();
  });
});
