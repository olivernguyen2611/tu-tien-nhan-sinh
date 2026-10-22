import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { doActivity } from '../src/systems/activities';
import { resolveChoice } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { createNpc, npcById } from '../src/systems/npcs';
import { romanceTarget, romanceYear } from '../src/systems/romance';

const content = loadContent();

function adult(patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'wed' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age: 22, gender: 'nam' }, money: { ...b.money, silver: 300 }, log: [...b.log, { age: 22, lines: [] }], ...patch };
}
const pend = (s: GameState, id: string, npc: string | null = null) => ({ ...s, events: { ...s.events, pending: id, npc } });

describe('10.6 tình duyên phàm tục', () => {
  it('canh thiếp: nghe lời means a match of the other gender, then the wedding feast', () => {
    const s = adult();
    const wed = resolveChoice(pend(s, 'td_canh_thiep'), content, 0).state;
    const p = romanceTarget(wed, 'partner')!;
    expect(p.gender).toBe('nu');
    expect(p.age).toBeGreaterThanOrEqual(18);
    expect(wed.flags.moi_cuoi).toBe(true);
    const feast = resolveChoice(pend(wed, 'td_le_cuoi'), content, 1).state;
    expect(feast.flags.moi_cuoi).toBeFalsy();
    expect(feast.money.silver).toBeLessThan(wed.money.silver);
  });

  it('bỏ trốn weds the lover; a widow(er) may marry again', () => {
    let s = adult();
    const m = createNpc(s, content, { role: 'người thương', gender: 'nu', minAge: 20, affinity: 80 });
    s = { ...m.state, romance: { ...m.state.romance, lover: m.id, couple: true } };
    const ran = resolveChoice(pend(s, 'td_ep_cuoi_nguoi_khac', m.id), content, 0).state;
    expect(ran.romance.partner).toBe(m.id);
    expect(ran.flags.bo_tron).toBe(true);
    const dead = { ...ran, npcs: ran.npcs.map((n) => (n.id === m.id ? { ...n, alive: false } : n)) };
    const after = romanceYear(dead, content);
    expect(after.romance.partner).toBeNull();
    expect(after.flags.goa_bua).toBe(true);
    expect(meets({ ...after, character: { ...after.character, age: 30 } }, content.events.find((e) => e.id === 'td_tai_gia')!.conditions, content)).toBe(true);
  });

  it('nạp thiếp adds a thiếp, and tranh sủng is about her', () => {
    let s = adult({ character: { ...adult().character, age: 30 } });
    s = resolveChoice(pend(s, 'td_canh_thiep'), content, 0).state;
    s = resolveChoice(pend(s, 'td_nap_thiep', s.romance.partner), content, 0).state;
    const c = romanceTarget(s, 'concubine')!;
    expect(c).toBeTruthy();
    expect(c.id).not.toBe(s.romance.partner);
    expect(npcById(s, c.id)!.role).toBe('thiếp');
    expect(meets({ ...s, events: { ...s.events, npc: c.id } }, content.events.find((e) => e.id === 'td_tranh_sung')!.conditions, content)).toBe(true);
  });

  it('matchmaking and dating are activities', () => {
    const s = adult();
    const r = doActivity(s, content, 'nho_mai_moi')!;
    expect(r.state.romance.lover).not.toBeNull();
    const lover = r.state.romance.lover!;
    const before = npcById(r.state, lover)!.affinity;
    const d = doActivity(r.state, content, 'ngam_trang')!;
    expect(npcById(d.state, lover)!.affinity).toBeGreaterThan(before);
  });
});
