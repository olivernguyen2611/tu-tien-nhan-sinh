import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeHooks } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { devSpecial } from '../src/systems/dev';
import { bindSystem, doSystemAction, levelFor, systemActions, systemDef, systemYear } from '../src/systems/heThong';

const content = loadContent();
const born = (seed: string) => confirmDestiny(rollDestiny(createLife({ seed, lifeNo: 5 }, content), content), content);
const adult = (s: GameState, age = 20): GameState => ({ ...s, character: { ...s.character, age } });

describe('Hệ thống (9.S2)', () => {
  it('a Xuyên không origin binds its system; the panel offers điểm danh, the shop and đoạn tuyệt', () => {
    const s = devSpecial({ ...born('a'), goldenFinger: null }, content, 'xuyen_khong_diem_danh');
    expect(s.system).toMatchObject({ id: 'diem_danh', points: 0, level: 0, gone: false });
    const views = systemActions(adult(s), content);
    expect(views.map((v) => v.id)).toEqual(expect.arrayContaining(['checkin', 'shop:doi_bac', 'quit']));
    expect(views.find((v) => v.id === 'shop:doi_bac')!.blocked).toMatch(/Thiếu/);
  });

  it('điểm danh once a year gives points; levels follow points and add all-life hooks', () => {
    let s = adult(bindSystem(born('b'), content, 'diem_danh'));
    const r = doSystemAction(s, content, 'checkin')!;
    expect(r.state.system!.points).toBe(15);
    expect(systemActions(r.state, content).find((v) => v.id === 'checkin')!.blocked).toBeTruthy();
    expect(doSystemAction(r.state, content, 'checkin')).toBeNull();
    s = { ...r.state, system: { ...r.state.system!, points: 55, checkin: null } };
    s = doSystemAction(s, content, 'checkin')!.state;
    expect(s.system!.level).toBe(levelFor(systemDef(content, 'diem_danh')!, 70));
    expect(s.system!.level).toBe(1);
    expect(lifeHooks(s, content).some((h) => h.hook === 'cultivationSpeed')).toBe(true);
  });

  it('a negative-cost shop line sells lifespan for points', () => {
    const s = adult(bindSystem(born('c'), content, 'doi_tho'));
    const r = doSystemAction(s, content, 'shop:ban_tho')!;
    expect(r.state.system!.points).toBe(50);
    expect(r.state.cult.lifespan).toBeLessThan(s.cult.lifespan);
  });

  it('tasks are given, then rewarded when the goal is met or failed past the deadline', () => {
    let s = adult(bindSystem(born('d'), content, 'nhiem_vu'), 15);
    s = { ...s, system: { ...s.system!, task: { id: 'tich_bac', until: 20 } } };
    const rich = systemYear({ ...s, money: { ...s.money, silver: 600 } }, content);
    expect(rich.system!.task).toBeNull();
    expect(rich.system!.done).toContain('tich_bac');
    expect(rich.system!.points).toBe(25);
    const late = systemYear(adult({ ...s, money: { ...s.money, silver: 0 } }, 21), content);
    expect(late.system!.task).toBeNull();
    expect(late.system!.done).not.toContain('tich_bac');
    // Over enough years a task comes.
    let t: GameState = { ...s, system: { ...s.system!, task: null } };
    for (let i = 0; i < 20 && !t.system!.task; i++) t = systemYear(adult(t, 15 + i), content);
    expect(t.system!.task).not.toBeNull();
  });

  it('đoạn tuyệt turns it off for good, and the hooks go with it', () => {
    const s = adult(bindSystem(born('e'), content, 'thoi_dien'));
    const r = doSystemAction(s, content, 'quit')!;
    expect(r.state.system!.gone).toBe(true);
    expect(systemActions(r.state, content)).toEqual([]);
    expect(lifeHooks(r.state, content).length).toBeLessThan(lifeHooks(s, content).length);
  });
});

describe('Hệ thống hố người (9.S2b)', () => {
  it('drops clues, then betrays at its age', () => {
    let s = adult(bindSystem(born('f'), content, 'loi_he_thong'), 30);
    for (let a = 30; a < 60; a++) s = systemYear(adult(s, a), content);
    expect(s.system!.clues).toBeGreaterThan(0);
    expect(s.system!.gone).toBe(false);
    const health = s.stats.health;
    s = systemYear(adult(s, 60), content);
    expect(s.system!.gone).toBe(true);
    expect(s.stats.health).toBeLessThan(health);
  });

  it('betrays at a realm; cutting it off first avoids it', () => {
    const def = systemDef(content, 'dai_le_bao')!;
    expect(def.trap!.betrayAt.realm).toBe('truc_co');
    const s = adult(bindSystem(born('g'), content, 'dai_le_bao'));
    const up: GameState = { ...s, cult: { ...s.cult, realm: 'truc_co' } };
    expect(systemYear(up, content).system!.gone).toBe(true);
    const quit = doSystemAction(s, content, 'quit')!.state;
    const after = systemYear({ ...quit, cult: { ...quit.cult, realm: 'truc_co' } }, content);
    expect(after.cult.lifespan).toBe(quit.cult.lifespan);
  });

  it('a whole life with a system runs without errors', () => {
    let s = adult(bindSystem(born('h'), content, 'khoai_lac'), 6);
    for (let i = 0; i < 80 && s.alive; i++) {
      if (s.events.pending) s = { ...s, events: { ...s.events, pending: null } };
      const c = doSystemAction(s, content, 'checkin');
      if (c) s = c.state;
      s = advanceYear(s, content);
    }
    expect(s.system!.points).toBeGreaterThan(0);
  });
});
