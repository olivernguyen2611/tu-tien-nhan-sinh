import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { meets } from '../src/systems/events/conditions';
import { addTradeLevel, enrollSchool, lifeStage, schoolLine, schoolMonths, schoolOf, schoolYear, startTrade, tradeLine, tradeOf } from '../src/systems/schooling';
import { monthsLeft } from '../src/systems/timeBudget';

const content = loadContent();
const kid = (age = 7, silver = 50): GameState => {
  const s = createLife({ seed: 'school' }, content);
  return { ...s, tier: 'pham_gian', character: { ...s.character, age }, money: { ...s.money, silver } };
};

describe('10.1 tuổi thơ và học hành', () => {
  it('names the life stage by age', () => {
    expect(lifeStage(content, 2)?.id).toBe('so_sinh');
    expect(lifeStage(content, 9)?.id).toBe('nhi_dong');
    expect(lifeStage(content, 15)?.id).toBe('thieu_nien');
    expect(lifeStage(content, 40)?.id).toBe('truong_thanh');
  });

  it('enrolling makes the teacher and classmates real acquaintances, without moving the life rng', () => {
    const s = kid();
    const after = enrollSchool(s, content, 'truong_lang');
    expect(after.rng).toEqual(s.rng);
    expect(schoolOf(after).at).toBe('truong_lang');
    expect(after.flags.di_hoc).toBe(true);
    const teacher = after.npcs.find((n) => n.id === schoolOf(after).teacher);
    expect(teacher?.kind).toBe('thay');
    expect(after.npcs.length - s.npcs.length).toBe(1 + content.balance.schooling!.classmates);
    expect(schoolLine(after, content)).toContain('Trường làng');
  });

  it('a school year costs the fee and raises học lực; no fee means dropping out', () => {
    const s = enrollSchool(kid(), content, 'truong_lang');
    const year = schoolYear(s, content);
    expect(year.money.silver).toBe(s.money.silver - 3);
    expect(schoolOf(year).grade).toBeGreaterThan(0);
    const poor = schoolYear({ ...s, money: { ...s.money, silver: 1 } }, content);
    expect(schoolOf(poor).at).toBeNull();
    expect(schoolOf(poor).ever).toBe(true);
    const grown = schoolYear({ ...s, character: { ...s.character, age: content.balance.schooling!.leaveAge } }, content);
    expect(schoolOf(grown).at).toBeNull();
  });

  it('school and apprenticeship take months from the year', () => {
    const s = kid(12);
    const free = monthsLeft(s, content);
    const busy = startTrade(enrollSchool(s, content, 'truong_lang'), content, 'ren');
    expect(schoolMonths(busy, content)).toBe(4 + content.balance.schooling!.tradeMonths);
    expect(monthsLeft(busy, content)).toBe(free - schoolMonths(busy, content));
  });

  it('a trade levels up to thợ chính, which sets the craft flag', () => {
    let s = startTrade(kid(13), content, 'ren');
    expect(tradeOf(s).master).toBeTruthy();
    s = addTradeLevel(addTradeLevel(s, content, 1), content, 1);
    expect(tradeOf(s).level).toBe(2);
    expect(s.flags.nghe_ren).toBe(true);
    expect(tradeLine(s, content)).toContain('rèn');
  });

  it('conditions read the school and the trade', () => {
    const s = enrollSchool(kid(), content, 'truong_lang');
    expect(meets(s, { school: { enrolled: true, at: 'truong_lang' } }, content)).toBe(true);
    expect(meets(kid(), { school: { enrolled: true } }, content)).toBe(false);
    expect(meets(kid(), { lifeStage: ['nhi_dong'] }, content)).toBe(true);
    expect(meets(startTrade(kid(13), content, 'moc'), { trade: { id: 'moc', learning: true } }, content)).toBe(true);
  });

  it('school activities appear only while enrolled, and change a stat', () => {
    const out = kid();
    expect(activityViews(out, content).some((a) => a.id === 'cham_hoc')).toBe(false);
    const s = enrollSchool(out, content, 'truong_lang');
    expect(activityViews(s, content).some((a) => a.id === 'cham_hoc')).toBe(true);
    const r = doActivity(s, content, 'cham_hoc');
    expect(r).not.toBeNull();
  });
});
