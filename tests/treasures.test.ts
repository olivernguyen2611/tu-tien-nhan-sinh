import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { consumeItem } from '../src/systems/items';
import { tribulationPreview } from '../src/systems/tribulation';
import { awakenBody } from '../src/systems/cultivation';
import { devAwakenBody, devGiveAllItems, devGiveAllScrolls, devLearnTechnique } from '../src/systems/dev';

const content = loadContent();
const base = createLife({ seed: 'treasures' }, content);
const adult: GameState = { ...base, character: { ...base.character, age: 25 }, log: [...base.log, { age: 25, lines: [] }] };

/** Every id a choice outcome can hand out or set, flattened. */
function effectsOf(event: (typeof content.events)[number]) {
  const out: Record<string, unknown>[] = [];
  const add = (o?: { effects: Record<string, unknown>; fight?: { win: { effects: Record<string, unknown> }; lose: { effects: Record<string, unknown> } } }) => {
    if (!o) return;
    out.push(o.effects);
    if (o.fight) out.push(o.fight.win.effects, o.fight.lose.effects);
  };
  for (const c of event.choices) { add(c.result); add(c.success); add(c.fail); }
  return out;
}
const grants = (key: string, id: string) => content.events.some((e) => effectsOf(e).some((fx) => [fx[key]].flat().includes(id)));

describe('treasure catalog gaps are closed', () => {
  it('dev mode hands out every item and every scroll, and learns any technique', () => {
    const all = devGiveAllItems(adult, content);
    for (const it of content.items) expect(all.inventory[it.id]).toBeGreaterThanOrEqual(1);
    expect(devGiveAllScrolls(adult, content).cult.scrolls.length).toBe(content.techniques.length);
    // A mortal without a root still learns a root-bound technique in dev mode.
    const learned = devLearnTechnique(adult, content, 'thai_so_dien_dao_kinh');
    expect(learned.cult.technique).toBe('thai_so_dien_dao_kinh');
  });

  it('every item and every technique can be obtained somewhere', () => {
    const shop = (id: string) => content.items.find((i) => i.id === id);
    const recipe = (id: string) => content.recipes.recipes.some((r) => r.product === id);
    const unreachable = content.items.filter((i) => !grants('addItems', i.id) && !recipe(i.id) && shop(i.id)?.forSale === false && !['phe_dan', 'huyet_khi_hoan', 'giap_vay_giao'].includes(i.id)); // giap_vay_giao is sold in regional markets (markets.json)
    // Items not for sale must come from an event (or a recipe / failed alchemy).
    expect(unreachable.map((i) => i.id)).toEqual([]);
    const sectTechs = new Set(content.sects.flatMap((s) => s.techniques.map((t) => t.id)));
    const loose = content.techniques.filter((t) => !sectTechs.has(t.id) && !grants('gainTechnique', t.id) && !grants('learnTechnique', t.id) && !['dan_khi_quyet', 'bat_tu_u_minh_luc'].includes(t.id));
    expect(loose.map((t) => t.id)).toEqual([]);
  });

  it('wires the chains the catalog found open', () => {
    expect(grants('addItems', 'noi_dan_3')).toBe(true);
    expect(grants('gainTechnique', 'thai_so_dien_dao_kinh')).toBe(true);
    expect(grants('gainTechnique', 'cuu_chuyen_kim_cot_quyet')).toBe(true);
    expect(grants('learnTechnique', 'tho_nap_hoan_quyen')).toBe(true);
    expect(grants('setFlags', 'trung_doc')).toBe(true);
    // The consumers of the flags exist, and the cures clear them.
    const uses = (flag: string) => content.events.some((e) => (e.conditions.flagsAll ?? []).includes(flag));
    for (const f of ['hoai_bich', 'trung_doc', 'co_tan_quyen', 'tan_quyen_manh_moi']) expect(uses(f)).toBe(true);
    expect(content.events.some((e) => (e.conditions.itemsAll ?? []).includes('phi_kiem_co_chu'))).toBe(true);
  });
});

describe('high-tier items and boosted once-per-life items', () => {
  const rich: GameState = {
    ...adult,
    cult: { ...adult.cult, realm: 'kim_dan', stage: 0, progress: 0, lifespan: 500, heartDemon: 12 },
    stats: { ...adult.stats, health: 20 },
  };
  const use = (s: GameState, id: string) => consumeItem({ ...s, inventory: { ...s.inventory, [id]: 1 } }, content, id).state;

  it('once-per-life items give the boosted amounts', () => {
    expect(use(rich, 'dien_tho_dan').cult.lifespan).toBe(520);
    expect(use(rich, 'linh_chi_ngan_nam').cult.lifespan).toBe(515);
    expect(use(rich, 'khai_tri_dan').stats.intellect).toBe(Math.min(100, rich.stats.intellect + 8));
    expect(use(rich, 'ngo_dao_co_thu_la').aptitudes.comprehension).toBe(Math.min(100, rich.aptitudes.comprehension + 10));
  });

  it('new use hooks: heart demon, lifespan share, tribulation guard', () => {
    expect(use(rich, 'dinh_tam_dan').cult.heartDemon).toBe(2);
    expect(use(rich, 'tue_nguyet_dan').cult.lifespan).toBe(575);
    expect(use(rich, 'hoi_xuan_tao_hoa_dan').stats.health).toBe(100);
    const guarded = use(rich, 'ho_mach_dan');
    expect(guarded.flags.ho_mach_dan).toBe(true);
    const plain = tribulationPreview(rich, content, 'nguyen_anh')!;
    expect(tribulationPreview(guarded, content, 'nguyen_anh')!.reducePct).toBe(plain.reducePct + 20);
  });

  it('breakthrough pills for Nguyên Anh and Hóa Thần exist', () => {
    const find = (realm: string) => content.items.filter((i) => i.breakthrough?.realm === realm && i.breakthrough.major).map((i) => i.id);
    expect(find('kim_dan')).toContain('ngung_anh_dan');
    expect(find('nguyen_anh')).toContain('hoa_than_dan');
  });
});

describe('thức tỉnh thể chất', () => {
  it('events awaken real bodies and every body is reachable by dev mode', () => {
    const ids = content.cultivation.roots.bodies.map((b) => b.id);
    const awaken = content.events.flatMap((e) => effectsOf(e)).map((fx) => fx.awakenBody).filter(Boolean) as string[];
    expect(awaken.length).toBeGreaterThanOrEqual(8);
    for (const b of awaken) expect(ids).toContain(b);
    for (const id of ids) {
      const s = devAwakenBody(adult, content, id);
      expect(s.cult.bodyId).toBe(id);
    }
  });
  it('never gives a body to a rootless mortal', () => {
    const rootless = { ...adult, cult: { ...adult.cult, root: { grade: 'none', elements: [] } } } as GameState;
    expect(awakenBody(rootless, content, 'cuu_duong_the').state.cult.bodyId).toBeNull();
    const rooted = { ...adult, cult: { ...adult.cult, root: { grade: 'don', elements: ['kim'] } } } as GameState;
    expect(awakenBody(rooted, content, 'ban_thach_thanh_cot').state.cult.bodyId).toBe('ban_thach_thanh_cot');
  });
});
