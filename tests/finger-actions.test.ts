import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { gainGoldenFinger } from '../src/systems/goldenFinger';
import { doFingerAction, fingerActionViews } from '../src/systems/fingerActions';

const content = loadContent();

function withFinger(id: string, age = 20, realm = 'luyen_khi'): GameState {
  const b = createLife({ seed: 'finger' }, content);
  const s: GameState = { ...b, character: { ...b.character, age }, cult: { ...b.cult, realm }, log: [...b.log, { age, lines: [] }] };
  return gainGoldenFinger(s, content, id);
}

describe('Kim Thủ Chỉ actions (playtest 2)', () => {
  it('every finger has actions, at least one open at level 1', () => {
    for (const f of content.goldenFingers.fingers) {
      expect(f.actions.length).toBeGreaterThan(1);
      expect(f.actions.some((a) => a.minLevel === 1)).toBe(true);
    }
  });

  it('an action works once per cooldown, then opens again', () => {
    const s = withFinger('binh_nho_than_bi');
    const r = doFingerAction(s, content, 'tuoi_vuon')!;
    expect(r.state.money.spiritStones).toBe(s.money.spiritStones + 4);
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
});
