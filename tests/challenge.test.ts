import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import type { GameState } from '../src/core/types';
import { challengeDef, challengeResult, creditKey, startChallenge, weekKey, weeklyChallenge } from '../src/systems/challenge';
import { confirmDestiny, rerollDestiny, toggleLock } from '../src/systems/destiny';
import { creditRebirth, readMeta, recordChallenge, recordNewLife, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const dead = (s: GameState, age: number): GameState =>
  ({ ...s, character: { ...s.character, age }, alive: false, death: { age, cause: 'old_age', epitaph: '' } });
/** A week whose challenge is the given id. */
function weekOf(id: string): string {
  for (let w = 1; w <= 53 * 4; w++) {
    const week = `${2026 + Math.floor((w - 1) / 53)}-W${String(((w - 1) % 53) + 1).padStart(2, '0')}`;
    if (weeklyChallenge(content, week)?.id === id) return week;
  }
  throw new Error(`no week for ${id}`);
}

describe('Thử thách tuần (task 5b.6)', () => {
  it('ISO week keys', () => {
    expect(weekKey(new Date(Date.UTC(2026, 9, 12)))).toBe('2026-W42');
    expect(weekKey(new Date(Date.UTC(2021, 0, 1)))).toBe('2020-W53');
    expect(weekKey(new Date(Date.UTC(2024, 11, 30)))).toBe('2025-W01');
  });

  it('the same challenge and the same birth for everyone in a week', () => {
    const week = '2026-W42';
    expect(weeklyChallenge(content, week)).toEqual(weeklyChallenge(content, week));
    const a = startChallenge(content, week, 1)!;
    const b = startChallenge(content, week, 2)!;
    expect(a.seed).toBe(b.seed);
    expect(a.character.name).toBe(b.character.name);
    expect(a.destiny.offered).toEqual(b.destiny.offered);
    expect(creditKey(a)).not.toBe(creditKey(b));
  });

  it('fixed origin, given traits stay locked, no rerolls unless the rules give some', () => {
    const farm = startChallenge(content, weekOf('pham_nhan_truong_tho'))!;
    expect(farm.character.originId).toBe('nong_dan');
    expect(farm.destiny.rerollsLeft).toBe(0);
    expect(farm.goldenFinger).toBeNull();
    expect(Object.keys(farm.rebirthTalents)).toHaveLength(0);

    const bad = startChallenge(content, weekOf('kho_tan_cam_lai'))!;
    expect(bad.destiny.offered).toEqual(expect.arrayContaining(['dao_moi_tinh', 'khac_than_menh']));
    const kept = toggleLock(bad, 'dao_moi_tinh');
    expect(kept.destiny.locked).toEqual(bad.destiny.locked);
    expect(rerollDestiny(bad, content)).toBe(bad);
  });

  it('the goal is read at death', () => {
    const s = confirmDestiny(startChallenge(content, weekOf('pham_nhan_truong_tho'))!, content);
    expect(challengeResult(s, content)).toBeNull();
    expect(challengeResult(dead(s, 50), content)!.done).toBe(false);
    expect(challengeResult(dead(s, 91), content)!.done).toBe(true);
    expect(challengeDef(content, s.challenge!.id)!.goalText).toContain('90');
  });

  it('meta: keeps the best score, credits each try once and leaves the Phúc báo alone', () => {
    const store = fakeStore();
    const s = dead(confirmDestiny(startChallenge(content, '2026-W42', 1)!, content), 70);
    creditRebirth(store, 'doi-truoc', 5, [{ id: 'x' }]);
    recordNewLife(store, 0, false, true);
    expect(readMeta(store).blessings).not.toBeNull();
    expect(creditRebirth(store, creditKey(s), 10).gained).toBe(10);
    expect(creditRebirth(store, creditKey({ ...s, challenge: { ...s.challenge!, try: 2 } }), 10).gained).toBe(10);
    recordChallenge(store, '2026-W42', s.challenge!.id, 10, false);
    recordChallenge(store, '2026-W42', s.challenge!.id, 4, true);
    expect(readMeta(store).weekly['2026-W42']).toEqual({ id: s.challenge!.id, tries: 2, best: 10, done: true });
    for (let w = 1; w <= 15; w++) recordChallenge(store, `2025-W${String(w).padStart(2, '0')}`, 'x', 1, false);
    expect(Object.keys(readMeta(store).weekly)).toHaveLength(12);
    expect(readMeta(store).weekly['2026-W42']).toBeDefined();
  });
});
