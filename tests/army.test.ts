import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { armyBattle, armyJoin, armyLeave, armyLine, armyOf, armyYear, battleChance } from '../src/systems/army';
import { initCourt } from '../src/systems/court';
import { meets } from '../src/systems/events/conditions';
import { jobBlocked } from '../src/systems/jobs';

const content = loadContent();
const cfg = content.balance.army!;
const life = (age = 20): GameState => {
  const s = createLife({ seed: 'binh-nghiep', originId: content.origins[0].id }, content);
  return { ...s, character: { ...s.character, age }, court: initCourt(s, content) };
};
const atWar = (s: GameState): GameState => ({ ...s, court: { ...s.court!, affairs: [{ id: 'ngoai_xam', until: 99 }], started: { ngoai_xam: s.character.age } } });
const soldier = (rank = 0, via: 'draft' | 'volunteer' = 'volunteer', s = life()): GameState => ({ ...armyJoin(s, content, via), army: { rank, merit: 0, since: s.character.age, via, battles: 0, wins: 0, best: rank } });

describe('Binh nghiệp và chiến tranh (12.3)', () => {
  it('enlisting puts a mortal in the army at the lowest hàm, and no other trade is taken meanwhile', () => {
    const s = armyJoin(life(), content, 'volunteer');
    expect(armyOf(s)).toMatchObject({ rank: 0, via: 'volunteer' });
    expect(s.flags.tung_tong_quan).toBe(true);
    expect(jobBlocked(s, content, content.jobs!.jobs[0].id)).toContain('tại ngũ');
    expect(armyLine(s, content)).toContain(content.army!.ranks[0]);
  });

  it('a war year always brings a trận; quân công raises the hàm', () => {
    const war = atWar(soldier());
    const next = armyYear(war, content);
    expect(next.army === null || next.army!.battles === 1 || !next.alive).toBe(true);
    let s = { ...atWar(soldier()), army: { ...soldier().army!, merit: 1000 } };
    let promoted = false;
    for (let i = 0; i < 10 && !promoted; i++) {
      const n = armyYear({ ...s, seed: `p-${i}`, stats: { ...s.stats, health: 100 } }, content);
      if ((n.army?.rank ?? 0) > 0) promoted = true;
      s = { ...s, army: { ...s.army!, merit: 1000 } };
    }
    expect(promoted).toBe(true);
  });

  it('strength and, for officers, intellect win trận; higher hàm faces a stronger enemy', () => {
    const s = soldier(0);
    const strong = { ...s, aptitudes: { ...s.aptitudes, physique: 100 }, martial: { ...s.martial, stage: 3 } };
    expect(battleChance(strong, content, true)).toBeGreaterThan(battleChance(s, content, true));
    expect(battleChance(soldier(5), content, true)).toBeLessThan(battleChance(soldier(0), content, true));
    const officer = soldier(4);
    const wise = { ...officer, stats: { ...officer.stats, intellect: 95 } };
    expect(battleChance(wise, content, true)).toBeGreaterThan(battleChance(officer, content, true));
    expect(battleChance(s, content, false)).toBeGreaterThan(battleChance(s, content, true));
  });

  it('a lost trận can kill or maim; a maimed soldier goes home a thương binh', () => {
    let dead = 0;
    let maimed = 0;
    for (let i = 0; i < 120; i++) {
      const s = armyBattle({ ...soldier(5), seed: `t-${i}` }, content);
      if (!s.alive) dead++;
      else if (s.flags.thuong_binh) { maimed++; expect(s.army).toBeNull(); }
    }
    expect(dead).toBeGreaterThan(0);
    expect(maimed).toBeGreaterThan(0);
  });

  it('a draftee goes home when the war is over; a deserter is hunted', () => {
    const d = soldier(0, 'draft', life(20));
    const peace = { ...d, character: { ...d.character, age: 20 + cfg.draftYears }, court: { ...d.court!, affairs: [] } };
    expect(armyYear(peace, content).army ?? null).toBeNull();
    const ran = armyLeave(soldier(), content, 'desert');
    expect(ran.army).toBeNull();
    expect(ran.law?.wanted).toBeGreaterThanOrEqual(cfg.desertWanted);
    expect(ran.law?.lastCrime).toBe('dao_ngu');
    expect(meets(ran, { army: { deserted: true, serving: false } }, content)).toBe(true);
  });

  it('the bắt lính event exists and its first choice enlists', () => {
    const ev = content.events.find((e) => e.id === content.court!.draftEvent)!;
    expect(ev).toBeDefined();
    expect(ev.choices[0].result?.effects.armyJoin).toBe('draft');
  });

  it('soldiers live a year through advanceYear', () => {
    const s = advanceYear(soldier(), content);
    expect(s.character.age).toBe(21);
  });
});
