import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { hasUsableInnateRoot, innateRoot, innateRootLabel, revealRoot } from '../src/systems/cultivation';
import { eventWeight, findEvent } from '../src/systems/events/engine';

const content = loadContent();
const life = (seed: string, patch: Partial<GameState> = {}): GameState => {
  const b = createLife({ seed }, content);
  return { ...b, character: { ...b.character, age: 8 }, traits: [], ...patch };
};
const usable = (s: GameState) => hasUsableInnateRoot(s, content);

describe('9.R4a linh căn ẩn', () => {
  it('the root is fixed at birth by the seed: testing shows exactly it, without touching the life RNG', () => {
    const s = life('ir-1');
    const born = innateRoot(s, content);
    expect(innateRoot({ ...s, character: { ...s.character, age: 30 } }, content)).toEqual(born);
    const r = revealRoot(s, content).state;
    expect(r.cult.root).toEqual(born.root);
    expect(r.cult.bodyId ?? null).toEqual(born.bodyId);
    expect(r.rng).toEqual(s.rng);
    expect(innateRootLabel(r, content)).toBeNull();
    expect(innateRootLabel(s, content)).toBeTruthy();
  });

  it('about two in five are born with a usable root', () => {
    let n = 0;
    for (let i = 0; i < 400; i++) if (usable(life(`ir-d${i}`))) n++;
    expect(n / 400).toBeGreaterThan(0.25);
    expect(n / 400).toBeLessThan(0.6);
  });

  it('childhood hints come only to an untested child with a usable innate root', () => {
    const ids = ['dau_hieu_gio_am', 'dau_hieu_ba_do', 'dau_hieu_mong_sao', 'dau_hieu_cay_heo'];
    let yes: GameState | null = null;
    let no: GameState | null = null;
    for (let i = 0; i < 50 && (!yes || !no); i++) {
      const s = life(`ir-h${i}`);
      if (usable(s)) yes ??= s; else no ??= s;
    }
    for (const id of ids) {
      const ev = findEvent(content, id)!;
      expect(eventWeight(yes!, content, ev), id).toBeGreaterThan(0);
      expect(eventWeight(no!, content, ev), id).toBe(0);
      expect(eventWeight(revealRoot(yes!, content).state, content, ev), id).toBe(0);
    }
  });

  it('Nhãn thấu cơ duyên sees whether the root is there', () => {
    const finger = { id: 'nhan_thau_co_duyen', level: 1, since: 12 };
    const pick = (want: boolean) => {
      for (let i = 0; i < 50; i++) {
        const s = life(`ir-f${i}`, { goldenFinger: finger });
        if (usable(s) === want) return { ...s, character: { ...s.character, age: 14 } };
      }
      throw new Error('no seed');
    };
    const has = findEvent(content, 'dau_hieu_mat_trai_co')!;
    const none = findEvent(content, 'dau_hieu_mat_trai_khong')!;
    expect(eventWeight(pick(true), content, has)).toBeGreaterThan(0);
    expect(eventWeight(pick(true), content, none)).toBe(0);
    expect(eventWeight(pick(false), content, none)).toBeGreaterThan(0);
    expect(eventWeight({ ...pick(true), goldenFinger: null }, content, has)).toBe(0);
  });
});
