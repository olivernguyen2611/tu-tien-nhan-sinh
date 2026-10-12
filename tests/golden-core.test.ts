import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { attemptMajorBreakthrough, majorBreakthroughInfo, yearlyGain } from '../src/systems/cultivation';
import { coreGradeFor, placeStrand, strandEffect } from '../src/systems/goldenCore';
import { fateRarityWeights } from '../src/systems/fate';
import { migrate } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.coreForming;

function peak(seed = 'core', patch: Partial<GameState['cult']> = {}): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 80 },
    aptitudes: { physique: 60, comprehension: 60, luck: 50, daoHeart: 60 },
    log: [...b.log, { age: 80, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    paths: {},
    cult: { ...b.cult, realm: 'truc_co', stage: 3, progress: 100, lifespan: 220, foundation: 'trung',
      root: { grade: 'song', elements: ['moc', 'hoa'] }, technique: 'tang_phong_kiem_kinh', lineage: 'tien', ...patch },
  };
}

/** Play kết đan: pick the strand with the best purity that does not crack, else the first. */
function play(s: GameState): GameState {
  let t = s;
  while (t.cult.coreForming) {
    const opts = t.cult.coreForming.offered.map((e) => strandEffect(t, content, e));
    const best = opts.filter((o) => !o.crack).sort((a, b) => b.purity - a.purity)[0] ?? opts[0];
    t = placeStrand(t, content, best.element).state;
  }
  return t;
}

describe('kết đan (task 4.2)', () => {
  it('Kim Đan is open: the attempt starts three rounds and blocks the year', () => {
    const s = peak();
    expect(majorBreakthroughInfo(s, content)!.target.id).toBe('kim_dan');
    const r = attemptMajorBreakthrough(s, content)!;
    expect(r.success).toBeNull();
    const f = r.state.cult.coreForming!;
    expect(f.offered).toHaveLength(cfg.offered);
    expect(f.purity).toBe(Math.round(cfg.startPurity + 10 * cfg.comprehensionPerPoint));
    expect(advanceYear(r.state, content)).toBe(r.state);
  });

  it('root match, tương sinh and clashes score as designed', () => {
    const s = attemptMajorBreakthrough(peak(), content)!.state;
    expect(strandEffect(s, content, 'moc')).toMatchObject({ kind: 'root', purity: cfg.baseGain + cfg.rootMatch, crack: false });
    const afterMoc = { ...s, cult: { ...s.cult, coreForming: { ...s.cult.coreForming!, placed: ['moc'] } } };
    // Mộc feeds Hỏa (and Hỏa is also the root).
    expect(strandEffect(afterMoc, content, 'hoa').purity).toBe(cfg.baseGain + cfg.rootMatch + cfg.flow);
    // Kim beats Mộc: a crack.
    expect(strandEffect(afterMoc, content, 'kim')).toMatchObject({ kind: 'clash', crack: true });
  });

  it('two cracks shatter the core: a failed breakthrough', () => {
    let s = attemptMajorBreakthrough(peak(), content)!.state;
    s = { ...s, cult: { ...s.cult, coreForming: { ...s.cult.coreForming!, placed: ['moc'], round: 1, cracks: 1, offered: ['kim', 'tho', 'thuy'] } } };
    const r = placeStrand(s, content, 'kim');
    expect(r.result!.success).toBe(false);
    expect(r.state.cult.coreForming).toBeNull();
    expect(r.state.cult.realm).toBe('truc_co');
    expect(r.state.cult.fails['truc_co:peak']).toBe(1);
  });

  it('success enters Kim Đan with a grade; better grades cultivate faster and live longer', () => {
    for (let i = 0; i < 30; i++) {
      const s = play({ ...attemptMajorBreakthrough(peak(`ok${i}`), content)!.state });
      if (s.cult.realm !== 'kim_dan') continue;
      const g = s.cult.coreGrade!;
      expect(g).toBeGreaterThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(9);
      expect(s.fate).not.toBeNull();
      const one = { ...s, cult: { ...s.cult, coreGrade: 1 } };
      const nine = { ...s, cult: { ...s.cult, coreGrade: 9 } };
      expect(yearlyGain(one, content) / yearlyGain(nine, content)).toBeCloseTo(cfg.gradeSpeed[0] / cfg.gradeSpeed[8]);
      expect(fateRarityWeights(one, content).than).toBeGreaterThan(0);
      return;
    }
    throw new Error('no success in 30 tries');
  });

  it('grades follow purity thresholds', () => {
    expect(coreGradeFor(content, 100)).toBe(1);
    expect(coreGradeFor(content, 60)).toBe(5);
    expect(coreGradeFor(content, 0)).toBe(9);
  });

  it('a careful player usually forms a middling core; rare top grades', () => {
    const grades: number[] = [];
    let ok = 0;
    for (let i = 0; i < 300; i++) {
      const s = peak(`sim${i}`);
      const t = play({ ...attemptMajorBreakthrough({ ...s, rng: new Rng(`r${i}`).getState() }, content)!.state });
      if (t.cult.realm === 'kim_dan') { ok++; grades.push(t.cult.coreGrade!); }
    }
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    expect(ok / 300).toBeGreaterThan(0.1);
    expect(avg).toBeGreaterThan(3);
    expect(avg).toBeLessThan(7);
    expect(grades.filter((g) => g === 1).length / grades.length).toBeLessThan(0.15);
  });

  it('old saves have no core', () => {
    const s = peak();
    const cult = { ...s.cult } as Partial<GameState['cult']>;
    delete cult.coreGrade;
    delete cult.coreForming;
    expect(migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: { ...s, cult } as unknown as GameState }).life.cult.coreGrade).toBeNull();
  });
});
