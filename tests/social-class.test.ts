import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { activityViews, doActivity } from '../src/systems/activities';
import { careerViews, joinCareer } from '../src/systems/career';
import { jobViews, takeJob } from '../src/systems/jobs';
import { availableActions } from '../src/systems/relationships';
import { meets } from '../src/systems/events/conditions';
import { classDef, classOf, setClass, stipendYear } from '../src/systems/socialClass';
import { standingAllows, standingMul } from '../src/systems/standing';

const content = loadContent();
const life = (origin: string, age = 20) => {
  const s = createLife({ seed: 'giai-cap', originId: origin }, content);
  return { ...s, character: { ...s.character, age } };
};

describe('Giai cấp (15.1)', () => {
  it('every origin belongs to a class of its world; the classes are ranked', () => {
    for (const o of content.origins) expect(classDef(content, o.class), o.id).toBeDefined();
    expect(classOf(life('hoang_tu'), content)).toBe('hoang_toc');
    expect(classOf(life('hoang_than'), content)).toBe('hoang_toc');
    expect(classOf(life('co_nhi'), content)).toBe('ban_dan');
    expect(classDef(content, 'hoang_toc')!.rank).toBeGreaterThan(classDef(content, 'nong_gia')!.rank);
  });

  it('a life can rise or fall into another class, and back', () => {
    const s = life('hoang_tu');
    const fallen = setClass(s, content, 'ban_dan');
    expect(classOf(fallen, content)).toBe('ban_dan');
    expect(classOf(setClass(fallen, content, 'hoang_toc'), content)).toBe('hoang_toc');
    expect(setClass(fallen, content, 'hoang_toc').character.classId).toBeUndefined();
    expect(setClass(s, content, 'khong_co')).toBe(s);
  });

  it('conditions classes / notClasses', () => {
    const prince = life('hoang_tu');
    const farmer = life('nong_dan');
    expect(meets(prince, { classes: ['hoang_toc'] } as never, content)).toBe(true);
    expect(meets(farmer, { classes: ['hoang_toc'] } as never, content)).toBe(false);
    expect(meets(prince, { notClasses: ['hoang_toc', 'quyen_quy'] } as never, content)).toBe(false);
    expect(meets(farmer, { notClasses: ['hoang_toc', 'quyen_quy'] } as never, content)).toBe(true);
  });

  it('an activity shows its giai cấp look (byClass); balance.classes closes activities and mutes events', () => {
    const a = content.activities!.find((x) => x.id === 'tra_quan')!;
    const patched: Content = {
      ...content,
      activities: content.activities!.map((x) => (x.id === a.id ? { ...x, byClass: { hoang_toc: { name: 'Nghe kể chuyện trong cung' } } } : x)),
      balance: { ...content.balance, classes: { hoang_toc: { mul: 0, categories: ['work'], themes: [], ids: [], activityGroups: [], activityIds: ['xem_boi'] } } },
    };
    const prince = life('hoang_tu');
    const farmer = life('nong_dan');
    expect(activityViews(prince, patched).find((v) => v.id === a.id)!.name).toBe('Nghe kể chuyện trong cung');
    expect(activityViews(farmer, patched).find((v) => v.id === a.id)!.name).toBe(a.name);
    const boi = patched.activities!.find((x) => x.id === 'xem_boi')!;
    expect(standingAllows(prince, patched, boi)).toBe(false);
    expect(standingAllows(farmer, patched, boi)).toBe(true);
    // An activity that names its classes stays open to them.
    expect(standingAllows(prince, patched, { ...boi, conditions: { classes: ['hoang_toc'] } as never })).toBe(true);
    expect(standingMul(prince, patched, { id: 'x', category: 'work', themes: [] })).toBe(0);
    expect(standingMul(farmer, patched, { id: 'x', category: 'work', themes: [] })).toBe(1);
  });
});

