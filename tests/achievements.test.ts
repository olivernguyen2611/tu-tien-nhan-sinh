import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { earnedAchievements, lifeBadges, lifeMeets, unlockedFingers } from '../src/systems/achievements';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { readMeta, recordAchievements, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const life = confirmDestiny(rollDestiny(createLife({ seed: 'tt' }, content), content), content);
const dead = (over: Partial<GameState>, age = 70, cause: NonNullable<GameState['death']>['cause'] = 'old_age'): GameState =>
  ({ ...life, ...over, character: { ...life.character, age }, alive: false, death: { age, cause, epitaph: 'x' } });

describe('thành tựu, huy hiệu, cáo phó (task 5b.5)', () => {
  it('has thành tựu and badges, with a fallback badge for any life', () => {
    expect(content.achievements.achievements.length).toBeGreaterThanOrEqual(20);
    expect(content.achievements.badges.some((b) => Object.keys(b.when).length === 0)).toBe(true);
  });

  it('checks a finished life', () => {
    const old = dead({}, 105);
    expect(lifeMeets(old, content, { ageMin: 100, mortal: true }, 1)).toBe(true);
    expect(lifeMeets(old, content, { realmMin: 'truc_co' }, 1)).toBe(false);
    expect(lifeMeets(old, content, { livesMin: 10 }, 9)).toBe(false);
    expect(lifeMeets(dead({}, 40, 'tribulation'), content, { cause: ['tribulation'] }, 1)).toBe(true);
    expect(earnedAchievements(old, content, 1).map((a) => a.id)).toContain('tram_tuoi');
    expect(earnedAchievements(life, content, 1)).toEqual([]);
  });

  it('gives at most balance.badges.max badges, best first', () => {
    const rich = dead({ money: { silver: 20000, spiritStones: 0 }, social: { ...life.social, karma: 90 } }, 110);
    const b = lifeBadges(rich, content, 1);
    expect(b.length).toBe(content.balance.badges.max);
    expect(b[0].id).toBe('bo_tat_song');
    expect(lifeBadges(dead({}, 50), content, 1).map((x) => x.id)).toEqual(['mot_doi_binh_thuong']);
  });

  it('meta keeps thành tựu once; some unlock a Kim Thủ Chỉ', () => {
    const store = fakeStore();
    expect(recordAchievements(store, ['tram_tuoi', 'thap_the_luan_hoi'], 'A').fresh).toEqual(['tram_tuoi', 'thap_the_luan_hoi']);
    expect(recordAchievements(store, ['tram_tuoi'], 'B').fresh).toEqual([]);
    expect(readMeta(store).achievements.tram_tuoi.name).toBe('A');
    expect(unlockedFingers(content, Object.keys(readMeta(store).achievements))).toEqual(['binh_nho_than_bi']);
  });
});
