import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { lifeHooks, startCultivating, yearlyGain } from '../src/systems/cultivation';
import { resolveChoice, visibleChoices, findEvent } from '../src/systems/events/engine';
import { makeSave, migrate } from '../src/systems/save';
import {
  doMission, joinSect, leaveSect, masterBlocked, missionViews, requestMaster, sectEligibility, sectYear,
} from '../src/systems/sect';
import { learnTechnique } from '../src/systems/technique';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };

function disciple(patch: Partial<GameState> = {}, cult: Partial<GameState['cult']> = {}): GameState {
  const b = createLife({ seed: 'sect' }, content);
  return {
    ...b,
    character: { ...b.character, age: 14 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    log: [...b.log, { age: 14, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130, ...cult },
    ...patch,
  };
}

describe('sects (task 2.5)', () => {
  it('a usable root books the recruitment event 1–3 years after the test', () => {
    const b = createLife({ seed: 'rec' }, content);
    const s = startCultivating({ ...b, character: { ...b.character, age: 9 }, cult: { ...b.cult, root: SONG }, events: { ...b.events, followUps: [], npc: null } }, content).state;
    const booked = s.events.followUps.find((f) => f.event === 'tong_mon_tuyen_do')!;
    expect(booked.atAge).toBeGreaterThanOrEqual(10);
    expect(booked.atAge).toBeLessThanOrEqual(12);
  });

  it('eligibility follows each sect\'s requirements', () => {
    const s = disciple();
    expect(sectEligibility(s, content, 'bich_lac_tong')).toBeNull();
    expect(sectEligibility(s, content, 'tang_phong_kiem_cac')).toBeNull(); // Kim root, đạo tâm 50
    expect(sectEligibility({ ...s, aptitudes: { ...s.aptitudes, daoHeart: 40 } }, content, 'tang_phong_kiem_cac')).toContain('Đạo tâm');
    const water = disciple({}, { root: { grade: 'song', elements: ['thuy', 'moc'] } });
    expect(sectEligibility(water, content, 'tang_phong_kiem_cac')).toContain('tư chất');
    expect(sectEligibility(s, content, 'vo_uu_tu')).toContain('Đạo tâm 55');
    expect(sectEligibility(s, content, 'van_yeu_dien')).toContain('chưa nhận');
    expect(sectEligibility(disciple({}, { root: { grade: 'none', elements: [] } }), content, 'u_ha_ma_tong')).toContain('linh căn');
  });

  it('the recruitment event locks sects the life cannot join and joins through the choice', () => {
    const s = { ...disciple({}, {}), events: { pending: 'tong_mon_tuyen_do', history: {}, followUps: [], npc: null } };
    const choices = visibleChoices(s, content, findEvent(content, 'tong_mon_tuyen_do')!);
    expect(choices.find((c) => c.text.includes('Vô Ưu'))?.disabled).toBe(true);
    const r = resolveChoice(s, content, 0);
    expect(r.state.sect.id).toBe('bich_lac_tong');
    expect(r.state.sect.rank).toBe(0);
  });

  it('U Hà costs reputation on joining and karma every year', () => {
    const s = joinSect(disciple(), content, 'u_ha_ma_tong').state;
    expect(s.social.reputation.chinh).toBe(-20);
    expect(sectYear(s, content).social.karma).toBe(-2);
  });

  it('stipend by rank; Ký danh becomes Ngoại môn after a year; promotions need contribution and realm', () => {
    let s = joinSect(disciple(), content, 'bich_lac_tong').state;
    s = sectYear({ ...s, character: { ...s.character, age: 15 } }, content);
    expect(s.sect.rank).toBe(1);
    expect(s.money.spiritStones - disciple().money.spiritStones).toBe(2); // 3 × 0.5 as Ký danh
    s = sectYear({ ...s, character: { ...s.character, age: 16 }, sect: { ...s.sect, contribution: 60 } }, content);
    expect(s.sect.rank).toBe(1); // still Luyện Khí 1
    s = sectYear({ ...s, character: { ...s.character, age: 17 }, cult: { ...s.cult, stage: 3 } }, content);
    expect(s.sect.rank).toBe(2);
  });

  it('missions: one a year, rank-gated, give contribution', () => {
    let s = joinSect(disciple(), content, 'bich_lac_tong').state;
    const board = missionViews(s, content);
    expect(board.length).toBe(content.balance.sects.missionBoard);
    expect(board.some((m) => m.id === 'hai_thuoc')).toBe(false); // Ngoại môn and up
    const first = board[0].id;
    const r = doMission(s, content, first)!;
    expect(r.state.sect.contribution).toBeGreaterThan(0);
    expect(doMission(r.state, content, first)).toBeNull();
    s = { ...r.state, character: { ...r.state.character, age: 15 } };
    const next = missionViews(s, content)[0].id;
    expect(doMission(s, content, next)).not.toBeNull();
  });

  it('the mission board rotates yearly and only shows the sect\'s own missions', () => {
    const joined = joinSect(disciple(), content, 'bich_lac_tong').state;
    const s = { ...joined, sect: { ...joined.sect, rank: 3 } };
    const boards = new Set<string>();
    const seen = new Set<string>();
    for (let age = 20; age < 40; age++) {
      const ids = missionViews({ ...s, character: { ...s.character, age } }, content).map((m) => m.id);
      boards.add(ids.join());
      ids.forEach((id) => seen.add(id));
    }
    expect(boards.size).toBeGreaterThan(5);
    expect(seen.has('canh_lo_dan')).toBe(true);
    expect(seen.has('khat_thuc')).toBe(false); // Vô Ưu Tự only
    expect(seen.has('phuc_kich')).toBe(false); // U Hà only
    expect(seen.has('thi_kiem')).toBe(false); // Kiếm Các only
  });

  it('the sect teaches its technique by rank and its perks apply', () => {
    const s = joinSect(disciple(), content, 'bich_lac_tong').state;
    expect(lifeHooks(s, content).some((h) => h.hook === 'breakthroughChance' && h.add === 5)).toBe(true);
    const learned = learnTechnique({ ...s, sect: { ...s.sect, rank: 1 } }, content, 'bich_lac_dan_khi_quyet');
    expect(learned?.state.cult.technique).toBe('bich_lac_dan_khi_quyet');
  });

  it('a master: from Nội môn, once a year, speeds cultivation', () => {
    const s = joinSect(disciple(), content, 'bich_lac_tong').state;
    expect(masterBlocked(s, content)).toContain('Nội môn');
    let got: GameState | null = null;
    for (let i = 0; i < 40 && !got; i++) {
      const t = { ...s, rng: createLife({ seed: `m${i}` }, content).rng, sect: { ...s.sect, rank: 2 } };
      const r = requestMaster(t, content)!;
      expect(requestMaster(r.state, content)).toBeNull();
      if (r.success) got = r.state;
    }
    expect(got!.sect.master).toMatch(/^Trưởng lão /);
    expect(got!.flags.co_su_phu).toBe(true);
    const before = { ...got!, sect: { ...got!.sect, master: null } };
    expect(yearlyGain(got!, content) / yearlyGain(before, content)).toBeCloseTo((1 + 0.1) / 1, 1);
  });

  it('leaving: no return to that sect', () => {
    const s = leaveSect(joinSect(disciple(), content, 'bich_lac_tong').state, content)!.state;
    expect(s.sect.id).toBeNull();
    expect(sectEligibility(s, content, 'bich_lac_tong')).toContain('rời đi');
    expect(sectEligibility(s, content, 'bach_thao_coc')).toBeNull();
  });

  it('runs in the yearly step and old saves get an empty sect', () => {
    const s = joinSect(disciple(), content, 'bich_lac_tong').state;
    expect(advanceYear(s, content).sect.rank).toBe(1);
    const { sect: _s, ...old } = createLife({ seed: 'old' }, content);
    expect(migrate(makeSave(old as GameState, 1)).life.sect.id).toBeNull();
  });
});
