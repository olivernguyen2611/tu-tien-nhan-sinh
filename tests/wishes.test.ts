import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { openWish, wishesMet } from '../src/systems/achievements';
import { rebirthPoints } from '../src/systems/rebirth';
import { currentGoal } from '../src/systems/tutorial';

const content = loadContent();

function life(realm: string, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: `wish-${realm}` }, content);
  return { ...b, character: { ...b.character, age: 300 }, cult: { ...b.cult, realm, stage: 1 }, log: [...b.log, { age: 300, lines: [] }], ...patch };
}

describe('6c.8 di nguyện', () => {
  it('a wish is met when its check holds, and each one is worth Luân Hồi points', () => {
    const s = life('hoa_than', { social: { ...life('hoa_than').social, karma: 80 }, alive: false, death: { age: 320, cause: 'old_age', epitaph: 'x', ghostOffer: null } });
    const met = wishesMet(s, content).map((w) => w.id);
    expect(met).toEqual(expect.arrayContaining(['vien_man_hoa_than', 'dai_thien', 'tho_nguyen_tron']));
    const wish = rebirthPoints(s, content).lines.filter((l) => l.label.startsWith('Di nguyện'));
    expect(wish.length).toBe(met.length);
    expect(wish.every((l) => l.points === content.balance.rebirth.wish)).toBe(true);
  });

  it('a mortal meets none, and the goal line names the open wish only from Hóa Thần', () => {
    expect(wishesMet(life('pham_nhan'), content)).toEqual([]);
    const ht = life('hoa_than');
    const open = openWish(ht, content)!;
    expect(open).toBeTruthy();
    expect(currentGoal(ht, content)).toContain(open.name);
    expect(currentGoal(life('nguyen_anh'), content) ?? '').not.toContain('Di nguyện');
  });

  it('wish ids are unique', () => {
    const ids = content.achievements.wishes.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(8);
  });
});
