import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { checkDeath } from '../src/systems/time';
import { FORESIGHT_FLAG, MEMORY_FLAG, rewind, rewindOffer } from '../src/systems/rewind';
import { resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { migrate, makeSave } from '../src/systems/save';

const content = loadContent();

/** Live years, skipping any event that comes. */
function live(s: GameState, toAge: number): GameState {
  while (s.alive && s.character.age < toAge) {
    s = { ...s, events: { ...s.events, pending: null }, combat: null, fate: null };
    s = advanceYear(s, content);
  }
  return s;
}

const born = () => confirmDestiny(rollDestiny(createLife({ seed: 'trung-sinh' }, content), content), content);
const die = (s: GameState) => checkDeath({ ...s, stats: { ...s.stats, health: 0 } }, content);

describe('Trùng sinh (task 5b.10)', () => {
  it('remembers the life at age 6 and on reaching a new major realm', () => {
    const s = live(born(), 8);
    expect(s.checkpoints.age6?.character.age).toBe(6);
    expect(s.checkpoints.realm).toBeNull();
    const cultivator = { ...s, events: { ...s.events, pending: null }, cult: { ...s.cult, realm: 'luyen_khi' } };
    expect(advanceYear(cultivator, content).checkpoints.realm?.cult.realm).toBe('luyen_khi');
  });

  it('no offer without a rewindOnDeath hook', () => {
    expect(rewindOffer(die(live(born(), 10)), content)).toBeNull();
  });

  it('Hồi Quang Kính: back to age 6 with the same root, memory flag, new world', () => {
    let s = live(born(), 20);
    const root = { grade: 'song', elements: ['kim', 'hoa'] };
    s = { ...s, inventory: { ...s.inventory, hoi_quang_kinh: 1 }, cult: { ...s.cult, root } };
    const dead = die(s);
    expect(rewindOffer(dead, content)).toEqual({ target: 'age6', age: 6 });
    const back = rewind(dead, content);
    expect(back.alive).toBe(true);
    expect(back.death).toBeNull();
    expect(back.character.age).toBe(6);
    expect(back.cult.root).toEqual(root);
    expect(back.flags[MEMORY_FLAG]).toBe(true);
    expect(back.flags[FORESIGHT_FLAG]).toBe(true);
    expect(back.inventory.hoi_quang_kinh ?? 0).toBe(0);
    expect(back.rng).not.toEqual(dead.checkpoints.age6!.rng);
    expect(back.log.every((y) => y.age <= 6)).toBe(true);
    expect(back.log.at(-1)!.lines.at(-1)!.tone).toBe('rare');
    // Once a life.
    expect(rewindOffer(die({ ...live(back, 8), inventory: { hoi_quang_kinh: 1 } }), content)).toBeNull();
  });

  it('Nhất Niệm Hồi Quang: back to the start of the current major realm', () => {
    let s = live(born(), 15);
    s = advanceYear({ ...s, events: { ...s.events, pending: null }, cult: { ...s.cult, realm: 'luyen_khi', stage: 0 } }, content);
    const startAge = s.checkpoints.realm!.character.age;
    s = live({ ...s, talents: ['nhat_niem_hoi_quang'] }, 25);
    const dead = die({ ...s, cult: { ...s.cult, stage: 5 } });
    expect(rewindOffer(dead, content)).toEqual({ target: 'realm', age: startAge });
    const back = rewind(dead, content);
    expect(back.character.age).toBe(startAge);
    expect(back.cult.realm).toBe('luyen_khi');
    expect(back.cult.stage).toBe(0);
  });

  it('old saves get empty checkpoints', () => {
    const s = born();
    const { checkpoints: _c, ...old } = s;
    expect(migrate(makeSave(old as GameState, 1)).life.checkpoints).toEqual({ age6: null, realm: null });
  });

  it('Hồi Quang Kính is found in kỳ ngộ; "Ta biết chuyện này sẽ xảy ra" opens only with the memory', () => {
    const s = { ...live(born(), 20), money: { silver: 100, spiritStones: 0 } };
    const got = resolveChoice({ ...s, events: { ...s.events, pending: 'hq_tiem_cam_do' } }, content, 0).state;
    expect(got.inventory.hoi_quang_kinh).toBe(1);
    const hidden = content.events.filter((e) => e.choices.some((c) => c.text === 'Ta biết chuyện này sẽ xảy ra'));
    expect(hidden.length).toBeGreaterThanOrEqual(8);
    for (const e of hidden) {
      const i = e.choices.findIndex((c) => c.text === 'Ta biết chuyện này sẽ xảy ra');
      expect(e.choices[i].hidden).toBe(true);
      const rich = { ...s, money: { silver: 100, spiritStones: 100 } };
      expect(visibleChoices(rich, content, e).some((v) => v.index === i)).toBe(false);
      expect(visibleChoices({ ...rich, flags: { ...rich.flags, [FORESIGHT_FLAG]: true } }, content, e).some((v) => v.index === i)).toBe(true);
    }
  });
});
