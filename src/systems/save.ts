// SaveSystem (PLAN.md C.5, task 1.9): save slots in localStorage, export/import
// as .json files, and `migrate` so old saves keep working after updates.
import { z } from 'zod';
import { version as GAME_VERSION } from '../../package.json';
import type { GameState, LogYear } from '../core/types';

export const SAVE_VERSION = 1;
export const SLOT_COUNT = 3;
const KEY_PREFIX = 'tutien.save.';
const META_KEY = 'tutien.meta';
/** Stay well under the ~5 MB localStorage limit; above this the log is compacted. */
const MAX_SAVE_CHARS = 1_000_000;
const CALM_LINE = 'Một năm bình lặng trôi qua.';

/** The part of `Storage` the save system uses (tests pass a Map-backed fake). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Data kept across lives (PLAN.md C.5 `meta`). Grows in later phases. */
export interface SaveMeta { livesPlayed: number }

export interface SaveFile {
  saveVersion: number;
  gameVersion: string;
  slot: number;
  savedAt: string;
  life: GameState;
}

export interface SlotSummary {
  slot: number;
  name: string;
  age: number;
  alive: boolean;
  worldId: string;
  savedAt: string;
  difficulty: string;
}

// Only the fields the game cannot run without are checked; the rest of
// GameState is trusted once these are present.
const LifeShape = z
  .object({
    version: z.literal(1),
    worldId: z.string().min(1),
    seed: z.string(),
    rng: z.array(z.number()).length(4),
    alive: z.boolean(),
    character: z.object({ name: z.string(), age: z.number().int().min(0) }).passthrough(),
    stats: z.record(z.number()),
    cult: z.object({ lifespan: z.number() }).passthrough(),
    events: z.object({ pending: z.string().nullable() }).passthrough(),
    log: z.array(z.object({ age: z.number(), lines: z.array(z.object({ text: z.string() }).passthrough()) })),
  })
  .passthrough();

const SaveShape = z
  .object({
    saveVersion: z.number().int().min(1),
    gameVersion: z.string(),
    slot: z.number().int(),
    savedAt: z.string(),
    life: LifeShape,
  })
  .passthrough();

