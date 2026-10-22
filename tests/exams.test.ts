import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { doActivity } from '../src/systems/activities';
import { careerViews, lifeTitles } from '../src/systems/career';
import { meets } from '../src/systems/events/conditions';
import { answerExam, approachChance, beginExam, examBlocked, examHeld, examLine, examOf, examView, resolveIncident } from '../src/systems/exams';
import { makeSave, migrate } from '../src/systems/save';
import { simulateMany } from '../src/systems/simulate';

const content = loadContent();
const cfg = content.balance.exams!;

/** A scholar of `age` with học lực `grade`, exam rank `rank`, at a year the next exam is held. */
function scholar(age = 16, grade = 70, rank = -1, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'exam' }, content);
  const s: GameState = {
    ...b, tier: 'pham_gian',
    character: { ...b.character, age },
    stats: { ...b.stats, intellect: 70, charm: 60, happiness: 50 },
    money: { ...b.money, silver: 100 },
    school: { at: null, since: null, grade, teacher: null, ever: true },
    exam: { ...b.exam!, rank, sitting: null },
    times: b.times ? { ...b.times, phase: 'thinh_the' } : b.times,
    ...patch,
  };
  // Move to the next year the level is held.
  let x = s;
  for (let i = 0; i < 3 && !examHeld(x, content, content.exams!.levels[rank + 1]?.id ?? 'huyen').held; i++) x = { ...x, character: { ...x.character, age: x.character.age + 1 } };
  return x;
}
/** Force the sitting's score and finish its rounds with the given approach. */
function sitAll(s: GameState, approach = 'chinh_luan'): GameState {
  let x = s;
  for (let i = 0; i < 12 && examOf(x).sitting; i++) {
    const r = examView(x, content)!.incident ? resolveIncident(x, content, 0) : answerExam(x, content, approach);
    x = r!.state;
  }
  return x;
}
const withScore = (s: GameState, score: number): GameState => ({ ...s, exam: { ...examOf(s), sitting: { ...examOf(s).sitting!, score, incident: null, round: cfg.rounds - 1 } } });

