import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fillTemplate } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { act, settle } from '../src/systems/combat';
import { createNpc, npcById } from '../src/systems/npcs';
import { applyRomance } from '../src/systems/romance';
import { addItems } from '../src/systems/items';

const content = loadContent();
const IDS = {
  romance: ['chung_o_duoi_mua', 'thu_tinh_gui_nham', 'tang_qua', 'tinh_dich_xuat_hien', 'the_gia_cau_than', 'bi_loi_dung_tinh_cam', 'to_tinh', 'song_tu', 'chia_ly_tho_nguyen', 'nguoi_cu_tro_ve'],
  plunder: ['bi_canh_chia_cua', 'bi_theo_doi', 'tui_tru_vat_vo_chu', 'bang_treo_thuong', 'ru_phuc_kich', 'bao_vat_xuat_the', 'bao_thu_doat_bao', 'ban_do_bay'],
  demonic: ['huyet_te_dot_pha', 'ma_cong_tan_quyen', 'tam_ma_nguoi_than', 'lo_dinh_cam_do', 'lao_ma_trong_nhan', 'u_ha_giao_dich', 'huyet_dan_cho_den', 'cam_thuat_dot_huyet'],
  beast: ['yeu_thu_ha_son', 'trung_yeu_thu', 'yeu_ho_bi_thuong', 'doi_san_yeu', 'thu_trieu', 'yeu_tu_hoa_hinh', 'linh_thu_tien_hoa'],
  market: ['dau_gia_kim_thiem', 'do_thach', 'hang_gia_phuong_thi', 'vay_kim_thiem', 'bay_sap_phuong_thi', 'bau_vat_lop_bui', 'toan_menh'],
};

function cultivator(age = 25, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'jh' }, content);
  return {
    ...b,
    character: { ...b.character, age, gender: 'nam' },
    traits: [],
    flags: {},
    money: { silver: 100, spiritStones: 200 },
    log: [...b.log, { age, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'luyen_khi', stage: 5, root: { grade: 'song', elements: ['kim', 'hoa'], body: null }, technique: 'dan_khi_quyet', lineage: 'tien' },
    ...patch,
  };
}

function pick(s: GameState, id: string, index: number) {
  return resolveChoice({ ...s, events: { ...s.events, pending: id } }, content, index);
}

