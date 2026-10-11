// Sanity checks on the approved mortal events of Thương Lan giới (task 1.6).
import { describe, expect, it } from 'vitest';
import { EventFileSchema, type GameEvent } from '../src/core/schemas';
import childhood from '../content/worlds/thuong_lan/events/childhood.json';
import study from '../content/worlds/thuong_lan/events/study.json';
import work from '../content/worlds/thuong_lan/events/work.json';
import funny from '../content/worlds/thuong_lan/events/funny.json';
import accident from '../content/worlds/thuong_lan/events/accident.json';

const events: GameEvent[] = [childhood, study, work, funny, accident].flatMap((f) => EventFileSchema.parse(f));

describe('mortal events of Thương Lan giới', () => {
  it('has the 20 approved events', () => {
    expect(events).toHaveLength(20);
  });

  it('every trait-only choice is hidden', () => {
    for (const e of events) for (const c of e.choices) {
      if (c.requires?.traitsAny?.length) expect(c.hidden, `${e.id}: ${c.text}`).toBe(true);
    }
  });

  it('the returning old man only comes as a follow-up', () => {
    const back = events.find((e) => e.id === 'ong_lao_tro_lai')!;
    expect(back.weight).toBe(0);
    const give = events.find((e) => e.id === 'ong_lao_xin_an')!;
    expect(give.choices[0].result?.effects.followUp).toEqual({ event: 'ong_lao_tro_lai', afterYears: [3, 8] });
  });

  it('events about parents skip lives without that parent', () => {
    expect(events.find((e) => e.id === 'thoi_noi')!.conditions.flagsNone).toEqual(expect.arrayContaining(['no_father', 'no_mother']));
    expect(events.find((e) => e.id === 'cha_me_lam_benh')!.conditions.flagsNone).toContain('no_father');
  });
});
