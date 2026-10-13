import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { eventWeight, findEvent } from '../src/systems/events/engine';
import { sectEligibility } from '../src/systems/sect';
import { treasuryViews } from '../src/systems/sectTreasury';

const content = loadContent();

describe('6b.6 hành động hợp ngữ cảnh', () => {
  it('no sect takes in an infant', () => {
    const s = createLife({ seed: 'baby' }, content);
    const strong = { ...s, aptitudes: { ...s.aptitudes, daoHeart: 100 } };
    expect(sectEligibility(strong, content, 'vo_uu_tu')).toContain('tuổi');
    const older = { ...strong, character: { ...strong.character, age: content.balance.sects.minJoinAge } };
    expect(sectEligibility(older, content, 'vo_uu_tu')).toBeNull();
  });

  it('a sect disciple is not offered a mortal apprenticeship', () => {
    const s = createLife({ seed: 'apprentice' }, content);
    const teen = { ...s, character: { ...s.character, age: 14 } };
    const ev = findEvent(content, 'hoc_nghe')!;
    expect(eventWeight(teen, content, ev)).toBeGreaterThan(0);
    expect(eventWeight({ ...teen, sect: { ...teen.sect, id: 'bich_lac_tong' } }, content, ev)).toBe(0);
  });

  it('the treasury will not sell a Trúc Cơ Đan to a Trúc Cơ', () => {
    const s = createLife({ seed: 'pill' }, content);
    const rich = { ...s, character: { ...s.character, age: 40 }, sect: { ...s.sect, id: 'bich_lac_tong', rank: 3, contribution: 1000 } };
    const view = (realm: string) => treasuryViews({ ...rich, cult: { ...rich.cult, realm } }, content).find((t) => t.id === 'kho_truc_co_dan')!;
    expect(view('luyen_khi').blocked).toBeNull();
    expect(view('truc_co').blocked).toBe('Vô dụng ở cảnh giới này.');
  });
});
