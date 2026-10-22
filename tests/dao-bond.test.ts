import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { resolveChoice } from '../src/systems/events/engine';
import { hookSum } from '../src/systems/cultivation';
import { syncTier } from '../src/systems/tiers';

const content = loadContent();

function entered(seed: string): GameState {
  const s = createLife({ seed }, content);
  const rich: GameState = {
    ...s,
    character: { ...s.character, age: 18 },
    money: { ...s.money, silver: 500 },
    job: { ...s.job!, id: content.jobs!.jobs[0].id, since: 16 },
    cult: { ...s.cult, realm: 'luyen_khi', stage: 0 },
    events: { ...s.events, followUps: [] },
  };
  return syncTier(rich, content);
}

describe('13.1 Nhập đạo: dứt hay giữ duyên', () => {
  it('entering Tu chân giới asks the question at once', () => {
    expect(entered('nd1').events.pending).toBe('nd_nhap_dao_lua_chon');
  });

  it('dứt duyên leaves the mortal life, keeps a share of silver and cultivates faster', () => {
    const s = entered('nd2');
    const base = hookSum(s, content, 'cultivationSpeed');
    const cut = resolveChoice(s, content, 0).state;
    expect(cut.flags.dut_duyen).toBe(true);
    expect(cut.job?.id ?? null).toBeNull();
    expect(cut.money.silver).toBe(Math.floor(500 * content.balance.daoBond!.silverKeep));
    expect(hookSum(cut, content, 'cultivationSpeed')).toBeCloseTo(base + 0.1);
    // Kin drift a little further each year.
    const kin = cut.family.find((r) => r.alive);
    if (kin) {
      const later = advanceYear(cut, content);
      const after = later.family.find((r) => r.id === kin.id)!;
      if (after.alive) expect(after.affinity).toBeLessThanOrEqual(kin.affinity);
    }
  });

  it('giữ duyên keeps everything and cultivates a little slower', () => {
    const s = entered('nd3');
    const base = hookSum(s, content, 'cultivationSpeed');
    const keep = resolveChoice(s, content, 1).state;
    expect(keep.flags.giu_duyen).toBe(true);
    expect(keep.job?.id).toBe(s.job?.id);
    expect(keep.money.silver).toBe(500);
    expect(hookSum(keep, content, 'cultivationSpeed')).toBeCloseTo(base - 0.05);
  });
});
