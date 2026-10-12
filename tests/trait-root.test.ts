import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { revealRoot, traitRootFloor } from '../src/systems/cultivation';

const content = loadContent();
const speed = (g: string) => content.balance.roots.gradeSpeed[g] ?? 0;

function child(traits: string[], seed: string): GameState {
  const s = createLife({ seed }, content);
  return { ...s, traits, cult: { ...s.cult, root: null }, character: { ...s.character, originId: 'nong_dan' }, rng: new Rng(seed).getState() };
}

describe('khí vận tu hành bảo đảm linh căn (playtest 2026-10-12)', () => {
  it('a cultivation trait sets a floor by its rarity; the strongest wins; others set none', () => {
    expect(traitRootFloor(child(['can_cu'], 'a'), content)?.grade).toBe('ngu');
    expect(traitRootFloor(child(['can_cu', 'thuan_linh'], 'a'), content)?.grade).toBe('tam');
    expect(traitRootFloor(child(['hon_don_linh_the'], 'a'), content)?.grade).toBe('bien_di');
    // Thể tu traits help the mortal martial path too, so they guarantee nothing.
    expect(traitRootFloor(child(['hau_bi'], 'a'), content)).toBeNull();
    expect(traitRootFloor(child([], 'a'), content)).toBeNull();
  });

  it('with such a trait the root is always usable and never below the floor', () => {
    for (let i = 0; i < 200; i++) {
      const r = revealRoot(child(['thuan_linh'], `u${i}`), content);
      expect(speed(r.state.cult.root!.grade)).toBeGreaterThanOrEqual(speed('tam'));
      expect(r.line!.text).toContain('Thuần Linh');
    }
    for (let i = 0; i < 100; i++) {
      expect(speed(revealRoot(child(['tien_thien_dao_thai'], `t${i}`), content).state.cult.root!.grade)).toBeGreaterThanOrEqual(speed('bien_di'));
    }
  });

  it('without one, the root test keeps its odds', () => {
    let none = 0;
    for (let i = 0; i < 300; i++) if (revealRoot(child([], `n${i}`), content).state.cult.root!.grade === 'none') none++;
    expect(none / 300).toBeGreaterThan(0.45);
    expect(none / 300).toBeLessThan(0.75);
  });
});
