import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { createNpc, npcById } from '../src/systems/npcs';
import { applyRomance, romanceAction, romanceViews, romanceYear } from '../src/systems/romance';
import { eventWeight, findEvent } from '../src/systems/events/engine';

const content = loadContent();
const b = content.balance.romance;

/** A married player (age 30); realm for both. */
function married(realm = 'pham_nhan', affinity = 60, seed = 'pt'): { s: GameState; id: string } {
  const base = createLife({ seed }, content);
  const s0: GameState = {
    ...base,
    character: { ...base.character, age: 30, gender: 'nam' },
    stats: { ...base.stats, charm: 50, happiness: 50 },
    money: { silver: 500, spiritStones: 500 },
    cult: { ...base.cult, realm, progress: 10 },
    log: [...base.log, { age: 30, lines: [] }],
    events: { ...base.events, pending: null },
  };
  const r = createNpc(s0, content, { role: 'bằng hữu', age: 29, affinity: 90, gender: 'nu', root: realm !== 'pham_nhan', realm: realm === 'pham_nhan' ? undefined : realm });
  let s = applyRomance(r.state, content, r.id, { pursue: true, couple: true });
  s = romanceAction(s, content, r.id, 'wed').state;
  s = { ...s, npcs: s.npcs.map((n) => (n.id === r.id ? { ...n, affinity } : n)), romance: { ...s.romance, lastActions: {} }, stats: { ...s.stats, happiness: 50 } };
  return { s, id: r.id };
}
const nextYear = (s: GameState): GameState => ({ ...s, character: { ...s.character, age: s.character.age + 1 }, log: [...s.log, { age: s.character.age + 1, lines: [] }] });

describe('phu thê (playtest 2026-10-12)', () => {
  it('a spouse has more to do than having children', () => {
    const { s, id } = married();
    const actions = romanceViews(s, content, id).map((v) => v.action);
    expect(actions).toEqual(expect.arrayContaining(['company', 'gift', 'child', 'divorce']));
    // Song tu needs both to cultivate; Làm lành only when things are cold.
    expect(actions).not.toContain('dualCult');
    expect(actions).not.toContain('reconcile');
    const c = married('luyen_khi');
    expect(romanceViews(c.s, content, c.id).map((v) => v.action)).toContain('dualCult');
    const cold = married('pham_nhan', 20);
    expect(romanceViews(cold.s, content, cold.id).map((v) => v.action)).toContain('reconcile');
  });

  it('Bầu bạn warms the spouse and lifts the mood, once a year', () => {
    const { s, id } = married();
    const r = romanceAction(s, content, id, 'company').state;
    expect(npcById(r, id)!.affinity).toBeGreaterThan(60);
    expect(r.stats.happiness).toBe(50 + b.companyHappiness);
    expect(romanceViews(r, content, id).find((v) => v.action === 'company')!.blocked).not.toBeNull();
  });

  it('Song tu moves both cultivations forward', () => {
    const { s, id } = married('luyen_khi', 80);
    const before = npcById(s, id)!.progress;
    const r = romanceAction(s, content, id, 'dualCult').state;
    expect(r.cult.progress).toBeGreaterThan(s.cult.progress);
    expect(npcById(r, id)!.progress).toBeGreaterThan(before);
  });

  it('a neglected spouse cools; a warm home brings joy, a cold one gloom', () => {
    const { s, id } = married('pham_nhan', 60);
    const left = romanceYear(nextYear(s), content);
    expect(npcById(left, id)!.affinity).toBe(60 + b.neglectAffinity);
    const cared = romanceYear(nextYear(romanceAction(s, content, id, 'company').state), content);
    expect(npcById(cared, id)!.affinity).toBeGreaterThan(60);
    const warm = married('pham_nhan', 90);
    const w = romanceYear(nextYear(romanceAction(warm.s, content, warm.id, 'company').state), content);
    expect(w.stats.happiness).toBe(50 + b.companyHappiness + b.warmHappiness);
    const cold = married('pham_nhan', 25);
    expect(romanceYear(nextYear(cold.s), content).stats.happiness).toBeLessThan(50);
  });

  it('a spouse long ignored may walk out', () => {
    let gone = 0;
    for (let i = 0; i < 40; i++) {
      const { s } = married('pham_nhan', 5, `l${i}`);
      const r = romanceYear(nextYear({ ...s, rng: new Rng(`l${i}`).getState() }), content);
      if (!r.romance.partner) gone++;
    }
    expect(gone).toBeGreaterThan(0);
    expect(gone).toBeLessThan(40);
  });

  it('Hòa ly ends the marriage; Làm lành can mend it', () => {
    const { s, id } = married('pham_nhan', 20);
    const d = romanceAction(s, content, id, 'divorce').state;
    expect(d.romance.partner).toBeNull();
    expect(d.romance.exes).toContain(id);
    let ok = 0;
    for (let i = 0; i < 30; i++) {
      const r = romanceAction({ ...s, rng: new Rng(`r${i}`).getState() }, content, id, 'reconcile').state;
      if (npcById(r, id)!.affinity > 20) ok++;
    }
    expect(ok).toBeGreaterThan(5);
  });

  it('marriage events come for a married player only', () => {
    const { s } = married('pham_nhan', 60);
    const ev = findEvent(content, 'pt_ky_niem')!;
    expect(eventWeight(s, content, ev)).toBeGreaterThan(0);
    const single = { ...s, romance: { ...s.romance, partner: null } };
    expect(eventWeight(single, content, ev)).toBe(0);
    expect(eventWeight(s, content, findEvent(content, 'pt_lanh_nhat')!)).toBe(0);
  });
});
