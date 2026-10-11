import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/core/validate';

const balance = {
  version: 1,
  events: { popupChanceLowRealm: 0.2, popupChanceHighRealm: 0.1, logLineChance: 0.6 },
  traits: { slots: 3, rerolls: 3, badLuckChance: 0.12, rarityWeights: { pham: 45 } },
};

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 'find_old_cave_01',
    category: 'fortune',
    title: 'Động phủ trong núi',
    text: '{name} lạc vào một hang động...',
    weight: 5,
    choices: [{ text: 'Rời đi', result: { text: 'Bạn quay về.' } }],
    ...overrides,
  };
}

const errors = (files: Record<string, unknown>) =>
  validateContent(files).filter((p) => p.level === 'error').map((p) => p.message);

describe('validateContent', () => {
  it('accepts valid content', () => {
    expect(errors({ 'config/balance.json': balance, 'events/a.json': [event()] })).toEqual([]);
  });

  it('accepts a skill check with success and fail', () => {
    const ev = event({
      choices: [
        {
          text: 'Phá cấm chế',
          check: { stat: 'luck', difficulty: 60 },
          success: { text: 'Thành công', effects: { addItems: ['ngoc_gian_01'], setFlags: ['found_old_cave'] } },
          fail: { text: 'Thất bại', effects: { health: -30 } },
        },
      ],
    });
    expect(errors({ 'events/a.json': [ev] })).toEqual([]);
  });

  it('reports schema errors with their path', () => {
    const msgs = errors({ 'events/a.json': [event({ weight: 'nhiều' })] });
    expect(msgs.some((m) => m.startsWith('0.weight'))).toBe(true);
  });

  it('rejects ids with accents or spaces', () => {
    expect(errors({ 'events/a.json': [event({ id: 'động phủ' })] }).length).toBeGreaterThan(0);
  });

  it('reports duplicate ids across files', () => {
    const msgs = errors({ 'events/a.json': [event()], 'events/b.json': [event()] });
    expect(msgs.some((m) => m.includes('trùng id'))).toBe(true);
  });

  it('requires success and fail when a choice has a check', () => {
    const ev = event({ choices: [{ text: 'Thử', check: { stat: 'luck', difficulty: 50 }, success: { text: 'ok' } }] });
    expect(errors({ 'events/a.json': [ev] }).some((m) => m.includes('success'))).toBe(true);
  });

  it('reports follow-ups to missing events', () => {
    const ev = event({
      choices: [{ text: 'Hẹn', result: { text: '...', effects: { followUp: { event: 'khong_co', afterYears: [3, 10] } } } }],
    });
    expect(errors({ 'events/a.json': [ev] }).some((m) => m.includes('khong_co'))).toBe(true);
  });

  it('blocks mature events for characters under 18', () => {
    const young = event({ tags: ['mature'], conditions: { age: { min: 16 } } });
    const adult = event({ id: 'adult', tags: ['mature'], conditions: { age: { min: 18 } } });
    expect(errors({ 'events/a.json': [young] }).some((m) => m.includes('mature'))).toBe(true);
    expect(errors({ 'events/b.json': [adult] })).toEqual([]);
  });

  it('warns when a required flag is never set', () => {
    const ev = event({ conditions: { flagsAll: ['never_set'] } });
    const problems = validateContent({ 'events/a.json': [ev] });
    expect(problems.some((p) => p.level === 'warning' && p.message.includes('never_set'))).toBe(true);
  });

  it('validates the balance config', () => {
    expect(errors({ 'config/balance.json': { ...balance, version: 'một' } }).length).toBeGreaterThan(0);
  });
});
