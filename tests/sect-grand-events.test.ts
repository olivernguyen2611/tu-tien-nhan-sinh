import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { joinSect } from '../src/systems/sect';
import { succeedSect } from '../src/systems/ownSect';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };
const GRAND = content.events.filter((e) => e.id.startsWith('sg_'));

function member(): GameState {
  const b = createLife({ seed: 'grand' }, content);
  const s = joinSect({
    ...b,
    character: { ...b.character, age: 20 },
    log: [...b.log, { age: 20, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', stage: 4, root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130 },
  }, content, 'bich_lac_tong').state;
  return { ...s, sect: { ...s.sect, rank: 1 } };
}

describe('sự kiện lớn của tông (task 5c.5)', () => {
  it('every chain target exists and chain steps are never rolled at random', () => {
    expect(GRAND.length).toBeGreaterThanOrEqual(10);
    const text = JSON.stringify(GRAND);
    for (const m of text.matchAll(/"chain":"([a-z0-9_]+)"/g)) expect(findEvent(content, m[1]!), m[1]).toBeTruthy();
    for (const e of GRAND.filter((x) => /_cua_|_giao_chien|_hau_|_dieu_tra|_ket_cuc|_vong_phieu|_luan_vo/.test(x.id))) expect(e.weight).toBe(0);
  });

  it('every choice of every event resolves', () => {
    for (const e of GRAND) {
      const base: GameState = { ...member(), events: { pending: e.id, history: {}, followUps: [], npc: null } };
      const n = visibleChoices(base, content, e).length;
      for (let i = 0; i < n; i++) {
        const r = resolveChoice(base, content, i);
        expect(r.state.log.length, `${e.id}#${i}`).toBeGreaterThan(0);
      }
    }
  });

  it('winning the succession makes the member the master of that very sect', () => {
    const s = member();
    const r = succeedSect(s, content);
    expect(r.ownSect?.name).toBe('Bích Lạc Tông');
    expect(r.ownSect?.members).toBe(content.balance.founding.inheritMembers);
    expect(r.sect.id).toBeNull();
    expect(r.sect.left).toContain('bich_lac_tong');
    expect(succeedSect(r, content)).toBe(r); // already a master
  });

  it('the succession opens only for a Chân truyền who has not taken the seat', () => {
    const open = findEvent(content, 'sg_ngoi_mo')!;
    expect(open.conditions.sect?.minRank).toBe(3);
    expect(open.conditions.flagsNone).toContain('da_ke_nhiem');
  });
});
