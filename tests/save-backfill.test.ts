import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { backfillLife, makeSave, migrate, parseSave, SAVE_VERSION } from '../src/systems/save';

const content = loadContent();
const fresh = createLife({ seed: 'backfill' }, content);

describe('save backfill', () => {
  it('save version is 2 and a save from an older version still loads', () => {
    expect(SAVE_VERSION).toBe(2);
    const save = makeSave(createLife({ seed: 'old' }, content), 1);
    expect(parseSave({ ...save, saveVersion: 1 }, [content.world.id], fresh).ok).toBe(true);
  });

  it('adds fields the old life lacks, top level and nested, without touching existing values', () => {
    const base = createLife({ seed: 'old-life' }, content);
    const { region: _r, ...rest } = base;
    const old = { ...rest, cult: { ...base.cult, heartDemon: 0, soulForm: undefined }, money: { silver: 7 } } as unknown as GameState;
    const { life, added } = backfillLife(old, fresh);
    expect(added).toEqual(expect.arrayContaining(['region', 'cult.soulForm', 'money.spiritStones']));
    expect(life.region).toEqual(fresh.region);
    expect(life.money.silver).toBe(7);
    expect(life.cult.heartDemon).toBe(0);
  });

  it('is idempotent and leaves a current life untouched', () => {
    const life = createLife({ seed: 'current' }, content);
    expect(backfillLife(life, fresh)).toEqual({ life, added: [] });
    const save = makeSave(life, 1);
    expect(migrate(save, fresh)).toBe(save);
  });

  it('leaves a note in the log when something was backfilled, once', () => {
    const base = createLife({ seed: 'note' }, content);
    const old = { ...base, money: { silver: 1 } } as unknown as GameState;
    const once = migrate(makeSave(old, 1), fresh);
    const lines = once.life.log[once.life.log.length - 1].lines;
    expect(lines.some((l) => l.text.startsWith('Game vừa cập nhật'))).toBe(true);
    expect(migrate(once, fresh)).toBe(once);
  });

  it('does not invent a root-test follow-up for an old life that lacks one', () => {
    const base = createLife({ seed: 'followups' }, content);
    const old = { ...base, events: { ...base.events, followUps: undefined } } as unknown as GameState;
    expect(backfillLife(old, fresh).added).not.toContain('events.followUps');
  });
});
