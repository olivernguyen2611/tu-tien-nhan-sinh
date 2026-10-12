import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { joinSect } from '../src/systems/sect';
import { chainViews, doChainStep, startChain } from '../src/systems/sectChains';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'], body: null };

function member(): GameState {
  const b = createLife({ seed: 'chains' }, content);
  const s = joinSect({
    ...b,
    character: { ...b.character, age: 16 },
    aptitudes: { physique: 90, comprehension: 90, luck: 50, daoHeart: 90 },
    stats: { ...b.stats, intellect: 90, charm: 90 },
    log: [...b.log, { age: 16, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130 },
  }, content, 'bich_lac_tong').state;
  return { ...s, sect: { ...s.sect, rank: 1 } };
}

describe('nhiệm vụ chuỗi (task 5c.3)', () => {
  it('a chain runs step by step, one step a year, and pays at the end', () => {
    let s = member();
    const id = 'chuoi_do_de_giup_dong_mon';
    expect(chainViews(s, content).some((c) => c.id === id)).toBe(true);
    s = startChain(s, content, id)!.state;
    expect(s.sect.chain?.id).toBe(id);
    expect(startChain(s, content, 'chuoi_bia_da_vo')).toBeNull();
    const start = s.sect.contribution;
    for (let year = 17, guard = 0; s.sect.chain && guard < 12; year++, guard++) {
      s = { ...s, character: { ...s.character, age: year } };
      const r = doChainStep(s, content, id)!;
      expect(doChainStep(r.state, content, id)).toBeNull(); // the year's slot is spent
      s = r.state;
    }
    expect(s.sect.chain).toBeNull();
    expect(s.sect.contribution).toBeGreaterThan(start);
    expect(chainViews(s, content).some((c) => c.id === id)).toBe(false);
  });

  it('every outcome moves a stat', () => {
    for (const c of content.sectLife!.chains) {
      for (const st of c.steps) for (const o of [st.success, st.fail]) expect(Object.values(o.stats).some((v) => v !== 0)).toBe(true);
      expect(Object.values(c.reward.stats).some((v) => v !== 0)).toBe(true);
    }
  });

  it('too many misses drop the chain', () => {
    let s = startChain(member(), content, 'chuoi_bia_da_vo')!.state;
    s = { ...s, aptitudes: { ...s.aptitudes, comprehension: 0, daoHeart: 0 }, stats: { ...s.stats, intellect: 0 } };
    for (let year = 17; year < 30 && s.sect.chain; year++) {
      s = { ...s, character: { ...s.character, age: year } };
      s = doChainStep(s, content, 'chuoi_bia_da_vo')!.state;
    }
    expect(s.sect.chain).toBeNull();
  });
});
