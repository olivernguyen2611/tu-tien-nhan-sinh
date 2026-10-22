import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { addWound, artFits, artsBonus, artsOf, artsYear, buyWeapon, gainWeapon, learnArt, martialArtsLine, practiseArt, woundFromDefeat } from '../src/systems/martialArts';
import { combatPower } from '../src/systems/combat';
import { meets } from '../src/systems/events/conditions';

const content = loadContent();
const cfg = content.balance.arts!;
const at = (age: number, physique = 60, comprehension = 60, daoHeart = 60): GameState => {
  const s = createLife({ seed: 'vo-hoc', originId: 'vo_lam' }, content);
  return { ...s, character: { ...s.character, age }, cult: { ...s.cult, realm: 'pham_nhan' }, aptitudes: { ...s.aptitudes, physique, comprehension, daoHeart }, money: { ...s.money, silver: 500 } };
};
/** Practise until the art is at its peak or gone (enough tries to cover every xp step). */
const train = (s: GameState, times: number) => { for (let i = 0; i < times; i++) s = practiseArt({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content); return s; };

describe('Võ học phàm tục (11.3)', () => {
  it('learns a bí kíp only when body and mind are up to it; the path grows', () => {
    const weak = at(20, 10, 10);
    expect(artFits(weak, content, 'liet_hoa_dao')).toBe(false);
    expect(artsOf(learnArt(weak, content, 'liet_hoa_dao')).known).toHaveLength(0);
    const s = learnArt(at(20), content, 'liet_hoa_dao');
    expect(artsOf(s).known.map((k) => k.id)).toEqual(['liet_hoa_dao']);
    expect(s.paths.weapon).toBe(at(20).paths.weapon + cfg.pathAffinity);
    expect(learnArt(s, content, 'liet_hoa_dao').martialArts).toEqual(s.martialArts);
    const drawn = learnArt(at(20), content, { grades: [1] });
    expect(content.martialArts!.arts.find((a) => a.id === artsOf(drawn).known[0].id)!.grade).toBe(1);
    expect(meets(s, { arts: { knows: 'liet_hoa_dao', countMin: 1 } }, content)).toBe(true);
  });

  it('practice raises the tầng and chiến lực, capped; a nội công at its peak adds thọ nguyên once', () => {
    let s = learnArt(at(20, 60, 60, 90), content, 'quy_tuc_cong');
    const before = artsBonus(s, content);
    const life = s.cult.lifespan;
    s = train(s, 80);
    const k = artsOf(s).known.find((x) => x.id === 'quy_tuc_cong');
    if (k) {
      expect(k.level).toBeGreaterThan(1);
      expect(artsBonus(s, content)).toBeGreaterThan(before);
      if (k.level === 6) expect(s.cult.lifespan).toBeGreaterThanOrEqual(life + 3);
    }
    expect(artsBonus(s, content)).toBeLessThanOrEqual(cfg.maxBonus);
  });

  it('a fake tàn quyển gives way past its real pages (tẩu hỏa), leaving nội thương', () => {
    let s = learnArt(at(20, 60, 60, 10), content, 'vo_danh_tan_quyen');
    s = train(s, 120);
    expect(artsOf(s).known.some((k) => k.id === 'vo_danh_tan_quyen')).toBe(false);
    expect(artsOf(s).wound).toBeGreaterThan(0);
    expect(s.log.flatMap((y) => y.lines).some((l) => l.text.includes('đồ giả'))).toBe(true);
  });

  it('buys the best binh khí the purse allows, fits an art of its kind; a won one is kept only if better', () => {
    let s = learnArt(at(20), content, 'thanh_phong_kiem');
    const poor = buyWeapon({ ...s, money: { ...s.money, silver: 5 } }, content, 'best');
    expect(artsOf(poor).weapon).toBeNull();
    s = buyWeapon(s, content, 'thu_tien_kiem');
    expect(artsOf(s).weapon).toBe('thu_tien_kiem');
    expect(s.money.silver).toBe(500 - 280);
    expect(artsBonus(s, content)).toBeCloseTo(0.035 + 0.16 * cfg.weaponFit);
    expect(artsOf(gainWeapon(s, content, 'thiet_con')).weapon).toBe('thu_tien_kiem');
    expect(combatPower(s, content)).toBeGreaterThan(combatPower(at(20), content));
    expect(martialArtsLine(s, content)).toContain('Thu Thủy kiếm');
  });

  it('a lost fight leaves nội thương (thọ nguyên, chiến lực); it mends year by year, a deep one hurts', () => {
    const s0 = at(30);
    const w = woundFromDefeat(s0, content);
    expect(artsOf(w.state).wound).toBe(cfg.woundPerLoss);
    expect(w.state.cult.lifespan).toBe(s0.cult.lifespan - cfg.woundLifespan);
    expect(w.line).not.toBeNull();
    expect(artsBonus(w.state, content)).toBeLessThan(0);
    const deep = addWound(s0, content, 80);
    const y = artsYear(deep, content);
    expect(artsOf(y).wound).toBe(80 - cfg.woundHeal);
    expect(y.stats.health).toBe(Math.max(0, deep.stats.health + cfg.woundHurt));
    expect(meets(deep, { arts: { woundMin: 30 } }, content)).toBe(true);
    // Cultivators shrug phàm võ học off.
    expect(woundFromDefeat({ ...s0, cult: { ...s0.cult, realm: 'luyen_khi' } }, content).line).toBeNull();
  });
});