describe('40 sự kiện giang hồ (task 3.9)', () => {
  it('all 40 approved events exist, in the five groups', () => {
    const all = Object.entries(IDS).flatMap(([cat, ids]) => ids.map((id) => [cat, id] as const));
    expect(all).toHaveLength(40);
    for (const [cat, id] of all) expect(findEvent(content, id)?.category, id).toBe(cat);
  });

  it('romance events: never under 18, never for a Phật tu; picked about the lover', () => {
    let s = cultivator(17);
    for (const id of IDS.romance) expect(eventWeight(s, content, findEvent(content, id)!), id).toBe(0);
    s = cultivator(25);
    const met = createNpc(s, content, { role: 'người quen', age: 24, affinity: 50 });
    s = applyRomance(met.state, content, met.id, { pursue: true });
    // An honest nature, so affinity moves at the plain rate.
    s = { ...s, npcs: s.npcs.map((n) => ({ ...n, nature: 'chan_thanh', surface: 'on_hoa' })) };
    expect(eventWeight(s, content, findEvent(content, 'tang_qua')!)).toBeGreaterThan(0);
    expect(eventWeight({ ...s, cult: { ...s.cult, lineage: 'phat' } }, content, findEvent(content, 'tang_qua')!)).toBe(0);
    // The gift event names the lover and raises their affinity.
    const r = pick(s, 'tang_qua', 0);
    expect(r.state.log.at(-1)!.lines.some((l) => l.text.includes(npcById(s, met.id)!.name))).toBe(true);
    expect(npcById(r.state, met.id)!.affinity).toBe(60);
  });

  it('meeting someone in the rain starts a courtship with an adult', () => {
    for (let i = 0; i < 10; i++) {
      const s = { ...cultivator(18), rng: createLife({ seed: `rain${i}` }, content).rng };
      const r = pick(s, 'chung_o_duoi_mua', 0).state;
      const lover = npcById(r, r.romance.lover)!;
      expect(lover.age).toBeGreaterThanOrEqual(18);
      expect(lover.affinity).toBe(65);
    }
  });

  it('a political match weds the event’s new NPC at low affinity; song tu feeds both', () => {
    let s = pick(cultivator(30, { cult: { ...cultivator().cult, realm: 'truc_co', stage: 0 } }), 'the_gia_cau_than', 0).state;
    const partner = npcById(s, s.romance.partner)!;
    expect(partner.affinity).toBe(20);
    expect(partner.age).toBeGreaterThanOrEqual(18);
    expect(s.flags.re_han_gia).toBe(true);
    s = { ...s, npcs: s.npcs.map((n) => (n.id === partner.id ? { ...n, realm: 'luyen_khi', progress: 10 } : n)), cult: { ...s.cult, realm: 'luyen_khi', progress: 0 } };
    expect(eventWeight(s, content, findEvent(content, 'song_tu')!)).toBeGreaterThan(0);
    const after = pick(s, 'song_tu', 0).state;
    expect(after.cult.progress).toBeGreaterThan(0);
    expect(npcById(after, partner.id)!.progress).toBe(30);
  });

  it('{deceased} names the dead parent; a failed cure takes the mother at year end', () => {
    const base = cultivator(40);
    const mother = base.family.find((r) => r.role === 'mother')!;
    const s = { ...base, family: base.family.map((r) => (r.role === 'father' ? { ...r, alive: false } : r)) };
    expect(fillTemplate('{deceased} đứng đó', s, content)).toMatch(/^cha /);
    const dies = { ...base, sect: { ...base.sect, id: 'bich_lac_tong', rank: 1 } };
    for (let i = 0; i < 20; i++) {
      const r = pick({ ...dies, rng: createLife({ seed: `cure${i}` }, content).rng }, 'u_ha_giao_dich', 1);
      if (r.success === false) {
        expect(r.state.family.find((x) => x.id === mother.id)!.lifespan).toBe(r.state.family.find((x) => x.id === mother.id)!.age + 1);
        expect(advanceYear(r.state, content).family.find((x) => x.id === mother.id)!.alive).toBe(false);
        return;
      }
    }
    throw new Error('no failed roll in 20 tries');
  });

  it('burning blood costs lifespan before the fight; dark choices seed tâm ma', () => {
    const s = cultivator(30);
    const r = pick(s, 'cam_thuat_dot_huyet', 0).state;
    expect(r.cult.lifespan).toBe(s.cult.lifespan - 10);
    expect(r.combat?.foe.name).toBe('Kẻ địch');
    expect(pick(s, 'lo_dinh_cam_do', 0).state.cult.heartDemon).toBe(2);
  });

  it('plunder kills leave a debt of blood that comes back years later', () => {
    const s = pick(cultivator(30), 'bi_canh_chia_cua', 0).state;
    expect(s.combat?.foe.name).toBe('Ba tán tu bị thương');
    // Winning the fight applies the win outcome: the pill, the flag and the follow-up.
    const won = settle({ ...s, combat: { ...s.combat!, phase: 'won' } }, content, 'spare').state;
    expect(won.inventory.truc_co_dan).toBe(1);
    expect(won.flags.da_giet_doat_bao).toBe(true);
    const due = won.events.followUps.find((f) => f.event === 'bao_thu_doat_bao')!;
    expect(due.atAge - 30).toBeGreaterThanOrEqual(3);
    expect(due.atAge - 30).toBeLessThanOrEqual(15);
  });

  it('hidden and gated choices: reputation, items, crafts', () => {
    const s = cultivator(30);
    const hunt = findEvent(content, 'doi_san_yeu')!;
    expect(visibleChoices(s, content, hunt).find((c) => c.text.startsWith('Báo cho hùng yêu'))?.disabled ?? true).toBe(true);
    const friend = { ...s, social: { ...s.social, reputation: { ...s.social.reputation, yeu: 40 } } };
    expect(visibleChoices(friend, content, hunt).find((c) => c.text.startsWith('Báo cho hùng yêu'))!.disabled).toBe(false);
    const pet = { ...s, flags: { co_linh_thu: true } };
    const ev = findEvent(content, 'linh_thu_tien_hoa')!;
    expect(visibleChoices(pet, content, ev).find((c) => c.text.startsWith('Cho nuốt'))?.disabled ?? true).toBe(true);
    expect(visibleChoices(addItems(pet, ['noi_dan_1']), content, ev).find((c) => c.text.startsWith('Cho nuốt'))!.disabled).toBe(false);
  });

  it('over many lives, the new events show up without flooding the log', () => {
    const fired: Record<string, number> = {};
    let years = 0;
    for (let i = 0; i < 40; i++) {
      let s = createLife({ seed: `jianghu${i}` }, content);
      s = { ...s, destiny: { ...s.destiny, confirmed: true } };
      for (let n = 0; n < 150 && s.alive; n++) {
        if (s.fate) s = { ...s, fate: null };
        if (s.combat) s = s.combat.phase === 'won' ? settle(s, content, 'spare').state : act(s, content, 'all_out').state;
        else if (s.events.pending) {
          const ev = findEvent(content, s.events.pending)!;
          fired[ev.category] = (fired[ev.category] ?? 0) + 1;
          s = resolveChoice(s, content, visibleChoices(s, content, ev).find((c) => !c.disabled)!.index).state;
        } else {
          s = advanceYear(s, content);
          years++;
        }
      }
    }
    const jianghu = ['romance', 'plunder', 'demonic', 'beast', 'market'].reduce((n, c) => n + (fired[c] ?? 0), 0);
    expect(jianghu).toBeGreaterThan(20);
    // At most about one jianghu event every three years on average.
    expect(jianghu / years).toBeLessThan(0.35);
  });
});
