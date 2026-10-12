import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { hasHook, hookSum } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { resolveChoice } from '../src/systems/events/engine';
import { meets as conditionsMet } from '../src/systems/events/conditions';
import { birthFingerChance, gainGoldenFinger, loseGoldenFinger, rollBirthFinger } from '../src/systems/goldenFinger';
import { readMeta, recordNewLife, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const born = (finger?: string) => confirmDestiny(rollDestiny(createLife({ seed: 'ktc', goldenFinger: finger }, content), content), content);

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('Kim Thủ Chỉ (task 5b.2)', () => {
  it('has 6–8 kinds, each with levels and a risk', () => {
    const fs = content.goldenFingers.fingers;
    expect(fs.length).toBeGreaterThanOrEqual(6);
    expect(fs.length).toBeLessThanOrEqual(8);
    for (const f of fs) { expect(f.levels.length).toBeGreaterThanOrEqual(2); expect(f.risk.length).toBeGreaterThan(0); }
  });

  it('birth chance grows with lives, capped, and is sure after the pity count', () => {
    const b = content.balance.goldenFinger;
    expect(birthFingerChance(content, 0, 0)).toBeCloseTo(b.birthChance);
    expect(birthFingerChance(content, 1000, 0)).toBe(b.maxChance);
    expect(birthFingerChance(content, 3, b.pityLives)).toBe(1);
    expect(rollBirthFinger('any', content, 3, b.pityLives)).not.toBeNull();
    // Same seed, same draw; it never changes the rest of the birth.
    expect(rollBirthFinger('s1', content, 0, b.pityLives)).toBe(rollBirthFinger('s1', content, 0, b.pityLives));
  });

  it('meta pity counts lives without a finger and resets on one', () => {
    const store = fakeStore();
    recordNewLife(store); recordNewLife(store);
    expect(readMeta(store).fingerPity).toBe(2);
    recordNewLife(store, 0, true);
    expect(readMeta(store).fingerPity).toBe(0);
  });

  it('a finger from birth awakens its first level when the destiny is confirmed', () => {
    const s = born('tuy_than_dong_thien');
    expect(s.goldenFinger).toEqual({ id: 'tuy_than_dong_thien', level: 1, since: 0 });
    expect(hookSum(s, content, 'cultivationSpeed') - hookSum(born(), content, 'cultivationSpeed')).toBeCloseTo(0.15);
    expect(s.log[0].lines.some((l) => l.text.startsWith('Kim Thủ Chỉ · Tùy thân động thiên'))).toBe(true);
  });

  it('awakens further when the realm rises, giving one-time stats once', () => {
    const s0 = born('binh_nho_than_bi');
    const at: GameState = { ...s0, cult: { ...s0.cult, realm: 'kim_dan' } };
    const s = advanceYear(at, content);
    expect(s.goldenFinger!.level).toBe(3);
    expect(s.aptitudes.physique).toBe(Math.min(100, s0.aptitudes.physique + 8));
    expect(advanceYear(s, content).aptitudes.physique).toBe(s.aptitudes.physique);
  });

  it('at most one a life; can be lost; events read it', () => {
    const s = born('doc_tam');
    expect(gainGoldenFinger(s, content, 'he_thong').goldenFinger!.id).toBe('doc_tam');
    expect(hasHook(s, content, 'readMind')).toBe(true);
    const gone = loseGoldenFinger(s, content);
    expect(gone.goldenFinger).toBeNull();
    expect(hasHook(gone, content, 'readMind')).toBe(false);
    expect(conditionsMet(s, { goldenFinger: { id: ['doc_tam'] } } as never, content)).toBe(true);
    expect(conditionsMet(gone, { goldenFinger: { has: false } } as never, content)).toBe(true);
    const random = gainGoldenFinger(born(), content, 'random');
    expect(content.goldenFingers.fingers.some((f) => f.id === random.goldenFinger?.id)).toBe(true);
  });

  it('the ring with the remnant soul (task 4.11) is the Lão gia gia finger', () => {
    const s = born();
    const r = resolveChoice({ ...s, character: { ...s.character, age: 14 }, money: { ...s.money, silver: 50 }, events: { ...s.events, pending: 'tan_hon_cho_phien' } }, content, 0);
    expect(r.state.goldenFinger?.id).toBe('lao_gia_gia');
  });

  it('Hệ thống brings a quest every 3 years', () => {
    let s = born('he_thong');
    const quests = new Set(content.events.filter((e) => e.themes.includes('he_thong')).map((e) => e.id));
    let seen = 0;
    for (let i = 0; i < 30 && s.alive; i++) {
      s = advanceYear({ ...s, events: { ...s.events, pending: null }, combat: null }, content);
      if (s.events.pending && quests.has(s.events.pending)) seen++;
    }
    expect(seen).toBeGreaterThanOrEqual(5);
  });
});
