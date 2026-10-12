import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeBadges } from '../src/systems/achievements';
import { seclusionView } from '../src/systems/seclusion';
import { cultivateYear } from '../src/systems/cultivation';

const content = loadContent();

function peak(): GameState {
  const b = createLife({ seed: 'leftovers' }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    cult: { ...b.cult, realm: 'luyen_khi', stage: 8, progress: 100, root: { grade: 'song', elements: ['kim', 'hoa'] }, lifespan: 150 },
    log: [...b.log, { age: 40, lines: [] }],
  };
}

describe('playtest leftovers', () => {
  it('waiting at the peak builds up a capped bonus for the big breakthrough', () => {
    let s = peak();
    const mb = content.balance.majorBreakthrough;
    for (let i = 0; i < 60; i++) s = cultivateYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(s.cult.nextBonus).toBeGreaterThan(0);
    expect(s.cult.nextBonus).toBeLessThanOrEqual(mb.peakWaitMax);
  });

  it('seclusion says why it is blocked', () => {
    const s = peak();
    const view = seclusionView({ ...s, cult: { ...s.cult, progress: 50 }, events: { ...s.events, pending: 'x' } }, content);
    expect(view.blocked).toContain('chuyện đang chờ');
  });

  it('Một Đời Bình Thường only shows when nothing else fits', () => {
    const dead: GameState = { ...peak(), alive: false, death: { age: 70, cause: 'illness', epitaph: '.' } };
    const ids = lifeBadges(dead, content, 1).map((b) => b.id);
    expect(ids).toContain('tu_si_vo_danh');
    expect(ids).not.toContain('mot_doi_binh_thuong');
    const plain: GameState = { ...dead, cult: { ...dead.cult, realm: 'pham_nhan' } };
    expect(lifeBadges(plain, content, 1).map((b) => b.id)).toContain('mot_doi_binh_thuong');
  });
});
