import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { hookSum } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { offerFate } from '../src/systems/fate';
import { nextTalentCost, ownedRebirthTalents, talentShop } from '../src/systems/rebirthTalents';
import { buyRebirthTalent, creditRebirth, readMeta, type KeyValueStore } from '../src/systems/save';

const content = loadContent();

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('thiên phú luân hồi (task 5b.1)', () => {
  it('has at least 8 talents, each with rising prices', () => {
    const ts = content.rebirthTalents.talents;
    expect(ts.length).toBeGreaterThanOrEqual(8);
    for (const t of ts) for (let i = 1; i < t.levels.length; i++) expect(t.levels[i].cost).toBeGreaterThan(t.levels[i - 1].cost);
  });

  it('buying spends points and raises the level; too poor buys nothing', () => {
    const store = fakeStore();
    creditRebirth(store, 'a', 20);
    const cost = nextTalentCost(content, {}, 'tuc_tue')!;
    const meta = buyRebirthTalent(store, 'tuc_tue', cost)!;
    expect(meta.rebirthTalents.tuc_tue).toBe(1);
    expect(meta.rebirthPoints).toBe(20 - cost);
    expect(buyRebirthTalent(store, 'dao_qua_du_am', 999)).toBeNull();
    expect(readMeta(store).rebirthTalents).toEqual({ tuc_tue: 1 });
    const row = talentShop(content, readMeta(store).rebirthTalents, readMeta(store).rebirthPoints).find((r) => r.id === 'tuc_tue')!;
    expect(row.level).toBe(1);
    expect(row.next?.cost).toBe(content.rebirthTalents.talents.find((t) => t.id === 'tuc_tue')!.levels[1].cost);
  });

  it('a new life gets the stats once, extra rerolls, silver and life-long hooks', () => {
    const owned = { tuc_tue: 3, menh_ban_khai_mo: 2, hu_bac_kiep_truoc: 1, dao_qua_du_am: 1, khong_co: 2 };
    const plain = confirmDestiny(rollDestiny(createLife({ seed: 'tt' }, content), content), content);
    const born = createLife({ seed: 'tt', rebirthTalents: owned }, content);
    expect(born.rebirthTalents).toEqual(ownedRebirthTalents(owned, content));
    expect(born.rebirthTalents.khong_co).toBeUndefined();
    expect(born.destiny.rerollsLeft).toBe(plain.destiny.rerollsLeft + 2);
    // 9.R2b: khí vận may add birthSilver on confirming, so compare before the destiny is confirmed.
    expect(born.money.silver).toBe(createLife({ seed: 'tt' }, content).money.silver + 30);
    const s = confirmDestiny(rollDestiny(born, content), content);
    expect(s.aptitudes.comprehension).toBe(Math.min(100, plain.aptitudes.comprehension + 10));
    expect(hookSum(s, content, 'cultivationSpeed') - hookSum(plain, content, 'cultivationSpeed')).toBeCloseTo(0.05);
    // stat hooks are not counted again through lifeHooks.
    expect(hookSum(s, content, 'stat.comprehension')).toBe(hookSum(plain, content, 'stat.comprehension'));
    expect(s.log[0].lines.some((l) => l.text.startsWith('Thiên phú luân hồi:'))).toBe(true);
  });

  it('Thiên Mệnh Khả Cải adds fate refreshes', () => {
    const base = createLife({ seed: 'fate' }, content);
    const a = offerFate(base, content);
    const b = offerFate({ ...base, rebirthTalents: { thien_menh_kha_cai: 2 } }, content);
    if (a.fate && b.fate) expect(b.fate.refreshesLeft).toBe(a.fate.refreshesLeft + 2);
  });
});
