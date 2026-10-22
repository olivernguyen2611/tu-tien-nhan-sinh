import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { tierTermWarnings } from '../src/core/validate';
import { TierTermsFileSchema } from '../src/core/schemas';
import terms0 from '../content/worlds/thuong_lan/tier-terms.json';

const content = loadContent();
const mortal = (age = 20): GameState => {
  const s = createLife({ seed: 'tien-tich', originId: 'vo_lam' }, content);
  return { ...s, character: { ...s.character, age }, cult: { ...s.cult, realm: 'pham_nhan', root: null }, events: { ...s.events, pending: null } };
};

describe('Cầu nối giang hồ → tu tiên (11.6)', () => {
  it('noting where the tiên nhân flew opens "Tìm tiên tích"; kneeling tests the innate root', () => {
    const a = content.activities!.find((x) => x.id === 'tim_tien_tich')!;
    expect(meets(mortal(), a.conditions, content)).toBe(false);
    const ev = findEvent(content, 'gh_tien_nhan_lam_do_cho')!;
    const s0 = { ...mortal(), events: { ...mortal().events, pending: ev.id } };
    expect(visibleChoices(s0, content, ev).some((c) => c.text.startsWith('Quỳ xuống'))).toBe(true);
    const s = resolveChoice(s0, content, ev.choices.findIndex((c) => c.text.startsWith('Lặng lẽ'))).state;
    expect(s.flags.ghi_huong_tien_tich).toBe(true);
    expect(meets(s, a.conditions, content)).toBe(true);
  });

  it('the rumours teach Lời đồn về tiên nhân; giang hồ text keeps mortal words', () => {
    const entry = content.knowledge!.find((k) => k.id === 'tin_don_tien_nhan')!;
    expect(entry.sources.map((x) => x.id)).toContain('gh_tin_don_tien_nhan');
    const terms = TierTermsFileSchema.parse(terms0);
    expect(terms.tiers.find((t) => t.tier === 'pham_gian')!.categories).toContain('jianghu');
    for (const id of ['gh_tin_don_tien_nhan', 'gh_tien_nhan_lam_do_cho', 'gh_ky_vat_xuat_the']) expect(tierTermWarnings(findEvent(content, id)!, terms, 'pham_gian')).toEqual([]);
  });
});
