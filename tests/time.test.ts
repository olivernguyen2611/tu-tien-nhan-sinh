import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, FamilyActionFileSchema, LifeTextsSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { advanceYear, createLife, fastForward } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { ageBody, checkDeath, lifeSummary } from '../src/systems/time';
import balance from '../content/config/balance.json';
import familyActions from '../content/family-actions.json';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, tutorial } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import traits from '../content/traits.json';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  traits: TraitFileSchema.parse(traits),
  familyActions: FamilyActionFileSchema.parse(familyActions),
  lifeTexts: LifeTextsSchema.parse(lifeTexts),
  extremes: StatExtremesFileSchema.parse(extremes),
  cultivation,
  difficulties,
  tutorial,
  careers,
  events: [],
  glossary: [],
};

const at = (s: GameState, age: number, health = s.stats.health): GameState => ({
  ...s,
  character: { ...s.character, age },
  stats: { ...s.stats, health },
  log: [...s.log, { age, lines: [] }],
});

/** Play years until death (no events in this content). */
function liveOut(seed: string): GameState {
  let s = createLife({ seed }, content);
  for (let i = 0; i < 300 && s.alive; i++) s = advanceYear(s, content);
  return s;
}

describe('aging', () => {
  it('the young heal up to recoverCap but not beyond', () => {
    const base = createLife({ seed: 'young' }, content);
    expect(ageBody(at(base, 30, 40), content).stats.health).toBe(43);
    expect(ageBody(at(base, 30, 69), content).stats.health).toBe(70);
    expect(ageBody(at(base, 30, 85), content).stats.health).toBe(85);
  });

  it('health declines every year from declineStartAge', () => {
    const s = at(createLife({ seed: 'old' }, content), 55, 70);
    expect(ageBody(s, content).stats.health).toBeLessThan(70);
  });

  it('illness only strikes after illnessStartAge', () => {
    for (let i = 0; i < 100; i++) {
      const s = at(createLife({ seed: `ill-${i}` }, content), 59, 80);
      expect(ageBody(s, content).log.at(-1)!.lines).toHaveLength(0);
    }
    let sick = 0;
    for (let i = 0; i < 200; i++) {
      const s = at(createLife({ seed: `ill-${i}` }, content), 90, 80);
      if (ageBody(s, content).log.at(-1)!.lines.length > 0) sick++;
    }
    // (90 − 60) × 0.8% = 24%.
    expect(sick).toBeGreaterThan(20);
    expect(sick).toBeLessThan(80);
  });
});

describe('old-age milestones', () => {
  it('ages 60, 70, 80 cost health and charm with a visible line', () => {
    const s = at(createLife({ seed: 'mile' }, content), 70, 80);
    const next = ageBody({ ...s, stats: { ...s.stats, charm: 50 } }, content);
    expect(next.stats.charm).toBe(47);
    expect(next.log.at(-1)!.lines[0].text).toContain('Mị lực −3');
  });
});

describe('death', () => {
  it('dies of old age at the lifespan', () => {
    const base = createLife({ seed: 'lifespan' }, content);
    const s = checkDeath(at(base, base.cult.lifespan, 50), content);
    expect(s.alive).toBe(false);
    expect(s.death?.cause).toBe('old_age');
    expect(s.log.at(-1)!.lines.at(-1)!.text).toContain(String(base.cult.lifespan));
  });

  it('dies of illness when health reaches zero', () => {
    const s = checkDeath(at(createLife({ seed: 'frail' }, content), 40, 0), content);
    expect(s.death?.cause).toBe('illness');
  });

  it('stays alive otherwise and clears nothing', () => {
    const s = at(createLife({ seed: 'fine' }, content), 40, 50);
    expect(checkDeath(s, content)).toBe(s);
  });

  it('a whole life ends, never past the lifespan, and the same seed ends the same way', () => {
    for (let i = 0; i < 20; i++) {
      const s = liveOut(`life-${i}`);
      expect(s.alive).toBe(false);
      expect(s.character.age).toBeLessThanOrEqual(s.cult.lifespan);
      expect(s.events.pending).toBeNull();
    }
    expect(liveOut('same')).toEqual(liveOut('same'));
  });

  it('advancing a dead life does nothing', () => {
    const s = liveOut('done');
    expect(advanceYear(s, content)).toBe(s);
  });

  it('summary picks the epitaph pool by karma', () => {
    const base = createLife({ seed: 'karma' }, content);
    const good = checkDeath(at({ ...base, social: { ...base.social, karma: 80 } }, base.cult.lifespan), content);
    const bad = checkDeath(at({ ...base, social: { ...base.social, karma: -80 } }, base.cult.lifespan), content);
    expect(content.lifeTexts.epitaph.good).toContain(good.death!.epitaph);
    expect(content.lifeTexts.epitaph.bad).toContain(bad.death!.epitaph);
    expect(lifeSummary(good, content)!.karmaLabel).toBe('Thiện nhân');
    expect(lifeSummary(bad, content)!.causeText).toBe(`Hưởng thọ ${base.cult.lifespan} tuổi`);
  });
});

describe('fast forward', () => {
  it('stops at a noteworthy year, death or after maxYears, and matches pressing +1 the same number of times', () => {
    const max = content.balance.fastForward.maxYears;
    for (let i = 0; i < 30; i++) {
      const start = createLife({ seed: `ff-${i}` }, content);
      const end = fastForward(start, content);
      const years = end.character.age - start.character.age;
      expect(years).toBeGreaterThan(0);
      expect(years).toBeLessThanOrEqual(max);
      let manual = start;
      for (let y = 0; y < years; y++) manual = advanceYear(manual, content);
      expect(end).toEqual(manual);
      const last = end.log.at(-1)!;
      const stoppedEarly = years < max;
      if (stoppedEarly) expect(!end.alive || !!end.events.pending || last.lines.some((l) => l.tone !== 'normal')).toBe(true);
      // Years skipped over were all quiet.
      for (const y of end.log.slice(start.log.length, -1)) expect(y.lines.every((l) => l.tone === 'normal')).toBe(true);
    }
  });

  it('does nothing for a dead life', () => {
    const base = createLife({ seed: 'ff-dead' }, content);
    const dead = checkDeath(at(base, base.cult.lifespan), content);
    expect(fastForward(dead, content)).toBe(dead);
  });
});
