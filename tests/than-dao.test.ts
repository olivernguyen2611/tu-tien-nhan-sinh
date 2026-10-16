import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { applyOutcome } from '../src/systems/events/engine';
import { Rng } from '../src/core/rng';
import { meritViews, thanDaoYear } from '../src/systems/thanDao';
import { lifeEnding } from '../src/systems/chronicle';

const content = loadContent();
const need = (id: string) => content.thanDao!.paths.find((p) => p.id === id)!.threshold;
const life = (age: number, patch: Partial<GameState> = {}): GameState => {
  const s = createLife({ seed: 'td' }, content);
  return { ...s, ...patch, character: { ...s.character, age } };
};

describe('Đường thành thần (9.S5)', () => {
  it('a life of good deeds earns Công đức each year; nothing for an ordinary one', () => {
    const plain = thanDaoYear(life(30), content);
    expect(plain.merit?.points.cong_duc).toBeUndefined();
    const s = life(30);
    const good = thanDaoYear({ ...s, social: { ...s.social, karma: 70 } }, content);
    expect(good.merit!.points.cong_duc).toBe(2);
    expect(meritViews(good, content).map((m) => m.id)).toContain('cong_duc');
  });

  it('events add points with the merit effect', () => {
    const r = applyOutcome(life(20), content, { text: 'x', effects: { merit: { van_dao: 7 } } as never }, new Rng('m'));
    expect(r.state.merit!.points.van_dao).toBe(7);
  });

  it('milestones once; the ascend event after the threshold and minAge; its flag gives the ending', () => {
    let s = life(40, { merit: { points: { huong_hoa: need('huong_hoa') - 1 }, marks: [] } });
    s = thanDaoYear(s, content);
    expect(s.merit!.marks).toEqual(expect.arrayContaining(['huong_hoa:30', 'huong_hoa:60']));
    expect(s.events.followUps.some((f) => f.event === 'td_huong_hoa_thanh_than')).toBe(false);
    s = thanDaoYear({ ...s, merit: { ...s.merit!, points: { huong_hoa: need('huong_hoa') } }, character: { ...s.character, age: 55 } }, content);
    expect(s.events.followUps[0].event).toBe('td_huong_hoa_thanh_than');
    const again = thanDaoYear(s, content);
    expect(again.events.followUps.filter((f) => f.event === 'td_huong_hoa_thanh_than').length).toBe(1);
    expect(again.merit!.marks.filter((m) => m === 'huong_hoa:30').length).toBe(1);
    const ev = content.events.find((e) => e.id === 'td_huong_hoa_thanh_than')!;
    const done = applyOutcome(s, content, ev.choices[0].result!, new Rng('a')).state;
    expect(lifeEnding({ ...done, alive: false }, content, 1)).toBe('than_dao_huong_hoa');
  });

  it('near the end of life with half the points: the miss event', () => {
    const s = life(70, { merit: { points: { van_dao: need('van_dao') / 2 + 1 }, marks: [] } });
    const near = thanDaoYear({ ...s, cult: { ...s.cult, lifespan: 72 } }, content);
    expect(near.events.followUps[0].event).toBe('td_van_dao_thieu');
  });
});
