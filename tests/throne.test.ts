import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { initCourt } from '../src/systems/court';
import { meets } from '../src/systems/events/conditions';
import { applyOutcome } from '../src/systems/events/engine';
import { hitRival, initRoyal, reignTitle, throneAscend, throneLine, throneOf, throneYear } from '../src/systems/throne';

const content = loadContent();
const cfg = content.balance.throne!;
const file = content.throne!;
const fx = (s: GameState, effects: Record<string, unknown>) => applyOutcome(s, content, { text: '', effects: effects as never }, new Rng('t')).state;

const royal = (age = 20, gender: 'nam' | 'nu' = 'nam'): GameState => {
  const s = createLife({ seed: 'hoang-that', originId: 'hoang_tu', gender }, content);
  const grown = { ...s, character: { ...s.character, age, gender }, court: initCourt(s, content) };
  return { ...grown, throne: { ...initRoyal(grown, content)!, since: 0 } };
};

describe('Hoàng thất tranh ngôi (12.6)', () => {
  it('a hoàng tử is born with siblings in line, a mother of some rank and the royal bars', () => {
    const o = content.origins.find((x) => x.id === 'hoang_tu')!;
    expect(o.royal).toBe(true);
    expect(o.rebirthCost).toBeGreaterThan(content.origins.find((x) => x.id === 'hoang_than')!.rebirthCost!);
    const s = royal();
    const t = throneOf(s)!;
    expect(t.path).toBe('royal');
    expect(t.rivals!.length).toBeGreaterThanOrEqual(cfg.rivals[0]);
    expect(Object.keys(t.bars).sort()).toEqual(Object.keys(file.bars.royal!).sort());
    expect(throneLine(s, content)).toContain(file.pathNames.royal);
    // A farmer never gets one.
    const farmer = createLife({ seed: 'hoang-that', originId: 'nong_dan' }, content);
    expect(throneOf(throneYear(farmer, content))).toBeNull();
  });

  it('the old emperor names an heir: the strongest wins, the loser is offered the lập trữ event', () => {
    let s = royal();
    s = { ...s, court: { ...s.court!, emperor: { ...s.court!.emperor, age: 70 } } };
    const strong = { ...s, throne: { ...throneOf(s)!, bars: { favor: 100, power: 100, suspicion: 0 } } };
    const weak = { ...s, throne: { ...throneOf(s)!, bars: { favor: 0, power: 0, suspicion: 0 } } };
    let won = false;
    let lost = false;
    for (let i = 0; i < 40 && !(won && lost); i++) {
      const a = throneYear({ ...strong, seed: `lt${i}` }, content);
      if (throneOf(a)?.heir === 'self') won = true;
      const b = throneYear({ ...weak, seed: `lt${i}` }, content);
      if (throneOf(b)?.heir && throneOf(b)!.heir !== 'self') {
        lost = true;
        expect(b.events.followUps.some((f) => f.event === file.events.heirLost)).toBe(true);
      }
    }
    expect(won && lost).toBe(true);
  });

  it('too much nghi kỵ brings the cup of wine; a named thái tử brought low is phế', () => {
    const s = royal();
    const feared = throneYear({ ...s, throne: { ...throneOf(s)!, bars: { favor: 40, power: 20, suspicion: 95 } } }, content);
    expect(feared.events.followUps.some((f) => f.event === file.events.banned)).toBe(true);
    const t = throneOf(s)!;
    const heir = t.rivals![0].name;
    const withHeir = { ...s, throne: { ...t, heir } };
    const hit = hitRival(withHeir, content, -100);
    expect(throneOf(hit)!.heir).toBeNull();
  });

  it('the named heir takes the throne when the niên hiệu changes; a passed-over sibling becomes a nhàn vương', () => {
    const s = royal(30);
    const turn = (x: GameState): GameState => ({ ...x, times: { ...x.times!, era: 'Thử Nghiệm', eraFrom: 30, eras: [...x.times!.eras, { dynasty: x.times!.dynasty, era: 'Thử Nghiệm', from: 30 }] } });
    const heir = throneYear(turn({ ...s, throne: { ...throneOf(s)!, heir: 'self' } }), content);
    expect(heir.reign).toMatchObject({ how: 'royal', era: 'Thử Nghiệm', founder: false });
    expect(heir.flags.len_ngoi).toBe(true);
    expect(heir.court!.emperor.name).toContain('Thử Nghiệm');
    const other = throneYear(turn({ ...s, throne: { ...throneOf(s)!, heir: throneOf(s)!.rivals![0].name } }), content);
    expect(other.reign ?? null).toBeNull();
    expect(other.flags.nhan_vuong).toBe(true);
  });

  it('the binh biến runs in three steps and ends on the throne or at the execution ground', () => {
    const steps = ['dn_binh_bien_1', 'dn_binh_bien_2', 'dn_binh_bien_3'].map((id) => content.events.find((e) => e.id === id)!);
    let s = royal(30);
    expect(meets(s, steps[0].conditions, content)).toBe(true);
    s = fx(s, { throneStep: 1 });
    expect(meets(s, steps[1].conditions, content)).toBe(true);
    s = fx(s, { throneStep: 1, throneRivalDies: true });
    expect(meets(s, steps[2].conditions, content)).toBe(true);
    const king = fx(s, { throneAscend: true });
    expect(king.reign?.how).toBe('royal');
    const dead = fx(s, { throneFail: 'death' });
    expect(dead.alive).toBe(false);
    expect(dead.flags.bi_tru_di).toBe(true);
  });

  it('a công chúa: hòa thân leaves the road; a woman heir needs more to be named', () => {
    const ev = content.events.find((e) => e.id === 'dn_hoa_than')!;
    const girl = royal(20, 'nu');
    const passed = { ...girl, throne: { ...throneOf(girl)!, heir: throneOf(girl)!.rivals![0].name } };
    expect(meets(passed, ev.conditions, content)).toBe(true);
    expect(meets({ ...passed, character: { ...passed.character, age: 16 } }, ev.conditions, content)).toBe(false);
    expect(cfg.womanNeeds).toBeGreaterThan(0);
    const crowned = throneAscend({ ...girl, throne: { ...throneOf(girl)!, heir: 'self' } }, content);
    expect(crowned.flags.nu_hoang).toBe(true);
  });

  it('royal activities only show for a hoàng tử on the road', () => {
    const acts = content.activities!.filter((a) => a.conditions.throne?.path?.includes('royal'));
    expect(acts.map((a) => a.id).sort()).toEqual(['an_nhan', 'duong_danh', 'ham_hai', 'ket_dang', 'lap_cong']);
    const farmer = createLife({ seed: 'hoang-that', originId: 'nong_dan' }, content);
    for (const a of acts) expect(meets({ ...farmer, character: { ...farmer.character, age: 20 } }, a.conditions, content)).toBe(false);
    for (const a of acts) expect(meets(royal(), a.conditions, content)).toBe(true);
  });
});

