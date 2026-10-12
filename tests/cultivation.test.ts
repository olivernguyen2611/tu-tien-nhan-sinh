import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { attemptMajorBreakthrough, breakthroughPct, cultivateYear, inBottleneck, majorBreakthroughInfo, enterRealm, hookActive, realmLabel, revealRoot, rollRoot, rootName, rootNameOf, rootTestAge, startCultivating, yearlyGain } from '../src/systems/cultivation';
import { migrate, makeSave } from '../src/systems/save';
import { resolveChoice } from '../src/systems/events/engine';

const content = loadContent();
const speed = (grade: string) => content.balance.roots.gradeSpeed[grade];

/** Pass years (taking the first choice of any event) until the root is known or age 20. */
function untilTested(seed: string, originId?: string): GameState {
  let s = createLife({ seed, originId }, content);
  s = { ...s, destiny: { ...s.destiny, confirmed: true } };
  while (s.alive && !s.cult.root && s.character.age < 20) {
    s = s.events.pending ? resolveChoice(s, content, 0).state : advanceYear(s, content);
  }
  return s;
}

describe('spirit root (task 2.2)', () => {
  it('every life is booked a root test between 6 and 12', () => {
    for (let i = 0; i < 50; i++) {
      const s = createLife({ seed: `book${i}` }, content);
      const test = s.events.followUps.find((f) => f.event === content.world.rootTestEvent);
      expect(test?.atAge).toBe(rootTestAge(`book${i}`, content));
      expect(test!.atAge).toBeGreaterThanOrEqual(6);
      expect(test!.atAge).toBeLessThanOrEqual(12);
    }
  });

  it('taking the test reveals the root at the booked age', () => {
    const s = untilTested('reveal-1');
    expect(s.cult.root).not.toBeNull();
    expect(s.character.age).toBe(rootTestAge('reveal-1', content));
    expect(s.log.at(-1)!.lines.some((l) => l.text.startsWith('Linh căn: '))).toBe(true);
  });

  it('hiding books the test again next year', () => {
    let s = createLife({ seed: 'hide' }, content);
    const age = rootTestAge('hide', content);
    s = { ...s, character: { ...s.character, age }, events: { ...s.events, pending: 'thu_linh_can', followUps: [] } };
    s = resolveChoice(s, content, 1).state;
    expect(s.cult.root).toBeNull();
    expect(s.events.followUps).toEqual([{ event: 'thu_linh_can', atAge: age + 1 }]);
  });

  it('roughly follows the grade table (60% no root)', () => {
    const rng = new Rng('grades');
    let none = 0;
    for (let i = 0; i < 4000; i++) if (rollRoot(rng, content).root.grade === 'none') none++;
    expect(none / 4000).toBeGreaterThan(0.56);
    expect(none / 4000).toBeLessThan(0.64);
  });

  it('elements match the grade', () => {
    const rng = new Rng('elements');
    const variant = content.cultivation.roots.elements.filter((e) => e.variant).map((e) => e.id);
    for (let i = 0; i < 3000; i++) {
      const { root: r, bodyId } = rollRoot(rng, content);
      expect(new Set(r.elements).size).toBe(r.elements.length);
      if (r.grade === 'the_chat') expect(bodyId).not.toBeNull();
      else expect(bodyId).toBeNull();
      if (r.grade === 'the_chat') continue;
      else expect(r.elements).toHaveLength(content.balance.roots.elementCount[r.grade]);
      if (r.grade === 'bien_di') expect(variant).toContain(r.elements[0]);
    }
  });

  it('clan descendants keep the better of two rolls', () => {
    const avg = (rolls: number) => {
      const rng = new Rng(`clan${rolls}`);
      let sum = 0;
      for (let i = 0; i < 3000; i++) sum += speed(rollRoot(rng, content, rolls).root.grade);
      return sum / 3000;
    };
    expect(avg(2)).toBeGreaterThan(avg(1) * 1.3);
  });

  it('names roots with their elements', () => {
    expect(rootName({ grade: 'song', elements: ['kim', 'hoa'] }, content)).toBe('Song linh căn (Kim, Hỏa)');
    expect(rootName({ grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'] }, content)).toBe('Ngũ linh căn');
    expect(rootNameOf({ grade: 'the_chat', elements: [] }, 'cuu_duong_the', content)).toBe('Cửu Dương Thể');
    expect(rootName({ grade: 'none', elements: [] }, content)).toBe('Không linh căn');
  });

  it('a special body applies its stat and lifespan hooks once', () => {
    const base = createLife({ seed: 'body' }, content);
    // Force the body by giving it all the weight.
    const forced = {
      ...content,
      balance: {
        ...content.balance,
        roots: { ...content.balance.roots, gradeWeights: { the_chat: 1 }, bodyWeights: { thien_tuyet_mach: 1 } },
      },
    };
    const s = { ...base, character: { ...base.character, age: 8 } };
    const { state } = revealRoot(s, forced);
    expect(state.cult.bodyId).toBe('thien_tuyet_mach');
    expect(state.cult.lifespan).toBe(Math.round(base.cult.lifespan * 0.3));
    expect(revealRoot(state, forced).state).toBe(state);
  });

  it('is reproducible for the same seed', () => {
    expect(untilTested('same').cult.root).toEqual(untilTested('same').cult.root);
  });
});

/** A cultivator at Luyện Khí with plain aptitudes (50) and no traits. */
function cultivator(seed: string, patch: Partial<GameState['cult']> = {}, grade = 'song'): GameState {
  const b = createLife({ seed }, content);
  const s: GameState = {
    ...b,
    character: { ...b.character, age: 15 },
    aptitudes: { physique: 50, comprehension: 50, luck: 50, daoHeart: 50 },
    stats: { ...b.stats, health: 80 },
    paths: {},
    traits: [],
    destiny: { ...b.destiny, confirmed: true },
    events: { ...b.events, followUps: [] },
    cult: { ...b.cult, root: { grade, elements: ['kim', 'hoa'] } },
    log: [...b.log, { age: 15, lines: [] }],
  };
  return { ...s, cult: { ...s.cult, realm: 'luyen_khi', ...patch } };
}

describe('cultivation per year (task 2.3)', () => {
  it('follows G.1: base speed × root × aptitude', () => {
    expect(yearlyGain(cultivator('g1'), content)).toBeCloseTo(25);
    const genius = { ...cultivator('g2', {}, 'don'), aptitudes: { physique: 70, comprehension: 70, luck: 50, daoHeart: 50 } };
    expect(yearlyGain(genius, content)).toBeCloseTo(25 * 1.6 * 3 ** 0.4); // playtest 2026-10-12: aptitudeGrowth 3
    expect(yearlyGain({ ...cultivator('g3'), cult: { ...cultivator('g3').cult, realm: 'pham_nhan' } }, content)).toBe(0);
  });

  it('a meridian injury halves the gain until it heals', () => {
    const s = cultivator('inj', { injuredUntil: 18 });
    expect(yearlyGain(s, content)).toBeCloseTo(12.5);
    const healed = cultivateYear({ ...s, character: { ...s.character, age: 18 } }, content);
    expect(healed.cult.injuredUntil).toBeNull();
  });

  it('lineage hooks count only for that lineage', () => {
    const body = (lineage: string | null) => cultivator('ma', { root: { grade: 'the_chat', elements: [] }, bodyId: 'thien_sinh_ma_the', lineage });
    expect(yearlyGain(body('ma'), content) / yearlyGain(body(null), content)).toBeCloseTo(1.2);
    expect(yearlyGain(body('tien'), content)).toBeCloseTo(yearlyGain(body(null), content));
  });

  it('G.2: stage chance moves with comprehension, đạo tâm and past failures', () => {
    const s = cultivator('bt');
    expect(breakthroughPct(s, content, 90, false)).toBeCloseTo(90);
    const wise = { ...s, aptitudes: { ...s.aptitudes, comprehension: 80, daoHeart: 70 } };
    expect(breakthroughPct(wise, content, 30, true)).toBeCloseTo(30 + 9 + 4);
    const failed = { ...s, cult: { ...s.cult, fails: { 'luyen_khi:0': 2 } } };
    expect(breakthroughPct(failed, content, 90, false)).toBeCloseTo(80);
    expect(breakthroughPct(s, content, 200, false)).toBe(95);
  });

  it('a full bar climbs to the next Luyện Khí stage about 90% of the time', () => {
    let up = 0;
    for (let i = 0; i < 400; i++) {
      const s = cultivateYear(cultivator(`up${i}`, { progress: 99 }), content);
      if (s.cult.stage === 1) {
        up++;
        expect(s.cult.progress).toBe(0);
      } else {
        expect(s.cult.fails['luyen_khi:0']).toBe(1);
      }
    }
    expect(up / 400).toBeGreaterThan(0.85);
    expect(up / 400).toBeLessThan(0.95);
  });

  it('stops at Luyện Khí 9 with a full bar and says so once', () => {
    let s = cultivator('peak', { stage: 8, progress: 90 });
    s = cultivateYear(s, content);
    expect(s.cult.stage).toBe(8);
    expect(s.cult.progress).toBe(100);
    const lines = s.log.at(-1)!.lines.length;
    s = cultivateYear(s, content);
    expect(s.log.at(-1)!.lines.length).toBe(lines);
    expect(realmLabel(s, content)).toBe('Luyện Khí tầng 9');
  });

  it('a Song linh căn with plain aptitudes reaches Luyện Khí 9 in about 36 years', () => {
    let s = cultivator('long');
    let years = 0;
    while (!(s.cult.stage === 8 && s.cult.progress >= 100) && years < 100) {
      s = cultivateYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
      years++;
    }
    expect(years).toBeGreaterThan(30);
    expect(years).toBeLessThan(50);
  });

  it('a root starts Luyện Khí 1 with a longer life; no root stays mortal', () => {
    const b = createLife({ seed: 'start' }, content);
    const s = { ...b, character: { ...b.character, age: 9 }, cult: { ...b.cult, root: { grade: 'tam', elements: ['kim', 'moc', 'thuy'] } } };
    const { state, line } = startCultivating(s, content);
    expect(state.cult.realm).toBe('luyen_khi');
    expect(state.cult.stage).toBe(0);
    expect(state.cult.lifespan - s.cult.lifespan).toBeGreaterThanOrEqual(40);
    expect(state.cult.lifespan - s.cult.lifespan).toBeLessThanOrEqual(60);
    expect(line?.text).toContain('Luyện Khí tầng 1');
    const none = { ...s, cult: { ...s.cult, root: { grade: 'none', elements: [] } } };
    expect(startCultivating(none, content).state).toBe(none);
  });

  it('Thiên Tuyệt Mạch gives its lifespan back on reaching Trúc Cơ (activeUntil)', () => {
    const s = cultivator('ttm', { root: { grade: 'the_chat', elements: [] }, bodyId: 'thien_tuyet_mach', lifespan: 36 });
    const hook = content.cultivation.roots.bodies.find((b) => b.id === 'thien_tuyet_mach')!.effects[1];
    expect(hookActive(hook, s, content)).toBe(true);
    const rng = new Rng('ttm');
    const up = enterRealm(s, content, 'truc_co', rng);
    expect(hookActive(hook, up, content)).toBe(false);
    // 36 + (200 − 120 ± 15) × 0.3, then ÷ 0.3.
    expect(up.cult.lifespan).toBeGreaterThan(36 / 0.3 + 60);
    expect(up.cult.lifespan).toBeLessThan(36 / 0.3 + 100);
  });

  it('old saves get the new cultivation fields', () => {
    const life = createLife({ seed: 'old' }, content);
    const { fails: _f, injuredUntil: _i, lineage: _l, ...oldCult } = life.cult;
    const save = makeSave({ ...life, cult: oldCult as GameState['cult'] }, 1);
    expect(migrate(save).life.cult).toMatchObject({ fails: {}, injuredUntil: null, lineage: null });
  });

  it('a whole life with a root keeps cultivating through advanceYear', () => {
    let s = untilTested('life-x');
    for (let i = 0; i < 300 && s.alive && s.character.age < 60; i++) {
      s = s.events.pending ? resolveChoice(s, content, 0).state : advanceYear(s, content);
    }
    if (s.cult.root && content.balance.roots.gradeSpeed[s.cult.root.grade] > 0) expect(s.cult.realm).toBe('luyen_khi');
    else expect(s.cult.realm).toBe('pham_nhan');
  });
});

describe('big breakthrough into Trúc Cơ (task 2.6)', () => {
  const peak = (seed: string, patch: Partial<GameState['cult']> = {}) => cultivator(seed, { stage: 8, progress: 100, lifespan: 130, ...patch });

  it('is offered only at Luyện Khí 9 with a full bar, once a year', () => {
    expect(majorBreakthroughInfo(createLife({ seed: 'm' }, content), content)).toBeNull();
    expect(majorBreakthroughInfo(cultivator('low', { stage: 3 }), content)?.blocked).toContain('Luyện Khí tầng 9');
    const info = majorBreakthroughInfo(peak('ok'), content)!;
    expect(info.blocked).toBeNull();
    expect(info.target.id).toBe('truc_co');
    expect(info.chancePct).toBeCloseTo(30);
    const tried = attemptMajorBreakthrough(peak('ok'), content)!.state;
    if (tried.alive && tried.cult.realm === 'luyen_khi') expect(attemptMajorBreakthrough(tried, content)).toBeNull();
  });

  it('succeeds about 30% of the time; success brings a foundation and a longer life', () => {
    let ok = 0;
    let deaths = 0;
    const grades: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const before = peak(`bt${i}`);
      const r = attemptMajorBreakthrough(before, content)!;
      if (r.success) {
        ok++;
        expect(r.state.cult.realm).toBe('truc_co');
        expect(r.state.cult.stage).toBe(0);
        expect(r.state.cult.foundation).not.toBeNull();
        grades[r.state.cult.foundation!] = (grades[r.state.cult.foundation!] ?? 0) + 1;
        const extra = r.state.cult.foundation === 'hoan_my' ? 20 : 0;
        expect(r.state.cult.lifespan - before.cult.lifespan - extra).toBeGreaterThanOrEqual(65);
        expect(r.state.cult.lifespan - before.cult.lifespan - extra).toBeLessThanOrEqual(95);
      } else {
        expect(r.state.cult.fails['luyen_khi:peak']).toBe(1);
        if (!r.state.alive) {
          deaths++;
          expect(r.state.death?.cause).toBe('breakthrough');
        }
      }
    }
    expect(ok / 1000).toBeGreaterThan(0.25);
    expect(ok / 1000).toBeLessThan(0.35);
    // Death is 3% of failures, about 2% of attempts.
    expect(deaths).toBeGreaterThan(5);
    expect(deaths).toBeLessThan(45);
    expect(grades.trung).toBeGreaterThan(grades.hoan_my ?? 0);
  });

  it('better comprehension and đạo tâm give better foundations', () => {
    const avgGrade = (apt: number) => {
      const order = ['ha', 'trung', 'thuong', 'hoan_my'];
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 2000 && n < 300; i++) {
        const s = peak(`fd${apt}-${i}`);
        const r = attemptMajorBreakthrough({ ...s, aptitudes: { ...s.aptitudes, comprehension: apt, daoHeart: apt } }, content)!;
        if (r.success) { sum += order.indexOf(r.state.cult.foundation!); n++; }
      }
      return sum / n;
    };
    expect(avgGrade(90)).toBeGreaterThan(avgGrade(30) + 0.5);
  });

  it('two failures bring the bottleneck: cultivation slows to 30%', () => {
    const s = cultivator('bn', { stage: 8, progress: 50, fails: { 'luyen_khi:peak': 2 } });
    expect(inBottleneck(s, content)).toBe(true);
    expect(yearlyGain(s, content)).toBeCloseTo(25 * 0.3);
    expect(breakthroughPct(s, content, 30, true)).toBeCloseTo(20);
  });

  it('a foundation grade changes the speed in Trúc Cơ', () => {
    const tc = (foundation: string) => cultivator('fs', { realm: 'truc_co', stage: 0, foundation });
    expect(yearlyGain(tc('hoan_my'), content) / yearlyGain(tc('trung'), content)).toBeCloseTo(1.2);
    expect(yearlyGain(tc('trung'), content)).toBeCloseTo(8);
  });

  it('Thiên Tuyệt Mạch is lifted on reaching Trúc Cơ', () => {
    for (let i = 0; i < 200; i++) {
      const s = peak(`ttm${i}`, { root: { grade: 'the_chat', elements: [] }, bodyId: 'thien_tuyet_mach', lifespan: 36 });
      const r = attemptMajorBreakthrough(s, content)!;
      if (!r.success) continue;
      expect(r.state.cult.lifespan).toBeGreaterThan(150);
      return;
    }
    throw new Error('no success in 200 tries');
  });
});
