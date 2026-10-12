import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { FightSchema, ItemFileSchema, type Fight } from '../src/core/schemas';
import type { GameState, SpiritRoot } from '../src/core/types';
import { act, combatPower, fleeChance, roundChance, settle, startBattle } from '../src/systems/combat';
import { enterRealm } from '../src/systems/cultivation';
import { addItems, consumeItem } from '../src/systems/items';
import { Rng } from '../src/core/rng';
import { validateContent } from '../src/core/validate';
import realmsFile from '../content/realms.json';
import rootsFile from '../content/roots.json';
import aptitudesFile from '../content/aptitudes.json';

const base = loadContent();
const content: Content = {
  ...base,
  items: [
    ...base.items,
    ...ItemFileSchema.parse([
      { id: 't_kiem', name: 'Kiếm', kind: 'artifact', description: '.', carried: [{ hook: 'combatPower', add: 0.2 }] },
      { id: 't_phu', name: 'Hỏa Cầu Phù', kind: 'talisman', description: '.', use: { text: 'Lửa.', effects: [{ hook: 'combatPowerNext', add: 50 }], combatOnly: true } },
      { id: 't_hoan', name: 'Huyết Khí Hoàn', kind: 'pill', description: '.', use: { text: 'Máu nóng.', effects: [{ hook: 'combatPowerNext', add: 10 }] } },
      { id: 't_ngoc', name: 'Hộ Thân Ngọc Bội', kind: 'artifact', description: '.', carried: [{ hook: 'trigger.cheatDeath', add: 1 }] },
    ]),
  ],
};

const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'], body: null };
const born = createLife({ seed: 'combat', originId: 'nong_dan' }, content);
const adult: GameState = { ...born, character: { ...born.character, age: 20 } };
const cultivator = (): GameState => {
  const s = { ...adult, cult: { ...adult.cult, root: SONG } };
  return enterRealm(s, content, 'luyen_khi', Rng.fromState(s.rng));
};
const fight = (foe: Partial<Fight['foe']> & { intent: 'teach' | 'rob' | 'kill' }): Fight => FightSchema.parse({
  foe: { name: 'Tên cướp', ...foe },
  win: { text: 'Thắng.', effects: { 'stat.happiness': 5 } },
  lose: { text: 'Thua.', effects: { 'stat.happiness': -5 } },
});
/** Play rounds with one action until the fight leaves the 'fight' phase. */
const playOut = (s: GameState, action: Parameters<typeof act>[2] = 'all_out'): GameState => {
  for (let i = 0; i < 5 && s.combat?.phase === 'fight'; i++) s = act(s, content, action).state;
  return s;
};

describe('combat power (K.4.1)', () => {
  it('grows by about ×4 per realm and with carried artifacts', () => {
    const mortal = combatPower(adult, content);
    const lk = cultivator();
    expect(combatPower(lk, content)).toBeGreaterThan(mortal * 5);
    expect(combatPower(addItems(lk, ['t_kiem']), content)).toBeCloseTo(combatPower(lk, content) * 1.2, 0);
  });

  it('one realm apart is almost a sure loss per round', () => {
    const s = startBattle(cultivator(), content, fight({ realm: 'above', intent: 'teach' }), null);
    expect(roundChance(s, content, 'defend')).toBeLessThan(0.15);
  });
});

