import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fillTemplate } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { attemptMajorBreakthrough, breakthroughPct, cultivateYear, majorBreakthroughInfo, yearlyGain } from '../src/systems/cultivation';
import { eventWeight, findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { joinSect } from '../src/systems/sect';
import { makeSave, migrate } from '../src/systems/save';
import { act, settle } from '../src/systems/combat';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };
const NONE: SpiritRoot = { grade: 'none', elements: [] };

function life(cult: Partial<GameState['cult']> = {}, patch: Partial<GameState> = {}, age = 20): GameState {
  const b = createLife({ seed: 'ev28' }, content);
  return {
    ...b,
    character: { ...b.character, age, originId: 'nong_dan' },
    stats: { health: 70, happiness: 50, intellect: 50, charm: 50 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    paths: {},
    traits: [],
    flags: {},
    log: [...b.log, { age, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique: 'dan_khi_quyet', lineage: 'tien', learned: ['dan_khi_quyet'], lifespan: 130, ...cult },
    ...patch,
  };
}
const pick = (s: GameState, eventId: string, choice: number) => resolveChoice({ ...s, events: { ...s.events, pending: eventId } }, content, choice);

describe('task 2.8 events and their engine', () => {
  it('all 37 new events are loaded', () => {
    for (const id of ['dong_phu_dau_tien', 'don_ngo_trong_mua', 'dong_phu_lo_am', 'loi_moi_u_ha', 'thi_huong', 'doi_tap_dich', 'huong_hoa_hoi_bao_quan']) {
      expect(findEvent(content, id), id).toBeDefined();
    }
  });

  it('cultProgress, speedBuff and {sect}', () => {
    const s = life({ progress: 10 });
    expect(pick(s, 'linh_khi_trieu_tich', 1).state.cult.progress).toBe(30);
    const buffed = pick(joinSect(s, content, 'bich_lac_tong').state, 'dong_phu_dau_tien', 0).state;
    expect(yearlyGain(buffed, content) / yearlyGain(joinSect(s, content, 'bich_lac_tong').state, content)).toBeCloseTo(1.1);
    expect(yearlyGain({ ...buffed, character: { ...buffed.character, age: 25 } }, content)).toBeCloseTo(yearlyGain(joinSect(s, content, 'bich_lac_tong').state, content));
    expect(fillTemplate('Đệ tử {sect}', joinSect(s, content, 'bich_lac_tong').state, content)).toBe('Đệ tử Bích Lạc Tông');
  });

  it('pills: Trúc Cơ Đan adds 25 to the big breakthrough and is used up', () => {
    const peak = life({ stage: 8, progress: 100 }, { inventory: { truc_co_dan: 1 } });
    expect(majorBreakthroughInfo(peak, content)!.chancePct).toBeCloseTo(55 + 3); // Tiên đạo +3
    const r = attemptMajorBreakthrough(peak, content)!;
    expect(r.state.inventory.truc_co_dan).toBeUndefined();
    const tk = life({ progress: 99 }, { inventory: { tu_khi_dan: 2 } });
    expect(breakthroughPct(tk, content, 90, false)).toBeCloseTo(95);
    expect(cultivateYear(tk, content).inventory.tu_khi_dan).toBe(1);
  });

  it('nextBreakthroughBonus applies once; reducePeakFails eases the bottleneck', () => {
    const s = life({ stage: 8, progress: 100, fails: { 'luyen_khi:peak': 2 } }, { flags: { co_su_phu: true } });
    const helped = pick(s, 'binh_canh_luyen_khi', 2).state;
    // 30 − 2 failures × 5 + sư phụ 10, and the choice's Ngộ tính +2 (× 0.3).
    expect(majorBreakthroughInfo(helped, content)!.chancePct).toBeCloseTo(30 - 10 + 10 + 0.6 + 3); // Tiên đạo +3
    expect(attemptMajorBreakthrough(helped, content)!.state.cult.nextBonus).toBe(0);
    expect(pick(s, 'binh_canh_luyen_khi', 0).state.cult.fails['luyen_khi:peak']).toBe(1);
  });

  it('scrolls: an event gives a technique to practise later', () => {
    const r = pick(life({}, { aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 } }), 'xac_tan_tu_duoi_ho', 0);
    expect(r.state.cult.scrolls).toEqual(['thuy_nguyet_quan_tuong_phap']);
    expect(r.state.cult.technique).toBe('dan_khi_quyet');
    expect(r.text).toContain('Thủy Nguyệt Quan Tưởng Pháp');
  });

  it('careers: Thi Hương promotes, Tạp dịch joins young rootless children', () => {
    const scholar = life({ realm: 'pham_nhan', root: NONE, technique: null }, { career: { id: 'quan', rung: 0, since: 16 }, flags: { tu_tai: true }, stats: { health: 70, happiness: 50, intellect: 100, charm: 50 } });
    expect(eventWeight(scholar, content, findEvent(content, 'thi_huong')!)).toBeGreaterThan(0);
    let promoted = 0;
    for (let i = 0; i < 20; i++) {
      const r = pick({ ...scholar, rng: createLife({ seed: `q${i}` }, content).rng }, 'thi_huong', 0);
      if (r.state.career.rung === 1) promoted++;
    }
    expect(promoted).toBeGreaterThan(10);
    const kid = life({ realm: 'pham_nhan', root: NONE, technique: null }, { aptitudes: { physique: 100, comprehension: 50, luck: 50, daoHeart: 50 } }, 10);
    expect(pick(kid, 'tien_mon_tuyen_do_truot', 1).state.career.id).toBe('tap_dich');
  });

  it('Phật duyên: a rootless mortal who takes refuge starts cultivating on đạo tâm', () => {
    const monk = life({ realm: 'pham_nhan', root: NONE, technique: null }, { knowledge: ['phat_duyen'], aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 75 }, career: { id: 'y', rung: 1, since: 15 } });
    // 9.R5b: only once the life has heard of Phật duyên.
    expect(eventWeight({ ...monk, knowledge: [] }, content, findEvent(content, 'ha_vien_vo_uu')!)).toBe(0);
    expect(eventWeight(monk, content, findEvent(content, 'ha_vien_vo_uu')!)).toBeGreaterThan(0);
    const r = pick(monk, 'ha_vien_vo_uu', 0).state;
    expect(r.cult.technique).toBe('vo_uu_thien_tam_phap');
    expect(r.cult.lineage).toBe('phat');
    expect(r.cult.realm).toBe('luyen_khi');
    expect(r.career.id).toBeNull();
    // 25 × min(0.7, 0.75) × Hoàng 1.0 × Phật 0.8 × main path Thể 0.9
    expect(yearlyGain(r, content)).toBeCloseTo(25 * 0.7 * 0.8 * 0.9);
    expect(advanceYear(r, content).cult.progress).toBeGreaterThan(0);
  });

  it('conditions: anyOf, stage, career, peakFails, sect.notId, talentsAny', () => {
    const s = life({ stage: 4 });
    expect(meets(s, { anyOf: [{ realm: { min: 'truc_co' } }, { stage: { min: 5 } }] }, content)).toBe(false);
    expect(meets({ ...s, cult: { ...s.cult, stage: 5 } }, { anyOf: [{ realm: { min: 'truc_co' } }, { stage: { min: 5 } }] }, content)).toBe(true);
    expect(meets(s, { career: { member: false } }, content)).toBe(true);
    expect(meets(s, { peakFails: { min: 1 } }, content)).toBe(false);
    const uha = joinSect(s, content, 'u_ha_ma_tong').state;
    expect(meets(uha, { sect: { notId: 'u_ha_ma_tong' } }, content)).toBe(false);
    const ev = findEvent(content, 'don_ngo_trong_mua')!;
    expect(visibleChoices(s, content, ev).some((c) => c.hidden)).toBe(false);
    const gifted = { ...s, talents: ['ngo_dao_thien_tu'] };
    expect(visibleChoices(gifted, content, ev).find((c) => c.hidden)?.traitId).toBe('ngo_dao_thien_tu');
  });

  it('U Hà invitation: leave the sect, switch to the Ma technique, reputation moves', () => {
    const s = joinSect(life({}, { social: { karma: -5, reputation: { chinh: 0, ma: 0, tan_tu: 0, yeu: 0, trieu_dinh: 0, giang_ho: 0 } } }), content, 'bich_lac_tong').state;
    const r = pick(s, 'loi_moi_u_ha', 0).state;
    expect(r.sect.id).toBeNull();
    expect(r.cult.lineage).toBe('ma');
    expect(r.social.reputation).toMatchObject({ ma: 20, chinh: -20 });
  });

  it('craftXp and gainMaster', () => {
    const s = joinSect(life({}, {}), content, 'bich_lac_tong').state;
    expect(pick(s, 'linh_khi_trieu_tich', 2).state.crafts.skills.farming.level).toBe(3);
    let mastered = false;
    for (let i = 0; i < 30 && !mastered; i++) {
      const t = { ...s, rng: createLife({ seed: `g${i}` }, content).rng, sect: { ...s.sect, rank: 2 } };
      const r = pick(t, 'truong_lao_de_mat', 0).state;
      if (r.sect.master) mastered = true;
    }
    expect(mastered).toBe(true);
  });

  it('old saves get the new fields', () => {
    const { inventory: _i, ...old } = createLife({ seed: 'old' }, content);
    const m = migrate(makeSave(old as GameState, 1)).life;
    expect(m.inventory).toEqual({});
    expect(m.social.reputation.trieu_dinh).toBe(0);
  });

  it('a few long lives play through without errors', () => {
    for (let i = 0; i < 15; i++) {
      let s = createLife({ seed: `long${i}` }, content);
      s = { ...s, destiny: { ...s.destiny, confirmed: true } };
      for (let n = 0; n < 400 && s.alive; n++) {
        if (s.fate) s = { ...s, fate: null };
        // Task 3.9 events start fights: fight all out, spare the beaten.
        if (s.combat) {
          s = s.combat.phase === 'won' ? settle(s, content, 'spare').state : act(s, content, 'all_out').state;
          continue;
        }
        s = s.events.pending ? resolveChoice(s, content, n % 3 === 0 ? 0 : visibleChoices(s, content, findEvent(content, s.events.pending)!).filter((c) => !c.disabled).at(-1)!.index).state : advanceYear(s, content);
      }
      expect(s.alive).toBe(false);
    }
  });
});
