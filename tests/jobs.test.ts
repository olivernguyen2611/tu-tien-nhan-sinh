import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { doActivity } from '../src/systems/activities';
import { meets } from '../src/systems/events/conditions';
import { addPerf, jobBlocked, jobLine, jobOf, jobViews, jobYear, promoteJob, quitJob, takeJob } from '../src/systems/jobs';
import { monthsLeft } from '../src/systems/timeBudget';

const content = loadContent();
const cfg = content.balance.jobs!;

function worker(age = 20, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'jobs' }, content);
  return {
    ...b, tier: 'pham_gian',
    character: { ...b.character, age, gender: 'nam' },
    stats: { ...b.stats, health: 80, intellect: 60, charm: 60 },
    aptitudes: { ...b.aptitudes, physique: 60, luck: 50 },
    log: [...b.log, { age, lines: [] }],
    ...patch,
  };
}

describe('10.3 việc làm', () => {
  it('has about thirty jobs in eight nhóm nghề', () => {
    expect(content.jobs!.groups).toHaveLength(8);
    expect(content.jobs!.jobs.length).toBeGreaterThanOrEqual(25);
    for (const g of content.jobs!.groups) expect(content.jobs!.jobs.some((j) => j.group === g.id), g.id).toBe(true);
  });

  it('requirements close jobs with a reason (học nghề, khoa cử, tuổi, giới)', () => {
    const s = worker();
    expect(jobBlocked(s, content, 'lam_ruong')).toBeNull();
    expect(jobBlocked(s, content, 'tho_ren')).toContain('rèn');
    expect(jobBlocked(s, content, 'thay_do')).toContain('Tú tài');
    expect(jobBlocked(worker(10), content, 'phu_khuan_vac')).toContain('14');
    expect(jobBlocked(s, content, 'ba_do')).not.toBeNull();
    expect(jobBlocked({ ...s, character: { ...s.character, gender: 'nu' } }, content, 'ba_do')).toBeNull();
    expect(jobViews(s, content).filter((v) => !v.blocked).length).toBeGreaterThan(5);
  });

  it('taking a job meets the boss and đồng liêu, keeps the life rng and takes its months', () => {
    const s = worker();
    const free = monthsLeft(s, content);
    const r = takeJob(s, content, 'lam_ruong')!;
    expect(r.state.rng).toEqual(s.rng);
    const j = jobOf(r.state);
    expect(j.id).toBe('lam_ruong');
    expect(j.perf).toBe(cfg.perfStart);
    expect(r.state.npcs.find((n) => n.id === j.boss)?.kind).toBe('chu');
    expect(j.mates).toHaveLength(cfg.colleagues);
    expect(monthsLeft(r.state, content)).toBe(free - 6);
    expect(jobLine(r.state, content)).toContain('Tá điền');
  });

  it('a year pays and moves hiệu suất toward what the stats make of it', () => {
    const s = takeJob(worker(), content, 'lam_ruong')!.state;
    const y = jobYear(s, content);
    expect(y.money.silver).toBe(s.money.silver + 6);
    expect(jobOf(y).years).toBe(1);
    const weak = takeJob(worker(20, { aptitudes: { physique: 5, comprehension: 50, luck: 5, daoHeart: 50 } }), content, 'lam_ruong')!.state;
    expect(jobOf(jobYear(weak, content)).perf).toBeLessThan(cfg.perfStart);
  });

  it('high hiệu suất climbs the ladder; the top opens the đường đời peak', () => {
    let s = takeJob(worker(), content, 'ban_rong')!.state;
    s = addPerf(s, 50);
    let years = 0;
    while (jobOf(s).rung === 0 && years++ < 40) s = jobYear({ ...addPerf(s, 50), character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(jobOf(s).rung).toBe(1);
    expect(s.career).toMatchObject({ id: 'thuong', rung: 1 });
    // While the job is held it pays the larger of the two livelihoods.
    const after = jobYear(s, content);
    expect(after.money.silver - s.money.silver).toBeGreaterThanOrEqual(20);
  });

  it('low hiệu suất gets the life fired; the trade will not take it back soon', () => {
    let s = takeJob(worker(), content, 'lam_ruong')!.state;
    let years = 0;
    while (jobOf(s).id && years++ < 40) s = jobYear({ ...addPerf(s, -100), character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(jobOf(s).id).toBeNull();
    expect(jobOf(s).past.at(-1)?.why).toBe('fired');
    expect(jobBlocked(s, content, 'lam_ruong')).toContain('đuổi');
    expect(jobBlocked({ ...s, character: { ...s.character, age: s.character.age + cfg.rehireYears } }, content, 'lam_ruong')).toBeNull();
  });

  it('work activities and conditions read the job', () => {
    const s = takeJob(worker(), content, 'tho_xay')!.state;
    expect(meets(s, { job: { group: 'cong' } }, content)).toBe(true);
    expect(meets(s, { job: { id: 'lam_ruong' } }, content)).toBe(false);
    expect(meets(s, { job: { top: false } }, content)).toBe(true);
    const r = doActivity(s, content, 'nghi_viec')!;
    expect(jobOf(r.state).id).toBeNull();
    expect(jobOf(r.state).past.at(-1)?.why).toBe('quit');
    expect(quitJob(promoteJob(s, content), content, 'retire').job?.past.at(-1)).toMatchObject({ id: 'tho_xay', rung: 1, why: 'retire' });
  });
});
