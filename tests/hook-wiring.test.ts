// Hooks that content already promised but the engine did not read yet, and the unit check that
// keeps share hooks (0.2) and percentage-point hooks (5) apart.
import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { EventSchema, FightSchema } from '../src/core/schemas';
import type { GameState, SpiritRoot } from '../src/core/types';
import { validateContent } from '../src/core/validate';
import { beats, fleeChance, roundChance, startBattle } from '../src/systems/combat';
import { enterRealm } from '../src/systems/cultivation';
import { craftChance } from '../src/systems/crafting';
import { careerViews } from '../src/systems/career';
import { createNpc } from '../src/systems/npcs';
import { learnBlocked } from '../src/systems/technique';
import { ageBody } from '../src/systems/time';
import { rollYearEvent } from '../src/systems/events/engine';
import { Rng } from '../src/core/rng';

const content = loadContent();
const born = createLife({ seed: 'wiring', originId: 'nong_dan' }, content);
const life: GameState = { ...born, traits: [], talents: [], character: { ...born.character, age: 20 } };
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };
const cultivator = (traits: string[] = []): GameState => {
  const s = { ...life, traits, cult: { ...life.cult, root: SONG } };
  return enterRealm(s, content, 'luyen_khi', Rng.fromState(s.rng));
};
const extreme = (s: GameState, id: string): GameState => ({ ...s, extremes: { ...s.extremes, active: { ...s.extremes.active, [id]: s.character.age } } });

describe('hook units in the validator', () => {
  const trait = (effects: unknown[]) => [{ id: 't_x', rarity: 'luong', name: 'X', flavor: '.', summary: '.', effects }];
  const errors = (effects: unknown[]) => validateContent({ 'traits.json': trait(effects) }).filter((p) => p.level === 'error').map((p) => p.message);

  it('flags a share hook written in percent and a points hook written as a share', () => {
    expect(errors([{ hook: 'combatPower', add: 10 }])[0]).toContain('tỉ lệ');
    expect(errors([{ hook: 'breakthroughChance.major', add: 0.05 }])[0]).toContain('điểm phần trăm');
    expect(errors([{ hook: 'combatPower', add: 0.1 }, { hook: 'breakthroughChance', add: 5 }])).toEqual([]);
  });
});

describe('hooks wired', () => {
  it('npcAffinityStart: strangers take to a Quý Nhân Duyên kindly', () => {
    const plain = createNpc(life, content, { role: 'bằng hữu' });
    const lucky = createNpc({ ...life, traits: ['quy_nhan_duyen'] }, content, { role: 'bằng hữu' });
    const npc = (r: typeof plain) => r.state.npcs.find((n) => n.id === r.id)!;
    expect(npc(lucky).affinity - npc(plain).affinity).toBe(10);
  });

  it('ignoreElementWeakness: a countering element no longer weakens the player', () => {
    const counter = content.cultivation.roots.elements.map((e) => e.id).find((e) => beats(content, e, 'kim'))!;
    const fight = FightSchema.parse({ foe: { name: 'Kẻ khắc hệ', realm: 'same', intent: 'rob', element: counter }, win: { text: '.', effects: {} }, lose: { text: '.', effects: {} } });
    const p = (traits: string[]) => roundChance(startBattle(cultivator(traits), content, fight, null), content, 'defend');
    const before = p([]);
    expect(p(['tien_thien_dao_thai'])).toBeGreaterThan(before);
  });

  it('divineSense: thần thức helps getting away', () => {
    const fight = FightSchema.parse({ foe: { name: 'Cướp', realm: 'same', intent: 'rob' }, win: { text: '.', effects: {} }, lose: { text: '.', effects: {} } });
    const flee = (traits: string[]) => fleeChance(startBattle(cultivator(traits), content, fight, null), content);
    expect(flee(['linh_lung_tam'])).toBeGreaterThan(flee([]));
  });

  it('craft.all.success: Thủ Ổn Tâm Tĩnh helps every craft', () => {
    const recipe = content.recipes.recipes[0];
    const s = { ...cultivator(), crafts: { skills: { [recipe.craft]: { level: recipe.minLevel, affinity: 20 } }, lastPractice: null } };
    expect(craftChance({ ...s, talents: ['thu_on_tam_tinh'] }, content, recipe) - craftChance(s, content, recipe)).toBeCloseTo(0.08, 5);
  });

  it('agingSlow: the body wears as if years younger', () => {
    const old = { ...life, character: { ...life.character, age: 55 }, stats: { ...life.stats, health: 60 } };
    expect(ageBody(old, content).stats.health).toBe(59);
    expect(ageBody({ ...old, traits: ['truong_xuan_the'] }, content).stats.health).toBe(64);
  });

  it('cannotWork: bedridden, no career can start', () => {
    const s = { ...life, character: { ...life.character, age: 18 } };
    expect(careerViews(extreme(s, 'benh_liet_giuong'), content).every((v) => v.blocked)).toBe(true);
  });

  it('noLineageChange: đạo tâm như bàn thạch keeps the đạo thống', () => {
    const s = { ...cultivator(), cult: { ...cultivator().cult, lineage: 'tien' } };
    const other = content.techniques.find((t) => t.lineage !== 'tien' && !t.requires.ghostOnly && !t.requires.minDaoHeart)!;
    expect(learnBlocked(s, content, other)).toBeNull();
    expect(learnBlocked(extreme(s, 'dao_tam_nhu_ban_thach'), content, other)).toContain('đạo thống');
  });

  it('trigger.everyNYears: Tử Khí Đông Lai brings a fortune every 10 years', () => {
    const ev = (id: string, themes: string[]) => EventSchema.parse({ id, category: 'test', title: '.', text: '.', weight: 1, themes, choices: [{ text: '.', result: { text: '.', effects: { 'stat.luck': 1 } } }] });
    const c: Content = { ...content, events: [ev('t_plain', []), ev('t_fortune', ['fortune'])], balance: { ...content.balance, events: { ...content.balance.events, popupChanceLowRealm: 0 } } };
    const s = { ...life, character: { ...life.character, age: 30 }, events: { ...life.events, followUps: [] } };
    expect(rollYearEvent(s, c).events.pending).toBeNull();
    expect(rollYearEvent({ ...s, traits: ['tu_khi_dong_lai'] }, c).events.pending).toBe('t_fortune');
    expect(rollYearEvent({ ...s, traits: ['tu_khi_dong_lai'], character: { ...s.character, age: 31 } }, c).events.pending).toBeNull();
  });
});