describe('Hoạt động theo giai cấp (15.2)', () => {
  const ids = (origin: string, age: number) => activityViews(life(origin, age), content).map((v) => v.id);
  const NEVER_ROYAL = ['xin_hoc_truong_lang', 'tu_hoc_len', 'nghe_lom', 'lam_muon_som', 'lam_thue', 'lam_vu_mua', 'cheo_do_thue', 'viet_thue',
    'hoc_nghe_ren', 'hoc_nghe_gom', 'pp_moc_tui', 'pp_trom_vat', 'chieu_bac', 'gia_nhap_bang_hoi', 'ap_tieu', 'tong_quan', 'leu_chong_di_thi', 'on_thi', 'mua_quan'];

  it('a hoàng tử or a hoàng thân never sees a commoner\'s errands at any age', () => {
    for (const origin of ['hoang_tu', 'hoang_than']) for (const age of [6, 8, 10, 14, 20, 35]) {
      const seen = ids(origin, age);
      for (const id of NEVER_ROYAL) expect(seen, `${origin} ${age}: ${id}`).not.toContain(id);
    }
  });

  it('a noble or an official\'s child never sees the village school, the hired work or petty crime', () => {
    for (const origin of ['quy_toc', 'quan_gia', 'tu_tien_gia_toc']) for (const age of [8, 14, 20]) {
      const seen = ids(origin, age);
      for (const id of ['xin_hoc_truong_lang', 'nghe_lom', 'lam_muon_som', 'lam_thue', 'pp_moc_tui', 'pp_trom_vat']) expect(seen, `${origin} ${age}: ${id}`).not.toContain(id);
    }
  });

  it('a farmer\'s child and an orphan still find the village school and odd jobs', () => {
    for (const origin of ['nong_dan', 'co_nhi']) {
      expect(ids(origin, 8)).toContain('xin_hoc_truong_lang');
      expect(ids(origin, 8)).toContain('nghe_lom');
      expect(ids(origin, 20)).toContain('lam_thue');
    }
  });

  it('the same activity reads by giai cấp: Truyền thái y, yến tiệc tông thất', () => {
    const prince = life('hoang_tu', 30);
    const ill = { ...prince, health: { ailments: [{ id: 'cam_mao', since: 30 }] } } as never;
    const sick = activityViews(ill, content).find((v) => v.id === 'moi_lang_trung');
    if (sick) expect(sick.name).toBe('Truyền thái y');
    expect(activityViews(prince, content).find((v) => v.id === 'ket_giao')!.name).toBe('Dự yến tiệc tông thất');
    expect(activityViews(life('nong_dan', 30), content).find((v) => v.id === 'ket_giao')!.name).toBe('Uống rượu đầu làng');
  });
});

describe('Học hành theo giai cấp (15.3)', () => {
  const grow = (origin: string, to: number) => {
    let s = createLife({ seed: `hoc-${origin}`, originId: origin }, content);
    s = { ...s, destiny: { ...s.destiny, confirmed: true } };
    while (s.character.age < to && s.alive) {
      if (s.events.pending) { s = { ...s, events: { ...s.events, pending: null } }; continue; }
      const next = advanceYear(s, content);
      if (next === s) break;
      s = next;
    }
    return s;
  };

  it('a child of a house with its own school is sent there at six; a farmer\'s child is not', () => {
    expect(grow('hoang_tu', 7).school?.at).toBe('thuong_thu_phong');
    expect(grow('quy_toc', 7).school?.at).toBe('toc_hoc');
    expect(grow('tu_tien_gia_toc', 7).school?.at).toBe('toc_hoc');
    expect(grow('quan_gia', 7).school?.at).toBe('tu_thuc');
    expect(grow('nong_dan', 7).school?.at ?? null).toBeNull();
    const teacher = (s: ReturnType<typeof grow>) => s.npcs.find((n) => n.id === s.school!.teacher)!.role;
    expect(teacher(grow('hoang_tu', 7))).toBe('thái phó');
  });

  it('a royal tutor teaches more than a village teacher', () => {
    const def = (id: string) => content.schooling!.schools.find((x) => x.id === id)!;
    expect(def('thuong_thu_phong').gradeMul).toBeGreaterThan(def('truong_lang').gradeMul);
    expect(def('quoc_tu_giam').gradeMul).toBeGreaterThan(def('tu_thuc').gradeMul);
  });

  it('the way into a school follows the class: chùa for the poor, tư thục for a merchant, Quốc Tử Giám for the noble', () => {
    const at = (origin: string, age: number) => activityViews(life(origin, age), content).map((v) => v.id);
    expect(at('co_nhi', 8)).toContain('xin_hoc_chua');
    expect(at('thuong_nhan', 8)).toContain('xin_vao_tu_thuc');
    expect(at('hoang_tu', 8)).not.toContain('xin_hoc_chua');
    expect(at('quy_toc', 13)).toContain('vao_quoc_tu_giam');
    expect(at('quan_gia', 13)).not.toContain('vao_quoc_tu_giam');
    expect(at('nong_dan', 13)).not.toContain('vao_quoc_tu_giam');
  });
});

