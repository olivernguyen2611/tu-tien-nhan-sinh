import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { gainGoldenFinger, SURE_CHECK_FLAG } from '../src/systems/goldenFinger';
import { hookSum } from '../src/systems/cultivation';
import { doFingerAction, fingerActionViews } from '../src/systems/fingerActions';

const content = loadContent();

function withFinger(id: string, age = 20, realm = 'luyen_khi'): GameState {
  const b = createLife({ seed: 'finger' }, content);
  const s: GameState = { ...b, character: { ...b.character, age }, cult: { ...b.cult, realm }, log: [...b.log, { age, lines: [] }] };
  return gainGoldenFinger(s, content, id);
}

describe('Kim Thủ Chỉ actions (playtest 2)', () => {
  it('every finger has actions, at least one open at level 1', () => {
    // 9.R3b: a passive finger (Trường sinh ấn) may have none; the rest open one by level 2.
    for (const f of content.goldenFingers.fingers) {
      if (f.actions.length === 0) { expect(f.signature, f.id).toBeTruthy(); continue; }
      expect(f.actions.some((a) => a.minLevel <= 2), f.id).toBe(true);
    }
  });

  it('an action works once per cooldown, then opens again', () => {
    const s = withFinger('binh_nho_than_bi');
    const r = doFingerAction(s, content, 'tuoi_vuon')!;
    expect(r.state.money.spiritStones).toBe(s.money.spiritStones + 2);
    expect(r.state.log.at(-1)!.lines.at(-1)!.text).toContain('Tưới linh dịch');
    expect(fingerActionViews(r.state, content).find((a) => a.id === 'tuoi_vuon')!.blocked).toContain('Năm nay');
    expect(doFingerAction(r.state, content, 'tuoi_vuon')).toBeNull();
    const nextYear = { ...r.state, character: { ...r.state.character, age: 21 } };
    expect(doFingerAction(nextYear, content, 'tuoi_vuon')).not.toBeNull();
  });

  it('higher actions wait for the level; small children cannot use it', () => {
    const s = withFinger('lao_gia_gia');
    expect(fingerActionViews(s, content).find((a) => a.id === 'xin_dan_phuong')!.blocked).toContain('Truyền thụ');
    const child = withFinger('lao_gia_gia', 3, 'pham_nhan');
    expect(fingerActionViews(child, content).every((a) => a.blocked)).toBe(true);
  });

  it('a check action uses the RNG and can fail', () => {
    const results = new Set<boolean>();
    for (let i = 0; i < 30; i++) {
      const s = withFinger('he_thong');
      const t = { ...s, rng: createLife({ seed: `f${i}` }, content).rng };
      results.add(doFingerAction(t, content, 'diem_danh')!.tone !== 'bad');
    }
    expect(results.size).toBe(2);
  });

  it('9.R3a: costs are paid, items used up, perUse hooks pile up', () => {
    const s0 = withFinger('thon_phe');
    expect(fingerActionViews(s0, content).find((v) => v.id === 'nuot_noi_dan')!.blocked).toMatch(/Cần/);
    const s1: GameState = { ...s0, inventory: { ...s0.inventory, noi_dan_1: 2 } };
    const r1 = doFingerAction(s1, content, 'nuot_noi_dan')!;
    expect(r1.state.inventory.noi_dan_1 ?? 0).toBe(1);
    expect(r1.state.goldenFinger!.count?.nuot_noi_dan).toBe(1);
    const before = hookSum(s1, content, 'heartDemonResist');
    expect(hookSum(r1.state, content, 'heartDemonResist')).toBeCloseTo(before - 0.03);
    const later: GameState = { ...r1.state, character: { ...r1.state.character, age: r1.state.character.age + 1 } };
    const r2 = doFingerAction(later, content, 'nuot_noi_dan')!;
    expect(hookSum(r2.state, content, 'heartDemonResist')).toBeCloseTo(before - 0.06);
  });

  it('9.R3a: Thiên mệnh thư costs thọ nguyên and makes the next event check sure', () => {
    const s = withFinger('thien_menh_thu');
    const r = doFingerAction(s, content, 'viet_menh')!;
    expect(r.state.cult.lifespan).toBe(s.cult.lifespan - 3);
    expect(r.state.flags[SURE_CHECK_FLAG]).toBe(true);
    expect(hookSum(r.state, content, 'tribulationPct') - hookSum(s, content, 'tribulationPct')).toBe(5);
  });
});
