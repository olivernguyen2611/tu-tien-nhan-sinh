import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { rankingBoard, rankingYear, rollProdigies } from '../src/systems/rankings';
import { migrate } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.rankings;

function cultivator(age: number, realm: string, stage: number): GameState {
  const b = createLife({ seed: 'rank' }, content);
  return {
    ...b,
    character: { ...b.character, age },
    log: [...b.log, { age, lines: [] }],
    cult: { ...b.cult, realm, stage, progress: 0, root: { grade: 'song', elements: ['kim', 'hoa'] } },
  };
}

describe('Thiên kiêu bảng (task 3.5)', () => {
  it('rolls the same prodigies for the same seed, ages around the player', () => {
    const a = rollProdigies('x', content, 10);
    expect(a).toHaveLength(cfg.count);
    expect(rollProdigies('x', content, 10)).toEqual(a);
    for (const p of a) {
      expect(p.age).toBeGreaterThanOrEqual(10 + cfg.ageOffset[0]);
      expect(p.age).toBeLessThanOrEqual(10 + cfg.ageOffset[1]);
    }
  });

  it('prodigies cultivate on their own; the board fills over the years', () => {
    let s = createLife({ seed: 'board' }, content);
    for (let i = 0; i < 30; i++) s = advanceYear({ ...s, events: { ...s.events, pending: null }, fate: null }, content);
    const board = rankingBoard(s, content);
    expect(board.length).toBeGreaterThan(0);
    expect(board.length).toBeLessThanOrEqual(cfg.size);
    expect(board[0].rank).toBe(1);
    expect(s.ranking.prodigies).toHaveLength(cfg.count);
  });

  it('a strong young cultivator enters the board and the log says so; mortals and the old do not', () => {
    const base = rankingYear(cultivator(20, 'luyen_khi', 0), content);
    expect(base.ranking.prodigies).toHaveLength(cfg.count);
    const strong = rankingYear({ ...base, cult: { ...base.cult, realm: 'kim_dan', stage: 3 } }, content);
    expect(strong.ranking.rank).toBe(1);
    expect(strong.log.at(-1)!.lines.some((l) => l.text === content.rankings.top.replace('{name}', base.character.name))).toBe(true);
    expect(rankingBoard({ ...strong, cult: { ...strong.cult, realm: 'pham_nhan' } }, content).some((r) => r.player)).toBe(false);
    const old = rankingYear({ ...strong, character: { ...strong.character, age: cfg.maxAge + 1 } }, content);
    expect(old.ranking.rank).toBeNull();
    expect(old.log.at(-1)!.lines.some((l) => l.text.includes('Quá trăm tuổi'))).toBe(true);
  });

  it('old saves get an empty board, filled the next year', () => {
    const s = cultivator(20, 'luyen_khi', 0);
    const { ranking: _r, ...old } = s;
    const m = migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: old as unknown as GameState });
    expect(m.life.ranking).toEqual({ prodigies: [], rank: null });
    expect(rankingYear(m.life, content).ranking.prodigies).toHaveLength(cfg.count);
  });
});
