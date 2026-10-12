import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife, fillTemplate } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, resolveChoice, rollYearEvent } from '../src/systems/events/engine';
import { createNpc, isMasked, killNpc, npcById, npcLabel } from '../src/systems/npcs';
import { Rng } from '../src/core/rng';

const content = loadContent();

function adult(age = 30): GameState {
  const b = createLife({ seed: 'npcev' }, content);
  return { ...b, character: { ...b.character, age }, log: [...b.log, { age, lines: [] }], events: { pending: null, history: {}, followUps: [], npc: null }, money: { silver: 200, spiritStones: 0 } };
}

/** Roll years until an NPC visit comes (or give up). */
function visit(s: GameState, tries = 200): GameState | null {
  for (let i = 0; i < tries; i++) {
    const r = rollYearEvent({ ...s, rng: new Rng(`v${i}`).getState() }, content);
    if (r.events.npc) return r;
  }
  return null;
}

describe('tính cách NPC và sự kiện ân oán (task 3.4, npcs.md đã duyệt)', () => {
  it('ships the approved 8 surfaces, 8 natures and 6 goals', () => {
    expect(content.npcTraits.surface).toHaveLength(8);
    expect(content.npcTraits.nature).toHaveLength(8);
    expect(content.npcTraits.goals).toHaveLength(6);
    const greedy = content.npcTraits.nature.find((n) => n.id === 'tham_lam')!;
    expect(greedy.masks).toEqual(['on_hoa', 'khiem_cung', 'hao_sang']);
    expect(content.npcTraits.nature.find((n) => n.id === 'thu_dai')!.grudgeFade).toBe(0);
  });

  it('every new NPC has a surface, a nature and a goal; Chân thành is known at once', () => {
    let s = adult();
    for (let i = 0; i < 30; i++) s = createNpc(s, content, { role: 'bằng hữu' }).state;
    for (const n of s.npcs) {
      expect(n.surface && n.nature && n.goal).toBeTruthy();
      if (n.nature === 'chan_thanh') expect(n.natureKnown).toBe(true);
      const l = npcLabel(content, n);
      expect(l.surface).toBeTruthy();
    }
  });

  it('a grudge brings the old acquaintance back for a real fight (E1)', () => {
    const m = createNpc(adult(), content, { role: 'kẻ thù', grudge: 80, root: true, realm: 'luyen_khi' });
    const s = { ...m.state, npcs: m.state.npcs.map((n) => ({ ...n, nature: 'thu_dai' })) };
    const r = visit(s)!;
    expect(r.events.pending).toBe('co_nhan_tim_toi');
    expect(fillTemplate(findEvent(content, 'co_nhan_tim_toi')!.text, r, content)).toContain(npcById(r, m.id)!.name);
    const fought = resolveChoice(r, content, 0).state;
    expect(fought.combat?.foe.name).toBe(npcById(r, m.id)!.name);
    expect(fought.combat?.npcId).toBe(m.id);
  });

  it('a favor is repaid (E2) and an heir comes for blood (E3)', () => {
    const m = createNpc(adult(), content, { role: 'ân nhân', favor: 80 });
    const r = visit(m.state)!;
    expect(r.events.pending).toBe('bao_an');
    const paid = resolveChoice(r, content, 0).state;
    expect(paid.money.silver).toBe(240);
    expect(npcById(paid, m.id)!.favor).toBe(50);

    const enemy = createNpc(adult(), content, { role: 'kẻ thù', grudge: 60 });
    const killed = killNpc(enemy.state, content, enemy.id);
    const heir = killed.npcs.find((n) => n.heirOf === enemy.id)!;
    const s = { ...killed, npcs: killed.npcs.map((n) => (n.id === heir.id ? { ...n, nature: 'thu_dai' } : n)) };
    const h = visit(s)!;
    expect(h.events.pending).toBe('hau_due_bao_thu');
    expect(fillTemplate(findEvent(content, 'hau_due_bao_thu')!.text, h, content)).toContain(npcById(killed, enemy.id)!.name);
  });

  it('a masked friend shows their true face (E4), named in the text', () => {
    const m = createNpc(adult(), content, { role: 'bằng hữu' });
    const s = { ...m.state, npcs: m.state.npcs.map((n) => ({ ...n, surface: 'on_hoa', nature: 'tham_lam', natureKnown: false })) };
    expect(isMasked(content, s.npcs[0])).toBe(true);
    const r = visit(s, 400)!;
    expect(r.events.pending).toBe('bo_mat_that');
    expect(fillTemplate(findEvent(content, 'bo_mat_that')!.text, r, content)).toContain('ôn hòa');
    const after = resolveChoice(r, content, 1).state;
    expect(npcById(after, m.id)!.natureKnown).toBe(true);
    expect(isMasked(content, npcById(after, m.id)!)).toBe(false);
  });
});
