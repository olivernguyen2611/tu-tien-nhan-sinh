import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { combatPower, combatSpeed } from '../src/systems/combat';
import { duelTable, matchChance } from '../src/systems/duel';

const content = loadContent();
const rows = duelTable(content);
const win = (martial: string, foe: string) => rows.find((r) => r.martial === martial && r.foe === foe)!.match;

describe('9.V1: thước sức mạnh võ đạo ↔ tu tiên', () => {
  it('best of three from one round', () => {
    expect(matchChance(0.5)).toBeCloseTo(0.5);
    expect(matchChance(1)).toBe(1);
  });

  it('each high martial stage meets the realm the owner set (15/10 16:40)', () => {
    // Hóa cảnh barely holds Luyện Khí tầng 1.
    expect(win('Hóa cảnh', 'Luyện Khí tầng 1')).toBeGreaterThan(0.2);
    expect(win('Hóa cảnh', 'Luyện Khí tầng 1')).toBeLessThan(0.45);
    // Tam hoa matches the top of Luyện Khí, not yet Trúc Cơ.
    expect(win('Tam hoa tụ đỉnh', 'Luyện Khí tầng 9')).toBeGreaterThan(0.4);
    expect(win('Tam hoa tụ đỉnh', 'Trúc Cơ sơ kỳ')).toBeLessThan(0.25);
    // Ngũ khí fights late and peak Trúc Cơ, and loses to Kim Đan.
    expect(win('Ngũ khí triều nguyên', 'Trúc Cơ hậu kỳ')).toBeGreaterThan(0.3);
    expect(win('Ngũ khí triều nguyên', 'Trúc Cơ viên mãn')).toBeGreaterThan(0.25);
    expect(win('Ngũ khí triều nguyên', 'Kim Đan sơ kỳ')).toBeLessThan(0.1);
  });

  it('every step up the martial ladder is stronger, by at most ×3', () => {
    const p = content.balance.martial.combatPower;
    for (let i = 1; i < p.length; i++) {
      expect(p[i]).toBeGreaterThan(p[i - 1]);
      expect(p[i] / p[i - 1]).toBeLessThanOrEqual(3);
    }
  });

  it('a Hóa cảnh mortal moves like Luyện Khí, and keeps martial power after starting to cultivate', () => {
    const born = createLife({ seed: 'duel' }, content);
    const hoaCanh = { ...born, martial: { ...born.martial, stage: 4 } };
    const lk = { ...born, cult: { ...born.cult, realm: 'luyen_khi', stage: 0 } };
    expect(combatSpeed(hoaCanh, content)).toBe(combatSpeed(lk, content));
    const nguKhi = { ...born, martial: { ...born.martial, stage: 6 } };
    expect(combatPower({ ...nguKhi, cult: { ...nguKhi.cult, realm: 'luyen_khi', stage: 0 } }, content)).toBeGreaterThanOrEqual(combatPower(nguKhi, content));
  });
});
