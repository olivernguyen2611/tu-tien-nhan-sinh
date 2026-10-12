import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { FightSchema } from '../src/core/schemas';
import type { GameState } from '../src/core/types';
import { blessingGains, earnedBlessings } from '../src/systems/blessings';
import { act, startBattle } from '../src/systems/combat';
import { hookSum, revealRoot } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { creditRebirth, readMeta, recordNewLife, type KeyValueStore } from '../src/systems/save';

const content = loadContent();

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

function dead(over: Partial<GameState> = {}, age = 70): GameState {
  const s = createLife({ seed: 'phuc-bao' }, content);
  return { ...s, alive: false, death: { age, cause: 'old_age', epitaph: '' }, character: { ...s.character, age }, ...over };
}

describe('Phúc báo (task 5b.8)', () => {
  it('a mortal earns each blessing by its condition', () => {
    const s = dead();
    expect(earnedBlessings(s, content)).toEqual([]);
    expect(earnedBlessings(dead({ social: { ...s.social, karma: 60 } }), content)).toEqual([{ id: 'dai_thien_nhan' }]);
    expect(earnedBlessings(dead({ career: { id: 'quan', rung: 4, since: 50 } }), content)).toEqual([{ id: 'danh_chan_mot_nghe', career: 'quan' }]);
    expect(earnedBlessings(dead({}, 100), content)).toEqual([{ id: 'bach_tue' }]);
    expect(earnedBlessings(dead({ flags: { chet_vi_cuu_nguoi: true } }), content)).toEqual([{ id: 'xa_than_cuu_nguoi' }]);
  });

  it('only a life that ends as a mortal earns them', () => {
    const s = dead();
    expect(earnedBlessings(dead({ social: { ...s.social, karma: 90 }, cult: { ...s.cult, realm: 'luyen_khi' } }), content)).toEqual([]);
  });

  it('the next life: an extra destiny reroll, root rolled twice, stats and lifespan at birth', () => {
    const plain = createLife({ seed: 'kiep-sau' }, content);
    const blessed = createLife({ seed: 'kiep-sau', blessings: [{ id: 'xa_than_cuu_nguoi' }, { id: 'dai_thien_nhan' }, { id: 'bach_tue' }, { id: 'danh_chan_mot_nghe', career: 'quan' }] }, content);
    expect(blessed.destiny.rerollsLeft).toBe(plain.destiny.rerollsLeft + 1);
    expect(hookSum(blessed, content, 'rootReroll')).toBe(1);
    expect(blessingGains(blessed, content)).toEqual(expect.arrayContaining([{ hook: 'stat.intellect', add: 5 }]));

    const a = confirmDestiny(rollDestiny(plain, content), content);
    const b = confirmDestiny(rollDestiny(blessed, content), content);
    expect(b.traits).toEqual(a.traits);
    expect(b.stats.intellect).toBe(Math.min(100, a.stats.intellect + 5));
    expect(b.cult.lifespan).toBe(Math.round(plain.cult.lifespan * (1 + content.traits.filter((t) => a.traits.includes(t.id)).flatMap((t) => t.effects).reduce((n, e) => n + (e.hook === 'lifespanPct' ? e.add ?? 0 : 0), 0) + 0.1)));
    expect(b.log[0].lines.some((l) => l.text.startsWith('Phúc báo kiếp trước'))).toBe(true);
    // The root test now rolls twice and keeps the better root.
    expect(revealRoot(b, content).state.cult.root).toBeTruthy();
  });

  it('unknown blessing ids are dropped', () => {
    expect(createLife({ seed: 'x', blessings: [{ id: 'khong_co' }] }, content).blessings).toEqual([]);
  });

  it('dying in a rescue fight sets the flag', () => {
    const s = createLife({ seed: 'cuu-nguoi' }, content);
    const weak = { ...s, character: { ...s.character, age: 20 }, stats: { ...s.stats, health: 1 } };
    const fight = FightSchema.parse({ rescue: true, foe: { name: 'Ma tu', realm: 'same', intent: 'kill', powerMul: 50 }, win: { text: 'Thắng.', effects: {} }, lose: { text: 'Thua.', effects: {} } });
    let b = startBattle(weak, content, fight, null);
    for (let i = 0; i < 5 && b.combat?.phase === 'fight'; i++) b = act(b, content, 'all_out').state;
    expect(b.stats.health).toBe(0);
    expect(b.flags.chet_vi_cuu_nguoi).toBe(true);
  });

  it('meta keeps the blessings for the next new life, once', () => {
    const store = fakeStore();
    creditRebirth(store, 'a', 5, [{ id: 'bach_tue' }]);
    expect(readMeta(store).blessings).toEqual({ from: 'a', list: [{ id: 'bach_tue' }] });
    // Shown again (reload): nothing changes; a new life spends them.
    creditRebirth(store, 'a', 5, [{ id: 'bach_tue' }]);
    expect(readMeta(store).rebirthPoints).toBe(5);
    recordNewLife(store);
    expect(readMeta(store).blessings).toBeNull();
    creditRebirth(store, 'a', 5, [{ id: 'bach_tue' }]);
    expect(readMeta(store).blessings).toBeNull();
  });
});
