import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState, Relative } from '../src/core/types';
import { continueAsHeir, heirOptions } from '../src/systems/heir';
import { createNpc } from '../src/systems/npcs';
import { recruitDisciple } from '../src/systems/disciples';
import { foundSect } from '../src/systems/ownSect';
import { checkDeath } from '../src/systems/time';

const content = loadContent();
const cfg = content.balance.heir;

function elder(): GameState {
  const b = createLife({ seed: 'heir-test' }, content);
  const kid = (id: string, name: string, age: number, root: Relative['root']): Relative => ({ id, role: 'child', gender: 'nam', name, age, alive: true, lifespan: 120, affinity: 70, lastActions: {}, root });
  return {
    ...b,
    character: { ...b.character, age: 90, gender: 'nam' },
    money: { silver: 100, spiritStones: 1000 },
    inventory: { hoi_xuan_dan: 2 },
    social: { karma: 50, reputation: { ...b.social.reputation, chinh: 40 } },
    family: [...b.family.map((r) => ({ ...r, alive: false })), kid('child_0', 'Lâm Tiểu Bảo', 20, { grade: 'don', elements: ['hoa'] }), kid('child_1', 'Lâm Tiểu Ngọc', 3, null)],
    log: [...b.log, { age: 90, lines: [] }],
    cult: { ...b.cult, realm: 'kim_dan', stage: 1, lifespan: 300, root: { grade: 'song', elements: ['kim', 'hoa'] }, technique: 'tang_phong_kiem_kinh', lineage: 'tien' },
  };
}

describe('chơi tiếp bằng con cháu hoặc đồ đệ (task 5.7)', () => {
  it('heirs: living children of age and disciples; nothing while alive', () => {
    const s = elder();
    expect(heirOptions(s, content)).toEqual([]);
    let dead = checkDeath(s, content, 'old_age');
    expect(heirOptions(dead, content).map((h) => h.id)).toEqual(['child_0']);
    const withDisciple = checkDeath(recruitDisciple(s, content)!.state, content, 'old_age');
    expect(heirOptions(withDisciple, content).map((h) => h.kind)).toEqual(['child', 'disciple']);
    dead = { ...dead, family: dead.family.map((r) => ({ ...r, age: r.id === 'child_1' ? cfg.minAge : r.age })) };
    expect(heirOptions(dead, content)).toHaveLength(2);
  });

  it('a child carries on: inherited root, the dead parent, siblings, money, bag, karma share, tộc phả', () => {
    const s = foundSect(elder(), content, { name: 'Lâm Gia Tông', rules: [] })!.state;
    const enemy = createNpc(s, content, { role: 'kẻ thù', grudge: 60 });
    const dead = checkDeath(enemy.state, content, 'old_age');
    const h = continueAsHeir(dead, content, 'child_0');
    expect(h.alive).toBe(true);
    expect(h.character.name).toBe('Lâm Tiểu Bảo');
    expect(h.character.age).toBe(20);
    expect(h.cult.root).toEqual({ grade: 'don', elements: ['hoa'] });
    expect(h.cult.realm).toBe('luyen_khi');
    expect(h.family.find((r) => r.role === 'father')).toMatchObject({ name: dead.character.name, alive: false });
    expect(h.family.find((r) => r.role === 'sibling')!.name).toBe('Lâm Tiểu Ngọc');
    expect(h.flags.no_father).toBe(true);
    expect(h.money.spiritStones).toBe(Math.round((1000 - content.balance.founding.cost) * cfg.inheritMoney));
    expect(h.inventory.hoi_xuan_dan).toBe(2);
    expect(h.social.karma).toBe(Math.round(50 * cfg.inheritKarma));
    expect(h.ownSect!.name).toBe('Lâm Gia Tông');
    expect(h.npcs.some((n) => n.id === enemy.id && n.grudge === 60)).toBe(true);
    expect(h.ancestry).toEqual([{ name: dead.character.name, age: 90, realm: 'Kim Đan trung kỳ', cause: 'old_age', relation: 'child' }]);
    expect(h.destiny.confirmed).toBe(true);
    expect(advanceYear(h, content).character.age).toBe(21);
  });

  it('a disciple carries on at their own realm, and the line keeps growing', () => {
    let s = recruitDisciple(elder(), content)!.state;
    const d = s.npcs.find((n) => n.disciple)!;
    s = { ...s, npcs: s.npcs.map((n) => (n.id === d.id ? { ...n, realm: 'truc_co', stage: 2, progress: 40 } : n)) };
    const h = continueAsHeir(checkDeath(s, content, 'combat'), content, d.id);
    expect(h.character.name).toBe(d.name);
    expect(h.cult).toMatchObject({ realm: 'truc_co', stage: 2, progress: 40 });
    expect((content.balance.roots.gradeSpeed[h.cult.root!.grade] ?? 0) > 0).toBe(true);
    expect(h.npcs.some((n) => n.id === d.id)).toBe(false);
    expect(h.ancestry[0].relation).toBe('disciple');
    const again = checkDeath({ ...h, family: [...h.family, { id: 'child_9', role: 'child', gender: 'nu', name: 'Tiểu Mai', age: 10, alive: true, lifespan: 70, affinity: 60, lastActions: {}, root: null }] }, content, 'old_age');
    expect(continueAsHeir(again, content, 'child_9').ancestry).toHaveLength(2);
  });
});
