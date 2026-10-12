import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { yearlyGain } from '../src/systems/cultivation';
import { becomeGhost, ghostChance } from '../src/systems/ghost';
import { checkDeath } from '../src/systems/time';

const content = loadContent();
const cfg = content.balance.ghost;
const combat = cfg.causeChance.combat ?? 0;

function life(seed = 'ghost', luck = 50): GameState {
  const b = createLife({ seed }, content);
  return { ...b, character: { ...b.character, age: 40 }, aptitudes: { ...b.aptitudes, luck, daoHeart: 60 }, log: [...b.log, { age: 40, lines: [] }], cult: { ...b.cult, root: { grade: 'none', elements: [] } } };
}

describe('quỷ tu (task 4.12)', () => {
  it('a violent death can leave an obsession; old age never does; luck helps', () => {
    expect(ghostChance(life(), content, 'old_age')).toBe(0);
    expect(ghostChance(life(), content, 'combat')).toBeCloseTo(combat);
    expect(ghostChance(life('g', 90), content, 'combat')).toBeGreaterThan(ghostChance(life('g', 50), content, 'combat'));
    let offers = 0;
    for (let i = 0; i < 200; i++) if (checkDeath(life(`d${i}`), content, 'combat').death!.ghostOffer) offers++;
    expect(offers / 200).toBeGreaterThan(combat - 0.1);
    expect(offers / 200).toBeLessThan(combat + 0.1);
  });

  it('rising as a ghost: alive again on the Quỷ đạo with the ghost-only method, cultivating without a root', () => {
    let dead: GameState | null = null;
    for (let i = 0; i < 100 && !dead; i++) {
      const d = checkDeath(life(`r${i}`), content, 'combat');
      if (d.death!.ghostOffer) dead = d;
    }
    const g = becomeGhost(dead!, content);
    expect(g.alive).toBe(true);
    expect(g.death).toBeNull();
    expect(g.flags.quy_tu).toBe(true);
    expect(g.cult.realm).toBe(cfg.realm);
    expect(g.cult.technique).toBe(cfg.technique);
    expect(g.cult.lineage).toBe('quy');
    expect(g.cult.lifespan).toBeGreaterThanOrEqual(40 + cfg.lifespanYears);
    expect(yearlyGain(g, content)).toBeGreaterThan(0);
    // No body: health does not recover, Quỷ đạo wears it down.
    const next = advanceYear({ ...g, events: { ...g.events, pending: null } }, content);
    expect(next.stats.health).toBeLessThan(g.stats.health);
    // Once per life.
    expect(ghostChance(g, content, 'combat')).toBe(0);
  });

  it('no offer, no rising', () => {
    const d = checkDeath(life(), content, 'old_age');
    expect(d.death!.ghostOffer).toBe(false);
    expect(becomeGhost(d, content)).toBe(d);
  });
});
