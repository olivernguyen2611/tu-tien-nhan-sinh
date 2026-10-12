import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { actBlocked, doDiscipleAct, giftableItems, teachableTechniques } from '../src/systems/discipleActs';
import { recruitDisciple } from '../src/systems/disciples';
import { ageNpcs } from '../src/systems/npcs';

const content = loadContent();

function teacher(): { s: GameState; id: string } {
  const b = createLife({ seed: 'acts' }, content);
  const base: GameState = {
    ...b,
    character: { ...b.character, age: 60 },
    log: [...b.log, { age: 60, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'truc_co', stage: 1, learned: ['dan_khi_quyet'], technique: 'dan_khi_quyet', lifespan: 300 },
    inventory: { tu_khi_dan: 2, thanh_phong_kiem: 1 },
  };
  const r = recruitDisciple(base, content)!.state;
  return { s: r, id: r.npcs.find((n) => n.disciple)!.id };
}

describe('sư phụ – đồ đệ (task 5c.8)', () => {
  it('each act is once a year per disciple and changes the master\'s stats too', () => {
    const { s, id } = teacher();
    for (const act of [{ kind: 'spar' }, { kind: 'debate' }, { kind: 'technique', techniqueId: 'dan_khi_quyet' }, { kind: 'gift', itemId: 'tu_khi_dan' }] as const) {
      const r = doDiscipleAct(s, content, id, act)!;
      expect(r, act.kind).toBeTruthy();
      expect(r.state.npcs.find((n) => n.id === id)!.disciple!.acts![act.kind]).toBe(60);
      expect(doDiscipleAct(r.state, content, id, act)).toBeNull();
      const stats = JSON.stringify([r.state.stats, r.state.aptitudes]);
      expect(stats, act.kind).not.toBe(JSON.stringify([s.stats, s.aptitudes]));
    }
  });

  it('handing down a technique records it, blocks repeats and speeds the disciple', () => {
    const { s, id } = teacher();
    const npc0 = s.npcs.find((n) => n.id === id)!;
    expect(teachableTechniques(s, content, npc0).map((t) => t.id)).toContain('dan_khi_quyet');
    const r = doDiscipleAct(s, content, id, { kind: 'technique', techniqueId: 'dan_khi_quyet' })!.state;
    const npc = r.npcs.find((n) => n.id === id)!;
    expect(npc.technique).toBe('dan_khi_quyet');
    expect(actBlocked({ ...r, character: { ...r.character, age: 61 } }, content, npc, { kind: 'technique', techniqueId: 'dan_khi_quyet' })).toContain('đã học');
    const plain = ageNpcs({ ...s, npcs: s.npcs.map((n) => (n.id === id ? { ...n, progress: 0 } : n)) }, content).npcs.find((n) => n.id === id)!;
    const handed = ageNpcs({ ...r, npcs: r.npcs.map((n) => (n.id === id ? { ...n, progress: 0 } : n)) }, content).npcs.find((n) => n.id === id)!;
    expect(handed.progress).toBeGreaterThanOrEqual(plain.progress);
  });

  it('gifts use up the item and respect what is carried', () => {
    const { s, id } = teacher();
    expect(giftableItems(s, content).map((g) => g.item.id)).toContain('tu_khi_dan');
    const r = doDiscipleAct(s, content, id, { kind: 'gift', itemId: 'tu_khi_dan' })!.state;
    expect(r.inventory.tu_khi_dan).toBe(1);
    expect(doDiscipleAct(s, content, id, { kind: 'gift', itemId: 'khong_co' })).toBeNull();
  });
});
