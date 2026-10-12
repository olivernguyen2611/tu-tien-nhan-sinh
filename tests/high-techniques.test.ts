import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { majorBreakthroughInfo, attemptMajorBreakthrough } from '../src/systems/cultivation';
import { adaptiveMul, techniqueById, techniqueMaxRealm, techniqueMul, techniqueSummary } from '../src/systems/technique';
import { devSetRealm } from '../src/systems/dev';

const content = loadContent();
const thaiSo = techniqueById(content, 'thai_so_dien_dao_kinh')!;

function cultivator(grade: string, tech: string, patch: Partial<GameState['cult']> = {}): GameState {
  const b = createLife({ seed: 'high-tech' }, content);
  const s = devSetRealm({ ...b, cult: { ...b.cult, root: { grade, elements: ['kim', 'moc'] } } }, content, 'nguyen_anh');
  return { ...s, cult: { ...s.cult, technique: tech, learned: [tech], stage: 3, progress: 100, ...patch }, log: [...s.log, { age: s.character.age, lines: [] }] };
}

describe('Thái Sơ Diễn Đạo Kinh and the high realms (backlog 8)', () => {
  it('is adaptive: the weaker the root, the more it makes up, a special body gets a flat share', () => {
    const weak = adaptiveMul(thaiSo, cultivator('ngu', thaiSo.id), content);
    const strong = adaptiveMul(thaiSo, cultivator('don', thaiSo.id), content);
    expect(weak).toBeGreaterThan(strong);
    expect(strong).toBeGreaterThan(1);
    const body = adaptiveMul(thaiSo, cultivator('the_chat', thaiSo.id, { bodyId: 'luu_ly_linh_the' }), content);
    expect(body).toBeCloseTo(1 + content.balance.techniques.adaptive.body);
    const plain = techniqueById(content, 'dan_khi_quyet')!;
    expect(adaptiveMul(plain, cultivator('ngu', plain.id), content)).toBe(1);
    expect(techniqueMul(cultivator('ngu', thaiSo.id), content)).toBeGreaterThan(techniqueMul(cultivator('don', thaiSo.id), content));
    expect(techniqueSummary(cultivator('song', thaiSo.id), content)).toContain('tự thích ứng');
  });

  it('is opened up to Hóa Thần so far, and the breakthrough into Hóa Thần is open', () => {
    expect(techniqueMaxRealm(thaiSo, content)).toBe('hoa_than');
    const info = majorBreakthroughInfo(cultivator('song', thaiSo.id), content)!;
    expect(info.target.id).toBe('hoa_than');
    expect(info.blocked).toBeNull();
    expect(attemptMajorBreakthrough(cultivator('song', thaiSo.id), content)).not.toBeNull();
  });

  it('a Địa technique still stops at Nguyên Anh, a Thiên one carries on', () => {
    expect(majorBreakthroughInfo(cultivator('song', 'ho_anh_thanh_lien_quyet'), content)!.blocked).toContain('Nguyên Anh');
    expect(majorBreakthroughInfo(cultivator('song', 'hu_khong_hoa_than_kinh'), content)!.blocked).toBeNull();
  });

  it('every Nguyên Anh / Hóa Thần technique can be found in an event', () => {
    const text = JSON.stringify(content.events);
    for (const id of ['ho_anh_thanh_lien_quyet', 'huyet_hai_phan_anh_cong', 'van_kiem_quy_tong_quyet', 'bat_dong_kim_than_quyet', 'hu_khong_hoa_than_kinh', 'thien_ma_giai_the_dai_phap']) expect(text).toContain(`"gainTechnique":"${id}"`);
  });
});
