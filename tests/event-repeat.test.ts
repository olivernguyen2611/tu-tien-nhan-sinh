import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice } from '../src/systems/events/engine';

const content = loadContent();
const b = content.balance.events;

describe('fewer repeats (playtest 2026-10-12)', () => {
  const base = createLife({ seed: 'rep' }, content);
  const at = (age: number, events: Partial<GameState['events']> = {}): GameState => ({
    ...base,
    character: { ...base.character, age },
    events: { pending: null, history: {}, followUps: [], npc: null, ...events },
  });
  const ev = findEvent(content, 'cha_me_lam_benh')!;

  it('a repeatable event waits at least minCooldownYears', () => {
    expect(eventWeight(at(30, { history: { [ev.id]: 30 - b.minCooldownYears + 1 } }), content, ev)).toBe(0);
  });

  it('each time it happened makes it rarer', () => {
    const fresh = eventWeight(at(40), content, ev);
    const once = eventWeight(at(40, { history: { [ev.id]: 10 }, seen: { [ev.id]: 1 } }), content, ev);
    const twice = eventWeight(at(40, { history: { [ev.id]: 10 }, seen: { [ev.id]: 2 } }), content, ev);
    expect(once).toBeCloseTo(fresh * b.repeatDecay);
    expect(twice).toBeCloseTo(fresh * b.repeatDecay ** 2);
    // Old saves (history but no count) count it once.
    expect(eventWeight(at(40, { history: { [ev.id]: 10 } }), content, ev)).toBeCloseTo(once);
  });

  it('answering an event counts it', () => {
    const s = { ...at(40), money: { silver: 100, spiritStones: 0 }, events: { ...at(40).events, pending: ev.id } };
    const r = resolveChoice(s, content, 0).state;
    expect(r.events.seen?.[ev.id]).toBe(1);
  });
});
