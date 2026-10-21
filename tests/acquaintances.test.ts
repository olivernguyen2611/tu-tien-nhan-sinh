import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { acquaintanceYear, markVisit, memoryText, pickVisit, relationGroup, remember } from '../src/systems/acquaintances';
import { meets } from '../src/systems/events/conditions';
import { createNpc, kindFor } from '../src/systems/npcs';
import { simulateLife } from '../src/systems/simulate';

const content = loadContent();
const at = (s: GameState, age: number): GameState => ({ ...s, character: { ...s.character, age } });
const adult = (seed: string) => at({ ...createLife({ seed }, content), money: { silver: 200, spiritStones: 0 } }, 30);

describe('Người quen sâu hơn (9.6)', () => {
  it('a child gets a neighbour and a childhood friend, and the life’s dice stay where they were', () => {
    const s = at(createLife({ seed: 'acq-1' }, content), content.balance.npcs.childhoodAge);
    const next = acquaintanceYear(s, content);
    expect(next.npcs.map((n) => n.kind)).toEqual(expect.arrayContaining(['hang_xom', 'ban_huu']));
    expect(next.rng).toEqual(s.rng);
  });

  it('role texts map to kinds; love, sect and enmity choose the group first', () => {
    expect(kindFor(content, 'huynh đệ kết nghĩa')).toBe('huynh_de');
    expect(kindFor(content, 'một người lạ')).toBe(content.relations!.defaultKind);
    const met = createNpc(adult('acq-2'), content, { role: 'bằng hữu' });
    const n = met.state.npcs.find((x) => x.id === met.id)!;
    expect(relationGroup(met.state, content, n)).toBe('ban_be');
    expect(relationGroup(met.state, content, { ...n, grudge: 90 })).toBe('thu_dich');
    expect(relationGroup({ ...met.state, romance: { ...met.state.romance, partner: n.id } }, content, n)).toBe('tinh_duyen');
  });

  it('kỷ niệm keep the last few and come back in texts', () => {
    const met = createNpc(adult('acq-3'), content, { role: 'bằng hữu' });
    let s = met.state;
    for (let i = 0; i < 7; i++) s = remember(at(s, 20 + i), content, met.id, `Việc thứ ${i}`);
    const n = s.npcs.find((x) => x.id === met.id)!;
    expect(n.memories!.length).toBe(content.balance.npcs.memories);
    expect(memoryText(at(s, 40), n)).toContain('việc thứ 6');
    expect(meets({ ...s, events: { ...s.events, npc: met.id } }, { npc: { minMemories: 5, kinds: ['ban_huu'] } }, content)).toBe(true);
  });

  it('a visit never brings the same matter from the same person twice', () => {
    const met = createNpc(adult('acq-4'), content, { role: 'bằng hữu', affinity: 60 });
    let s = met.state;
    const seen = new Set<string>();
    for (let age = 20; age < 200; age++) {
      const v = pickVisit(at(s, age), content, () => true);
      if (!v) continue;
      expect(seen.has(`${v.npc}:${v.event}`)).toBe(false);
      seen.add(`${v.npc}:${v.event}`);
      s = { ...markVisit(at(s, age), v.npc, v.event), events: { ...s.events, history: { ...s.events.history, [v.event]: age } } };
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('a 60-year life has people coming on their own at least 8 times on average', () => {
    const counts: number[] = [];
    for (let i = 0; i < 12; i++) {
      const r = simulateLife(content, `acq-sim-${i}`, { profile: 'player', maxAge: 60 });
      if (r.age < 60) continue;
      counts.push(Object.entries(r.seen).filter(([id]) => id.startsWith('vs_')).reduce((a, [, c]) => a + c, 0));
    }
    expect(counts.reduce((a, b) => a + b, 0) / counts.length).toBeGreaterThanOrEqual(8);
  }, 60_000);
});
