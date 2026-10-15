import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activeWorldEvent, startWorldEvent, worldEventsYear, worldPriceMul, worldThemeMultiplier } from '../src/systems/worldEvents';
import { meets } from '../src/systems/events/conditions';
import { devWorldEvent } from '../src/systems/dev';

const content = loadContent();
const born = createLife({ seed: 'world-ev', originId: 'nong_dan' }, content);
const at = (age: number, s: GameState = born): GameState => ({ ...s, character: { ...s.character, age } });

describe('sự kiện thiên hạ (9.R7e)', () => {
  it('thirty events, each phase logged as it begins, then a cooldown', () => {
    expect(content.worldEvents!.length).toBeGreaterThanOrEqual(30);
    const ev = content.worldEvents!.find((e) => e.id === 'thu_trieu_van_thu')!;
    let s = startWorldEvent(at(20), content, ev.id);
    expect(s.world!.active).toEqual({ id: ev.id, phase: 0, left: ev.phases[0].years });
    expect(s.log.at(-1)!.lines.at(-1)!.text).toContain(ev.phases[0].name);
    const total = ev.phases.reduce((n, p) => n + p.years, 0);
    for (let i = 0; i < total; i++) s = worldEventsYear(at(21 + i, s), content);
    expect(s.world!.active).toBeNull();
    expect(s.world!.cooldown[ev.id]).toBe(20 + total + ev.cooldownYears);
  });

  it('starts by its own seeded roll: same seed, same world', () => {
    const run = () => { let s = at(10); for (let a = 11; a < 80; a++) s = worldEventsYear(at(a, s), content); return s.world; };
    expect(run()).toEqual(run());
    let started = 0;
    let s = at(10);
    for (let a = 11; a < 200; a++) { const before = s.world?.active?.id; s = worldEventsYear(at(a, s), content); if (s.world?.active && s.world.active.id !== before && s.world.active.phase === 0) started++; }
    expect(started).toBeGreaterThan(3);
  });

  it('a phase reweights themes and prices only where it is felt, and gates its events', () => {
    const s = startWorldEvent(at(30), content, 'thu_trieu_van_thu');
    const tide: GameState = { ...s, world: { ...s.world!, active: { id: 'thu_trieu_van_thu', phase: 1, left: 2 } } };
    expect(worldThemeMultiplier(tide, content, ['beast'])).toBe(3);
    expect(worldPriceMul(tide, content)).toBe(1.2);
    const far: GameState = { ...tide, region: { ...tide.region, id: 'dong_hai' } };
    expect(worldThemeMultiplier(far, content, ['beast'])).toBe(1);
    expect(activeWorldEvent(far, content)!.phase.name).toBe('Thú triều');
    expect(meets(tide, { worldEvent: { id: ['thu_trieu_van_thu'], phase: 1 } }, content)).toBe(true);
    expect(meets(tide, { worldEvent: { id: ['thu_trieu_van_thu'], phase: 0 } }, content)).toBe(false);
    expect(meets(born, { worldEvent: { id: ['thu_trieu_van_thu'] } }, content)).toBe(false);
  });

  it('developer mode starts and stops one', () => {
    const s = devWorldEvent(at(30), content, 'sao_choi');
    expect(s.world!.active!.id).toBe('sao_choi');
    expect(devWorldEvent(s, content, null).world!.active).toBeNull();
  });
});
