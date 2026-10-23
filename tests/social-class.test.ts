import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { activityViews } from '../src/systems/activities';
import { meets } from '../src/systems/events/conditions';
import { classDef, classOf, setClass } from '../src/systems/socialClass';
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