describe('Việc làm, đường đời, người nhà theo giai cấp (15.4)', () => {
  const free = (origin: string) => ({ ...life(origin), school: undefined });

  it('a hoàng tử sees no job (the Việc làm fold is hidden); a farmer sees the hạ cửu lưu, a quan gia child does not', () => {
    const royal = free('hoang_tu');
    expect(jobViews(royal, content)).toHaveLength(0);
    expect(takeJob(royal, content, 'lam_ruong')).toBeNull();
    const farmer = jobViews(free('nong_dan'), content).map((j) => j.id);
    expect(farmer).toContain('phu_do');
    expect(farmer).toContain('lam_ruong');
    const official = jobViews(free('quan_gia'), content).map((j) => j.id);
    expect(official).not.toContain('phu_do');
    expect(official).not.toContain('lam_ruong');
    expect(official).toContain('thay_do');
    expect(official).toContain('bo_khoai');
  });

  it('a job held before the class changed stays listed', () => {
    const s = takeJob(free('nong_dan'), content, 'lam_ruong')!.state;
    const risen = setClass(s, content, 'hoang_toc');
    expect(jobViews(risen, content).map((j) => j.id)).toEqual(['lam_ruong']);
  });

  it('careers: no Quan lộ, Thương, Võ lâm or Tạp dịch for a hoàng tử; Tạp dịch closed to thế gia', () => {
    const royal = careerViews(life('hoang_tu'), content).map((c) => c.id);
    expect(royal).toEqual(['y']);
    expect(joinCareer(life('hoang_tu'), content, 'thuong')).toBeNull();
    expect(careerViews(life('quy_toc'), content).map((c) => c.id)).not.toContain('tap_dich');
    expect(careerViews(life('nong_dan'), content).map((c) => c.id)).toContain('tap_dich');
  });

  it('family actions take the class name: a hoàng tử asks for a ban thưởng', () => {
    const royal = life('hoang_tu', 14);
    const father = royal.family.find((r) => r.role === 'father')!;
    const names = availableActions(royal, content, father).map((a) => a.name);
    expect(names).toContain('Xin ban thưởng');
    expect(names).not.toContain('Xin tiền');
    const farmer = life('nong_dan', 14);
    expect(availableActions(farmer, content, farmer.family.find((r) => r.role === 'father')!).map((a) => a.name)).toContain('Xin tiền');
  });

  it('bổng lộc: a tông thất child draws a yearly allowance from balance.classStipend; a farmer does not', () => {
    const cfg = content.balance.classStipend!;
    const royal = { ...life('hoang_tu', cfg.fromAge), log: [{ age: cfg.fromAge, lines: [] }] };
    const paid = stipendYear(royal, content);
    expect(paid.money.silver - royal.money.silver).toBe(cfg.silver.hoang_toc);
    expect(paid.log.at(-1)!.lines.at(-1)!.ledger).toBe(true);
    expect(stipendYear({ ...royal, character: { ...royal.character, age: cfg.fromAge - 1 } }, content)).toEqual({ ...royal, character: { ...royal.character, age: cfg.fromAge - 1 } });
    const farmer = life('nong_dan', 20);
    expect(stipendYear(farmer, content)).toBe(farmer);
  });
});

describe('Hoàng tộc trọn bộ, cải trang vi hành (15.5)', () => {
  const ids = (s: ReturnType<typeof life>) => activityViews(s, content).map((a) => a.id);

  it('a hoàng tử has his own học hành and, grown up, khai phủ then sai sự Lục bộ; a farmer sees none of it', () => {
    const boy = life('hoang_tu', 10);
    expect(ids(boy)).toEqual(expect.arrayContaining(['hoc_le_nghi_cung_dinh', 'doc_sach_tang_thu_cac', 'luan_kinh_nghia']));
    const man = life('hoang_tu', 20);
    expect(ids(man)).toContain('xin_phong_tuoc');
    expect(ids(man)).not.toContain('sai_su_luc_bo');
    const opened = { ...man, flags: { ...man.flags, khai_phu: true } };
    expect(ids(opened)).toEqual(expect.arrayContaining(['sai_su_luc_bo', 've_phong_dia']));
    expect(ids(opened)).not.toContain('xin_phong_tuoc');
    const farmer = ids(life('nong_dan', 20));
    for (const id of ['xin_phong_tuoc', 'hoc_le_nghi_cung_dinh', 'cai_trang_vi_hanh', 'yen_tiec_ton_that']) expect(farmer).not.toContain(id);
  });

  it('a công chúa learns cầm kỳ thi họa; a hoàng thân goes to court instead of the throne race', () => {
    const girl = createLife({ seed: 'cong-chua', originId: 'hoang_tu', gender: 'nu' }, content);
    expect(ids({ ...girl, character: { ...girl.character, age: 10 } })).toContain('hoc_cam_ky_thi_hoa');
    const prince = ids(life('hoang_than', 20));
    expect(prince).toEqual(expect.arrayContaining(['vao_trieu_hau', 'dang_so_xin_viec']));
    expect(prince).not.toContain('hau_phe_tau');
  });

  it('in disguise a hoàng tử sees the hội chợ and lôi đài with a commoner\'s words, for one year', () => {
    const s = life('hoang_tu', 20);
    expect(ids(s)).not.toContain('hoi_cho');
    expect(ids(s)).toContain('cai_trang_vi_hanh');
    const out = doActivity(s, content, 'cai_trang_vi_hanh');
    expect(out).not.toBeNull();
    const disguised = { ...out!.state, events: { ...out!.state.events, pending: null } };
    expect(disguised.flags.vi_hanh).toBe(true);
    expect(ids(disguised)).toEqual(expect.arrayContaining(['hoi_cho', 'len_loi_dai', 'hanh_hiep']));
    expect(ids(disguised)).not.toContain('cai_trang_vi_hanh');
    // Still a hoàng tử: no trường làng, no móc túi.
    expect(ids(disguised)).not.toContain('pp_moc_tui');
    expect(classOf(disguised, content)).toBe('hoang_toc');
    const next = advanceYear(disguised, content);
    expect(next.flags.vi_hanh).toBeFalsy();
    expect(ids({ ...next, events: { ...next.events, pending: null } })).not.toContain('hoi_cho');
  });
});

