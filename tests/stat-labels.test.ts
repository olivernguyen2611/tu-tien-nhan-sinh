import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { describeChanges } from '../src/systems/deltas';
import { migrate, makeSave } from '../src/systems/save';
import { daoHeartLabel, innerForce, karmaView, reputationViews } from '../src/systems/statLabels';

const content = loadContent();
const life = (patch: (s: GameState) => GameState = (s) => s) => patch(createLife({ seed: 'labels' }, content));

describe('9.9 stat labels by tier', () => {
  it('one đạo tâm number, named Tâm tính / Ý chí / Đạo tâm by the life', () => {
    const mortal = life((s) => ({ ...s, martial: { ...s.martial, stage: -1 } }));
    expect(daoHeartLabel(mortal, content).label).toBe('Tâm tính');
    const fighter = { ...mortal, martial: { ...mortal.martial, stage: 0 } };
    expect(daoHeartLabel(fighter, content).label).toBe('Ý chí');
    const cultivator = { ...fighter, cult: { ...fighter.cult, realm: 'luyen_khi' } };
    expect(daoHeartLabel(cultivator, content).label).toBe('Đạo tâm');
    // Same number underneath, and the delta line uses the life's name for it.
    const after = { ...mortal, aptitudes: { ...mortal.aptitudes, daoHeart: mortal.aptitudes.daoHeart + 3 } };
    expect(describeChanges(mortal, after, content)).toContain('Tâm tính +3');
  });

  it('shows only the factions the life is involved in', () => {
    const s = life((x) => ({ ...x, tier: 'pham_gian' }));
    const keys = reputationViews(s, content).map((r) => r.key);
    expect(keys).toContain('lang_xa');
    expect(keys).not.toContain('ma');
    const bad = { ...s, social: { ...s.social, reputation: { ...s.social.reputation, lang_xa: -5, ma: 4 } } };
    const views = reputationViews(bad, content);
    expect(views.find((r) => r.key === 'lang_xa')?.name).toBe('Tiếng xấu');
    expect(views.some((r) => r.key === 'ma')).toBe(true);
  });

  it('nhân quả is hearsay for a mortal until a cao tăng shows it', () => {
    const s = life((x) => ({ ...x, social: { ...x.social, karma: 20 } }));
    const heard = karmaView(s, content)!;
    expect(heard.value).toBeNull();
    expect(heard.text).toContain('người hiền');
    expect(describeChanges(s, { ...s, social: { ...s.social, karma: 25 } }, content)).not.toContain('Thiện ác');
    const seen = karmaView({ ...s, flags: { ...s.flags, gap_cao_tang: true } }, content)!;
    expect(seen.value).toBe(20);
  });

  it('nội lực is the martial stage bar, only on the martial path', () => {
    const s = life();
    expect(innerForce({ ...s, martial: { ...s.martial, stage: -1, years: 0 } }, content)).toBeNull();
    const f = innerForce({ ...s, martial: { ...s.martial, stage: 0, years: 1 } }, content)!;
    expect(f.label).toBe('Nội lực');
    expect(f.pct).toBeGreaterThan(0);
    expect(innerForce({ ...s, cult: { ...s.cult, realm: 'luyen_khi' }, martial: { ...s.martial, stage: 0, years: 1 } }, content)).toBeNull();
  });

  it('adds no new 0–100 stat, and old saves gain hương danh', () => {
    const s = life();
    expect(Object.keys(s.stats).sort()).toEqual(['charm', 'happiness', 'health', 'intellect']);
    const { lang_xa: _l, ...rep } = s.social.reputation;
    const old = { ...s, social: { ...s.social, reputation: rep } } as GameState;
    expect(migrate(makeSave(old, 1), s).life.social.reputation.lang_xa).toBe(0);
  });
});
