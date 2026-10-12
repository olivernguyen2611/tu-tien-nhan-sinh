import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState, Npc, Relative } from '../src/core/types';
import { bondViews, doBond, heirInsightBonus } from '../src/systems/familyBond';
import { continueAsHeir } from '../src/systems/heir';
import { devResetBond } from '../src/systems/dev';
import { migrate, makeSave } from '../src/systems/save';

const content = loadContent();

const kid = (patch: Partial<Relative> = {}): Relative => ({
  id: 'child_0_30', role: 'child', gender: 'nam', name: 'Cố Thiếu Khanh', age: 14, alive: true, lifespan: 80, affinity: 50, lastActions: {},
  root: { grade: 'none', elements: [] }, ...patch,
});

function parent(patch: Partial<GameState> = {}, child: Partial<Relative> = {}): GameState {
  const b = createLife({ seed: 'family-bond' }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    aptitudes: { ...b.aptitudes, comprehension: 70 },
    cult: { ...b.cult, realm: 'luyen_khi', learned: ['dan_khi_quyet'], technique: 'dan_khi_quyet' },
    family: [kid(child)],
    log: [...b.log, { age: 40, lines: [] }],
    ...patch,
  };
}
const target = { kind: 'child' as const, id: 'child_0_30' };
const view = (s: GameState, id: string) => bondViews(s, content)[0].actions.find((a) => a.id === id)!;

describe('Gia đạo: children', () => {
  it('lists children with four actions, once a year each', () => {
    const s = parent();
    expect(bondViews(s, content)[0].actions.map((a) => a.id)).toEqual(['spar', 'discuss', 'teach', 'gift']);
    const r = doBond(s, content, target, 'spar');
    expect(r.text).not.toBe('');
    expect(r.state.family[0].affinity).toBeGreaterThan(50);
    expect(r.state.family[0].insight).toBeGreaterThan(0);
    expect(view(r.state, 'spar').blocked).toMatch(/Năm nay/);
    expect(doBond(r.state, content, target, 'spar').text).toBe('');
    // Every action changes the player's stats a little.
    expect(r.state.stats).not.toEqual(s.stats);
    // Another action the same year is fine; devResetBond frees the first again.
    expect(view(r.state, 'discuss').blocked).toBeNull();
    expect(view(devResetBond(r.state), 'spar').blocked).toBeNull();
  });

  it('a child too young is blocked; discussion needs Ngộ tính', () => {
    expect(view(parent({}, { age: 5 }), 'spar').blocked).toMatch(/nhỏ/);
    const dull = parent({ aptitudes: { ...parent().aptitudes, comprehension: 20 } });
    expect(view(dull, 'discuss').blocked).toMatch(/Ngộ tính/);
  });

  it('teaching needs a technique and a child who can cultivate; it is remembered', () => {
    expect(view(parent(), 'teach').blocked).toMatch(/linh căn/);
    const rooted = parent({}, { root: { grade: 'song', elements: ['kim', 'hoa'] } });
    expect(view(rooted, 'teach').blocked).toBeNull();
    expect(view(rooted, 'teach').options!.map((o) => o.id)).toEqual(['dan_khi_quyet']);
    expect(doBond(rooted, content, target, 'teach', 'ngu_hanh_luan_chuyen_kinh').text).toBe(''); // not one you know
    const r = doBond(rooted, content, target, 'teach', 'dan_khi_quyet');
    expect(r.state.family[0].technique).toBe('dan_khi_quyet');
    expect(doBond({ ...rooted, cult: { ...rooted.cult, learned: [] } }, content, target, 'teach', 'dan_khi_quyet').text).toBe('');
  });

  it('gifting spends the item and warms the child', () => {
    const s = parent({ inventory: { hoi_xuan_dan: 2 } });
    const r = doBond(s, content, target, 'gift', 'hoi_xuan_dan');
    expect(r.state.inventory.hoi_xuan_dan).toBe(1);
    expect(r.state.family[0].affinity).toBeGreaterThan(50);
    expect(doBond(parent(), content, target, 'gift', 'hoi_xuan_dan').text).toBe(''); // none carried
    // An ordinary item never opens a root.
    expect(r.state.family[0].root!.grade).toBe('none');
  });

  it('a thousand-year item may open a hậu thiên linh căn for a rootless child, at most maxTries times', () => {
    const cfg = content.balance.familyBond.rootGift;
    let wins = 0;
    for (let i = 0; i < 60; i++) {
      const s = parent({ inventory: { linh_chi_ngan_nam: 1 }, rng: new Rng(`gift${i}`).getState() });
      const r = doBond(s, content, target, 'gift', 'linh_chi_ngan_nam');
      const c = r.state.family[0];
      expect(c.rootTries).toBe(1);
      if (c.acquired) {
        wins++;
        expect(['tu', 'ngu']).toContain(c.root!.grade);
        expect(c.root!.elements.length).toBe(content.balance.roots.elementCount[c.root!.grade]);
        expect(r.tone).toBe('rare');
      } else {
        expect(c.root!.grade).toBe('none');
        expect(r.tone).toBe('bad');
      }
    }
    expect(wins).toBeGreaterThan(60 * (cfg.items.linh_chi_ngan_nam - 0.25));
    expect(wins).toBeLessThan(60);
    // Past the tries, the item is only a gift.
    const spent = parent({ inventory: { linh_chi_ngan_nam: 1 } }, { rootTries: cfg.maxTries });
    expect(doBond(spent, content, target, 'gift', 'linh_chi_ngan_nam').state.family[0].rootTries).toBe(cfg.maxTries);
  });

  it('a child who already has a root, or a special body, never gets an acquired one', () => {
    const rooted = parent({ inventory: { linh_chi_ngan_nam: 1 } }, { root: { grade: 'song', elements: ['kim', 'hoa'] } });
    const r = doBond(rooted, content, target, 'gift', 'linh_chi_ngan_nam');
    expect(r.state.family[0].root).toEqual({ grade: 'song', elements: ['kim', 'hoa'] });
    expect(r.state.family[0].acquired).toBeFalsy();
  });

  it('the gift list names the chance and groups items by kind', () => {
    const s = parent({ inventory: { linh_chi_ngan_nam: 1, hoi_xuan_dan: 1 } });
    const opts = view(s, 'gift').options!;
    expect(opts.find((o) => o.id === 'linh_chi_ngan_nam')!.hint).toMatch(/linh căn/);
    expect(new Set(opts.map((o) => o.group)).size).toBe(2);
  });
});