describe('Quyền quý, quan gia (15.6)', () => {
  const ids = (s: ReturnType<typeof life>) => activityViews(s, content).map((a) => a.id);

  it('a quyền quý child takes tập ấm instead of buying an office, keeps an estate, plays đấu dế', () => {
    const noble = ids(life('quy_toc', 20));
    expect(noble).toEqual(expect.arrayContaining(['tap_am', 'vao_cam_quan', 'quan_dien_trang', 'dau_de_dua_ngua', 'mo_thi_xa']));
    expect(noble).not.toContain('mua_quan');
    const out = doActivity(life('quy_toc', 20), content, 'tap_am');
    expect(out!.state.career.id).toBe(content.office!.career);
  });

  it('a quan gia child learns from the father, follows him to his post, gets a thư lại seat by his name', () => {
    expect(ids(life('quan_gia', 10))).toEqual(expect.arrayContaining(['theo_cha_hoc_kinh_su', 'theo_cha_di_nham']));
    const grown = { ...life('quan_gia', 20), school: undefined };
    expect(ids(grown)).toEqual(expect.arrayContaining(['nho_the_cha', 'hanh_quyen', 'ket_van_huu', 'lam_mon_sinh', 'bai_danh_su']));
    expect(doActivity(grown, content, 'nho_the_cha')!.state.job?.id).toBe('thu_lai');
    const farmer = ids(life('nong_dan', 20));
    for (const id of ['tap_am', 'nho_the_cha', 'theo_cha_hoc_kinh_su', 'quan_dien_trang']) expect(farmer).not.toContain(id);
  });
});

describe('Thương gia, võ gia (15.7)', () => {
  const ids = (s: ReturnType<typeof life>) => activityViews(s, content).map((a) => a.id);

  it('a merchant child learns the abacus, grows into the counter, the long trade run, the thương hội and the hoàng thương', () => {
    expect(ids(life('thuong_nhan', 8))).toContain('hoc_tinh_so');
    const grown = life('thuong_nhan', 26);
    expect(ids(grown)).toEqual(expect.arrayContaining(['trong_quay', 'buon_chuyen_xa', 'do_gia_cac_chau', 'gop_von_thuong_hoi']));
    expect(ids(grown)).not.toContain('xin_lam_hoang_thuong');
    const member = { ...grown, flags: { ...grown.flags, thuong_hoi: true } };
    expect(ids(member)).toEqual(expect.arrayContaining(['nghi_su_thuong_hoi', 'xin_lam_hoang_thuong']));
    expect(ids(member)).not.toContain('gop_von_thuong_hoi');
  });

  it('a võ gia child stands in mã bộ, learns the family art, rides with the tiêu, sits the võ cử', () => {
    expect(ids(life('vo_lam', 6))).toContain('tan_ma_bo');
    expect(ids(life('vo_lam', 14))).toEqual(expect.arrayContaining(['hoc_vo_gia_truyen', 'theo_cha_ap_tieu']));
    expect(ids(life('vo_lam', 24))).toEqual(expect.arrayContaining(['thi_vo_cu', 'thu_do_de']));
    const farmer = ids(life('nong_dan', 24));
    for (const id of ['tan_ma_bo', 'hoc_vo_gia_truyen', 'thi_vo_cu', 'trong_quay', 'buon_chuyen_xa']) expect(farmer).not.toContain(id);
  });
});

