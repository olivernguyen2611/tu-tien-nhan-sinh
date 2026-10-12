import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fillTemplate } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { meets } from '../src/systems/events/conditions';
import { createNpc, npcById } from '../src/systems/npcs';
import { affinityTier, applyRomance, confessChance, romanceAction, romanceBlocked, romanceViews } from '../src/systems/romance';
import { migrate } from '../src/systems/save';
import { validateContent } from '../src/core/validate';

const content = loadContent();
const b = content.balance.romance;

function adult(age = 20, patch: Partial<GameState> = {}): GameState {
  const s = createLife({ seed: 'love' }, content);
  return {
    ...s,
    character: { ...s.character, age },
    stats: { ...s.stats, charm: 50, happiness: 50 },
    money: { silver: 100, spiritStones: 0 },
    log: [...s.log, { age, lines: [] }],
    events: { ...s.events, pending: null },
    ...patch,
  };
}

function withNpc(s: GameState, age: number, affinity = 50) {
  const r = createNpc(s, content, { role: 'bằng hữu', age, affinity });
  return { state: r.state, id: r.id };
}

describe('tình duyên (task 3.6)', () => {
  it('names affinity tiers', () => {
    expect(affinityTier(content, 0)).toBe('Chán ghét');
    expect(affinityTier(content, 65)).toBe('Có cảm tình');
    expect(affinityTier(content, 100)).toBe('Khắc cốt ghi tâm');
  });

  it('nobody under 18 courts or is courted; Phật đạo keeps its precept', () => {
    const young = withNpc(adult(17), 20);
    expect(romanceBlocked(young.state, content)).toContain('18');
    expect(romanceViews(young.state, content, young.id)).toEqual([]);
    const minor = withNpc(adult(20), 17);
    expect(romanceViews(minor.state, content, minor.id)).toEqual([]);
    expect(applyRomance(minor.state, content, minor.id, { pursue: true }).romance.lover).toBeNull();
    const monk = withNpc(adult(20, {}), 20);
    const phat = { ...monk.state, cult: { ...monk.state.cult, lineage: 'phat' } };
    expect(romanceViews(phat, content, monk.id)).toEqual([]);
  });

  it('pursue, gift (money spent, affinity up), confess when close enough', () => {
    let { state: s, id } = withNpc(adult(20), 21, 60);
    expect(romanceViews(s, content, id).map((v) => v.action)).toEqual(['pursue']);
    s = romanceAction(s, content, id, 'pursue').state;
    expect(s.romance.lover).toBe(id);
    const before = npcById(s, id)!.affinity;
    s = romanceAction(s, content, id, 'gift').state;
    expect(s.money.silver).toBeLessThanOrEqual(100 - b.giftSilver);
    expect(npcById(s, id)!.affinity).toBeGreaterThan(before);
    expect(romanceViews(s, content, id).find((v) => v.action === 'gift')!.blocked).toBe('Năm nay đã tặng');
    expect(romanceViews(s, content, id).find((v) => v.action === 'confess')!.blocked).toBe(null);
    let yes = 0;
    for (let i = 0; i < 40; i++) {
      const r = romanceAction({ ...s, rng: createLife({ seed: `c${i}` }, content).rng }, content, id, 'confess').state;
      if (r.romance.couple) yes++;
      else expect(r.stats.happiness).toBe(s.stats.happiness + b.rejectHappiness);
    }
    const p = confessChance(s, content, npcById(s, id)!);
    expect(yes / 40).toBeGreaterThan(p - 0.3);
    expect(yes / 40).toBeLessThan(p + 0.3);
  });

  it('a lover who dies is mourned and let go; rivals cool the lover', () => {
    let { state: s, id } = withNpc(adult(20), 21, 60);
    s = applyRomance(s, content, id, { pursue: true, rival: 2 });
    const next = advanceYear(s, content);
    expect(npcById(next, id)!.affinity).toBeLessThanOrEqual(60 + 2 * b.rivalAffinityPerYear + 1);
    const dead = { ...s, npcs: s.npcs.map((n) => (n.id === id ? { ...n, alive: false } : n)) };
    const after = advanceYear(dead, content);
    expect(after.romance.lover).toBeNull();
    expect(after.log.at(-1)!.lines.some((l) => l.text.includes('không còn'))).toBe(true);
  });

  it('events: romance conditions pick the lover as the event NPC; {lover} fills in', () => {
    let { state: s, id } = withNpc(adult(20), 21, 50);
    s = applyRomance(s, content, id, { pursue: true });
    expect(meets(s, { romance: { target: 'lover', minAffinity: 40 } }, content)).toBe(true);
    expect(meets(s, { romance: { target: 'lover', minAffinity: 60 } }, content)).toBe(false);
    expect(meets(s, { romance: { partner: true } }, content)).toBe(false);
    expect(meets({ ...s, character: { ...s.character, age: 17 } }, { romance: { lover: true } }, content)).toBe(false);
    expect(fillTemplate('Sinh thần của {lover}', s, content)).toBe(`Sinh thần của ${npcById(s, id)!.name}`);
    expect(applyRomance(s, content, id, { lose: true }).romance).toMatchObject({ lover: null, exes: [id] });
  });

  it('the validator keeps romance away from minors', () => {
    const ev = [{
      id: 'thu_tinh', title: 'Thư', text: 'Một phong thư.', category: 'mortal', themes: ['romance'], weight: 10,
      choices: [{ text: 'Đọc', result: { text: 'Ồ.', effects: { 'stat.happiness': 2 } } }],
    }];
    const files = Object.fromEntries(Object.entries(import.meta.glob('../content/**/*.json', { eager: true, import: 'default' })).map(([k, v]) => [k.replace('../content/', ''), v]));
    files['worlds/thuong_lan/events/zz-test.json'] = ev;
    const problems = validateContent(files);
    expect(problems.some((p) => p.message.includes('age.min ≥ 18'))).toBe(true);
  });

  it('old saves get an empty romance', () => {
    const s = adult();
    const { romance: _r, ...old } = s;
    expect(migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: old as unknown as GameState }).life.romance.lover).toBeNull();
  });
});