describe('Khởi nghĩa thời loạn (12.7)', () => {
  const commoner = (phase = 'loan_the'): GameState => {
    const s = createLife({ seed: 'khoi-nghia', originId: 'nong_dan' }, content);
    return { ...s, character: { ...s.character, age: 25 }, court: initCourt(s, content), times: { ...s.times!, phase } };
  };
  const rebel = (phase = 'loan_the') => fx(commoner(phase), { throneStart: 'rebel' });

  it('a mồi lửa only lights in a loạn thế, and raising the banner starts the rebel road', () => {
    const ev = content.events.find((e) => e.id === 'kn_moi_lua_thue')!;
    expect(meets(commoner('loan_the'), ev.conditions, content)).toBe(true);
    expect(meets(commoner('thinh_the'), ev.conditions, content)).toBe(false);
    const s = rebel();
    expect(throneOf(s)).toMatchObject({ path: 'rebel', cities: 0 });
    expect(throneOf(s)!.banner).toBeTruthy();
    expect(s.flags.tung_khoi_nghia).toBe(true);
    expect(throneLine(s, content)).toContain(throneOf(s)!.banner!);
    expect(meets(s, ev.conditions, content)).toBe(false);
  });

  it('each year the army eats, men come by dân tâm, and the big decision is booked', () => {
    let booked = false;
    for (let i = 0; i < 20 && !booked; i++) {
      const s = { ...rebel(), seed: `ky${i}` };
      const next = throneYear(s, content);
      expect(throneOf(next)!.bars.grain).toBeLessThan(throneOf(s)!.bars.grain);
      booked = next.events.followUps.some((f) => [file.events.rebelYear, file.events.amnesty].includes(f.event));
    }
    expect(booked).toBe(true);
  });

  it('enough cities bring the assault on the capital; taking it founds a new dynasty', () => {
    const s = rebel();
    const strong = { ...s, throne: { ...throneOf(s)!, cities: cfg.capitalCities } };
    expect(throneYear(strong, content).events.followUps.some((f) => f.event === file.events.capital)).toBe(true);
    const king = fx(strong, { throneAscend: true });
    expect(king.reign).toMatchObject({ how: 'rebel', founder: true });
    expect(king.flags.khai_quoc).toBe(true);
    expect(king.times!.dynasty).not.toBe(s.times!.dynasty);
  });

  it('a rising out of its time is crushed; no troops left ends it', () => {
    let ended = 0;
    for (let i = 0; i < 20; i++) {
      const s = { ...rebel('thinh_the'), seed: `dep${i}` };
      if (!throneOf(throneYear(s, content))) ended++;
    }
    expect(ended).toBeGreaterThan(0);
    const s = rebel();
    const broken = throneYear({ ...s, throne: { ...throneOf(s)!, bars: { people: 0, troops: 0, grain: 0 } } }, content);
    expect(throneOf(broken)).toBeNull();
  });

  it('a won battle takes a city; chiêu an ends the road and gives an office', () => {
    const s = rebel();
    let took = false;
    for (let i = 0; i < 20 && !took; i++) took = (throneOf(fx({ ...s, seed: `thanh${i}`, throne: { ...throneOf(s)!, bars: { people: 80, troops: 90, grain: 60 } } }, { throneBattle: true }))!.cities ?? 0) > 0;
    expect(took).toBe(true);
    const peace = fx({ ...s, character: { ...s.character, age: 30 } }, { throneFail: 'quiet', officeJoin: 'recommend' });
    expect(throneOf(peace)).toBeNull();
    expect(peace.career.id).toBe(content.office!.career);
  });
});

