import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { devGiveAllItems, devGiveAllScrolls, devLearnTechnique } from '../src/systems/dev';

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
    const unreachable = content.items.filter((i) => !grants('addItems', i.id) && !recipe(i.id) && shop(i.id)?.forSale === false && !['phe_dan', 'huyet_khi_hoan'].includes(i.id));
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
