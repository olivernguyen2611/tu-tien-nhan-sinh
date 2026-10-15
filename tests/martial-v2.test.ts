import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, eventWeight, resolveChoice } from '../src/systems/events/engine';
import { martialLabel, martialPower, martialPromote, martialSubStage, trainMartial } from '../src/systems/martial';

const content = loadContent();

function fighter(stage: number, age = 40, reachedAt: number | null = age, physique = 90): GameState {
  const b = createLife({ seed: 'v2' }, content);
  return {
    ...b,
    character: { ...b.character, age, originId: 'nong_dan' },
    stats: { health: 70, happiness: 50, intellect: 50, charm: 50 },
    aptitudes: { physique, comprehension: 50, luck: 50, daoHeart: 50 },
    traits: [],
    flags: {},
    log: [...b.log, { age, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, root: { grade: 'none', elements: [] }, lifespan: 75 },
    martial: { ...b.martial, stage, years: 0, bonus: 0, lastTrain: null, reachedAt },
  };
}

describe('9.V2: martial tiểu cảnh, tẩu hỏa, Tiên Võ đồng tu', () => {
  it('each stage has sơ nhập, tiểu thành, đại thành by years held; each adds combat.stagePct', () => {
    const per = content.balance.martial.subStageYears![4];
    const s0 = fighter(4, 40, 40);
    expect(martialSubStage(s0, content)).toBe(0);
    expect(martialLabel(s0, content)).toBe('Hóa cảnh sơ nhập');
    const s2 = fighter(4, 40 + per * 5, 40);
    expect(martialSubStage(s2, content)).toBe(2);
    expect(martialLabel(s2, content)).toBe('Hóa cảnh đại thành');
    const base = content.balance.martial.combatPower[4];
    expect(martialPower(s2, content)).toBeCloseTo(base * (1 + 2 * content.balance.combat.stagePct));
    // Old saves (no reachedAt) start at sơ nhập.
    expect(martialSubStage(fighter(4, 50, null), content)).toBe(0);
  });

  it('đại thành Tam hoa stays below sơ nhập Ngũ khí', () => {
    const tamHoa = martialPower(fighter(5, 80, 40), content);
    expect(tamHoa).toBeLessThan(martialPower(fighter(6), content));
  });

  it('Ngũ khí is the end: promote stays mortal and logs the peak', () => {
    const s = martialPromote(fighter(5), content);
    expect(s.martial.stage).toBe(6);
    expect(s.cult.realm).toBe('pham_nhan');
    expect(s.log.at(-1)!.lines.map((l) => l.text)).toContain(content.martial.texts.peak);
  });

  it('forcing Hóa cảnh past its years can cause tẩu hỏa (health loss), rarely a lost stage', () => {
    const need = content.balance.martial.steps[4].years;
    let hurt = 0;
    for (let i = 0; i < 200; i++) {
      const s = { ...fighter(3, 40, 30, 70), rng: new Rng(`dev${i}`).getState() };
      const t = { ...s, martial: { ...s.martial, years: need + 2 } };
      const out = trainMartial(t, content)!.state;
      if (out.martial.stage === 4) continue;
      if (out.stats.health < s.stats.health) hurt++;
      expect(out.martial.stage).toBeGreaterThanOrEqual(2);
    }
    expect(hurt).toBeGreaterThan(0);
    expect(hurt).toBeLessThan(60);
  });

  it('the tiên duyên event needs Ngũ khí and the cao nhân; accepting steps into Luyện Khí', () => {
    const ev = findEvent(content, 'vd_tien_vo_dong_tu')!;
    const peak = martialPromote(martialPromote(fighter(4), content), content);
    expect(eventWeight({ ...peak, flags: {} }, content, ev)).toBe(0);
    const ready = { ...peak, flags: { ...peak.flags, cao_nhan_vo_dao: true } };
    expect(eventWeight(ready, content, ev)).toBeGreaterThan(0);
    const go = resolveChoice({ ...ready, events: { ...ready.events, pending: ev.id } }, content, 0).state;
    expect(go.cult.realm).toBe('luyen_khi');
    expect(go.cult.root?.grade).toBe('ngu_khi');
    const stay = resolveChoice({ ...ready, events: { ...ready.events, pending: ev.id } }, content, 1).state;
    expect(stay.cult.realm).toBe('pham_nhan');
    expect(stay.martial.stage).toBe(6);
  });
});
