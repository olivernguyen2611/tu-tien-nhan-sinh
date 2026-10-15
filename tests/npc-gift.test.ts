import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc, npcById } from '../src/systems/npcs';
import { giftBlocked, giftNpc, giftOptions } from '../src/systems/npcGift';

const content = loadContent();

function setup(nature: string, over: { affinity?: number; realm?: string } = {}, seed = 'gift'): { s: GameState; id: string } {
  const base = createLife({ seed }, content);
  const s0: GameState = { ...base, character: { ...base.character, age: 25 }, inventory: { tu_khi_dan: 2, linh_chi_ngan_nam: 1 }, log: [...base.log, { age: 25, lines: [] }] };
  const met = createNpc(s0, content, { role: 'bằng hữu', age: 30, affinity: over.affinity ?? 60, gender: 'nam', root: true, realm: (over.realm ?? 'luyen_khi') as never });
  const s = { ...met.state, npcs: met.state.npcs.map((n) => (n.id === met.id ? { ...n, nature, natureKnown: true } : n)) };
  return { s, id: met.id };
}

describe('9.0.2 tặng vật phẩm cho người quen', () => {
  it('lists the bag grouped by kind', () => {
    const { s, id } = setup('tham_lam');
    const opts = giftOptions(s, content, npcById(s, id)!);
    expect(opts.length).toBe(2);
    expect(opts.every((o) => o.group)).toBe(true);
  });

  it('takes exactly one item from the bag and once a year', () => {
    const { s, id } = setup('trung_hau');
    const r = giftNpc(s, content, id, 'tu_khi_dan')!;
    expect(r.state.inventory.tu_khi_dan).toBe(1);
    expect(giftBlocked(r.state, npcById(r.state, id)!)).not.toBeNull();
    expect(giftNpc(r.state, content, id, 'tu_khi_dan')).toBeNull();
  });

  it('the same item pleases two temperaments differently', () => {
    // pill: tham_lam ×1.3, hen_nhat ×0.8 (affinity above the rejection line so no refusal)
    const a = setup('tham_lam', { affinity: 60 });
    const b = setup('hen_nhat', { affinity: 60 });
    const ra = giftNpc(a.s, content, a.id, 'tu_khi_dan')!.state;
    const rb = giftNpc(b.s, content, b.id, 'tu_khi_dan')!.state;
    expect(npcById(ra, a.id)!.affinity).toBeGreaterThan(npcById(rb, b.id)!.affinity);
  });

  it('a cultivator takes a pill to heart: cultivation progress rises', () => {
    const { s, id } = setup('trung_hau');
    const before = npcById(s, id)!.progress;
    const r = giftNpc(s, content, id, 'tu_khi_dan')!.state;
    expect(npcById(r, id)!.progress).toBeGreaterThan(before);
  });

  it('a mortal only keeps it: no progress, weaker bond', () => {
    const c = setup('trung_hau', { realm: 'pham_nhan' });
    const m = giftNpc(c.s, content, c.id, 'tu_khi_dan')!.state;
    expect(npcById(m, c.id)!.progress).toBe(npcById(c.s, c.id)!.progress);
  });

  it('a cold NPC may refuse, and then the item stays', () => {
    let refused = 0;
    for (let i = 0; i < 40; i++) {
      const { s, id } = setup('trung_hau', { affinity: 5 }, `cold${i}`);
      const r = giftNpc(s, content, id, 'tu_khi_dan')!.state;
      if (r.inventory.tu_khi_dan === 2) refused++;
    }
    expect(refused).toBeGreaterThan(0);
    expect(refused).toBeLessThan(40);
  });
});
