import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, Relative } from '../src/core/types';
import { createNpc } from '../src/systems/npcs';
import { devPeople, devPersonCheat, personCheatsAvailable } from '../src/systems/devPeople';

const content = loadContent();

const kid = (): Relative => ({
  id: 'child_0_30', role: 'child', gender: 'nam', name: 'Cố Thiếu Khanh', age: 14, alive: true, lifespan: 80, affinity: 50, lastActions: {},
  root: { grade: 'none', elements: [] },
});

function world(): { s: GameState; npcKey: string; kidKey: string } {
  const b = createLife({ seed: 'dev-people' }, content);
  const base = { ...b, character: { ...b.character, age: 30 }, family: [kid()], log: [...b.log, { age: 30, lines: [] }] };
  const r = createNpc(base, content, { role: 'bằng hữu', name: 'Lục Thanh Vân', root: false, realm: 'pham_nhan', affinity: 50 });
  return { s: r.state, npcKey: `npc:${r.id}`, kidKey: 'rel:child_0_30' };
}

describe('Dev mode: cheat the people around the protagonist', () => {
  it('lists family and NPCs by name under two headings', () => {
    const { s } = world();
    const list = devPeople(s);
    expect(list.map((p) => p.group)).toEqual(['Gia đình', 'Người quen']);
    expect(list[0].name).toContain('Cố Thiếu Khanh');
    expect(list[1].name).toContain('Lục Thanh Vân');
  });

  it('changes an NPC: ledger, aptitude, age, life and death, root and realm', () => {
    const { s, npcKey } = world();
    const get = (st: GameState) => st.npcs[0];
    let t = devPersonCheat(s, content, npcKey, { kind: 'affinity', delta: 30 });
    expect(get(t).affinity).toBe(80);
    t = devPersonCheat(t, content, npcKey, { kind: 'favor', delta: 20 });
    t = devPersonCheat(t, content, npcKey, { kind: 'grudge', delta: 40 });
    expect([get(t).favor, get(t).grudge]).toEqual([20, 40]);
    t = devPersonCheat(t, content, npcKey, { kind: 'age', delta: 100 });
    expect(get(t).lifespan).toBeGreaterThan(get(t).age);
    t = devPersonCheat(t, content, npcKey, { kind: 'alive', on: false });
    expect(get(t).alive).toBe(false);
    t = devPersonCheat(t, content, npcKey, { kind: 'alive', on: true });
    expect(get(t).alive).toBe(true);
    t = devPersonCheat(t, content, npcKey, { kind: 'realm', realmId: 'kim_dan' });
    expect(get(t)).toMatchObject({ realm: 'kim_dan', root: true, stage: 0 });
    t = devPersonCheat(t, content, npcKey, { kind: 'stage' });
    expect(get(t).stage).toBe(1);
    t = devPersonCheat(t, content, npcKey, { kind: 'root', on: false });
    expect(get(t)).toMatchObject({ root: false, realm: 'pham_nhan' });
    expect(t.log[t.log.length - 1].lines.some((l) => l.text.startsWith('[Dev] Lục Thanh Vân'))).toBe(true);
    t = devPersonCheat(t, content, npcKey, { kind: 'remove' });
    expect(t.npcs).toHaveLength(0);
  });

  it('changes a relative, who takes fewer cheats', () => {
    const { s, kidKey } = world();
    let t = devPersonCheat(s, content, kidKey, { kind: 'affinity', delta: 60 });
    expect(t.family[0].affinity).toBe(100);
    t = devPersonCheat(t, content, kidKey, { kind: 'root', on: true });
    expect(t.family[0].root?.elements.length).toBeGreaterThan(0);
    t = devPersonCheat(t, content, kidKey, { kind: 'root', on: false });
    expect(t.family[0].root?.grade).toBe('none');
    t = devPersonCheat(t, content, kidKey, { kind: 'alive', on: false });
    expect(t.family[0].alive).toBe(false);
    expect(devPersonCheat(t, content, kidKey, { kind: 'favor', delta: 10 })).toBe(t);
    expect(devPersonCheat(t, content, kidKey, { kind: 'remove' })).toBe(t);
    expect(personCheatsAvailable(devPeople(s)[0])).not.toContain('remove');
  });

  it('does not remove the đạo lữ or a disciple, and ignores unknown people', () => {
    const { s, npcKey } = world();
    const partnered = { ...s, romance: { ...s.romance, partner: s.npcs[0].id } };
    expect(devPersonCheat(partnered, content, npcKey, { kind: 'remove' })).toBe(partnered);
    expect(devPersonCheat(s, content, 'npc:nobody', { kind: 'affinity', delta: 5 })).toBe(s);
    expect(devPersonCheat(s, content, 'zzz', { kind: 'affinity', delta: 5 })).toBe(s);
  });
});
