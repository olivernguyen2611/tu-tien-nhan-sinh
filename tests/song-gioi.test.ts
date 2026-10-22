import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { meets } from '../src/systems/events/conditions';
import { addWanted, arrest } from '../src/systems/law';

const content = loadContent();

function cultivator(seed: string, flags: Record<string, boolean> = {}): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 20 },
    flags: { ...b.flags, ...flags },
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', stage: 2 },
  };
}

describe('13.2 Song giới', () => {
  it('ago: years since an event or activity, else since entering the tầng', () => {
    const s = cultivator('sg1');
    expect(meets(s, { ago: { of: ['ha_son'], min: 15 } }, content)).toBe(true);
    const back = { ...s, activities: { ...s.activities!, last: { ha_son: 37 } } };
    expect(meets(back, { ago: { of: ['ha_son'], min: 15 } }, content)).toBe(false);
    expect(meets(back, { ago: { of: ['ha_son'], max: 5 } }, content)).toBe(true);
  });

  it('family.alive asks for one of these relatives alive', () => {
    const s = cultivator('sg2');
    const noMother = { ...s, family: s.family.map((r) => (r.role === 'mother' ? { ...r, alive: false } : r)) };
    expect(meets(noMother, { family: { alive: ['mother'] } }, content)).toBe(false);
    expect(meets({ ...s, family: [] }, { family: { alive: ['father', 'mother'] } }, content)).toBe(false);
  });

  it('bộ khoái cannot hold a tu sĩ: no công đường, the hunt ends, karma pays', () => {
    const s = addWanted(cultivator('sg3'), content, 3);
    const out = arrest({ ...s, law: { ...s.law!, lastCrime: content.crimes!.crimes[0].id } }, content);
    expect(out.law!.trial).toBeNull();
    expect(out.law!.wanted).toBe(0);
    expect(out.events.pending).toBeNull();
    expect(out.social.karma).toBe(s.social.karma - content.balance.law!.slipKarma);
  });

  it('hạ sơn is for those who kept their bond, and takes months', () => {
    const keep = cultivator('sg4', { giu_duyen: true });
    expect(activityViews(keep, content).some((a) => a.id === 'ha_son')).toBe(true);
    expect(activityViews(cultivator('sg4', { dut_duyen: true }), content).some((a) => a.id === 'ha_son')).toBe(false);
    const done = doActivity(keep, content, 'ha_son')!;
    expect(done.state.activities!.months).toBe(3);
  });
});
