import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { joinSect, nextRankNeed } from '../src/systems/sect';
import { buyTreasury, merit, treasuryViews } from '../src/systems/sectTreasury';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'], body: null };

function member(contribution: number): GameState {
  const b = createLife({ seed: 'treasury' }, content);
  const s = joinSect({
    ...b,
    character: { ...b.character, age: 16 },
    log: [...b.log, { age: 16, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130 },
  }, content, 'bich_lac_tong').state;
  return { ...s, sect: { ...s.sect, rank: 1, contribution } };
}

describe('bảo khố (task 5c.4)', () => {
  it('buying spends spendable merit, gives the goods, and respects limits and rank', () => {
    let s = member(30);
    const v = treasuryViews(s, content);
    expect(v.find((t) => t.id === 'kho_tu_khi_dan')!.blocked).toBeNull();
    expect(v.find((t) => t.id === 'kho_khai_tri_dan')!.blocked).toContain('Nội môn');
    expect(v.find((t) => t.id === 'kho_truc_co_dan')!.blocked).toBeTruthy();
    s = buyTreasury(s, content, 'kho_tu_khi_dan')!.state;
    expect(s.inventory.tu_khi_dan).toBe(1);
    expect(merit(s)).toBe(15);
    expect(s.sect.contribution).toBe(30); // promotion total untouched
    s = buyTreasury(s, content, 'kho_tu_khi_dan')!.state;
    expect(buyTreasury(s, content, 'kho_tu_khi_dan')).toBeNull(); // out of merit
    const stones = member(100);
    const r = buyTreasury(stones, content, 'kho_linh_thach')!;
    expect(r.state.money.spiritStones).toBe(stones.money.spiritStones + 6);
  });

  it('every treasury item exists and is used with a valid limit', () => {
    for (const t of content.sectLife!.treasury) for (const i of t.items) expect(content.items.some((x) => x.id === i), i).toBe(true);
    expect(nextRankNeed(member(0), content)).not.toBeNull();
  });
});
