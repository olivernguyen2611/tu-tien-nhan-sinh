import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { simulateMany, withBalancePatch } from '../src/systems/simulate';

const content = loadContent();

describe('Bảng cân bằng (9.R12)', () => {
  it('patches balance in memory, checked by the schema', () => {
    const ok = withBalancePatch(content, { karmaLedger: { chance: 0.5 } });
    expect(ok.error).toBeNull();
    expect(ok.content.balance.karmaLedger.chance).toBe(0.5);
    expect(ok.content.balance.karmaLedger.maxLives).toBe(content.balance.karmaLedger.maxLives);
    expect(content.balance.karmaLedger.chance).not.toBe(0.5);
    expect(withBalancePatch(content, { karmaLedger: { chance: 'x' } }).error).toMatch(/karmaLedger\.chance/);
    expect(withBalancePatch(content, [1]).error).not.toBeNull();
    expect(withBalancePatch(content, {}).content).toBe(content);
  });

  it('reports gates, Kim Thủ Chỉ, khí vận and kết cục', () => {
    const { report } = simulateMany(content, 6, 'bal', { profile: 'player' });
    const sum = Object.values(report.byEnding).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(Object.keys(report.byTrait).length).toBeGreaterThan(0);
    for (const g of Object.values(report.byTrait)) expect(g.share).toBeGreaterThan(0);
    expect(report.byGate).toBeTypeOf('object');
    expect(report.byFinger).toBeTypeOf('object');
  }, 60_000);
});