/** Upgrade a save written by an older version. Each saveVersion bump adds a step here. */
export function migrate(save: SaveFile): SaveFile {
  // Fields added within saveVersion 1 get their empty defaults.
  let life = save.life as GameState & { extremes?: GameState['extremes'] };
  if (!life.extremes) life = { ...life, extremes: { streak: {}, active: {}, givenAt: {} } };
  // Task 3.8: old lives start every path at 0 (no main path yet); the current lineage counts as adopted.
  if (life.paths === undefined) {
    life = { ...life, paths: {}, cult: { ...life.cult, lineagesAdopted: life.cult.lineage ? [life.cult.lineage] : [] } };
  }
  // Task 3.12: no precepts broken.
  if ((life.cult as Partial<GameState['cult']>).preceptBreaks === undefined) life = { ...life, cult: { ...life.cult, preceptBreaks: 0 } };
  // Task 3.11: no martial training yet.
  if (life.martial === undefined) life = { ...life, martial: { stage: -1, years: 0, bonus: 0, lastTrain: null } };
  // Task 2.8: items, scrolls, buffs, two more factions.
  if (life.inventory === undefined) {
    const c = life.cult as Partial<GameState['cult']> & GameState['cult'];
    life = {
      ...life,
      inventory: {},
      cult: { ...c, scrolls: c.scrolls ?? [], buffs: c.buffs ?? [], nextBonus: c.nextBonus ?? 0 },
      social: { ...life.social, reputation: { ...{ trieu_dinh: 0, giang_ho: 0 }, ...(life.social.reputation as Partial<GameState['social']['reputation']>) } as GameState['social']['reputation'] },
    };
  }
  // Task 3.2: no bargains yet.
  if (life.bargains === undefined) life = { ...life, bargains: {} };
  // Task 3.3: no fight in progress.
  if (life.combat === undefined) life = { ...life, combat: null };
  // Task 3.4: no NPCs met yet.
  if (life.npcs === undefined) life = { ...life, npcs: [] };
  // Task 4.4: no tâm ma trial.
  if (life.cult.heartDemonTrial === undefined) life = { ...life, cult: { ...life.cult, heartDemonTrial: null } };
  // Task 4.2: no core yet.
  if (life.cult.coreGrade === undefined) life = { ...life, cult: { ...life.cult, coreForming: null, coreGrade: null } };
  // Task 5.4: no clan.
  if (life.clan === undefined) life = { ...life, clan: null };
  // Task 5.7: no ancestors recorded.
  if (life.ancestry === undefined) life = { ...life, ancestry: [] };
  // Task 5.1: no sect of one's own.
  if (life.ownSect === undefined) life = { ...life, ownSect: null };
  // Task 4.1: not in seclusion.
  if (life.seclusion === undefined) life = { ...life, seclusion: null };
  // Task 3.9: no tâm ma yet.
  if (life.cult.heartDemon === undefined) life = { ...life, cult: { ...life.cult, heartDemon: 0 } };
  // Task 3.6: nobody courted yet.
  if (life.romance === undefined) life = { ...life, romance: { lover: null, couple: false, partner: null, exes: [], rivals: 0, lastActions: {} } };
  // Task 3.5: an empty board; rankingYear fills it next year.
  if (life.ranking === undefined) life = { ...life, ranking: { prodigies: [], rank: null } };
  if (life.events.npc === undefined) life = { ...life, events: { ...life.events, npc: null } };
  if (life.combat && life.combat.npcId === undefined) life = { ...life, combat: { ...life.combat, npcId: null } };
  // Task 3.1: no items used yet.
  if (life.itemUse === undefined) life = { ...life, itemUse: { lastAge: {}, spent: [], nextBreakthrough: 0, nextCombat: 0 } };
  if (life.itemUse.nextCombat === undefined) life = { ...life, itemUse: { ...life.itemUse, nextCombat: 0 } };
  // Task 2.7: no fate talents yet.
  if (life.talents === undefined) life = { ...life, talents: [], fate: null };
  // Task 2.5: not in a sect.
  if (life.sect === undefined) {
    life = { ...life, sect: { id: null, rank: 0, since: 0, contribution: 0, master: null, lastMission: null, lastMasterTry: null, left: [] } };
  }
  // Task 2.4: cultivators from before techniques get the default one.
  if ((life.cult as Partial<GameState['cult']>).technique === undefined) {
    const technique = life.cult.realm === 'pham_nhan' ? null : 'dan_khi_quyet';
    life = { ...life, cult: { ...life.cult, technique, learned: technique ? [technique] : [] } };
  }
  // Task 2.11: no career yet.
  if (life.career === undefined) life = { ...life, career: { id: null, rung: 0, since: 0 } };
  // Task 2.12: no crafts learned yet.
  if (life.crafts === undefined) life = { ...life, crafts: { skills: {}, lastPractice: null } };
  // Task 2.9: older lives get no tips.
  if (life.tutorial === undefined) life = { ...life, tutorial: { enabled: false, seen: [] } };
  // Task 2.10: lives from before difficulty were "Thường".
  if (life.difficulty === undefined) life = { ...life, difficulty: 'normal' };
  // Task 2.3: cultivation bookkeeping.
  const cult = life.cult as Partial<GameState['cult']> & GameState['cult'];
  if (cult.fails === undefined || cult.injuredUntil === undefined || cult.lineage === undefined || cult.foundation === undefined || cult.lastMajorAttempt === undefined) {
    life = {
      ...life,
      cult: {
        ...cult,
        fails: cult.fails ?? {},
        injuredUntil: cult.injuredUntil ?? null,
        lineage: cult.lineage ?? null,
        foundation: cult.foundation ?? null,
        lastMajorAttempt: cult.lastMajorAttempt ?? null,
      },
    };
  }
  return life === save.life ? save : { ...save, life };
}

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: string };

/** Check and upgrade raw save data (from a slot or an imported file). */
export function parseSave(raw: unknown, knownWorlds: string[]): ParseResult {
  const parsed = SaveShape.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'File không phải save của Tu Tiên Nhân Sinh, hoặc đã hỏng.' };
  if (parsed.data.saveVersion > SAVE_VERSION) {
    return { ok: false, error: 'Save này từ bản game mới hơn, hãy tải lại trang để cập nhật.' };
  }
  const save = migrate(parsed.data as unknown as SaveFile);
  if (!knownWorlds.includes(save.life.worldId)) {
    return { ok: false, error: `Save thuộc thế giới "${save.life.worldId}" mà bản game này chưa có.` };
  }
  return { ok: true, save };
}

