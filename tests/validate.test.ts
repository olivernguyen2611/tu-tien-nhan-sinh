import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/core/validate';
import realBalance from '../content/config/balance.json';

const balance = {
  version: 1,
  events: { popupChanceLowRealm: 0.2, popupChanceHighRealm: 0.1, logLineChance: 0.6, check: { base: 0.5, perPoint: 0.015, min: 0.05, max: 0.95 } },
  traits: { slots: 3, rerolls: 3, badLuckChance: 0.12, rarityWeights: { pham: 45 }, maxSlots: 5, locks: 1, lockCost: 3 },
  character: { mortalStatRange: [30, 80], aptitudeRange: [10, 90], aptitudeRolls: 2 },
  family: {
    fatherAge: [20, 35], motherAge: [17, 30], affinityStart: [55, 85], olderSiblings: [0, 2], olderSiblingGap: [2, 6],
    youngerSiblingChance: 0.12, motherMinAgeForChild: 16, motherMaxAgeForChild: 40, maxSiblings: 4, affinityDecay: 1, grief: { father: [-20, -30], mother: [-20, -30], sibling: [-15, -15], child: [-25, -40], parentDaoHeart: 2 },
  },
  lifespan: { mortalBase: 70, mortalVariance: 10, healthAdjustMax: 10, pressureLeftPct: 0.1 },
  fastForward: { maxYears: 10 },
  aging: { recoverPerYear: 3, recoverCap: 70, declineStartAge: 50, healthDeclinePerYear: 1, illnessStartAge: 60, illnessChancePerYear: 0.008, illnessHealthLoss: [5, 15], illnessHappinessLoss: 5, epitaphKarma: 30, milestoneAges: [60], milestoneHealth: -5, milestoneCharm: -3, slowAgingYears: 30 },
  realms: realBalance.realms,
  realmStages: realBalance.realmStages,
  roots: realBalance.roots,
  cultivation: realBalance.cultivation,
  majorBreakthrough: realBalance.majorBreakthrough,
  defaultDifficulty: realBalance.defaultDifficulty,
  difficulty: realBalance.difficulty,
  careers: realBalance.careers,
  kyVat: realBalance.kyVat,
  techniques: realBalance.techniques,
  sects: realBalance.sects,
  fate: realBalance.fate,
  martial: realBalance.martial,
  buddhism: realBalance.buddhism,
  paths: realBalance.paths,
  crafts: realBalance.crafts,
  market: realBalance.market,
  combat: realBalance.combat,
  npcs: realBalance.npcs,
  rankings: realBalance.rankings,
  seclusion: realBalance.seclusion,
  coreForming: realBalance.coreForming,
  ghost: realBalance.ghost,
  tribulation: realBalance.tribulation,
  heartDemon: realBalance.heartDemon,
  crafting: realBalance.crafting,
  disciples: realBalance.disciples,
  chosen: realBalance.chosen,
  founding: realBalance.founding,
  heir: realBalance.heir,
  clan: realBalance.clan,
  romance: realBalance.romance,
  rebirth: realBalance.rebirth,
  goldenFinger: realBalance.goldenFinger,
  badges: realBalance.badges,
  pastSect: realBalance.pastSect,
  extremes: { lowAt: 5, highAt: 95, exitLow: 20, exitHigh: 80, karmaLowAt: -80, karmaHighAt: 80, karmaExitLow: -60, karmaExitHigh: 60, years: 3, onceCooldownYears: 10, happinessDrift: 2, happinessRest: 50 },
};

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 'find_old_cave_01',
    category: 'fortune',
    title: 'Động phủ trong núi',
    text: '{name} lạc vào một hang động...',
    weight: 5,
    choices: [{ text: 'Rời đi', result: { text: 'Bạn quay về.', effects: { 'stat.happiness': -1 } } }],
    ...overrides,
  };
}

const errors = (files: Record<string, unknown>) =>
  validateContent(files).filter((p) => p.level === 'error').map((p) => p.message);

