import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { codexOf, codexProgress, mergeCodex, EMPTY_CODEX } from '../src/systems/codex';
import { BASIC_KNOWLEDGE, featureOpen, knowledgeByGroup, knowledgeUnlocks, knowledgeYear, sourceHolds, visibleGlossary } from '../src/systems/knowledge';
import { nextTalentCost, talentShop } from '../src/systems/rebirthTalents';
import { sectEligibility } from '../src/systems/sect';
import { readMeta, recordCodex, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const entries = content.knowledge ?? [];

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const base = (patch: Partial<GameState> = {}): GameState => ({ ...createLife({ seed: 'kn' }, content), ...patch });

describe('9.R5a Sổ tri thức', () => {
  it('the world has entries in several groups, none known at first', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
    expect(new Set(entries.map((e) => e.group)).size).toBeGreaterThanOrEqual(5);
    expect(base().knowledge).toEqual([]);
    expect(knowledgeByGroup([], content).every((g) => g.entries.every((e) => !e.known))).toBe(true);
  });

  it('sources read the life: events seen, flags, items, realms, martial stage, sect, region', () => {
    const s = base({ events: { ...base().events, history: { thu_linh_can: 1 } }, flags: { luc_hop_mon: true }, inventory: { linh_tinh_kim: 1 } });
    expect(sourceHolds(s, content, { kind: 'event', id: 'thu_linh_can' })).toBe(true);
    expect(sourceHolds(s, content, { kind: 'event', id: 'do_thach' })).toBe(false);
    expect(sourceHolds(s, content, { kind: 'flag', id: 'luc_hop_mon' })).toBe(true);
    expect(sourceHolds(s, content, { kind: 'item', id: 'linh_tinh_kim' })).toBe(true);
    expect(sourceHolds(s, content, { kind: 'realm', id: 'luyen_khi' })).toBe(false);
    expect(sourceHolds({ ...s, cult: { ...s.cult, realm: 'truc_co' } }, content, { kind: 'realm', id: 'luyen_khi' })).toBe(true);
    expect(sourceHolds({ ...s, martial: { ...s.martial, stage: 4 } }, content, { kind: 'martial', stage: 4 })).toBe(true);
    expect(sourceHolds(s, content, { kind: 'sect' })).toBe(false);
    // Home (region id null) is the world's first region.
    expect(sourceHolds(s, content, { kind: 'region', id: content.regions[0].id })).toBe(true);
  });

  it('a sure source is always found, logged, and does not touch the life RNG or the chance cap', () => {
    const s = base({ cult: { ...base().cult, realm: 'luyen_khi' } });
    const out = knowledgeYear(s, content);
    expect(out.knowledge).toContain('dan_khi_nhap_the');
    expect(out.knowledgeFound ?? 0).toBeLessThanOrEqual(1);
    expect(out.rng).toEqual(s.rng);
    expect(out.log.at(-1)!.lines.map((l) => l.text).join(' ')).toContain('Sổ tri thức');
    // Known entries are never found twice.
    expect(knowledgeYear(out, content).knowledge!.filter((k) => k === 'dan_khi_nhap_the')).toHaveLength(1);
  });

  it('chancy finds stop at maxPerLife', () => {
    const cap = content.balance.knowledge!.maxPerLife;
    const full = base({ knowledgeFound: cap, events: { ...base().events, history: Object.fromEntries(content.events.map((e) => [e.id, 1])) } });
    expect(knowledgeYear(full, content)).toBe(full);
  });

  it('a mortal life finds a few entries; past lives pass theirs on', () => {
    let s = base();
    for (let i = 0; i < 60 && s.alive; i++) {
      s = advanceYear(s, content);
      if (s.events.pending) s = { ...s, events: { ...s.events, pending: null } };
    }
    expect((s.knowledge ?? []).length).toBeLessThanOrEqual(content.balance.knowledge!.maxPerLife + 4);
    const next = createLife({ seed: 'kn2', knowledge: ['tin_don_tien_nhan', 'khong_co'] }, content);
    expect(next.knowledge).toEqual(['tin_don_tien_nhan']);
  });

  it('the Thiên Thư keeps the finds of every life (also before the destiny is confirmed); old metas read as none', () => {
    const s = base({ knowledge: ['bi_canh'] });
    expect(codexOf(s, content).knowledge).toEqual(['bi_canh']);
    const m = mergeCodex({ ...EMPTY_CODEX, knowledge: ['bi_canh'] }, { ...EMPTY_CODEX, knowledge: ['bi_canh', 'thien_kieu'] });
    expect(m.knowledge).toEqual(['bi_canh', 'thien_kieu']);
    expect(codexProgress(m, content).knowledge).toEqual([2, entries.length]);
    const store = fakeStore();
    store.setItem('bachthe.meta', JSON.stringify({ livesPlayed: 2, codex: { traits: [], combos: [], fingers: [], stories: [] } }));
    expect(readMeta(store).livesPlayed).toBe(2);
    // 9.R5b: a browser that played before the Sổ tri thức starts with the basics.
    expect(readMeta(store).codex.knowledge).toEqual(BASIC_KNOWLEDGE);
    const fresh = fakeStore();
    expect(readMeta(fresh).codex.knowledge).toEqual([]);
    recordCodex(store, m);
    expect(readMeta(store).codex.knowledge).toEqual([...BASIC_KNOWLEDGE, 'bi_canh', 'thien_kieu']);
  });

  it('unlocks are looked up by kind and id', () => {
    expect(knowledgeUnlocks(['tien_mon_thu_do'], content, 'gate', 'hoi_thu_do')).toBe(true);
    expect(knowledgeUnlocks([], content, 'gate', 'hoi_thu_do')).toBe(false);
    expect(knowledgeUnlocks(['dan_khi_nhap_the'], content, 'tab', 'tu_luyen')).toBe(true);
  });
});

