import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc } from '../src/systems/npcs';
import { ownSectYear } from '../src/systems/ownSect';
import { recruitChance, recruitNpc, recruitViews, sectMembers } from '../src/systems/sectRecruit';

const content = loadContent();

function setup(affinity = 80, seed = 'recruit'): { s: GameState; id: string } {
  const b = createLife({ seed }, content);
  const base: GameState = {
    ...b,
    character: { ...b.character, age: 60 },
    log: [...b.log, { age: 60, lines: [] }],
    ownSect: { name: 'Thanh Tiêu Tông', lineage: 'tien', rules: [], founded: 50, members: 10, treasury: 500, buildings: {} },
  };
  const made = createNpc(base, content, { role: 'Bằng hữu', root: true, age: 40, affinity });
  return { s: made.state, id: made.id };
}

describe('chiêu mộ người quen (task 5c.9)', () => {
  it('lists only acquaintances with enough affinity as invitable', () => {
    const { s, id } = setup(80);
    expect(recruitViews(s, content).find((v) => v.npc.id === id)!.blocked).toBeNull();
    const low = setup(20);
    expect(recruitViews(low.s, content).find((v) => v.npc.id === low.id)!.blocked).toMatch(/thiện cảm/);
  });

  it('chance rises with affinity and falls with grudge', () => {
    const { s, id } = setup(80);
    const n = s.npcs.find((x) => x.id === id)!;
    expect(recruitChance(content, n)).toBeGreaterThan(recruitChance(content, { ...n, affinity: 60 }));
    expect(recruitChance(content, { ...n, grudge: 40 })).toBeLessThan(recruitChance(content, n));
  });

  it('an invitation costs the gift, is once a year and changes happiness either way', () => {
    const { s, id } = setup(80);
    const r = recruitNpc(s, content, id)!;
    expect(r.state.ownSect!.treasury).toBe(500 - content.balance.founding.recruit.giftCost);
    expect(r.state.stats.happiness).not.toBe(s.stats.happiness);
    expect(r.state.npcs.find((n) => n.id === id)!.recruitTried).toBe(60);
    expect(recruitNpc(r.state, content, id)).toBeNull();
    expect(r.state.ownSect!.members).toBe(10 + (r.joined ? 1 : 0));
    expect(sectMembers(r.state).length).toBe(r.joined ? 1 : 0);
  });

  it('some seeds join, and a member pays tithe into the treasury', () => {
    let joined: GameState | null = null;
    for (let i = 0; i < 40 && !joined; i++) {
      const { s, id } = setup(95, `recruit${i}`);
      const r = recruitNpc(s, content, id)!;
      if (r.joined) joined = r.state;
    }
    expect(joined).toBeTruthy();
    expect(recruitViews(joined!, content).length).toBe(0);
    const year = ownSectYear(joined!, content);
    expect(year.ownSect!.treasury).toBeGreaterThan(0);
  });
});
