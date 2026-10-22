import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { eventWeight, findEvent, resolveChoice } from '../src/systems/events/engine';
import { jobBlocked } from '../src/systems/jobs';
import { arrest, commitCrime, imprison, lawLine, lawOf, lawYear, sentence, tryEscape } from '../src/systems/law';

const content = loadContent();
const cfg = content.balance.law!;

function adult(age = 25, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'law' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age }, money: { ...b.money, silver: 300 }, log: [...b.log, { age, lines: [] }], ...patch };
}
const older = (s: GameState, n = 1): GameState => ({ ...s, character: { ...s.character, age: s.character.age + n } });
const withTrial = (s: GameState, crime: string, score: number): GameState => ({ ...s, law: { ...lawOf(s), trial: { crime, score } } });

describe('10.9 phạm pháp', () => {
  it('a crime pays or gets you caught and sent to công đường', () => {
    let caught = 0, paid = 0;
    for (let i = 0; i < 30; i++) {
      const b = adult(20 + i);
      const s = commitCrime(b, content, 'trom_nha_giau');
      if (s.events.pending === 'pp_cong_duong') { caught++; expect(lawOf(s).trial?.crime).toBe('trom_nha_giau'); }
      else { paid++; expect(s.money.silver).toBeGreaterThan(b.money.silver); }
      expect(s.social.karma).toBeLessThan(b.social.karma);
    }
    expect(caught).toBeGreaterThan(0);
    expect(paid).toBeGreaterThan(0);
  });

  it('the verdict follows the crime and the điểm at công đường', () => {
    const b = adult();
    expect(lawOf(sentence(withTrial(b, 'moc_tui', 1), content)).convictions).toBe(0); // tha bổng
    const fined = sentence(withTrial(b, 'moc_tui', 0), content);
    expect(fined.money.silver).toBeLessThan(b.money.silver);
    expect(fined.flags.tien_an).toBe(true);
    const jailed = sentence(withTrial(b, 'trom_nha_giau', 0), content);
    expect(lawOf(jailed).jail).toBeTruthy();
    const dead = sentence(withTrial(b, 'giet_nguoi', 0), content);
    expect(dead.events.pending).toBe('pp_an_tu');
  });

  it('công đường is two steps that end in a verdict; tử hình can end the life', () => {
    let s = arrest(adult(), content, 'danh_nguoi');
    s = resolveChoice(s, content, 0).state; // khai thật
    expect(s.events.pending).toBe('pp_cong_duong_2');
    s = resolveChoice(s, content, 3).state; // nhận án
    expect(lawOf(s).trial).toBeNull();
    let d = sentence(withTrial(adult(), 'giet_nguoi', 0), content);
    d = resolveChoice(d, content, 0).state;
    expect(d.alive).toBe(false);
    expect(d.death?.cause).toBe('execution');
  });

  it('in ngục only ngục activities and events; released when the years are up', () => {
    let s = imprison(adult(), content, 'trom_vat', 2);
    const ids = activityViews(s, content).map((v) => v.id);
    expect(ids).toContain('pp_dao_ham');
    expect(ids).not.toContain('tuu_lau');
    expect(eventWeight(s, content, findEvent(content, 'pp_bi_trom')!)).toBe(0);
    expect(eventWeight(s, content, findEvent(content, 'pp_nguc_dai_ca')!)).toBeGreaterThan(0);
    expect(jobBlocked(s, content, 'lam_ruong')).toBeTruthy();
    expect(lawLine(s, content)).toContain('Trong ngục');
    s = lawYear(older(s, 2), content);
    expect(lawOf(s).jail).toBeNull();
  });

  it('vượt ngục grows harder with every failed try', () => {
    let s = imprison(adult(), content, 'trom_vat', 3);
    let tries = 0;
    while (lawOf(s).jail && tries < 40) { s = tryEscape(older(s), content); tries++; }
    if (!lawOf(s).jail) expect(lawOf(s).wanted).toBe(cfg.maxWanted);
    expect(lawOf(s).failedEscapes + lawOf(s).escapes).toBe(tries);
  });

  it('a tiền án closes some jobs; truy nã cools with time', () => {
    const s = sentence(withTrial(adult(), 'moc_tui', 0), content);
    expect(jobBlocked(s, content, 'bo_khoai')).toContain('tiền án');
    let w: GameState = { ...adult(), law: { ...lawOf(adult()), wanted: 3, lastCrimeAge: 25 } };
    for (let i = 0; i < cfg.decayEvery * 3; i++) w = lawYear(older(w), content);
    expect(lawOf(w).wanted).toBe(0);
  });

  it('crimes are activities for adults only', () => {
    expect(activityViews(adult(8), content).map((v) => v.id)).not.toContain('pp_trom_nha_giau');
    const s = doActivity(adult(), content, 'pp_moc_tui')!.state;
    expect(lawOf(s).lastCrime).toBe('moc_tui');
  });
});
