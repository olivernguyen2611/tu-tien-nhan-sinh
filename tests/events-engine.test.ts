import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, EventFileSchema, NamesSchema, OriginFileSchema, TraitFileSchema, WorldSchema } from '../src/core/schemas';
import { LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { cultivation } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice, rollYearEvent, visibleChoices } from '../src/systems/events/engine';
import balance from '../content/config/balance.json';
import traits from '../content/traits.json';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';
import childhood from '../content/worlds/thuong_lan/events/childhood.json';
import study from '../content/worlds/thuong_lan/events/study.json';
import work from '../content/worlds/thuong_lan/events/work.json';
import funny from '../content/worlds/thuong_lan/events/funny.json';
import accident from '../content/worlds/thuong_lan/events/accident.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  traits: TraitFileSchema.parse(traits),
  events: [childhood, study, work, funny, accident].flatMap((f) => EventFileSchema.parse(f)),
  glossary: [],
  familyActions: [],
  lifeTexts: LifeTextsSchema.parse(lifeTexts),
  extremes: StatExtremesFileSchema.parse(extremes),
  cultivation,
};
const ev = (id: string) => findEvent(content, id)!;
const at = (s: GameState, age: number, patch: Partial<GameState> = {}): GameState =>
  ({ ...s, character: { ...s.character, age }, ...patch });

/** Play a whole life, always taking the first enabled choice. */
function play(seed: string, years: number) {
  let s = createLife({ seed }, content);
  let events = 0;
  for (let y = 0; y < years; y++) {
    s = advanceYear(s, content);
    if (s.events.pending) {
      events++;
      const pick = visibleChoices(s, content, ev(s.events.pending)).find((c) => !c.disabled)!;
      s = resolveChoice(s, content, pick.index).state;
    }
  }
  return { s, events };
}

describe('event engine', () => {
  it('plays a long life deterministically without getting stuck', () => {
    const a = play('life-a', 70);
    const b = play('life-a', 70);
    expect(a.s).toEqual(b.s);
    expect(a.s.character.age).toBe(70);
    expect(a.events).toBeGreaterThan(0);
    expect(a.s.events.pending).toBeNull();
  });

  it('respects age, flags, orphans and once-per-life', () => {
    const base = createLife({ seed: 'cond', originId: 'nong_dan' }, content);
    expect(eventWeight(at(base, 1), content, ev('thoi_noi'))).toBeGreaterThan(0);
    expect(eventWeight(at(base, 2), content, ev('thoi_noi'))).toBe(0);
    expect(eventWeight(at(base, 1, { flags: { no_parents: true, no_father: true, no_mother: true } }), content, ev('thoi_noi'))).toBe(0);
    expect(eventWeight(at(base, 10), content, ev('thay_do_ngu_gat'))).toBe(0);
    expect(eventWeight(at(base, 10, { flags: { di_hoc: true } }), content, ev('thay_do_ngu_gat'))).toBeGreaterThan(0);
    const seen = at(base, 1, { events: { ...base.events, history: { thoi_noi: 1 } } });
    expect(eventWeight(seen, content, ev('thoi_noi'))).toBe(0);
    expect(eventWeight(at(base, 10), content, ev('ong_lao_tro_lai'))).toBe(0);
  });

  it('trait theme multipliers change weights (Thiết Vị blocks poisoning)', () => {
    const base = at(createLife({ seed: 'theme' }, content), 8);
    const w = eventWeight(base, content, ev('qua_do_ben_suoi'));
    expect(w).toBeGreaterThan(0);
    expect(eventWeight({ ...base, traits: ['thiet_vi'] }, content, ev('qua_do_ben_suoi'))).toBe(0);
    expect(eventWeight({ ...base, traits: ['dao_moi_tinh'] }, content, ev('cho_du_dau_lang')))
      .toBeCloseTo(eventWeight(base, content, ev('cho_du_dau_lang')) * 1.5);
  });

  it('shows hidden choices only with the trait, and disables unaffordable ones', () => {
    const base = at(createLife({ seed: 'hidden' }, content), 6);
    const poor = { ...base, money: { ...base.money, silver: 0 } };
    const plain = visibleChoices(poor, content, ev('cho_du_dau_lang'));
    expect(plain.some((c) => c.hidden)).toBe(false);
    const withTrait = visibleChoices({ ...poor, traits: ['kheo_mom'] }, content, ev('cho_du_dau_lang'));
    expect(withTrait.find((c) => c.hidden)?.traitId).toBe('kheo_mom');
    expect(visibleChoices(poor, content, ev('vao_tu_thuc'))[0].disabled).toBe(true);
  });

  it('applies effects, books follow-ups and fires them when due', () => {
    let s = at(createLife({ seed: 'follow' }, content), 8);
    // Drop the root test booked at birth so only this event's follow-up is left.
    s = { ...s, events: { ...s.events, pending: 'ong_lao_xin_an', followUps: [] } };
    const karma = s.social.karma;
    s = resolveChoice(s, content, 0).state;
    expect(s.social.karma).toBe(karma + 3);
    expect(s.flags.cho_ong_lao_an).toBe(true);
    const booked = s.events.followUps[0];
    expect(booked.event).toBe('ong_lao_tro_lai');
    expect(booked.atAge).toBeGreaterThanOrEqual(11);
    expect(booked.atAge).toBeLessThanOrEqual(16);
    s = rollYearEvent(at(s, booked.atAge), content);
    expect(s.events.pending).toBe('ong_lao_tro_lai');
    expect(s.events.followUps).toHaveLength(0);
  });

  it('skill checks succeed more often with a higher stat', () => {
    const rate = (physique: number) => {
      let wins = 0;
      for (let i = 0; i < 400; i++) {
        const b = at(createLife({ seed: `chk${i}` }, content), 8);
        const s = { ...b, aptitudes: { ...b.aptitudes, physique }, events: { ...b.events, pending: 'qua_do_ben_suoi' } };
        if (resolveChoice(s, content, 0).success) wins++;
      }
      return wins / 400;
    };
    expect(rate(80)).toBeGreaterThan(rate(20) + 0.4);
  });
});
