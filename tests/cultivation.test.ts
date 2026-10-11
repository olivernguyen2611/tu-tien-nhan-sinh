import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { revealRoot, rollRoot, rootName, rootTestAge } from '../src/systems/cultivation';
import { resolveChoice } from '../src/systems/events/engine';

const content = loadContent();
const speed = (grade: string) => content.balance.roots.gradeSpeed[grade];

/** Pass years (taking the first choice of any event) until the root is known or age 20. */
function untilTested(seed: string, originId?: string): GameState {
  let s = createLife({ seed, originId }, content);
  s = { ...s, destiny: { ...s.destiny, confirmed: true } };
  while (s.alive && !s.cult.root && s.character.age < 20) {
    s = s.events.pending ? resolveChoice(s, content, 0).state : advanceYear(s, content);
  }
  return s;
}

describe('spirit root (task 2.2)', () => {
  it('every life is booked a root test between 6 and 12', () => {
    for (let i = 0; i < 50; i++) {
      const s = createLife({ seed: `book${i}` }, content);
      const test = s.events.followUps.find((f) => f.event === content.world.rootTestEvent);
      expect(test?.atAge).toBe(rootTestAge(`book${i}`, content));
      expect(test!.atAge).toBeGreaterThanOrEqual(6);
      expect(test!.atAge).toBeLessThanOrEqual(12);
    }
  });

  it('taking the test reveals the root at the booked age', () => {
    const s = untilTested('reveal-1');
    expect(s.cult.root).not.toBeNull();
    expect(s.character.age).toBe(rootTestAge('reveal-1', content));
    expect(s.log.at(-1)!.lines.some((l) => l.text.startsWith('Linh căn: '))).toBe(true);
  });

  it('hiding books the test again next year', () => {
    let s = createLife({ seed: 'hide' }, content);
    const age = rootTestAge('hide', content);
    s = { ...s, character: { ...s.character, age }, events: { ...s.events, pending: 'thu_linh_can', followUps: [] } };
    s = resolveChoice(s, content, 1).state;
    expect(s.cult.root).toBeNull();
    expect(s.events.followUps).toEqual([{ event: 'thu_linh_can', atAge: age + 1 }]);
  });

  it('roughly follows the grade table (60% no root)', () => {
    const rng = new Rng('grades');
    let none = 0;
    for (let i = 0; i < 4000; i++) if (rollRoot(rng, content).grade === 'none') none++;
    expect(none / 4000).toBeGreaterThan(0.56);
    expect(none / 4000).toBeLessThan(0.64);
  });

  it('elements match the grade', () => {
    const rng = new Rng('elements');
    const variant = content.cultivation.roots.elements.filter((e) => e.variant).map((e) => e.id);
    for (let i = 0; i < 3000; i++) {
      const r = rollRoot(rng, content);
      expect(new Set(r.elements).size).toBe(r.elements.length);
      if (r.grade === 'the_chat') expect(r.body).not.toBeNull();
      else expect(r.elements).toHaveLength(content.balance.roots.elementCount[r.grade]);
      if (r.grade === 'bien_di') expect(variant).toContain(r.elements[0]);
    }
  });

  it('clan descendants keep the better of two rolls', () => {
    const avg = (rolls: number) => {
      const rng = new Rng(`clan${rolls}`);
      let sum = 0;
      for (let i = 0; i < 3000; i++) sum += speed(rollRoot(rng, content, rolls).grade);
      return sum / 3000;
    };
    expect(avg(2)).toBeGreaterThan(avg(1) * 1.3);
  });

  it('names roots with their elements', () => {
    expect(rootName({ grade: 'song', elements: ['kim', 'hoa'], body: null }, content)).toBe('Song linh căn (Kim, Hỏa)');
    expect(rootName({ grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'], body: null }, content)).toBe('Ngũ linh căn');
    expect(rootName({ grade: 'the_chat', elements: [], body: 'cuu_duong_the' }, content)).toBe('Cửu Dương Thể');
    expect(rootName({ grade: 'none', elements: [], body: null }, content)).toBe('Không linh căn');
  });

  it('a special body applies its stat and lifespan hooks once', () => {
    const base = createLife({ seed: 'body' }, content);
    // Force the body by giving it all the weight.
    const forced = {
      ...content,
      balance: {
        ...content.balance,
        roots: { ...content.balance.roots, gradeWeights: { the_chat: 1 }, bodyWeights: { thien_tuyet_mach: 1 } },
      },
    };
    const s = { ...base, character: { ...base.character, age: 8 } };
    const { state } = revealRoot(s, forced);
    expect(state.cult.root?.body).toBe('thien_tuyet_mach');
    expect(state.cult.lifespan).toBe(Math.round(base.cult.lifespan * 0.3));
    expect(revealRoot(state, forced).state).toBe(state);
  });

  it('is reproducible for the same seed', () => {
    expect(untilTested('same').cult.root).toEqual(untilTested('same').cult.root);
  });
});
