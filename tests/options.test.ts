import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fastForward } from '../src/core/state';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { eventWeight } from '../src/systems/events/engine';
import { hiddenByOptions, setGentle } from '../src/systems/options';

const content = loadContent();
const life = confirmDestiny(rollDestiny(createLife({ seed: 'opt' }, content), content), content);

describe('Cài đặt ảnh hưởng lối chơi (9.R11)', () => {
  it('gentle hides dark and mature events, nothing else', () => {
    const dark = content.events.find((e) => e.tags.includes('dark') && !e.npcTrigger && e.weight > 0)!;
    const plain = content.events.find((e) => e.tags.length === 0 && !e.npcTrigger && e.weight > 0)!;
    const gentle = setGentle(life, true);
    expect(hiddenByOptions(gentle, dark)).toBe(true);
    expect(hiddenByOptions(life, dark)).toBe(false);
    expect(eventWeight(gentle, content, dark)).toBe(0);
    expect(hiddenByOptions(gentle, plain)).toBe(false);
    expect(setGentle(gentle, true)).toBe(gentle);
    expect(createLife({ seed: 'g', gentle: true }, content).options?.gentle).toBe(true);
  });

  it('a gentle life never meets a sensitive event', () => {
    let s = setGentle(life, true);
    for (let i = 0; i < 80 && s.alive; i++) {
      s = advanceYear(s.events.pending ? { ...s, events: { ...s.events, pending: null } } : s, content);
      const id = s.events.pending;
      if (id) expect(content.events.find((e) => e.id === id)!.tags.some((t) => t === 'dark' || t === 'mature')).toBe(false);
    }
  });

  it('fast-forward stops at the chosen number of years', () => {
    const quiet = { ...life, character: { ...life.character, age: 30 } };
    const s = fastForward(quiet, content, 1);
    expect(s.character.age).toBeLessThanOrEqual(31);
    expect(content.balance.fastForward.choices).toContain(content.balance.fastForward.maxYears);
  });
});