describe('Quan lại, tướng lĩnh tạo phản (12.8)', () => {
  const minister = (rank = 5): GameState => {
    const s = createLife({ seed: 'tao-phan', originId: 'nong_dan' }, content);
    const base = { ...s, character: { ...s.character, age: 40 }, court: initCourt(s, content) };
    return { ...base, career: { id: content.office!.career, rung: rank, since: 30 } };
  };

  it('only a high official or a general can start plotting; the plot has quyền thế, binh quyền, danh nghĩa', () => {
    const act = content.activities!.find((a) => a.id === 'muu_do_dai_su')!;
    expect(meets(minister(5), act.conditions, content)).toBe(true);
    expect(meets(minister(1), act.conditions, content)).toBe(false);
    const s = fx(minister(5), { throneStart: 'usurp' });
    expect(throneOf(s)).toMatchObject({ path: 'usurp', kind: 'minister', plotters: 1 });
    expect(Object.keys(throneOf(s)!.bars).sort()).toEqual(Object.keys(file.bars.usurp!).sort());
    expect(s.flags.tung_muu_phan).toBe(true);
  });

  it('every gain in quyền thế pulls in another plotter, and more plotters mean the plot is found out sooner', () => {
    const s = fx(minister(), { throneStart: 'usurp' });
    const grown = fx(fx(s, { throneBar: { power: 5 } }), { throneBar: { power: 5 } });
    expect(throneOf(grown)!.plotters).toBe(3);
    const found = (x: GameState) => {
      let n = 0;
      for (let i = 0; i < 200; i++) if (throneYear({ ...x, seed: `bl${i}` }, content).events.followUps.some((f) => f.event === file.events.discovered)) n++;
      return n;
    };
    expect(found({ ...grown, throne: { ...throneOf(grown)!, plotters: 30 } })).toBeGreaterThan(found(grown));
  });

  it('enough strength and a weak throne bring the thời cơ; the rising is three steps to the throne or the block', () => {
    const s = fx(minister(), { throneStart: 'usurp' });
    const ready = { ...s, times: { ...s.times!, phase: 'loan_the' }, throne: { ...throneOf(s)!, plotters: 0, bars: { power: 90, troops: 90, cause: 90 } } };
    let rose = false;
    for (let i = 0; i < 30 && !rose; i++) rose = throneYear({ ...ready, seed: `ks${i}` }, content).events.followUps.some((f) => f.event === file.events.rise);
    expect(rose).toBe(true);
    const steps = ['tp_khoi_su_1', 'tp_khoi_su_2', 'tp_khoi_su_3'].map((id) => content.events.find((e) => e.id === id)!);
    let x: GameState = ready;
    for (const [i, ev] of steps.entries()) {
      expect(meets(x, ev.conditions, content)).toBe(true);
      if (i < 2) x = fx(x, { throneStep: 1 });
    }
    const king = fx(x, { throneAscend: true });
    expect(king.reign).toMatchObject({ how: 'usurp', founder: true });
    expect(king.career.id).toBeNull();
    const dead = fx(x, { throneFail: 'death' });
    expect(dead.alive).toBe(false);
    expect(dead.flags.bi_tru_di).toBe(true);
  });

  it('the loyal side has its own events: reporting a plotter, putting down a rebel general', () => {
    expect(content.events.find((e) => e.id === 'tp_to_giac_dong_lieu')!.conditions.throne?.none).toBe(true);
    expect(content.events.find((e) => e.id === 'tp_dep_phan')!.conditions.army?.serving).toBe(true);
  });
});

