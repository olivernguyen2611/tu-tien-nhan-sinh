import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { fingerImpacts, formatReport, simulateLife, simulateMany, summarize } from '../src/systems/simulate';

const content = loadContent();

describe('Mô phỏng tự động (6.1)', () => {
  it('a life ends in death, never stuck, and is the same for the same seed', () => {
    const a = simulateLife(content, 'sim-test-1');
    expect(a.alive).toBe(false);
    expect(a.stuck).toBe(false);
    expect(a.age).toBeGreaterThan(0);
    expect(simulateLife(content, 'sim-test-1')).toEqual(a);
    expect(simulateLife(content, 'sim-test-2')).not.toEqual(a);
  });

  it('both bot profiles finish every life', () => {
    for (const profile of ['random', 'steady', 'player'] as const) {
      const { results, report } = simulateMany(content, 12, `sim-p-${profile}`, { profile });
      expect(results.every((r) => !r.alive && !r.stuck)).toBe(true);
      expect(report.count).toBe(12);
      expect(report.stuck).toBe(0);
    }
  }, 60_000);

  it('the report adds up', () => {
    const { results, report } = simulateMany(content, 20, 'sim-report');
    expect(Object.values(report.byCause).reduce((a, b) => a + b, 0)).toBe(20);
    expect(Object.values(report.byRoot).reduce((a, b) => a + b.share, 0)).toBeCloseTo(1);
    expect(report.reached.pham_nhan).toBe(1);
    expect(report.age.p10).toBeLessThanOrEqual(report.age.p50);
    expect(report.age.p50).toBeLessThanOrEqual(report.age.p90);
    expect(report.age.p90).toBeLessThanOrEqual(report.age.max);
    expect(summarize([], content).count).toBe(0);
    expect(formatReport(report, content, 'thử')).toContain('20 đời');
    expect(results).toHaveLength(20);
  }, 60_000);

  it('9.R3d: every Kim Thủ Chỉ changes the life it is given (same seeds, with and without)', () => {
    const ids = content.goldenFingers.fingers.map((f) => f.id);
    const base = simulateLife(content, 'sim-gf-0', { profile: 'player' });
    for (const id of ids) {
      const life = simulateLife(content, 'sim-gf-0', { profile: 'player', goldenFinger: id });
      expect(life, id).not.toEqual(base);
    }
    const { impacts } = fingerImpacts(content, ids.slice(0, 2), 2, 'sim-gf', { profile: 'player' });
    expect(impacts.map((i) => i.id)).toEqual(ids.slice(0, 2));
    expect(impacts.every((i) => Number.isFinite(i.gain) && ['yeu', 'manh', 'vua'].includes(i.verdict))).toBe(true);
   }, 60_000);
});
