import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';

const content = loadContent();

describe('Thái Sơ Diễn Đạo Kinh: Vô Thượng phẩm', () => {
  const tech = content.techniques.find((t) => t.id === 'thai_so_dien_dao_kinh')!;

  it('is the only Vô Thượng technique and outranks Thiên phẩm', () => {
    expect(tech.grade).toBe('vo_thuong');
    expect(content.techniques.filter((t) => t.grade === 'vo_thuong').map((t) => t.id)).toEqual(['thai_so_dien_dao_kinh']);
    const g = content.balance.techniques.gradeMul;
    expect(g.vo_thuong).toBeGreaterThan(g.thien);
  });

  it('cannot be bought in any market', () => {
    expect(JSON.stringify(content.markets)).not.toContain('thai_so_dien_dao_kinh');
  });

  it('comes only from a rare event that demands luck, comprehension and đạo tâm, with a hard check', () => {
    const givers = content.events.filter((e) => JSON.stringify(e.choices).includes('"gainTechnique":"thai_so_dien_dao_kinh"'));
    expect(givers.map((e) => e.id)).toEqual(['di_tich_thuong_co']);
    const e = givers[0];
    const need = Object.fromEntries((e.conditions.stats ?? []).map((s) => [s.stat, s.gte]));
    expect(need['stat.luck']).toBeGreaterThanOrEqual(90);
    expect(need['stat.comprehension']).toBeGreaterThanOrEqual(80);
    expect(e.choices[0].check?.difficulty).toBeGreaterThanOrEqual(90);
  });
});
