import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc, npcById } from '../src/systems/npcs';
import { applyRomance, romanceAction, romanceViews } from '../src/systems/romance';

const content = loadContent();

/** A player who courted an NPC and then broke it off (9.0.1). */
function withEx(affinity: number, seed = 'ex'): { s: GameState; id: string } {
  const base = createLife({ seed }, content);
  const s0: GameState = { ...base, character: { ...base.character, age: 25, gender: 'nam' }, stats: { ...base.stats, charm: 80 }, money: { silver: 500, spiritStones: 500 }, log: [...base.log, { age: 25, lines: [] }] };
  const met = createNpc(s0, content, { role: 'bằng hữu', age: 24, affinity, gender: 'nu', root: false, realm: 'pham_nhan' });
  let s = applyRomance(met.state, content, met.id, { pursue: true, couple: true });
  s = applyRomance(s, content, met.id, { lose: true });
  return { s, id: met.id };
}

describe('9.0.1 người cũ vẫn tương tác được', () => {
  it('has at least four actions after a break-up', () => {
    const { s, id } = withEx(60);
    expect(s.romance.exes).toContain(id);
    expect(romanceViews(s, content, id).map((v) => v.action)).toEqual(['amends', 'mend', 'rekindle', 'cutOff']);
  });

  it('rekindle is closed while affinity is low, open once it is high', () => {
    const low = withEx(10);
    expect(romanceViews(low.s, content, low.id).find((v) => v.action === 'rekindle')!.blocked).not.toBeNull();
    const high = withEx(80);
    expect(romanceViews(high.s, content, high.id).find((v) => v.action === 'rekindle')!.blocked).toBeNull();
  });

  it('can be rekindled in some seeds', () => {
    let ok = 0;
    for (let i = 0; i < 40; i++) {
      const { s, id } = withEx(90, `rk${i}`);
      const r = romanceAction(s, content, id, 'rekindle').state;
      if (r.romance.lover === id && r.romance.couple) { ok++; expect(r.romance.exes).not.toContain(id); }
    }
    expect(ok).toBeGreaterThan(0);
    expect(ok).toBeLessThan(40);
  });

  it('amends raises affinity and charges the gift cost', () => {
    const { s, id } = withEx(60);
    const r = romanceAction(s, content, id, 'amends').state;
    expect(npcById(r, id)!.affinity).toBeGreaterThan(60);
    expect(r.money.silver).toBeLessThan(s.money.silver);
  });

  it('cutting off ends it for good: no actions, cannot be courted again', () => {
    const { s, id } = withEx(60);
    const r = romanceAction(s, content, id, 'cutOff').state;
    expect(r.romance.exes).not.toContain(id);
    expect(romanceViews(r, content, id)).toEqual([]);
  });
});
