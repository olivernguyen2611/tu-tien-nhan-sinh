import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { doActivity } from '../src/systems/activities';
import { joinFaction } from '../src/systems/jhFactions';

const content = loadContent();
const base = (age = 25): GameState => {
  const s = createLife({ seed: 'viec-giang-ho', originId: 'vo_lam' }, content);
  return {
    ...s, character: { ...s.character, age }, cult: { ...s.cult, realm: 'pham_nhan' },
    martial: { ...s.martial, stage: 2 }, aptitudes: { ...s.aptitudes, physique: 100, comprehension: 100, luck: 100 },
    stats: { ...s.stats, charm: 100, intellect: 100, health: 100 }, money: { ...s.money, silver: 200 },
    jianghu: { fame: 0, infamy: 0, alias: null, aliasAt: null }, events: { ...s.events, pending: null }, combat: null,
  };
};
const at = (s: GameState, id: string): GameState => ({ ...s, events: { ...s.events, pending: id } });
const choose = (s: GameState, text: string) => {
  const ev = findEvent(content, s.events.pending!)!;
  const i = ev.choices.findIndex((c) => c.text.startsWith(text));
  expect(i).toBeGreaterThanOrEqual(0);
  return resolveChoice(s, content, i).state;
};

describe('Việc giang hồ (11.4)', () => {
  it('every step of a chain exists, and chain-only steps never roll on their own', () => {
    const steps = ['gh_tieu_chon_duong', 'gh_tieu_son_trai', 'gh_tieu_hang_lau', 'gh_thuong_truy_na', 'gh_thuong_son_tac', 'gh_thuong_nguoi_mat_tich', 'gh_am_sat_tham_do', 'gh_am_sat_ra_tay', 'gh_am_sat_rut_lui', 'gh_kim_dang_hoi_2'];
    for (const id of steps) expect(findEvent(content, id)?.weight, id).toBe(0);
    const chained = content.events.flatMap((e) => e.choices.flatMap((c) => [c.result, c.success, c.fail, c.result?.fight?.win, c.success?.fight?.win, c.fail?.fight?.win]))
      .map((o) => o?.effects?.chain).filter((x): x is string => !!x && x.startsWith('gh_'));
    for (const id of chained) expect(findEvent(content, id), id).toBeTruthy();
  });

  it('áp tiêu: the route leads on; the mountain road reaches the sơn trại', () => {
    const s = choose(at(base(), 'gh_tieu_chon_duong'), 'Đi đường núi');
    expect(s.events.pending).toBe('gh_tieu_son_trai');
    const paid = choose(s, 'Nộp tiền mãi lộ');
    expect(paid.events.pending).toBe('gh_tieu_hang_lau');
    const sold = choose(paid, 'Giữ lại');
    expect(sold.law?.wanted ?? 0).toBeGreaterThan(0);
    expect(sold.jianghu?.infamy).toBeGreaterThan(0);
  });

  it('ám sát: thăm dò opens the hidden lối đã dò; rút lui pays and clears the trail', () => {
    let s = joinFaction({ ...base(), jianghu: { fame: 0, infamy: 30, alias: null, aliasAt: null } }, content, { id: 'huyet_sat_lau' });
    expect(meets(s, findEvent(content, 'gh_am_sat_hop_dong')!.conditions, content)).toBe(true);
    s = choose(at(s, 'gh_am_sat_hop_dong'), 'Nhận việc');
    expect(s.events.pending).toBe('gh_am_sat_tham_do');
    const before = visibleChoices(at(base(), 'gh_am_sat_ra_tay'), content, findEvent(content, 'gh_am_sat_ra_tay')!);
    expect(before.some((c) => c.text.startsWith('Theo lối đã dò'))).toBe(false);
    s = choose(s, 'Giả làm người bán rau');
    expect(s.events.pending).toBe('gh_am_sat_ra_tay');
    if (s.flags.am_sat_ro_duong) {
      expect(visibleChoices(s, content, findEvent(content, 'gh_am_sat_ra_tay')!).some((c) => c.text.startsWith('Theo lối đã dò'))).toBe(true);
    }
    s = choose(s, 'Đổi ý');
    expect(s.events.pending).toBeNull();
    expect(s.flags.am_sat_ro_duong).toBeFalsy();
  });

  it('ân oán: an oath of revenge waits for the hung thủ; a pardon ends it', () => {
    let s = choose(at(base(), 'gh_su_phu_bi_hai'), 'Thắp hương');
    expect(s.flags.thu_su_phu).toBe(true);
    expect(meets(s, findEvent(content, 'gh_bao_thu_su_phu')!.conditions, content)).toBe(true);
    s = choose(at(s, 'gh_bao_thu_su_phu'), 'Tha cho hắn');
    expect(s.flags.thu_su_phu).toBeFalsy();
  });

  it('bảng treo thưởng and áp tiêu xa open their events; tỉ võ chiêu thân is for adults only', () => {
    const board = doActivity(base(), content, 'xem_bang_treo_thuong');
    expect(['gh_thuong_truy_na', 'gh_thuong_son_tac', 'gh_thuong_nguoi_mat_tich']).toContain(board!.state.events.pending);
    expect(doActivity(base(), content, 'nhan_ap_tieu_xa')!.state.events.pending).toBe('gh_tieu_chon_duong');
    const ev = findEvent(content, 'gh_ti_vo_chieu_than')!;
    expect(meets(base(16), ev.conditions, content)).toBe(false);
  });
});
