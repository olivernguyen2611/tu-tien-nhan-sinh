// Task 3.13: the Hương Hỏa Hội chain and the career events.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { resolveChoice, visibleChoices, findEvent } from '../src/systems/events/engine';

const content = loadContent();
const base: GameState = createLife({ seed: 'hhh', originId: 'nong_dan' }, content);
const at = (s: GameState, id: string): GameState => ({ ...s, events: { ...s.events, pending: id } });

describe('Hương Hỏa Hội chain (task 3.13)', () => {
  it('joining books the cave three years later', () => {
    const s = resolveChoice(at(base, 'huong_hoa_hoi'), content, 0).state;
    expect(s.events.followUps).toContainEqual({ event: 'hang_khai_mach', atAge: base.character.age + 3 });
  });

  it('the cave leads to the blood rite; breaking the array needs tinh_tao', () => {
    const s = resolveChoice(at(base, 'hang_khai_mach'), content, 0).state;
    expect(s.events.followUps.some((f) => f.event === 'dem_huyet_te')).toBe(true);
    const rite = findEvent(content, 'dem_huyet_te')!;
    expect(visibleChoices(at(base, 'dem_huyet_te'), content, rite).some((c) => c.text === 'Phá trận')).toBe(false);
    const awake = { ...base, flags: { ...base.flags, tinh_tao: true } };
    expect(visibleChoices(at(awake, 'dem_huyet_te'), content, rite).some((c) => c.text === 'Phá trận')).toBe(true);
  });

  it('fighting the U Hà cultivator is a real fight against a Luyện Khí foe', () => {
    const s = resolveChoice(at(base, 'dem_huyet_te'), content, 1).state;
    expect(s.combat?.foe.realm).toBe('luyen_khi');
    expect(s.combat?.foe.intent).toBe('kill');
  });

  it('waiting for the paper crane names a new enemy in the ledger', () => {
    const r = resolveChoice(at({ ...base, character: { ...base.character, age: 20 } }, 'u_ha_nho_mat'), content, 2);
    const npc = r.state.npcs.at(-1)!;
    expect(npc.grudge).toBeGreaterThanOrEqual(content.balance.npcs.revengeAt);
    expect(r.text).toContain(npc.name);
  });
});

describe('career events (task 3.13)', () => {
  it('a promotion event moves the career one rung up', () => {
    const s: GameState = { ...base, career: { id: 'quan', rung: 3, since: 0 } };
    const r = resolveChoice(at(s, 'gian_than_trieu'), content, 0).state;
    expect(r.career.rung).toBe(4);
  });

  it('the linh thảo cure only shows with the herb in the bag, and uses it up', () => {
    const ev = findEvent(content, 'benh_la')!;
    const s: GameState = { ...base, career: { id: 'y', rung: 0, since: 0 } };
    expect(visibleChoices(at(s, 'benh_la'), content, ev)[2].disabled).toBe(true);
    const withHerb = { ...s, inventory: { ...s.inventory, linh_thao_tram_nam: 1 } };
    const r = resolveChoice(at(withHerb, 'benh_la'), content, 2).state;
    expect(r.career.rung).toBe(1);
    expect(r.inventory.linh_thao_tram_nam ?? 0).toBe(0);
  });
});
