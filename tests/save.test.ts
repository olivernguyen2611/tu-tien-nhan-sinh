import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, LifeTextsSchema, NamesSchema, OriginFileSchema, WorldSchema } from '../src/core/schemas';
import { advanceYear, createLife } from '../src/core/state';
import {
  compactLog, deleteSlot, exportSave, firstFreeSlot, latestSlot, listSlots, makeSave, parseSave, readMeta, readSlot,
  recordNewLife, slotTaken, writeSlot, SAVE_VERSION, SLOT_COUNT, type KeyValueStore,
} from '../src/systems/save';
import balance from '../content/config/balance.json';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, fateTalents, items, martial, lineages, rankings, romance, heartDemon, recipes, disciples, founding, heir, clan, blessings, sectLife, sects, techniques, tutorial, combat } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import world from '../content/worlds/thuong_lan/world.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  lifeTexts: LifeTextsSchema.parse(lifeTexts),
  extremes: StatExtremesFileSchema.parse(extremes),
  cultivation,
  difficulties,
  tutorial,
  careers,
  techniques,
  sects,
  sectLife,
  fateTalents,
  items,
  martial,
  lineages,
  markets: [],
  combat,
  npcTraits: { surface: [], nature: [], goals: [] },
  rankings,
  romance,
  heartDemon,
  recipes,
  corePatterns: [],
  regions: [],
  nascentSouls: { realm: 'nguyen_anh', forms: [] },
  disciples,
  founding,
  heir,
  clan,
  blessings,
  events: [],
  glossary: [],
  familyActions: [],
  traits: [],
};
const WORLDS = ['thuong_lan'];

function fakeStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

function lifeAt(seed: string, years: number) {
  let s = createLife({ seed }, content);
  for (let i = 0; i < years; i++) s = advanceYear(s, content);
  return s;
}

describe('save slots', () => {
  it('a saved life loads back exactly and keeps playing the same way', () => {
    const store = fakeStore();
    const life = lifeAt('round', 12);
    writeSlot(store, makeSave(life, 2, new Date('2026-10-11T10:00:00Z')));
    const r = readSlot(store, 2, WORLDS);
    expect(r?.ok).toBe(true);
    if (!r?.ok) return;
    expect(r.save.life).toEqual(life);
    expect(advanceYear(r.save.life, content)).toEqual(advanceYear(life, content));
  });

  it('lists slots, finds the first free one and the latest save', () => {
    const store = fakeStore();
    expect(firstFreeSlot(store)).toBe(1);
    writeSlot(store, makeSave(lifeAt('a', 3), 1, new Date('2026-01-01')));
    writeSlot(store, makeSave(lifeAt('b', 5), 3, new Date('2026-02-01')));
    const slots = listSlots(store, WORLDS);
    expect(slots).toHaveLength(SLOT_COUNT);
    expect(slots[0]?.age).toBe(3);
    expect(slots[1]).toBeNull();
    expect(firstFreeSlot(store)).toBe(2);
    expect(latestSlot(store, WORLDS)).toBe(3);
    writeSlot(store, makeSave(lifeAt('c', 1), 2));
    expect(firstFreeSlot(store)).toBeNull();
    deleteSlot(store, 1);
    expect(firstFreeSlot(store)).toBe(1);
  });

  it('a broken slot is not listed but still counts as taken', () => {
    const store = fakeStore();
    store.setItem('tutien.save.1', '{not json');
    expect(listSlots(store, WORLDS)[0]).toBeNull();
    expect(slotTaken(store, 1)).toBe(true);
    expect(readSlot(store, 1, WORLDS)).toMatchObject({ ok: false });
    expect(firstFreeSlot(store)).toBe(2);
  });

  it('reports storage failures instead of throwing', () => {
    const full: KeyValueStore = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
    expect(writeSlot(full, makeSave(lifeAt('q', 1), 1))).toBe(false);
  });
});

describe('import / export', () => {
  it('an exported file imports back', () => {
    const save = makeSave(lifeAt('export', 8), 1);
    const { fileName, text } = exportSave(save);
    expect(fileName).toMatch(/^tu-tien-[a-z0-9-]+-8-tuoi\.json$/);
    const r = parseSave(JSON.parse(text), WORLDS);
    expect(r.ok && r.save.life).toEqual(save.life);
  });

  it('rejects files that are not saves, newer saves, and unknown worlds', () => {
    expect(parseSave({ hello: 1 }, WORLDS).ok).toBe(false);
    const save = makeSave(lifeAt('x', 2), 1);
    expect(parseSave({ ...save, saveVersion: SAVE_VERSION + 1 }, WORLDS)).toMatchObject({ ok: false });
    expect(parseSave({ ...save, life: { ...save.life, worldId: 'khac' } }, WORLDS)).toMatchObject({ ok: false });
    expect(parseSave({ ...save, life: { ...save.life, rng: [1, 2] } }, WORLDS).ok).toBe(false);
  });
});

describe('log compaction and meta', () => {
  it('drops calm years but keeps eventful ones and the current year', () => {
    const calm = { text: 'Một năm bình lặng trôi qua.', tone: 'normal' as const };
    const log = [
      { age: 0, lines: [{ text: 'Chào đời', tone: 'normal' as const }] },
      { age: 1, lines: [calm] },
      { age: 2, lines: [{ text: 'Ngã cây', tone: 'bad' as const }] },
      { age: 3, lines: [calm] },
    ];
    expect(compactLog(log).map((y) => y.age)).toEqual([0, 2, 3]);
  });

  it('counts lives played', () => {
    const store = fakeStore();
    expect(readMeta(store).livesPlayed).toBe(0);
    recordNewLife(store);
    expect(recordNewLife(store).livesPlayed).toBe(2);
  });
});
