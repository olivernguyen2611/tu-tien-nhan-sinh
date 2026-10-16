import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { hookSum } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { devSpecial } from '../src/systems/dev';
import { describeEffects } from '../src/systems/effectText';

const content = loadContent();
const born = (seed: string, id: string) => devSpecial(confirmDestiny(rollDestiny(createLife({ seed, lifeNo: 5 }, content), content), content), content, id);
const PATHS = ['nghich_canh', 'ma_nghich', 'thon_phe', 'dan_the', 'huyet_mach'];

describe('Phế vật nghịch tập (9.S4)', () => {
  it('every path has the humiliation chain and its own awakening', () => {
    for (const p of PATHS) {
      const s = born('a', `phe_vat_${p}`);
      const chain = s.events.followUps.map((f) => f.event);
      expect(chain).toEqual(expect.arrayContaining(['pv_si_nhuc', 'pv_huy_hon', 'pv_truc_xuat', `pv_tinh_${p}`]));
    }
  });

  it('slow before the awakening, fast after it; no unconditional buff', () => {
    const s = born('b', 'phe_vat_nghich_canh');
    const before = hookSum(s, content, 'cultivationSpeed');
    const after = hookSum({ ...s, flags: { ...s.flags, phe_vat_tinh: true } }, content, 'cultivationSpeed');
    expect(before).toBeLessThan(hookSum({ ...s, special: undefined }, content, 'cultivationSpeed'));
    expect(after - before).toBeCloseTo(0.8, 5);
    expect(hookSum(s, content, 'combatPower')).toBeLessThan(hookSum({ ...s, flags: { phe_vat_tinh: true } }, content, 'combatPower'));
  });

  it('only Huyết mạch ẩn (a major kỳ ngộ) can give a root; the others respect the innate root', () => {
    const ev = (id: string) => content.events.find((e) => e.id === id)!;
    const grants = (id: string) => ev(id).choices.some((c) => !!c.success?.effects.grantRoot || !!c.result?.effects.grantRoot);
    expect(grants('pv_tinh_huyet_mach')).toBe(true);
    for (const p of PATHS.filter((x) => x !== 'huyet_mach')) expect(grants(`pv_tinh_${p}`)).toBe(false);
    // A failed awakening comes back later.
    expect(ev('pv_tinh_dan_the').choices[0].fail!.effects.followUp!.event).toBe('pv_tinh_dan_the');
  });

  it('the Thiên cơ card says which hooks wait for the awakening', () => {
    const o = content.specialOrigins!.find((x) => x.id === 'phe_vat_dan_the')!;
    const lines = describeEffects([...o.effects, ...o.costs], content).map((l) => l.text);
    expect(lines.some((t) => t.includes('sau khi thức tỉnh'))).toBe(true);
    expect(lines.some((t) => t.includes('cho tới khi thức tỉnh'))).toBe(true);
  });
});
