// Task 4.8: đại vực open with the realm, change linh khí and events, and each has an đại năng.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { yearlyGain, hookSum } from '../src/systems/cultivation';
import { meets } from '../src/systems/events/conditions';
import { eventWeight, findEvent } from '../src/systems/events/engine';
import { currentRegion, travel, travelBlock } from '../src/systems/regions';
import { migrate } from '../src/systems/save';

const content = loadContent();
const fresh = createLife({ seed: 'dai-vuc', originId: 'nong_dan' }, content);
const at = (realm: string, age = 30): GameState => ({
  ...fresh,
  character: { ...fresh.character, age },
  cult: { ...fresh.cult, realm, root: { grade: 'song', elements: ['kim', 'hoa'], body: null } },
  events: { ...fresh.events, followUps: [] },
});

describe('đại vực (task 4.8)', () => {
  it('a life starts at home, the first region', () => {
    expect(currentRegion(fresh, content)?.id).toBe(content.regions[0].id);
  });

  it('regions open with the realm', () => {
    expect(travelBlock(at('pham_nhan'), content, 'vo_chu_hoang_nguyen')).toBe('locked');
    expect(travelBlock(at('luyen_khi'), content, 'vo_chu_hoang_nguyen')).toBeNull();
    expect(travelBlock(at('luyen_khi'), content, 'van_thu_son_mach')).toBe('locked');
    expect(travelBlock(at('pham_nhan'), content, 'trung_chau', true)).toBeNull(); // dev mode
  });

  it('one trip a year; the first visit meets the guardian', () => {
    const r = travel(at('truc_co'), content, 'van_thu_son_mach')!;
    expect(r.state.region.id).toBe('van_thu_son_mach');
    const keeper = content.regions.find((x) => x.id === 'van_thu_son_mach')!.guardian.text;
    expect(r.text).toContain(keeper);
    expect(travelBlock(r.state, content, 'thanh_van_chau')).toBe('movedThisYear');
    const nextYear = { ...r.state, character: { ...r.state.character, age: r.state.character.age + 1 } };
    const back = travel(nextYear, content, 'thanh_van_chau')!;
    const again = travel({ ...back.state, character: { ...back.state.character, age: back.state.character.age + 1 } }, content, 'van_thu_son_mach')!;
    expect(again.text).not.toContain(keeper);
  });

  it('linh khí of the region speeds cultivation', () => {
    const home = at('kim_dan');
    const east: GameState = { ...home, region: { id: 'dong_hai', visited: ['dong_hai'], movedAt: null } };
    expect(yearlyGain(east, content) / yearlyGain(home, content)).toBeCloseTo(1.5);
  });

  it('region hooks and event themes apply while there', () => {
    const wild: GameState = { ...at('luyen_khi'), region: { id: 'vo_chu_hoang_nguyen', visited: [], movedAt: null } };
    expect(hookSum(wild, content, 'lootPct')).toBeGreaterThan(hookSum(at('luyen_khi'), content, 'lootPct'));
    const plunder = content.events.find((e) => e.themes.includes('plunder') && eventWeight(at('luyen_khi', 40), content, e) > 0)!;
    expect(eventWeight({ ...wild, character: { ...wild.character, age: 40 } }, content, plunder)).toBeCloseTo(eventWeight(at('luyen_khi', 40), content, plunder) * 2);
  });

  it('guardian events need their region', () => {
    const ev = findEvent(content, 'dai_nang_kim_mao_hong')!;
    expect(meets(at('truc_co'), ev.conditions, content)).toBe(false);
    expect(meets({ ...at('truc_co'), region: { id: 'van_thu_son_mach', visited: [], movedAt: null } }, ev.conditions, content)).toBe(true);
  });

  it('every region has a guardian event', () => {
    for (const r of content.regions) expect(content.events.some((e) => e.conditions.region?.includes(r.id))).toBe(true);
  });

  it('an old save starts at home', () => {
    const { region: _, ...old } = fresh;
    const save = migrate({ saveVersion: 1, gameVersion: '0', slot: 1, savedAt: '', life: old as GameState });
    expect(save.life.region).toEqual({ id: null, visited: [], movedAt: null });
  });
});
