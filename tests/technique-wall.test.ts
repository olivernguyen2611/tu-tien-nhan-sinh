import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice } from '../src/systems/events/engine';
import { currentGoal } from '../src/systems/tutorial';
import { techniqueById, techniqueMaxRealm, techniqueWall } from '../src/systems/technique';

const content = loadContent();
const order = content.cultivation.realms.realms.map((r) => r.id);

/** A Trúc Cơ at the peak with a hoàng technique (tu tới Trúc Cơ). */
function walled(seed: string): GameState {
  const s = createLife({ seed }, content);
  const stages = content.cultivation.realms.realms.find((r) => r.id === 'truc_co')!.stages.length;
  return {
    ...s,
    destiny: { ...s.destiny, confirmed: true },
    character: { ...s.character, age: 60 },
    cult: { ...s.cult, realm: 'truc_co', stage: stages - 1, progress: 100, root: { grade: 'song', elements: ['kim', 'hoa'] }, technique: 'dan_khi_quyet', lifespan: 200 },
  };
}

describe('6b.4 bức tường công pháp', () => {
  it('knows the wall and says it in the goal line', () => {
    const s = walled('wall-goal');
    expect(techniqueWall(s, content)?.next).toBe('Kim Đan');
    expect(currentGoal(s, content)).toContain('Kim Đan');
    expect(currentGoal(s, content)).not.toContain('{');
  });

  it('counts the years behind the wall and then sends a fitting scroll', () => {
    let s = walled('wall-years');
    s = advanceYear(s, content);
    expect(s.cult.wallSince).not.toBeNull();
    const ev = findEvent(content, 'tw_ngoc_gian_goc_tung')!;
    expect(eventWeight(s, content, ev)).toBe(0);
    s = { ...s, character: { ...s.character, age: s.cult.wallSince! + 8 }, events: { ...s.events, pending: null } };
    expect(eventWeight(s, content, ev)).toBeGreaterThan(0);
    const got = resolveChoice({ ...s, events: { ...s.events, pending: ev.id } }, content, 0).state;
    const scroll = got.cult.scrolls.find((id) => !s.cult.scrolls.includes(id))!;
    const max = techniqueMaxRealm(techniqueById(content, scroll)!, content);
    expect(max === null || order.indexOf(max) > order.indexOf('truc_co')).toBe(true);
  });
});
