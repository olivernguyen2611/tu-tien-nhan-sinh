import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc, npcById, npcCalls } from '../src/systems/npcs';
import { doNpcAct, npcActViews } from '../src/systems/npcActs';
import { Rng } from '../src/core/rng';
import { meets } from '../src/systems/events/conditions';

const content = loadContent();

function setup(affinity: number, over: { realm?: string; grudge?: number } = {}, seed = 'acts'): { s: GameState; id: string } {
  const base = createLife({ seed }, content);
  const s0: GameState = { ...base, character: { ...base.character, age: 25 }, money: { silver: 200, spiritStones: 0 }, log: [...base.log, { age: 25, lines: [] }] };
  const met = createNpc(s0, content, { role: 'bằng hữu', age: 28, affinity, gender: 'nam', root: false, realm: (over.realm ?? 'pham_nhan') as never });
  const s = { ...met.state, npcs: met.state.npcs.map((n) => (n.id === met.id ? { ...n, grudge: over.grudge ?? 0 } : n)) };
  return { s, id: met.id };
}

describe('9.0.3 việc làm theo mức thân', () => {
  it('a stranger-ish acquaintance gets few acts, a close friend gets many', () => {
    const a = setup(45), b = setup(85);
    const na = npcActViews(a.s, content, npcById(a.s, a.id)!).length;
    const nb = npcActViews(b.s, content, npcById(b.s, b.id)!).length;
    expect(na).toBeLessThan(nb);
    expect(nb).toBeGreaterThanOrEqual(6);
  });

  it('a person with a grudge gets enemy acts only', () => {
    const { s, id } = setup(10, { grudge: 50 });
    const ids = npcActViews(s, content, npcById(s, id)!).map((v) => v.id);
    expect(ids).toEqual(expect.arrayContaining(['do_la', 'hoa_giai', 'doi_dau']));
    expect(ids).not.toContain('ruou');
  });

  it('cultivating together needs two cultivators', () => {
    const mortal = setup(70);
    expect(npcActViews(mortal.s, content, npcById(mortal.s, mortal.id)!).some((v) => v.id === 'cung_tu_luyen')).toBe(false);
  });

  it('an act is once a year and raises affinity, costs silver', () => {
    const { s, id } = setup(70);
    const r = doNpcAct(s, content, id, 'ruou')!;
    expect(npcById(r.state, id)!.affinity).toBeGreaterThan(70);
    expect(r.state.money.silver).toBe(195);
    expect(doNpcAct(r.state, content, id, 'ruou')).toBeNull();
  });

  it('a close friend sometimes calls with a shared event, and its conditions follow closeness', () => {
    const { s, id } = setup(90);
    let called = 0;
    for (let i = 0; i < 200; i++) if (npcCalls(s, content, new Rng(`b${i}`)).some((c) => c.trigger === 'bond' && c.id === id)) called++;
    expect(called).toBeGreaterThan(0);
    const bond = content.events.filter((e) => e.npcTrigger === 'bond');
    expect(bond.length).toBeGreaterThanOrEqual(8);
    const withNpc = { ...s, events: { ...s.events, npc: id } };
    const eligible = (aff: number) => bond.filter((e) => meets({ ...withNpc, npcs: withNpc.npcs.map((n) => (n.id === id ? { ...n, affinity: aff } : n)) }, e.conditions, content)).length;
    expect(eligible(95)).toBeGreaterThan(0);
    expect(eligible(95)).not.toBe(eligible(62));
  });
});