describe('Làm vua (12.9)', () => {
  const king = (how: 'royal' | 'rebel' = 'rebel'): GameState => {
    const s = createLife({ seed: 'lam-vua', originId: how === 'royal' ? 'hoang_tu' : 'nong_dan' }, content);
    const grown: GameState = { ...s, character: { ...s.character, age: 35 }, court: initCourt(s, content) };
    const road = how === 'royal' ? { ...grown, throne: { ...initRoyal(grown, content)!, since: 0, heir: 'self' as const } } : fx(grown, { throneStart: 'rebel' });
    return fx(road, { throneAscend: true });
  };

  it('the throne keeps its niên hiệu while the life reigns, with a yearly report of four bars', () => {
    const s = king();
    expect(Object.keys(s.reign!.bars).sort()).toEqual(Object.keys(file.bars.reign!).sort());
    const era = s.times!.era;
    const next = throneYear({ ...s, character: { ...s.character, age: 36 } }, content);
    expect(next.times!.era).toBe(era);
    expect(next.log[next.log.length - 1].lines.some((l) => l.text.startsWith('Triều chính'))).toBe(true);
    expect(throneLine(next, content)).toContain(s.reign!.dynasty);
  });

  it('a bar near zero brings its threat event; at zero the dynasty falls', () => {
    const s = { ...king(), character: { ...king().character, age: 36 } };
    const low = throneYear({ ...s, reign: { ...s.reign!, bars: { treasury: 60, people: 5, army: 60, court: 60 } } }, content);
    expect(low.events.followUps.some((f) => f.event === file.events.threats.people)).toBe(true);
    const gone = throneYear({ ...s, reign: { ...s.reign!, bars: { treasury: 60, people: 60, army: -20, court: 60 } } }, content);
    expect(gone.events.followUps.some((f) => f.event === file.events.deposed)).toBe(true);
    const fallen = fx(s, { reignEnd: 'exile' });
    expect(fallen.reign).toBeNull();
    expect(reignTitle(fallen, content)).toBe(file.titles.lost);
  });

  it('deeds make the ruler a minh quân or a bạo quân, and the court’s temper follows', () => {
    let good = king();
    for (let i = 0; i < cfg.deedTitle; i++) good = fx(good, { reignDeed: 'good' });
    expect(reignTitle(good, content)).toBe(file.titles.good);
    expect(good.court!.emperor.temper).toBe('minh_quan');
    let bad = king();
    for (let i = 0; i < cfg.deedTitle; i++) bad = fx(bad, { reignDeed: 'bad' });
    expect(reignTitle(bad, content)).toBe(file.titles.bad);
    // The title outlives the reign.
    expect(reignTitle(fx(bad, { reignEnd: 'abdicate' }), content)).toBe(file.titles.bad);
    expect(reignTitle(king(), content)).toBe(file.titles.founder);
  });

  it('ten court decisions an emperor can take each year, and reign events only for a ruler', () => {
    const acts = content.activities!.filter((a) => a.conditions.reign?.active);
    expect(acts.length).toBeGreaterThanOrEqual(10);
    const commoner = createLife({ seed: 'lam-vua', originId: 'nong_dan' }, content);
    for (const a of acts) expect(meets({ ...commoner, character: { ...commoner.character, age: 30 } }, a.conditions, content)).toBe(false);
    const reign = content.events.filter((e) => e.category === 'reign');
    expect(reign.length).toBeGreaterThanOrEqual(15);
    expect(reign.every((e) => e.conditions.reign?.active)).toBe(true);
    const abdicated = fx(king(), { reignEnd: 'abdicate' });
    expect(abdicated.flags.thai_thuong_hoang).toBe(true);
  });
});

describe('Nội dung triều đình (12.10)', () => {
  it('enough court, war, đế nghiệp and reign events, and no id is shared', () => {
    const by = (cats: string[]) => content.events.filter((e) => cats.includes(e.category)).length;
    expect(by(['royal', 'rebel', 'usurp'])).toBeGreaterThanOrEqual(55);
    expect(by(['reign'])).toBeGreaterThanOrEqual(20);
    const ids = content.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every road has a bot persona that plays it', async () => {
    const { MORTAL_PERSONAS } = await import('../src/systems/simulate');
    for (const id of ['tham_vong', 'nghia_quan', 'quyen_than'] as const) expect(MORTAL_PERSONAS[id].choice).toBe('ambitious');
  });
});
