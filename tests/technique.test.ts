import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { enterFirstRealm, majorBreakthroughInfo, startCultivating, yearlyGain } from '../src/systems/cultivation';
import { joinSect } from '../src/systems/sect';
import { resolveChoice } from '../src/systems/events/engine';
import { makeSave, migrate } from '../src/systems/save';
import { learnBlocked, learnTechnique, techniqueById, techniqueMatches, techniqueMul } from '../src/systems/technique';
import { validateContent } from '../src/core/validate';
import { EventFileSchema } from '../src/core/schemas';

const content = loadContent();
const tech = (id: string) => techniqueById(content, id)!;
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };

function cultivator(technique: string | null, patch: Partial<GameState['cult']> = {}, daoHeart = 50): GameState {
  const b = createLife({ seed: 'tech' }, content);
  return {
    ...b,
    character: { ...b.character, age: 20 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart },
    paths: {},
    traits: [],
    log: [...b.log, { age: 20, lines: [] }],
    cult: { ...b.cult, realm: 'luyen_khi', root: SONG, technique, lineage: technique ? tech(technique).lineage : null, learned: technique ? [technique] : [], lifespan: 130, ...patch },
  };
}

describe('techniques (task 2.4)', () => {
  it('the shipped techniques and sects pass validation', () => {
    expect(content.techniques.length).toBe(30);
    expect(content.sects.map((s) => s.id)).toContain('bich_lac_tong');
    expect(content.sects.find((s) => s.id === 'van_yeu_dien')?.recruitable).toBe(false);
  });

  it('9.R4c: the root test gives no technique; a clan child gets Dẫn Khí Quyết; a sect hands one to a newcomer', () => {
    const b = createLife({ seed: 'start' }, content);
    const plain = startCultivating({ ...b, character: { ...b.character, age: 9, originId: 'nong_dan' }, cult: { ...b.cult, root: SONG } }, content).state;
    expect(plain.cult.technique).toBeNull();
    expect(plain.cult.realm).toBe('pham_nhan');
    const clan = startCultivating({ ...b, character: { ...b.character, age: 9, originId: 'tu_tien_gia_toc' }, cult: { ...b.cult, root: SONG } }, content).state;
    expect(clan.cult.technique).toBe('dan_khi_quyet');
    expect(clan.cult.lineage).toBe('tien');
    expect(clan.cult.realm).toBe('luyen_khi');
    const joined = joinSect({ ...plain, character: { ...plain.character, age: 12 } }, content, 'bich_lac_tong');
    expect(joined.joined).toBe(true);
    expect(joined.state.cult.technique).toBe('dan_khi_quyet');
    expect(enterFirstRealm(joined.state, content).cult.realm).toBe('luyen_khi');
  });

  it('grade, element match and lineage set the multiplier (G.1)', () => {
    expect(techniqueMul(cultivator('dan_khi_quyet'), content)).toBeCloseTo(1);
    expect(techniqueMul(cultivator('tang_phong_kiem_kinh'), content)).toBeCloseTo(1.2); // Huyền, Kim fits
    expect(techniqueMul(cultivator('thanh_moc_truong_sinh_cong'), content)).toBeCloseTo(0.7); // Mộc does not fit Kim/Hỏa
    expect(techniqueMul(cultivator('u_ha_huyet_anh_cong'), content)).toBeCloseTo(1.2 * 0.7 * 1.4); // Ma, mismatch
    expect(yearlyGain(cultivator('tang_phong_kiem_kinh'), content)).toBeCloseTo(25 * 1.2 * (1 + 0.1)); // đạo tâm 50: no penalty; main path Kiếm +10%
  });

  it('matching rules: root/any/none always fit, five needs a basic element, Lưu Ly Linh Thể fits all', () => {
    expect(techniqueMatches(tech('ngu_hanh_luan_chuyen_kinh'), SONG, content)).toBe(true);
    expect(techniqueMatches(tech('ngu_hanh_luan_chuyen_kinh'), { grade: 'bien_di', elements: ['loi'] }, content)).toBe(true); // playtest 2026-10-12: Lôi = Kim + Hỏa
    const stand: SpiritRoot = { grade: 'song', elements: ['moc', 'thuy'] };
    expect(techniqueMatches(tech('hoa_van_quyet'), stand, content, 'luu_ly_linh_the')).toBe(true);
    expect(techniqueMatches(tech('hoa_van_quyet'), stand, content, 'cuu_duong_the')).toBe(false);
    expect(techniqueMatches(tech('tho_nap_tan_quyen'), stand, content, 'cuu_duong_the')).toBe(true);
  });

  it('conditional hooks: Tàng Phong needs đạo tâm, Ngũ Hành rewards 3+ elements', () => {
    const low = cultivator('tang_phong_kiem_kinh', {}, 40);
    expect(yearlyGain(low, content) / yearlyGain(cultivator('tang_phong_kiem_kinh'), content)).toBeCloseTo(0.9 / 1.1);
    const tam: SpiritRoot = { grade: 'tam', elements: ['kim', 'moc', 'thuy'] };
    const withTam = cultivator('ngu_hanh_luan_chuyen_kinh', { root: tam });
    expect(yearlyGain(withTam, content)).toBeCloseTo(25 * 0.7 * 1.2 * 1.15);
  });

  it('requirements block learning', () => {
    expect(learnBlocked(cultivator(null, {}, 40), content, tech('tang_phong_kiem_kinh'))).toContain('Đạo tâm 50');
    expect(learnBlocked(cultivator(null), content, tech('ngu_hanh_luan_chuyen_kinh'))).toContain('3 hệ');
    expect(learnBlocked(cultivator(null), content, tech('bat_tu_u_minh_luc'))).toContain('quỷ tu');
  });

  it('switching costs 20% of the bar, moves lineage and lifespan; stat hooks once', () => {
    const s = cultivator('dan_khi_quyet', { progress: 50 });
    const r = learnTechnique(s, content, 'thanh_moc_truong_sinh_cong')!;
    expect(r.state.cult.progress).toBeCloseTo(40);
    expect(r.state.cult.lifespan).toBe(Math.round(130 * 1.1));
    const back = learnTechnique(r.state, content, 'dan_khi_quyet')!.state;
    expect(back.cult.lifespan).toBe(130);
    const dream = learnTechnique(s, content, 'mong_trung_tan_kinh')!.state;
    expect(dream.aptitudes.comprehension).toBe(55);
    const again = learnTechnique(learnTechnique(dream, content, 'dan_khi_quyet')!.state, content, 'mong_trung_tan_kinh')!.state;
    expect(again.aptitudes.comprehension).toBe(55);
    expect(learnTechnique(s, content, 'dan_khi_quyet')).toBeNull();
  });

  it('the grade caps the realm: Thổ Nạp Tàn Quyển cannot break into Trúc Cơ', () => {
    const peak = cultivator('tho_nap_tan_quyen', { stage: 8, progress: 100 });
    expect(majorBreakthroughInfo(peak, content)?.blocked).toContain('Thổ Nạp Tàn Quyển chỉ tu tới Luyện Khí');
    expect(majorBreakthroughInfo({ ...peak, cult: { ...peak.cult, technique: 'dan_khi_quyet' } }, content)?.blocked).toBeNull();
  });

  it('an event can teach a technique', () => {
    const files = { 'techniques.json': content.techniques, 'worlds/w/events/a.json': [{
      id: 'x', category: 'c', title: 't', text: 'x', weight: 1,
      choices: [{ text: 'a', result: { text: 'b', effects: { learnTechnique: 'khong_co', 'stat.happiness': 1 } } }],
    }] };
    expect(validateContent(files).map((p) => p.message).join()).toContain('công pháp không tồn tại "khong_co"');
    const s = { ...cultivator('dan_khi_quyet'), events: { pending: 'x', history: {}, followUps: [], npc: null } };
    const event = EventFileSchema.parse([{ ...files['worlds/w/events/a.json'][0],
      choices: [{ text: 'a', result: { text: 'b', effects: { learnTechnique: 'hoa_van_quyet', 'stat.happiness': 1 } } }] }]);
    const withEvent = { ...content, events: event };
    expect(resolveChoice(s, withEvent, 0).state.cult.technique).toBe('hoa_van_quyet');
  });

  it('old cultivator saves get Dẫn Khí Quyết', () => {
    const c = cultivator('dan_khi_quyet');
    const { technique: _t, learned: _l, ...oldCult } = c.cult;
    const migrated = migrate(makeSave({ ...c, cult: oldCult as GameState['cult'] }, 1)).life.cult;
    expect(migrated.technique).toBe('dan_khi_quyet');
  });
});
