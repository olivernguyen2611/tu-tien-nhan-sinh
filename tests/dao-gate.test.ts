import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { daoReady, daoView } from '../src/systems/daoGate';
import { dockGroups, dockView } from '../src/systems/dock';
import { featureOpen } from '../src/systems/knowledge';
import { techniqueOffers } from '../src/systems/market';
import { syncTier } from '../src/systems/tiers';

const content = loadContent();
const all = (content.knowledge ?? []).map((e) => e.id);
const mortal = (): GameState => {
  const s = createLife({ seed: 'dao-gate', originId: 'nong_dan', knowledge: all, lifeNo: 10 }, content);
  return { ...s, character: { ...s.character, age: 14 } };
};
const rooted = (s: GameState): GameState => ({ ...s, cult: { ...s.cult, root: { grade: 'tam', elements: ['kim', 'moc', 'thuy'] } as GameState['cult']['root'] } });
const ids = (s: GameState) => { const d = dockView(s, content); return [...d.left, ...d.right].map((v) => v.id); };

describe('Phàm nhân không thấy tu tiên (góp ý 23/10)', () => {
  it('an untested mortal sees no Tu luyện, linh căn, linh thạch or tu vi, even knowing every Sổ tri thức entry', () => {
    const s = mortal();
    expect(featureOpen(s, content, 'tab', 'tu_luyen')).toBe(false);
    expect(ids(s)).not.toContain('tu_luyen');
    expect(daoView(s)).toEqual({ root: false, stones: false, cultivation: false, jianghu: true });
  });

  it('a root and a scroll open the Tu luyện sheet; the first cultivation opens the rest and hides the giang hồ', () => {
    const r = rooted(mortal());
    expect(daoView(r).root).toBe(true);
    expect(featureOpen(r, content, 'tab', 'tu_luyen')).toBe(false);
    const ready = { ...r, cult: { ...r.cult, scrolls: ['dan_khi_quyet'] } };
    expect(daoReady(ready, content)).toBe(true);
    expect(featureOpen(ready, content, 'tab', 'tu_luyen')).toBe(true);
    const dao = syncTier({ ...ready, cult: { ...ready.cult, realm: 'luyen_khi', technique: 'dan_khi_quyet', scrolls: [] } }, content);
    expect(daoView(dao)).toEqual({ root: true, stones: true, cultivation: true, jianghu: false });
    expect(ids(dao)).toContain('tu_luyen');
    expect(dockGroups(dao, content, 'hoat_dong')).not.toContain('giang_ho');
    expect(dockGroups(mortal(), content, 'hoat_dong')).toContain('giang_ho');
  });

  it('mortal markets sell no bí tịch', () => {
    for (const m of content.markets.filter((x) => x.currency === 'silver')) expect(techniqueOffers(mortal(), content, m.id)).toHaveLength(0);
  });
});