describe('validateContent', () => {
  it('accepts valid content', () => {
    expect(errors({ 'config/balance.json': balance, 'worlds/w/events/a.json': [event()] })).toEqual([]);
  });

  it('accepts a skill check with success and fail', () => {
    const ev = event({
      choices: [
        {
          text: 'Phá cấm chế',
          check: { stat: 'stat.luck', difficulty: 60 },
          success: { text: 'Thành công', effects: { addItems: ['ngoc_gian_01'], setFlags: ['found_old_cave'], 'stat.luck': 1 } },
          fail: { text: 'Thất bại', effects: { 'stat.health': -30 } },
        },
      ],
    });
    expect(errors({ 'worlds/w/events/a.json': [ev] })).toEqual([]);
  });

  it('requires every outcome to change at least one number', () => {
    const msgs = errors({ 'worlds/w/events/a.json': [event({ choices: [{ text: 'x', result: { text: 'y', effects: { setFlags: ['a'] } } }] })] });
    expect(msgs.join()).toContain('không đổi chỉ số');
  });

  it('text naming a parent must exclude lives where that parent is gone', () => {
    const fx = { 'stat.happiness': 1 };
    const sick = event({ text: 'Cha ngươi ho ra máu.', choices: [{ text: 'Chăm sóc', result: { text: 'Mẹ ngươi khóc.', effects: fx } }] });
    const msgs = errors({ 'worlds/w/events/a.json': [sick] }).join();
    expect(msgs).toContain('no_father');
    expect(msgs).toContain('no_mother');
    const ok = event({ text: 'Cha ngươi ho ra máu.', conditions: { flagsNone: ['no_father'] },
      choices: [{ text: 'Chăm sóc', requires: { flagsNone: ['no_mother'] }, result: { text: 'Mẹ ngươi khóc.', effects: fx } }] });
    expect(errors({ 'worlds/w/events/a.json': [ok] })).toEqual([]);
    // "chạy", "chăm" are not "cha".
    expect(errors({ 'worlds/w/events/a.json': [event({ text: 'Ngươi chạy đi chăm vườn.' })] })).toEqual([]);
  });

  it('reports schema errors with their path', () => {
    const msgs = errors({ 'worlds/w/events/a.json': [event({ weight: 'nhiều' })] });
    expect(msgs.some((m) => m.startsWith('0.weight'))).toBe(true);
  });

  it('rejects ids with accents or spaces', () => {
    expect(errors({ 'worlds/w/events/a.json': [event({ id: 'động phủ' })] }).length).toBeGreaterThan(0);
  });

  it('reports duplicate ids across files', () => {
    const msgs = errors({ 'worlds/w/events/a.json': [event()], 'worlds/w/events/b.json': [event()] });
    expect(msgs.some((m) => m.includes('trùng id'))).toBe(true);
  });

  it('requires success and fail when a choice has a check', () => {
    const ev = event({ choices: [{ text: 'Thử', check: { stat: 'luck', difficulty: 50 }, success: { text: 'ok' } }] });
    expect(errors({ 'worlds/w/events/a.json': [ev] }).some((m) => m.includes('success'))).toBe(true);
  });

  it('reports follow-ups to missing events', () => {
    const ev = event({
      choices: [{ text: 'Hẹn', result: { text: '...', effects: { followUp: { event: 'khong_co', afterYears: [3, 10] } } } }],
    });
    expect(errors({ 'worlds/w/events/a.json': [ev] }).some((m) => m.includes('khong_co'))).toBe(true);
  });

  it('reports chains to missing events and chains placed beside a fight', () => {
    const missing = event({ choices: [{ text: 'Vào', result: { text: '...', effects: { chain: 'khong_co', 'stat.happiness': 1 } } }] });
    expect(errors({ 'worlds/w/events/a.json': [missing] }).some((m) => m.includes('chain tới sự kiện không tồn tại'))).toBe(true);
    const fight = { foe: { name: 'Kẻ địch', intent: 'teach' }, win: { text: 'Thắng.', effects: { 'stat.happiness': 1 } }, lose: { text: 'Thua.', effects: { 'stat.happiness': -1 } } };
    const beside = event({ choices: [{ text: 'Đánh', result: { text: '...', effects: { chain: 'find_old_cave_01' }, fight } }] });
    expect(errors({ 'worlds/w/events/a.json': [beside] }).some((m) => m.includes('đặt chain trong win/lose'))).toBe(true);
  });

  it('blocks mature events for characters under 18', () => {
    const young = event({ tags: ['mature'], conditions: { age: { min: 16 } } });
    const adult = event({ id: 'adult', tags: ['mature'], conditions: { age: { min: 18 } } });
    expect(errors({ 'worlds/w/events/a.json': [young] }).some((m) => m.includes('mature'))).toBe(true);
    expect(errors({ 'worlds/w/events/b.json': [adult] })).toEqual([]);
  });

  it('warns when a required flag is never set', () => {
    const ev = event({ conditions: { flagsAll: ['never_set'] } });
    const problems = validateContent({ 'worlds/w/events/a.json': [ev] });
    expect(problems.some((p) => p.level === 'warning' && p.message.includes('never_set'))).toBe(true);
  });

  it('validates the balance config', () => {
    expect(errors({ 'config/balance.json': { ...balance, version: 'một' } }).length).toBeGreaterThan(0);
  });

  it('keeps world files inside their world and checks the world id', () => {
    const world = { id: 'w', name: 'Thử', description: '', order: 1 };
    expect(errors({ 'worlds/w/world.json': world })).toEqual([]);
    expect(errors({ 'worlds/x/world.json': world }).join()).toContain('trùng tên thư mục');
    // World-only files at the top level are not recognised.
    expect(validateContent({ 'events/a.json': [event()] })[0].level).toBe('warning');
  });

  it('checks event effects, stat checks, themes and trait references', () => {
    const traits = [{ id: 'kheo_mom', rarity: 'pham', name: 'Khéo Mồm', flavor: '.', summary: '.', effects: [{ hook: 'stat.charm', add: 5 }] }];
    const bad = (ev: Record<string, unknown>) => errors({ 'traits.json': traits, 'worlds/w/events/a.json': [event(ev)] });
    expect(bad({ choices: [{ text: 'x', result: { text: 'y', effects: { 'stat.health': -5, silver: 3, karma: 1 } } }] })).toEqual([]);
    expect(bad({ choices: [{ text: 'x', result: { text: 'y', effects: { health: -5 } } }] }).join()).toContain('health');
    expect(bad({ choices: [{ text: 'x', check: { stat: 'silver', difficulty: 40 }, success: { text: 'a' }, fail: { text: 'b' } }] }).length).toBeGreaterThan(0);
    expect(bad({ themes: ['romance_trouble'], conditions: { age: { min: 16 } } }).join()).toContain('tình duyên');
    expect(bad({ choices: [{ text: 'x', hidden: true, requires: { traitsAny: ['khong_co'] }, result: { text: 'y' } }] }).join()).toContain('khong_co');
    expect(bad({ conditions: { flagsAll: ['no_parents'] } })).toEqual([]);
  });
});