describe('Gia đạo: the đạo lữ', () => {
  const spouse = (patch: Partial<Npc> = {}): Npc => ({
    id: 'npc_1', name: 'Liễu Thanh Hà', gender: 'nu', age: 38, lifespan: 90, alive: true, role: 'đạo lữ', root: true, aptitude: 50,
    realm: 'luyen_khi', stage: 1, progress: 10, surface: null, nature: null, natureKnown: false, goal: null, affinity: 60, favor: 0, grudge: 0, heirOf: null, ...patch,
  });
  const married = (npc = spouse(), patch: Partial<GameState> = {}): GameState => {
    const s = parent(patch);
    return { ...s, family: [], npcs: [npc], romance: { ...s.romance, partner: npc.id, couple: true } };
  };
  const tp = { kind: 'partner' as const };

  it('a cultivating spouse gains progress and warmth; once a year per action', () => {
    const s = married();
    const r = doBond(s, content, tp, 'discuss');
    const n = r.state.npcs[0];
    expect(n.progress).toBeGreaterThan(10);
    expect(n.affinity).toBeGreaterThan(60);
    expect(doBond(r.state, content, tp, 'discuss').text).toBe('');
    expect(bondViews(r.state, content)[0].label).toBe('Phu nhân');
  });

  it('a mortal spouse cannot be taught but a thousand-year item may open a root', () => {
    const s = married(spouse({ root: false, realm: 'pham_nhan' }), { inventory: { ha_thu_o_ngan_nam: 1 } });
    expect(bondViews(s, content)[0].actions.find((a) => a.id === 'teach')!.blocked).toMatch(/Phàm nhân/);
    let opened = 0;
    for (let i = 0; i < 40; i++) {
      const r = doBond({ ...s, rng: new Rng(`sp${i}`).getState() }, content, tp, 'gift', 'ha_thu_o_ngan_nam');
      if (r.state.npcs[0].root) { opened++; expect(r.state.npcs[0].acquired).toBe(true); }
    }
    expect(opened).toBeGreaterThan(10);
    expect(opened).toBeLessThan(40);
  });
});

describe('Gia đạo: heir and old saves', () => {
  it('a child who was taught carries the technique and some Ngộ tính into the next life', () => {
    const c = kid({ root: { grade: 'song', elements: ['kim', 'hoa'] }, insight: 80, technique: 'tho_nap_tan_quyen', age: 20 });
    expect(heirInsightBonus(content, c)).toBe(Math.min(content.balance.familyBond.insightAptitudeMax, Math.round(80 * content.balance.familyBond.insightAptitude)));
    const dead: GameState = { ...parent({}, c), alive: false, death: { age: 70, cause: 'old_age', epitaph: 'x' } };
    const heir = continueAsHeir(dead, content, c.id);
    expect(heir.cult.technique).toBe('tho_nap_tan_quyen');
    expect(heir.log[0].lines.some((l) => l.text === content.lifeTexts.familyBond.texts.heirInsight)).toBe(true);
    const base = createLife({ seed: `${dead.seed}:heir1`, name: c.name, gender: c.gender, originId: dead.character.originId, difficulty: dead.difficulty }, content);
    expect(heir.aptitudes.comprehension).toBeGreaterThanOrEqual(base.aptitudes.comprehension);
  });

  it('an old save with children and no bond fields still loads and works', () => {
    const s = migrate(makeSave(parent(), 1)).life;
    expect(bondViews(s, content)[0].actions.every((a) => a.blocked === null || typeof a.blocked === 'string')).toBe(true);
  });
});
