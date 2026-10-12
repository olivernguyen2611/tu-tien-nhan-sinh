import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { devMarry, devResetEventHistory, devRootOptions, devSetMartial, devSetRoot, devSpouseAffinity } from '../src/systems/dev';
import { npcById } from '../src/systems/npcs';

const content = loadContent();
const base = createLife({ seed: 'devpt' }, content);
const adult: GameState = { ...base, character: { ...base.character, age: 25 }, log: [...base.log, { age: 25, lines: [] }] };

describe('developer mode for the playtest fixes', () => {
  it('sets the martial stage of a mortal', () => {
    expect(devSetMartial(adult, content, 4).martial.stage).toBe(4);
  });

  it('offers every grade and variant, and sets the root', () => {
    const roots = devRootOptions(content);
    expect(roots.some((r) => r.label === 'Biến dị linh căn (Lôi: Kim + Hỏa)')).toBe(true);
    const lôi = roots.find((r) => r.key === 'bien_di:loi')!;
    expect(devSetRoot(adult, content, lôi.root).cult.root).toEqual(lôi.root);
  });

  it('marries at once and moves the spouse affinity; not under 18', () => {
    const m = devMarry(adult, content);
    expect(m.romance.partner).not.toBeNull();
    expect(npcById(m, m.romance.partner)!.affinity).toBe(80);
    expect(npcById(devSpouseAffinity(m, -20), m.romance.partner)!.affinity).toBe(60);
    const kid = { ...adult, character: { ...adult.character, age: 15 } };
    expect(devMarry(kid, content).romance.partner).toBeNull();
  });

  it('clears the event history', () => {
    const s = { ...adult, events: { ...adult.events, history: { lu_quet: 20 }, seen: { lu_quet: 2 } } };
    expect(devResetEventHistory(s).events.history).toEqual({});
  });
});
