import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fastForward } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { onYearAdvanced, recordSnapshot, rewind, rewindOptions, type Snapshot } from '../src/systems/timeline';

const content = loadContent();
const keep = content.balance.dev.rewindKeepYears;

/** Set a waiting event aside so the next year can come. */
const clear = (s: GameState): GameState => ({ ...s, events: { ...s.events, pending: null } });

/** A life played forward, recording like the app does. */
function play(years: number) {
  let history: Snapshot[] = [];
  const off = onYearAdvanced((s) => { history = recordSnapshot(history, s, keep); });
  let s: GameState = createLife({ seed: 'timeline' }, content);
  history = recordSnapshot(history, s, keep);
  for (let i = 0; i < years; i++) s = advanceYear(clear(s), content);
  off();
  return { s, history };
}

let off: (() => void) | null = null;
afterEach(() => { off?.(); off = null; });

describe('Dev mode: rewind time', () => {
  it('keeps one snapshot per age, only the last few years', () => {
    const { s, history } = play(20);
    expect(history.length).toBeLessThanOrEqual(keep + 1);
    expect(history[history.length - 1].age).toBe(s.character.age);
    expect(new Set(history.map((h) => h.age)).size).toBe(history.length);
  });

  it('offers only the steps that have a snapshot', () => {
    const young = play(3);
    expect(rewindOptions(young.history, young.s, content).map((o) => o.years)).toEqual([1]);
    const old = play(12);
    expect(rewindOptions(old.history, old.s, content).map((o) => o.years)).toEqual([1, 10]);
  });

  it('rewinds 1 and 10 years to that age, with a Dev line, and replays the same years', () => {
    const { s, history } = play(12);
    const back = rewind(history, s, 10)!;
    expect(back.state.character.age).toBe(s.character.age - 10);
    expect(back.state.log[back.state.log.length - 1].lines.some((l) => l.text.startsWith('[Dev]'))).toBe(true);
    expect(back.history.every((h) => h.age <= back.state.character.age)).toBe(true);
    // Same seed state → playing on gives the same life again.
    const again = advanceYear(clear(back.state), content);
    const first = history.find((h) => h.age === back.state.character.age + 1)!;
    expect(again.stats).toEqual(first.state.stats);
    expect(rewind(history, s, 99)).toBeNull();
  });

  it('records every year of a fast-forward', () => {
    let history: Snapshot[] = [];
    off = onYearAdvanced((st) => { history = recordSnapshot(history, st, keep); });
    const start = createLife({ seed: 'timeline-ff' }, content);
    let end = start;
    for (let i = 0; i < 6; i++) end = fastForward(clear(end), content);
    expect(history[history.length - 1].age).toBe(end.character.age);
    expect(history.length).toBeGreaterThan(2);
  });

  it('starts over for another life', () => {
    const a = play(4);
    const other = createLife({ seed: 'someone-else' }, content);
    const h = recordSnapshot(a.history, other, keep);
    expect(h).toHaveLength(1);
    expect(rewindOptions(a.history, other, content)).toEqual([]);
  });
});
