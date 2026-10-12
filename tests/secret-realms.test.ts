// Task 4.6: multi-step secret realms (bí cảnh) chained in one year.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { settle } from '../src/systems/combat';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';

const content = loadContent();
const fresh = createLife({ seed: 'bi-canh', originId: 'nong_dan' }, content);
const base: GameState = {
  ...fresh,
  character: { ...fresh.character, age: 25 },
  cult: { ...fresh.cult, realm: 'luyen_khi', stage: 3, lifespan: 120 },
  events: { ...fresh.events, followUps: [] },
};
const at = (s: GameState, id: string): GameState => ({ ...s, events: { ...s.events, pending: id } });

describe('chained steps (task 4.6)', () => {
  it('entering opens the first step at once, in the same year', () => {
    const s = resolveChoice(at(base, 'bi_canh_van_kiem_mo'), content, 0).state;
    expect(s.events.pending).toBe('bc_vk_rung_kiem');
    expect(s.character.age).toBe(base.character.age);
    expect(advanceYear(s, content)).toBe(s); // the year waits for the run
  });

  it('every step can be left, which ends the run', () => {
    const r = resolveChoice(at(base, 'bc_vk_rung_kiem'), content, 2).state;
    expect(r.events.pending).toBeNull();
  });

  it('a won fight leads on to the next step', () => {
    const fought = resolveChoice(at(base, 'bc_vk_kiem_hon'), content, 0).state;
    expect(fought.combat).not.toBeNull();
    expect(fought.events.pending).toBeNull();
    const won: GameState = { ...fought, combat: { ...fought.combat!, phase: 'won' } };
    expect(settle(won, content, 'spare').state.events.pending).toBe('bc_vk_mo_chu');
  });

  it('seeing through the array opens a quiet way past the guardian, and the run clears it', () => {
    const ev = findEvent(content, 'bc_vk_kiem_hon')!;
    const quiet = (s: GameState) => visibleChoices(at(s, ev.id), content, ev).find((c) => c.text === 'Đi theo khe hở của trận')!;
    expect(quiet(base).disabled).toBe(true);
    const wise = { ...base, flags: { ...base.flags, vk_hieu_tran: true } };
    expect(quiet(wise).disabled).toBeFalsy();
    const end = resolveChoice(at(wise, 'bc_vk_mo_chu'), content, 0).state;
    expect(end.flags.vk_hieu_tran).toBeFalsy();
    expect(end.inventory.thanh_phong_kiem).toBe(1);
  });

  it('a party splits the dragon pearl or fights over it; alone, the pearl is yours', () => {
    const ev = findEvent(content, 'bc_lu_long_chau')!;
    const open = (s: GameState) => visibleChoices(at(s, ev.id), content, ev).filter((c) => !c.disabled).map((c) => c.text);
    expect(open(base)).toContain('Lấy long châu');
    const party = { ...base, flags: { ...base.flags, lu_lap_doi: true } };
    expect(open(party)).not.toContain('Lấy long châu');
    expect(open(party)).toContain('Chia đều với đồng đội');
  });
});
