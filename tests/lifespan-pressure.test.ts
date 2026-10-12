// Task 4.10: lifespan pressure (đại hạn sắp tới, thọ đan, đoạt xá, di ngôn).
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { meets } from '../src/systems/events/conditions';
import { findEvent, resolveChoice, rollYearEvent, visibleChoices } from '../src/systems/events/engine';

const content = loadContent();
const base: GameState = createLife({ seed: 'dai-han', originId: 'nong_dan' }, content);
const at = (s: GameState, id: string): GameState => ({ ...s, events: { ...s.events, pending: id } });
/** A life at this age with this lifespan, in this realm. */
const life = (age: number, lifespan: number, realm = 'luyen_khi'): GameState => ({
  ...base,
  character: { ...base.character, age },
  cult: { ...base.cult, realm, lifespan },
  events: { ...base.events, followUps: [] },
});

describe('lifespan conditions (task 4.10)', () => {
  it('nearEnd follows balance.lifespan.pressureLeftPct', () => {
    expect(meets(life(108, 120), { lifespan: { nearEnd: true } }, content)).toBe(true);
    expect(meets(life(100, 120), { lifespan: { nearEnd: true } }, content)).toBe(false);
    expect(meets(life(100, 120), { lifespan: { nearEnd: false } }, content)).toBe(true);
  });

  it('maxLeft counts the years left', () => {
    expect(meets(life(119, 120), { lifespan: { maxLeft: 1 } }, content)).toBe(true);
    expect(meets(life(118, 120), { lifespan: { maxLeft: 1 } }, content)).toBe(false);
  });
});

describe('urgent events (task 4.10)', () => {
  it('đại hạn fires for a cultivator as soon as it is near, without the yearly roll', () => {
    expect(rollYearEvent(life(110, 120), content).events.pending).toBe('dai_han_sap_toi');
  });

  it('a mortal gets the mortal version', () => {
    expect(rollYearEvent(life(64, 70, 'pham_nhan'), content).events.pending).toBe('dai_han_pham_nhan');
  });

  it('it only fires once per life', () => {
    const seen: GameState = { ...life(110, 120), events: { ...base.events, history: { dai_han_sap_toi: 109 } } };
    expect(rollYearEvent(seen, content).events.pending).not.toBe('dai_han_sap_toi');
  });

  it('the last year brings the di ngôn first', () => {
    expect(rollYearEvent(life(119, 120), content).events.pending).toBe('di_ngon');
  });

  it('a due follow-up still comes before an urgent event', () => {
    const s: GameState = { ...life(110, 120), events: { ...base.events, followUps: [{ event: 'tho_dan_dau_gia', atAge: 110 }] } };
    expect(rollYearEvent(s, content).events.pending).toBe('tho_dan_dau_gia');
  });
});

describe('the đại hạn chain (task 4.10)', () => {
  it('seeking a pill books the auction', () => {
    const s = resolveChoice(at(life(110, 120), 'dai_han_sap_toi'), content, 1).state;
    expect(s.events.followUps.some((f) => f.event === 'tho_dan_dau_gia')).toBe(true);
  });

  it('a body to seize is only an option with heavy bad karma', () => {
    const ev = findEvent(content, 'dai_han_sap_toi')!;
    const kind = life(110, 120);
    expect(visibleChoices(at(kind, ev.id), content, ev)[2].disabled).toBe(true);
    const cruel = { ...kind, social: { ...kind.social, karma: -50 } };
    expect(visibleChoices(at(cruel, ev.id), content, ev)[2].disabled).toBeFalsy();
  });

  it('the pill adds a share of the lifespan, so it scales with the realm', () => {
    const rich = (s: GameState): GameState => ({ ...s, money: { ...s.money, spiritStones: 1000 } });
    const low = resolveChoice(at(rich(life(110, 120)), 'tho_dan_dau_gia'), content, 0).state;
    const high = resolveChoice(at(rich(life(950, 1000, 'nguyen_anh')), 'tho_dan_dau_gia'), content, 0).state;
    expect(low.cult.lifespan).toBe(120 + 18);
    expect(high.cult.lifespan).toBe(1000 + 150);
    expect(low.money.spiritStones).toBe(0);
  });
});