describe('Nông gia, bần dân (15.8)', () => {
  const ids = (s: ReturnType<typeof life>) => activityViews(s, content).map((a) => a.id);

  it('a farm child herds the buffalo; grown, works the family field, the chợ phiên, khai hoang, rents more land', () => {
    expect(ids(life('nong_dan', 8))).toEqual(expect.arrayContaining(['chan_trau_cat_co', 'mo_cua_bat_oc']));
    expect(ids(life('nong_dan', 22))).toEqual(expect.arrayContaining(['lam_ruong_giup_nha', 'di_cho_phien', 'khai_hoang', 'doi_cong', 'di_phu_dap_de', 'thue_them_ruong']));
  });

  it('an orphan begs, gathers wood, serves a rich house, may join the Cái Bang and look for its origin', () => {
    expect(ids(life('co_nhi', 8))).toEqual(expect.arrayContaining(['an_xin_dau_cho', 'nhat_cui_ban']));
    const grown = ids(life('co_nhi', 18));
    expect(grown).toEqual(expect.arrayContaining(['o_do', 'lam_mo', 'theo_ganh_xiec', 'vao_cai_bang', 'tim_than_the']));
    for (const origin of ['hoang_tu', 'quy_toc', 'quan_gia', 'thuong_nhan']) {
      const rich = ids(life(origin, 18));
      for (const id of ['an_xin_dau_cho', 'o_do', 'chan_trau_cat_co', 'di_phu_dap_de', 'tim_than_the']) expect(rich, `${origin} ${id}`).not.toContain(id);
    }
  });
});

describe('Tu tiên thế gia (15.9)', () => {
  const ids = (s: ReturnType<typeof life>) => activityViews(s, content).map((a) => a.id);

  it('a child of a cultivating clan hears the tộc lão, trains the clan body art, tends the linh điền, joins the tộc tỷ', () => {
    const child = ids(life('tu_tien_gia_toc', 12));
    expect(child).toEqual(expect.arrayContaining(['nghe_toc_lao_giang_dao', 'luyen_the_toc_truyen', 'phu_viec_linh_dien', 'du_toc_ty', 'doc_tang_kinh_gia_toc', 'hau_tong_lao']));
    expect(ids(life('nong_dan', 12))).not.toContain('nghe_toc_lao_giang_dao');
  });

  it('no clan activity grants a spiritual root (the innate-root rule)', () => {
    const own = content.activities!.filter((a) => a.conditions.classes?.includes('tu_gia'));
    for (const a of own) for (const o of [...a.outcomes, ...(a.failOutcomes ?? [])]) expect(o.effects.testRoot, a.id).toBeFalsy();
  });

  it('an activity that speaks of the father hides once he is gone', () => {
    const s = life('quan_gia', 10);
    expect(ids(s)).toContain('theo_cha_hoc_kinh_su');
    expect(ids({ ...s, flags: { ...s.flags, no_father: true } })).not.toContain('theo_cha_hoc_kinh_su');
  });
});

describe('Sự kiện theo giai cấp (15.10)', () => {
  const ev = (id: string) => {
    for (const e of content.events) if (e.id === id) return e;
    throw new Error(id);
  };

  it('a hoàng tử never meets the năm đói, the bắt lính, the chủ nợ; a farmer still does', () => {
    for (const id of ['tc_nan_doi', 'tc_bat_linh', 'ts_chu_no_toi_cua', 'cho_du_dau_lang', 'ld_doi_la']) {
      expect(standingMul(life('hoang_tu', 20), content, ev(id)), id).toBe(0);
      expect(standingMul(life('nong_dan', 20), content, ev(id)), id).toBe(1);
    }
    // A quyền quý is spared the hunger, but the chuyện họ hàng hỏi vay stays.
    expect(standingMul(life('quy_toc', 20), content, ev('ld_nan_doi'))).toBe(0);
    expect(standingMul(life('quy_toc', 20), content, ev('gt_hk_muon_tien'))).toBe(1);
  });

  it('the rich get their own version: open the granary or shut the gate', () => {
    const famine = ev('gc_nan_doi_mo_kho');
    expect(famine.conditions.classes).toEqual(expect.arrayContaining(['hoang_toc', 'quyen_quy']));
    expect(meets(life('nong_dan', 20), famine.conditions, content)).toBe(false);
  });
});
