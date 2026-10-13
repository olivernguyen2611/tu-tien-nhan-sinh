import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { makeSave, migrate } from '../src/systems/save';
import { techniqueSummary } from '../src/systems/technique';
import { currentGoal, disableTutorial, dismissTip, pendingTip } from '../src/systems/tutorial';

const content = loadContent();
const life = (tutorial = true) => createLife({ seed: 'tut', tutorial }, content);
const withCult = (s: GameState, cult: Partial<GameState['cult']>, age = 20): GameState =>
  ({ ...s, character: { ...s.character, age }, cult: { ...s.cult, ...cult } });
const song = { grade: 'song', elements: ['kim', 'hoa'] };

describe('goals and tips (task 2.9)', () => {
  it('the goal follows the life: test, mortal, Luyện Khí, peak, Trúc Cơ', () => {
    const s = life();
    expect(currentGoal(s, content)).toContain('thử linh căn');
    expect(currentGoal(withCult(s, { root: { grade: 'none', elements: [] } }), content)).toContain('phàm nhân');
    expect(currentGoal(withCult(s, { root: song, realm: 'luyen_khi', stage: 3 }), content)).toBe('Tu tới Luyện Khí tầng 9.');
    expect(currentGoal(withCult(s, { root: song, realm: 'luyen_khi', stage: 8, progress: 100 }), content)).toContain('Đột phá Trúc Cơ');
    expect(currentGoal(withCult(s, { root: song, realm: 'truc_co' }), content)).toContain('Trúc Cơ viên mãn');
    expect(currentGoal({ ...s, alive: false }, content)).toBeNull();
  });

  it('a rootless cultivator on the Buddhist path is not told to live as a mortal (6b.10)', () => {
    const none = { grade: 'none', elements: [] };
    const monk = withCult(life(), { root: none, realm: 'luyen_khi', stage: 0, technique: 'vo_uu_thien_tam_phap', lineage: 'phat' });
    expect(currentGoal(monk, content)).toBe('Tu tới Luyện Khí tầng 9.');
    expect(techniqueSummary(monk, content)).toContain('không cần linh căn');
    expect(techniqueSummary(monk, content)).not.toContain('hợp linh căn');
  });

  it('tips show one at a time, only once, only when enabled', () => {
    let s = life();
    expect(pendingTip(s, content)?.id).toBe('start');
    s = dismissTip(s, 'start');
    expect(pendingTip(s, content)).toBeNull(); // the next tips wait for age 2
    s = { ...s, character: { ...s.character, age: 2 } };
    expect(pendingTip(s, content)?.id).toBe('terms');
    expect(pendingTip(disableTutorial(s), content)).toBeNull();
    expect(pendingTip(life(false), content)).toBeNull();
  });

  it('the peak tip shows at a full last stage', () => {
    const seen = content.tutorial.tips.map((t) => t.id).filter((id) => id !== 'peak');
    const s = { ...withCult(life(), { root: song, realm: 'luyen_khi', stage: 8, progress: 100 }), tutorial: { enabled: true, seen } };
    expect(pendingTip(s, content)?.id).toBe('peak');
  });

  it('old saves get the tutorial off', () => {
    const { tutorial: _t, ...old } = life();
    expect(migrate(makeSave(old as GameState, 1)).life.tutorial).toEqual({ enabled: false, seen: [] });
  });
});
