import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeEnding } from '../src/systems/chronicle';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { thienDaoKy } from '../src/systems/thienDaoKy';

const content = loadContent();
const life = confirmDestiny(rollDestiny(createLife({ seed: 'ky' }, content), content), content);
const dead = (over: Partial<GameState>, age = 70, cause: NonNullable<GameState['death']>['cause'] = 'old_age'): GameState =>
  ({ ...life, ...over, character: { ...life.character, age }, alive: false, death: { age, cause, epitaph: 'x' } });

describe('Kết cục đa dạng, Thiên Đạo Ký (9.R10)', () => {
  it('reaches the new endings', () => {
    expect(content.endings!.length).toBeGreaterThanOrEqual(25);
    const hoaThan = { ...life.cult, realm: 'hoa_than' };
    expect(lifeEnding(dead({ cult: hoaThan, aptitudes: { ...life.aptitudes, daoHeart: 90 } }, 900), content, 1)).toBe('hoa_dao');
    expect(lifeEnding(dead({ cult: { ...life.cult, realm: 'truc_co', heartDemon: 25 } }, 120, 'breakthrough'), content, 1)).toBe('thanh_ma');
    expect(lifeEnding(dead({ cult: { ...life.cult, realm: 'pham_nhan' }, martial: { ...life.martial, stage: 6 } }, 60, 'combat'), content, 1)).toBe('vo_dao_tan_cung');
    expect(lifeEnding(dead({ flags: { ...life.flags, phi_thang: true } }), content, 1)).toBe('phi_thang');
  });

  it('tells a finished life in 8–12 paragraphs, nothing while alive', () => {
    expect(thienDaoKy(life, content, 1)).toEqual([]);
    const ky = thienDaoKy(dead({}), content, 1);
    expect(ky.length).toBeGreaterThanOrEqual(6);
    expect(ky.length).toBeLessThanOrEqual(12);
    expect(ky.join(' ')).not.toMatch(/\{\w+\}/);
    expect(ky[0]).toContain(life.character.name);
    expect(ky.at(-1)).toMatch(/^Thiên Đạo ghi: /);
    expect(thienDaoKy(dead({}), content, 1)).toEqual(ky);
  });
});