describe('a fight (K.4.2)', () => {
  it('blocks the year until it ends', () => {
    const s = startBattle(adult, content, fight({ intent: 'teach' }), 'Thử');
    expect(advanceYear(s, content)).toBe(s);
  });

  it('beating a weaker foe asks spare / loot / kill, then applies the win outcome', () => {
    let s = startBattle(cultivator(), content, fight({ realm: 'pham_nhan', intent: 'rob' }), 'Thử');
    s = playOut(s);
    expect(s.combat?.phase).toBe('won');
    const silver = s.money.silver;
    const r = settle(s, content, 'loot');
    expect(r.state.combat).toBeNull();
    expect(r.state.money.silver).toBeGreaterThan(silver); // a mortal robber carries silver
    expect(r.state.stats.happiness).toBe(Math.min(100, s.stats.happiness + 5));
    expect(r.state.log.at(-1)!.lines.some((l) => l.text.startsWith('Giao chiến với Tên cướp'))).toBe(true);
    const k = settle(s, content, 'kill');
    expect(k.state.social.karma).toBeLessThan(s.social.karma);
  });

  it('a Phật tu who kills the beaten foe breaks a precept (task 3.12)', () => {
    let s = startBattle(cultivator(), content, fight({ realm: 'pham_nhan', intent: 'rob' }), 'Thử');
    s = playOut(s);
    const monk = { ...s, cult: { ...s.cult, lineage: 'phat' } };
    const k = settle(monk, content, 'kill').state;
    expect(k.cult.preceptBreaks).toBe(1);
    expect(k.aptitudes.daoHeart).toBe(Math.max(0, monk.aptitudes.daoHeart + content.balance.buddhism.precepts.killDaoHeart));
  });

  it('losing to a robber takes money; to a killer, a jade saves you once', () => {
    let s = startBattle({ ...adult, money: { silver: 100, spiritStones: 0 } }, content, fight({ realm: 'truc_co', intent: 'rob' }), null);
    s = playOut(s);
    expect(s.combat).toBeNull();
    expect(s.money.silver).toBe(70);

    let k = startBattle(addItems({ ...adult, stats: { ...adult.stats, health: 100 } }, ['t_ngoc']), content, fight({ realm: 'truc_co', intent: 'kill' }), null);
    k = playOut(k, 'defend');
    expect(k.combat).toBeNull();
    expect(k.stats.health).toBeGreaterThan(0);
    expect(k.inventory.t_ngoc ?? 0).toBe(0);
  });

  it('talismans burn for one round; pills taken before last the whole fight', () => {
    let s = addItems(cultivator(), ['t_phu', 't_hoan']);
    s = consumeItem(s, content, 't_hoan').state;
    expect(s.itemUse.nextCombat).toBe(10);
    s = startBattle(s, content, fight({ intent: 'teach' }), null);
    expect(s.itemUse.nextCombat).toBe(0);
    expect(s.combat!.nextBonus).toBe(10);
    expect(roundChance(s, content, 'item', 't_phu')).toBeGreaterThan(roundChance(s, content, 'all_out') - 0.2);
    const r = act(s, content, 'item', 't_phu');
    expect(r.state.inventory.t_phu ?? 0).toBe(0);
  });

  it('fleeing a slower foe usually works', () => {
    const s = startBattle(cultivator(), content, fight({ realm: 'pham_nhan', intent: 'kill' }), null);
    expect(fleeChance(s, content)).toBeGreaterThan(0.6);
  });

  it('is the same fight for the same seed', () => {
    const a = playOut(startBattle(adult, content, fight({ intent: 'teach' }), null));
    const b = playOut(startBattle(adult, content, fight({ intent: 'teach' }), null));
    expect(a).toEqual(b);
  });
});

describe('validator (task 3.3)', () => {
  const ev = (foe: Record<string, unknown>, win: Record<string, unknown> = { 'stat.happiness': 1 }) => [{
    id: 'phuc_kich', category: 'fortune', title: 'Phục kích', text: 'Có kẻ chặn đường.', weight: 1,
    choices: [{ text: 'Đánh', result: { text: 'Rút kiếm.', fight: {
      foe: { name: 'Sơn tặc', intent: 'rob', ...foe },
      win: { text: 'Thắng.', effects: win },
      lose: { text: 'Thua.', effects: { 'stat.health': -5 } },
    } } }],
  }];
  const errors = (files: Record<string, unknown>) => validateContent({
    'realms.json': realmsFile, 'roots.json': rootsFile, 'aptitudes.json': aptitudesFile, ...files,
  }).filter((p) => p.level === 'error').map((p) => p.message);

  it('accepts a fight with no stat change on the choice itself', () => {
    expect(errors({ 'worlds/w/events/a.json': ev({ realm: 'above', element: 'random' }) })).toEqual([]);
  });

  it('rejects unknown realms, elements and endings that change nothing', () => {
    const e = errors({ 'worlds/w/events/a.json': ev({ realm: 'tien_de', element: 'go' }, {}) });
    expect(e.some((m) => m.includes('tien_de'))).toBe(true);
    expect(e.some((m) => m.includes('"go"'))).toBe(true);
    expect(e.some((m) => m.includes('kết quả thắng'))).toBe(true);
  });
});
