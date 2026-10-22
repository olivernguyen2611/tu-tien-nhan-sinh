import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { combatPower } from '../src/systems/combat';
import { beastView, feedBeast, gainBeast } from '../src/systems/spiritBeast';

const content = loadContent();

function tamer(seed: string, level = 20): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'truc_co', stage: 1, lifespan: 220 },
    inventory: { trung_linh_thu: 1, noi_dan_2: 10 },
    crafts: { skills: { beast: { level, affinity: 0 } }, lastPractice: null },
  };
}

describe('13.7c Ngự thú', () => {
  it('an egg hatches into a beast that adds to combat power', () => {
    const s = tamer('sb1');
    const r = gainBeast(s, content, 'hatch')!;
    expect(r.state.inventory.trung_linh_thu ?? 0).toBe(0);
    expect(r.state.beast!.stage).toBe(0);
    expect(combatPower(r.state, content)).toBeGreaterThan(combatPower(s, content));
  });

  it('feeding nội đan makes it grow through the stages', () => {
    let s = gainBeast(tamer('sb2'), content, 'hatch')!.state;
    for (let i = 0; i < 10; i++) s = feedBeast(s, content, 'noi_dan_2')!.state;
    expect(s.beast!.stage).toBeGreaterThanOrEqual(2);
    expect(beastView(s, content)!.stage).toBe(content.recipes.beastTexts!.stages[s.beast!.stage]);
  });

  it('a capture needs the craft level and takes the year\'s craft slot', () => {
    expect(gainBeast(tamer('sb3', 0), content, 'capture')).toBeNull();
    const r = gainBeast(tamer('sb3'), content, 'capture')!;
    expect(r.state.crafts.lastPractice).toBe(40);
    expect(gainBeast(r.state, content, 'capture')).toBeNull();
  });

  it('the beast grows with the years', () => {
    const s = gainBeast(tamer('sb4'), content, 'hatch')!.state;
    expect(advanceYear(s, content).beast!.exp).toBeGreaterThan(0);
  });
});
