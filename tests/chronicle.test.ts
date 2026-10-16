import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { chronicleOf, chronicleStats, EMPTY_CHRONICLE, lifeEnding, mergeChronicle, readChronicle } from '../src/systems/chronicle';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { readMeta, recordChronicle, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const life = confirmDestiny(rollDestiny(createLife({ seed: 'so' }, content), content), content);
const dead = (age: number, cause: NonNullable<GameState['death']>['cause'] = 'old_age'): GameState =>
  ({ ...life, character: { ...life.character, age }, alive: false, death: { age, cause, epitaph: 'x' } });

describe('Sổ luân hồi (9.R8)', () => {
  it('has unique endings with a catch-all last', () => {
    const ids = (content.endings ?? []).map((e) => e.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(content.endings!.at(-1)!.check)).toEqual([]);
  });

  it('gives every finished life one ending, none while alive', () => {
    expect(lifeEnding(life, content, 1)).toBeNull();
    expect(lifeEnding(dead(80), content, 1)).not.toBeNull();
    expect(lifeEnding(dead(15, 'illness'), content, 1)).not.toBe(lifeEnding(dead(80), content, 1));
  });

  it('records a life and merges without duplicates', () => {
    const one = chronicleOf(dead(80), content, 1);
    expect(one.lives).toHaveLength(1);
    expect(one.lives[0]).toMatchObject({ name: life.character.name, age: 80, life: 1 });
    expect(one.regions.length).toBeGreaterThan(0);
    const twice = mergeChronicle(mergeChronicle(EMPTY_CHRONICLE, one), one);
    expect(twice.lives).toHaveLength(1);
    expect(twice.endings).toHaveLength(1);
    const st = chronicleStats(twice, content);
    expect(st.longest).toBe(80);
    expect(st.endings[1]).toBe(content.endings!.length);
  });

  it('tolerates a missing or broken store and keeps it across reads', () => {
    expect(readChronicle(undefined)).toEqual(EMPTY_CHRONICLE);
    expect(readChronicle({ lives: [null, { key: 1 }], endings: [3, 'x'] })).toEqual({ lives: [], endings: ['x'], regions: [] });
    const store = fakeStore();
    expect(readMeta(store).chronicle).toEqual(EMPTY_CHRONICLE);
    recordChronicle(store, chronicleOf(dead(60), content, 1));
    expect(readMeta(store).chronicle.lives).toHaveLength(1);
  });
});
