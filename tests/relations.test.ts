import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, Relative } from '../src/core/types';
import { breakOath, doNpcAct, npcActViews } from '../src/systems/npcActs';
import { createNpc, npcById, npcInfo } from '../src/systems/npcs';
import { ageFamily, availableActions, childTemperLabel, performFamilyAction } from '../src/systems/relationships';

const content = loadContent();

function adult(patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'rel' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age: 30 }, money: { ...b.money, silver: 200 }, stats: { ...b.stats, charm: 90, intellect: 90 }, log: [...b.log, { age: 30, lines: [] }], ...patch };
}
const friend = (s: GameState, affinity: number) => createNpc(s, content, { role: 'bằng hữu', affinity, root: false });
const ids = (s: GameState, id: string) => npcActViews(s, content, npcById(s, id)!).map((v) => v.id);

describe('10.5 quan hệ kiểu BitLife', () => {
  it('a close friend has a long menu; debts open đòi nợ / trả nợ', () => {
    const m = friend(adult(), 90);
    const menu = ids(m.state, m.id);
    for (const id of ['khen', 'che', 'ke_chuyen_cuoi', 'cai_nhau', 'cho_tien', 'muon_tien', 'cho_vay', 'di_tuu_lau', 'di_hoi', 'ket_nghia', 'tuyet_giao']) expect(menu, id).toContain(id);
    expect(menu).not.toContain('doi_no');
    const lent = doNpcAct(m.state, content, m.id, 'cho_vay')!.state;
    expect(npcById(lent, m.id)!.owed).toBe(20);
    expect(ids({ ...lent, character: { ...lent.character, age: 31 } }, m.id)).toContain('doi_no');
    expect(npcInfo(lent, content, npcById(lent, m.id)!).rows.some((r) => r.label === 'Nợ nần')).toBe(true);
  });

  it('kết nghĩa is an oath; cutting ties breaks it with a cost', () => {
    const m = friend(adult(), 95);
    let s = { ...m.state, npcs: m.state.npcs.map((n) => (n.id === m.id ? { ...n, sworn: 30, kind: 'huynh_de' } : n)) };
    const before = s.aptitudes.daoHeart;
    const cut = doNpcAct(s, content, m.id, 'tuyet_giao')!.state;
    expect(npcById(cut, m.id)!.cut).toBe(true);
    expect(npcById(cut, m.id)!.sworn).toBeUndefined();
    expect(cut.aptitudes.daoHeart).toBeLessThan(before);
    expect(cut.flags.boi_uoc).toBe(true);
    // A cut tie shows the enemy menu.
    expect(ids({ ...cut, character: { ...cut.character, age: 31 } }, m.id)).toContain('hoa_giai');
    s = breakOath(m.state, content, m.id);
    expect(s).toBe(m.state);
  });

  it('children: upbringing shapes the temper they grow into, shown and carried', () => {
    const kid: Relative = { id: 'child_0', role: 'child', gender: 'nam', name: 'Lâm Tiểu Hổ', age: 6, alive: true, lifespan: 70, affinity: 60, lastActions: {} };
    let s = adult({ family: [kid] });
    const menu = availableActions(s, content, kid).map((a) => a.id);
    expect(menu).toContain('danh_don');
    expect(menu).not.toContain('ga_cuoi_con');
    for (let i = 0; i < 3; i++) {
      s = performFamilyAction(s, content, 'child_0', 'danh_don').state;
      s = { ...s, character: { ...s.character, age: s.character.age + 1 } };
    }
    expect(s.family[0].rearing).toBe(-9);
    s = { ...s, family: s.family.map((r) => ({ ...r, age: content.balance.kinship!.temperAge - 1 })) };
    s = ageFamily(s, content);
    expect(s.family[0].temper).toBe('ngang_buong');
    expect(childTemperLabel(content, s.family[0])).toContain('Ngang bướng');
    const grown = { ...s, family: s.family.map((r) => ({ ...r, age: 20 })) };
    const wed = performFamilyAction(grown, content, 'child_0', 'ga_cuoi_con').state;
    expect(wed.family[0].married).toBe(true);
    expect(availableActions(wed, content, wed.family[0]).map((a) => a.id)).not.toContain('ga_cuoi_con');
  });
});