describe('10.2 khoa cử', () => {
  it('thi huyện and thi viện come every year; thi Hương every three years; loạn thế holds only the low ones', () => {
    const s = scholar(20, 70, 1);
    const years = [0, 1, 2, 3, 4, 5].filter((d) => examHeld({ ...s, character: { ...s.character, age: 20 + d } }, content, 'huong').held);
    expect(years.length).toBe(2);
    expect(years[1] - years[0]).toBe(3);
    expect(examHeld(s, content, 'huyen').held).toBe(true);
    const loan = { ...s, times: { ...s.times!, phase: 'loan_the' } };
    expect(examHeld(loan, content, 'huong').held).toBe(false);
    expect(examHeld(loan, content, 'vien').held).toBe(true);
    const an = { ...s, times: { ...s.times!, phase: 'tan_trieu' } };
    for (let d = 0; d < 3; d++) expect(examHeld({ ...an, character: { ...an.character, age: 20 + d } }, content, 'huong').held).toBe(true);
  });

  it('says why an exam cannot be sat', () => {
    expect(examBlocked(scholar(8, 70), content)).toContain('tuổi');
    expect(examBlocked(scholar(16, 5), content)).toContain('Học lực');
    expect(examBlocked(scholar(16, 70, -1, { money: { silver: 0, spiritStones: 0 } as GameState['money'] }), content)).toContain('Lộ phí');
    expect(examBlocked(scholar(16, 70), content)).toBeNull();
  });

  it('sitting pays the lộ phí, blocks the year and keeps the life rng', () => {
    const s = scholar();
    const sat = beginExam(s, content);
    expect(sat.money.silver).toBe(s.money.silver - cfg.levels.huyen.fee);
    expect(sat.rng).toEqual(s.rng);
    expect(examOf(sat).sitting?.level).toBe('huyen');
    expect(advanceYear(sat, content)).toBe(sat);
    expect(examBlocked(sat, content)).not.toBeNull();
  });

  it('passing gives the title, flag and rewards; failing counts', () => {
    const s = beginExam(scholar(), content);
    const pass = answerExam(withScore(s, 10), content, 'chinh_luan')!;
    expect(pass.done).toBe(true);
    expect(examOf(pass.state).rank).toBe(0);
    expect(pass.state.flags.dong_sinh).toBe(true);
    expect(examLine(pass.state, content)).toBe('Đồng sinh');
    const fail = answerExam(withScore(s, -5), content, 'chinh_luan')!;
    expect(examOf(fail.state).rank).toBe(-1);
    expect(examOf(fail.state).fails).toBe(1);
    expect(fail.state.stats.happiness).toBeLessThan(s.stats.happiness);
  });

  it('thi Hội leads straight into thi Đình; a top score is Trạng nguyên', () => {
    const s = beginExam(scholar(30, 90, 2), content);
    expect(examOf(s).sitting?.level).toBe('hoi');
    const hoi = answerExam(withScore(s, 20), content, 'chinh_luan')!;
    expect(examOf(hoi.state).rank).toBe(3);
    expect(examOf(hoi.state).sitting?.level).toBe('dinh');
    const dinh = answerExam(withScore(hoi.state, 20), content, 'chinh_luan')!;
    expect(examOf(dinh.state).placing).toBe('trang_nguyen');
    expect(lifeTitles(dinh.state, content)).toContain('Trạng nguyên khai khoa');
    expect(meets(dinh.state, { exam: { placing: ['trang_nguyen'] } }, content)).toBe(true);
  });

  it('risky ways score more or less; chances follow học lực and the level', () => {
    const s = beginExam(scholar(), content);
    const low = beginExam(scholar(16, 20), content);
    expect(approachChance(s, content, 'chinh_luan')).toBeGreaterThan(approachChance(low, content, 'chinh_luan'));
    const hoi = beginExam(scholar(30, 70, 2), content);
    expect(approachChance(hoi, content, 'chinh_luan')).toBeLessThan(approachChance(s, content, 'chinh_luan'));
    const done = sitAll(s);
    expect(examOf(done).sitting).toBeNull();
    expect(examOf(done).rank + examOf(done).fails).toBeGreaterThanOrEqual(0);
  });

  it('an incident can disqualify', () => {
    const s = beginExam(scholar(), content);
    const sit = { ...examOf(s).sitting!, incident: 'om_giua_truong_thi', incidentRound: 0, round: 0 };
    const x: GameState = { ...s, exam: { ...examOf(s), sitting: sit } };
    expect(examView(x, content)?.incident?.id).toBe('om_giua_truong_thi');
    expect(answerExam(x, content, 'chinh_luan')).toBeNull();
    const r = resolveIncident(x, content, 1)!;
    expect(r.done).toBe(true);
    expect(examOf(r.state).fails).toBe(1);
  });

  it('Quan lộ opens at Cử nhân', () => {
    const blocked = careerViews(scholar(20, 70, 1), content).find((c) => c.id === 'quan')!;
    expect(blocked.blocked).toContain('Cử nhân');
    expect(careerViews(scholar(20, 70, 2), content).find((c) => c.id === 'quan')!.blocked).toBeNull();
  });

  it('Lều chõng đi thi opens the trường thi', () => {
    const s = scholar();
    const r = doActivity(s, content, 'leu_chong_di_thi');
    expect(r).not.toBeNull();
    expect(examOf(r!.state).sitting).not.toBeNull();
  });

  it('an old Quan lộ save keeps its standing as exam ranks', () => {
    const base = createLife({ seed: 'old-quan' }, content);
    const { exam: _e, ...old } = { ...base, career: { id: 'quan', rung: 2, since: 20 }, events: { ...base.events, pending: 'thi_hoi' } };
    const save = { ...makeSave(old as GameState, 1), saveVersion: 6 };
    const life = migrate(save, base).life;
    expect(life.exam?.rank).toBe(4);
    expect(life.flags.tien_si).toBe(true);
    expect(life.career).toMatchObject({ id: 'quan', rung: 1 });
    expect(life.events.pending).toBeNull();
    const tuTai = migrate({ ...makeSave({ ...old, career: { id: 'quan', rung: 0, since: 20 } } as GameState, 1), saveVersion: 6 }, base).life;
    expect(tuTai.exam?.rank).toBe(1);
    expect(tuTai.career.id).toBeNull();
  });

  it('the scholar persona passes exams over many lives', () => {
    const { results } = simulateMany(content, 30, 'exam-sim', { profile: 'thu_sinh' });
    const tuTai = results.filter((r) => (r.examRank ?? -1) >= 1).length;
    expect(tuTai).toBeGreaterThan(3);
  }, 60_000);
});