export function makeSave(life: GameState, slot: number, now: Date = new Date()): SaveFile {
  return { saveVersion: SAVE_VERSION, gameVersion: GAME_VERSION, slot, savedAt: now.toISOString(), life };
}

/** Drop calm years (only "Một năm bình lặng…") to shrink a long log; eventful years stay. */
export function compactLog(log: LogYear[]): LogYear[] {
  return log.filter((y, i) => i === log.length - 1 || !(y.lines.length === 1 && y.lines[0].text === CALM_LINE));
}

function serialize(save: SaveFile): string {
  const text = JSON.stringify(save);
  if (text.length <= MAX_SAVE_CHARS) return text;
  return JSON.stringify({ ...save, life: { ...save.life, log: compactLog(save.life.log) } });
}

const slotKey = (slot: number) => `${KEY_PREFIX}${slot}`;

export function readSlot(store: KeyValueStore, slot: number, knownWorlds: string[]): ParseResult | null {
  let text: string | null;
  try {
    text = store.getItem(slotKey(slot));
  } catch {
    return null;
  }
  if (text === null) return null;
  try {
    return parseSave(JSON.parse(text), knownWorlds);
  } catch {
    return { ok: false, error: 'Save trong ô này bị hỏng.' };
  }
}

/** Returns false when the browser refuses to store (blocked or full). */
export function writeSlot(store: KeyValueStore, save: SaveFile): boolean {
  try {
    store.setItem(slotKey(save.slot), serialize(save));
    return true;
  } catch {
    return false;
  }
}

export function deleteSlot(store: KeyValueStore, slot: number): void {
  try {
    store.removeItem(slotKey(slot));
  } catch {
    /* nothing to do when storage is blocked */
  }
}

/** One entry per slot 1..SLOT_COUNT; null = empty, or unreadable. */
export function listSlots(store: KeyValueStore, knownWorlds: string[]): (SlotSummary | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const r = readSlot(store, i + 1, knownWorlds);
    if (!r || !r.ok) return null;
    const { life, savedAt } = r.save;
    return { slot: i + 1, name: life.character.name, age: life.character.age, alive: life.alive, worldId: life.worldId, savedAt, difficulty: life.difficulty };
  });
}

/** True if the slot holds anything, even a broken save (so it is never overwritten silently). */
export function slotTaken(store: KeyValueStore, slot: number): boolean {
  try {
    return store.getItem(slotKey(slot)) !== null;
  } catch {
    return false;
  }
}

/** First empty slot, or null when all are taken. */
export function firstFreeSlot(store: KeyValueStore): number | null {
  for (let s = 1; s <= SLOT_COUNT; s++) if (!slotTaken(store, s)) return s;
  return null;
}

/** Most recently saved slot, for "Tiếp tục". */
export function latestSlot(store: KeyValueStore, knownWorlds: string[]): number | null {
  const slots = listSlots(store, knownWorlds).filter((s): s is SlotSummary => s !== null);
  slots.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return slots[0]?.slot ?? null;
}

/** Text and file name for "Xuất file". */
export function exportSave(save: SaveFile): { fileName: string; text: string } {
  const who = save.life.character.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return { fileName: `tu-tien-${who || 'save'}-${save.life.character.age}-tuoi.json`, text: JSON.stringify(save, null, 2) };
}

export function readMeta(store: KeyValueStore): SaveMeta {
  try {
    const m = JSON.parse(store.getItem(META_KEY) ?? '{}') as Partial<SaveMeta>;
    return { livesPlayed: typeof m.livesPlayed === 'number' ? m.livesPlayed : 0 };
  } catch {
    return { livesPlayed: 0 };
  }
}

export function recordNewLife(store: KeyValueStore): SaveMeta {
  const meta = { ...readMeta(store), livesPlayed: readMeta(store).livesPlayed + 1 };
  try {
    store.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* meta is a bonus; the game still runs without it */
  }
  return meta;
}