describe('9.R5b kiếp đầu là phàm nhân, mở khóa dần', () => {
  it('tabs open with knowledge, or once the life is inside them', () => {
    const s = base();
    expect(featureOpen(s, content, 'tab', 'tu_luyen')).toBe(false);
    expect(featureOpen(s, content, 'tab', 'tong_mon')).toBe(false);
    // Góp ý 23/10: Tu luyện waits for the life's own root and scroll, whatever past lives knew.
    expect(featureOpen({ ...s, knowledge: ['dan_khi_nhap_the'] }, content, 'tab', 'tu_luyen')).toBe(false);
    expect(featureOpen({ ...s, cult: { ...s.cult, root: { grade: 'tam', elements: ['kim', 'moc', 'thuy'] } } }, content, 'tab', 'tong_mon')).toBe(true);
    expect(featureOpen({ ...s, knowledge: ['phat_duyen'] }, content, 'tab', 'tong_mon')).toBe(true);
    // A tab no entry gates is always open.
    expect(featureOpen(s, content, 'tab', 'khong_co')).toBe(true);
  });

  it('gated glossary terms stay plain until known', () => {
    expect(visibleGlossary(content, []).some((g) => g.id === 'linh_can')).toBe(false);
    expect(visibleGlossary(content, ['linh_can_la_gi']).some((g) => g.id === 'linh_can')).toBe(true);
    expect(visibleGlossary(content, []).some((g) => g.id === 'hanh_phuc')).toBe(true);
  });

  it('fate never rolls the clan origin for a life that knows nothing; cultivation talents hide', () => {
    for (let i = 0; i < 200; i++) expect(createLife({ seed: `o${i}`, knowledge: [] }, content).character.originId).not.toBe('tu_tien_gia_toc');
    const rows = talentShop(content, {}, 999, []);
    expect(rows.find((r) => r.id === 'linh_can_an_ky')!.locked).toBe(true);
    expect(rows.find((r) => r.id === 'tuc_tue')!.locked).toBe(false);
    expect(nextTalentCost(content, {}, 'linh_can_an_ky', [])).toBeNull();
    expect(nextTalentCost(content, {}, 'linh_can_an_ky', ['linh_can_la_gi'])).toBeGreaterThan(0);
  });

  it('a rootless mortal who never heard of Phật duyên does not knock on the temple door', () => {
    const s = { ...base(), character: { ...base().character, age: 20 }, aptitudes: { ...base().aptitudes, daoHeart: 90 }, cult: { ...base().cult, root: { grade: 'none', elements: [] } } };
    expect(sectEligibility(s, content, 'vo_uu_tu')).toMatch(/chưa từng nghe/);
    expect(sectEligibility({ ...s, knowledge: ['phat_duyen'] }, content, 'vo_uu_tu')).toBeNull();
  });
});
