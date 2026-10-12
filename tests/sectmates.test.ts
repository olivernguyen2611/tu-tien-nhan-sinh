import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { joinSect, requestMaster, sectYear } from '../src/systems/sect';
import { doTalk, enterTournament, sectmates, sectmateViews, tournamentViews } from '../src/systems/sectmates';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };

function disciple(): GameState {
  const b = createLife({ seed: 'mates' }, content);
  return {
    ...b,
    character: { ...b.character, age: 16 },
    aptitudes: { physique: 50, comprehension: 80, luck: 50, daoHeart: 50 },
    log: [...b.log, { age: 16, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130 },
  };
}

describe('đồng môn (task 5c.1)', () => {
  it('joining brings a named cast with distinct names and the right ranks', () => {
    const s = joinSect(disciple(), content, 'bich_lac_tong').state;
    const mates = sectmates(s);
    expect(mates.length).toBe(6);
    expect(new Set(mates.map((n) => n.name)).size).toBe(6);
    expect(mates.some((n) => n.sectmate!.kind === 'elder')).toBe(true);
    const elder = mates.find((n) => n.sectmate!.kind === 'elder')!;
    expect(elder.realm).not.toBe('luyen_khi');
    expect(mates.find((n) => n.sectmate!.kind === 'rival')!.grudge).toBeGreaterThan(0);
  });

  it('a master is a real elder NPC and his death is noticed', () => {
    let s = joinSect(disciple(), content, 'bich_lac_tong').state;
    s = { ...s, sect: { ...s.sect, rank: 2 } };
    let r = requestMaster(s, content);
    for (let i = 0; i < 60 && r && !r.success; i++) {
      s = { ...s, sect: { ...s.sect, lastMasterTry: null }, rng: r.state.rng };
      r = requestMaster(s, content);
    }
    const m = r!.state;
    expect(m.sect.masterId).toBeTruthy();
    expect(m.npcs.find((n) => n.id === m.sect.masterId)!.sectmate!.kind).toBe('master');
    const dead = { ...m, npcs: m.npcs.map((n) => (n.id === m.sect.masterId ? { ...n, alive: false } : n)) };
    expect(sectYear(dead, content).sect.master).toBeNull();
  });

  it('time with a sectmate: once each a year, capped, and every outcome moves a stat', () => {
    const s = joinSect(disciple(), content, 'bich_lac_tong').state;
    const peer = sectmateViews(s, content).find((v) => v.npc.sectmate!.kind === 'peer')!;
    const t = peer.talks.find((x) => x.id === 'uong_tra_dong_mon')!;
    expect(t.blocked).toBeNull();
    const r = doTalk(s, content, peer.npc.id, t.id)!;
    expect(r.state.npcs.find((n) => n.id === peer.npc.id)!.affinity).not.toBe(peer.npc.affinity);
    expect(doTalk(r.state, content, peer.npc.id, t.id)).toBeNull();
    for (const i of content.sectLife!.interactions) {
      expect(Object.values(i.success.stats).some((v) => v !== 0)).toBe(true);
      expect(Object.values(i.fail.stats).some((v) => v !== 0)).toBe(true);
    }
  });

  it('tournaments open in their years, run once, reward by wins and every placement moves a stat', () => {
    const joined = joinSect(disciple(), content, 'bich_lac_tong').state;
    let s: GameState = { ...joined, character: { ...joined.character, age: 20 }, sect: { ...joined.sect, rank: 1 } };
    expect(tournamentViews(s, content).find((t) => t.id === 'dai_ti')!.blocked).toBeNull();
    expect(tournamentViews(s, content).find((t) => t.id === 'luan_dao_hoi')!.blocked).toBe('Năm nay không mở.');
    const before = s.sect.contribution;
    const r = enterTournament(s, content, 'dai_ti')!;
    expect(r.state.sect.contribution).toBeGreaterThan(before);
    expect(r.state.sect.tournaments!.dai_ti!.last).toBe(20);
    expect(enterTournament(r.state, content, 'dai_ti')).toBeNull();
    expect(enterTournament(s, content, 'luan_dao_hoi')).toBeNull();
    s = { ...s, character: { ...s.character, age: 17 } };
    expect(enterTournament(s, content, 'luan_dao_hoi')).not.toBeNull();
    for (const t of content.balance.sects.tournaments) {
      for (const rw of t.rewards) expect(Object.values(rw.stats).some((v) => v !== 0)).toBe(true);
    }
  });
});
