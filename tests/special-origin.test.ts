import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { lifeHooks } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { devSpecial } from '../src/systems/dev';
import { openOrigins, rollSpecialOrigin, seeSpecial, specialChance } from '../src/systems/specialOrigin';
import { withBalancePatch } from '../src/systems/simulate';

const content = loadContent();
const born = (seed: string, lifeNo: number, c = content) => confirmDestiny(rollDestiny(createLife({ seed, lifeNo }, c), c), c);

describe('Tình tiết đặc biệt hiếm (9.S1)', () => {
  it('never comes in a first life', () => {
    const sure = withBalancePatch(content, { specialOrigins: { chance: 1 } }).content;
    expect(specialChance(createLife({ seed: 'a', lifeNo: 1 }, sure), sure)).toBe(0);
    for (let i = 0; i < 20; i++) expect(born(`f${i}`, 1, sure).special).toBeUndefined();
  });

  it('comes in later lives, at most one "nền", with gains, costs and all-life hooks', () => {
    const sure = withBalancePatch(content, { specialOrigins: { chance: 1 } }).content;
    let hits = 0;
    for (let i = 0; i < 30; i++) {
      const s = born(`l${i}`, 5, sure);
      if (!s.special) continue;
      hits++;
      expect(s.special.seen).toBe(false);
      expect(s.special.ids.length).toBeLessThanOrEqual(sure.balance.specialOrigins.maxPerLife);
      const groups = s.special.ids.map((id) => sure.specialOrigins!.find((o) => o.id === id)!.group);
      expect(groups.filter((g) => ['he_thong', 'trung_sinh', 'phe_vat'].includes(g)).length).toBeLessThanOrEqual(1);
      for (const id of s.special.ids) expect(s.flags[`origin_${id}`]).toBe(true);
      expect(seeSpecial(s).special!.seen).toBe(true);
    }
    expect(hits).toBeGreaterThan(20);
  });

  it('unlocks by lives and the karma of the last life; gives the effects', () => {
    const life2 = { ...createLife({ seed: 'u', lifeNo: 2 }, content) };
    expect(openOrigins(life2, content).map((o) => o.id)).toContain('tuc_tue');
    expect(openOrigins(life2, content).map((o) => o.id)).not.toContain('long_mach_duoi_nha');
    const life3 = { ...life2, lifeNo: 3 };
    expect(openOrigins(life3, content, 0).map((o) => o.id)).not.toContain('thien_sat_menh');
    expect(openOrigins(life3, content, -50).map((o) => o.id)).toContain('thien_sat_menh');
    const base = born('fx', 1);
    const s = rollSpecialOrigin(base, content, 0, 'tuc_tue');
    expect(s.stats.intellect).toBeGreaterThan(base.stats.intellect);
    expect(lifeHooks(s, content).some((h) => h.hook === 'eventWeight.study')).toBe(true);
    expect(devSpecial(base, content, 'long_mach_duoi_nha').special?.ids).toEqual(['long_mach_duoi_nha']);
  });
});
