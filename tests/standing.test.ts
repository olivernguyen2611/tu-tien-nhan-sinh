import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews } from '../src/systems/activities';
import { courtYear, initCourt } from '../src/systems/court';
import { eventWeight, findEvent, rollYearEvent } from '../src/systems/events/engine';
import { jobYear } from '../src/systems/jobs';
import { standingMul } from '../src/systems/standing';

const content = loadContent();
const man = (age = 25): GameState => {
  const s = createLife({ seed: 'than-phan', originId: 'nong_dan', gender: 'nam' }, content);
  return { ...s, character: { ...s.character, age, gender: 'nam' }, money: { ...s.money, silver: 500 } };
};
const atWar = (s: GameState): GameState => ({ ...s, court: { ...initCourt(s, content)!, affairs: [{ id: 'ngoai_xam', until: 40 }], started: { ngoai_xam: s.character.age } } });
const official = (s: GameState): GameState => ({ ...s, career: { id: content.office!.career, rung: 1, since: s.character.age } });
const queued = (s: GameState) => s.events.followUps.some((f) => f.event === content.court!.draftEvent);

describe('Thân phận', () => {
  it('a tri huyện is neither taxed nor drafted; a farmer is', () => {
    const farmer = courtYear(atWar(man()), content);
    expect(queued(farmer)).toBe(true);
    const quan = courtYear(official(atWar(man())), content);
    expect(queued(quan)).toBe(false);
    expect(quan.money.silver).toBe(500);
    // The other bắt lính events pass him by too.
    for (const id of ['tc_bat_linh', 'tr_bao_quan_bat_phu']) expect(eventWeight(official(man()), content, findEvent(content, id)!)).toBe(0);
  });

  it('a follow-up that no longer fits is dropped (drafted, then took office the same year)', () => {
    const s = official(man());
    const r = rollYearEvent({ ...s, events: { ...s.events, followUps: [{ event: content.court!.draftEvent!, atAge: s.character.age }] } }, content);
    expect(r.events.pending).not.toBe(content.court!.draftEvent);
    expect(r.events.followUps).toHaveLength(0);
  });

  it('a thiên tử gets no errands of a thường dân, nor their activities', () => {
    const s = man(40);
    const emperor: GameState = { ...s, reign: { since: 35, dynasty: 'Tề', era: 'Hưng Long', how: 'rebel', bars: { treasury: 50, people: 50, army: 50, court: 50 }, good: 0, bad: 0, founder: true } };
    expect(standingMul(emperor, content, findEvent(content, 'vs_muon_tien')!)).toBe(0);
    expect(standingMul(s, content, findEvent(content, 'vs_muon_tien')!)).toBe(1);
    const ids = activityViews(emperor, content).map((v) => v.id);
    expect(ids).toContain('giam_thue');
    for (const id of ['lam_thue', 'cheo_do_thue', 'mua_quan', 'leu_chong_di_thi', 'pp_moc_tui']) expect(ids).not.toContain(id);
    expect(activityViews(s, content).map((v) => v.id)).toContain('lam_thue');
  });

  it('a quan keeps no job on the side', () => {
    const s = official(man());
    const withJob: GameState = { ...s, job: { ...s.job, id: 'lam_ruong', rung: 0, since: 20, years: 2, perf: 50 } as GameState['job'] };
    expect(jobYear(withJob, content).job?.id ?? null).toBeNull();
  });
});
