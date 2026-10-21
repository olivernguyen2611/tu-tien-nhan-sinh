// SaveSystem (PLAN.md C.5, task 1.9): save slots in localStorage, export/import
// as .json files, and `migrate` so old saves keep working after updates.
import type { SavedPerson } from './npcLibrary';
import { z } from 'zod';
import { version as GAME_VERSION } from '../../package.json';
import type { GameState, KarmaTie, LogYear, PastSectRecord } from '../core/types';
import { Rng } from '../core/rng';
import { EMPTY_CODEX, mergeCodex, type Codex } from './codex';
import { readKarmaLedger } from './karmaLedger';
import { EMPTY_CHRONICLE, mergeChronicle, readChronicle, type Chronicle } from './chronicle';
import { BASIC_KNOWLEDGE } from './knowledge';

/**
 * v2: after the per-version steps in `migrate`, missing fields are backfilled from a fresh life (`backfillLife`).
 * v3: a special body no longer stands in for the root; old "thể chất" lives get an ordinary root back (`restoreRoots`).
 * v4: tầng (9.1): an older life is put in Phàm gian, or Tu chân giới when it already has a realm (`placeTier`).
 * v5: hoạt động (9.2): the last Ngao du trip moves into the activity record (`moveLeisure`).
 */
export const SAVE_VERSION = 6;
export const SLOT_COUNT = 9;
const KEY_PREFIX = 'bachthe.save.';
const META_KEY = 'bachthe.meta';

/** 9.R1: keys from before the game was renamed (Tu Tiên Nhân Sinh). Kept untouched as a backup. */
export const LEGACY_PREFIX = 'tutien.';
export const STORE_PREFIX = 'bachthe.';
const MIGRATED_KEY = 'bachthe.migrated';

/**
 * 9.R1: copy every old `tutien.*` key to `bachthe.*` once (never overwriting a newer key, never
 * deleting the old one). `keys` lists the store's keys (localStorage has no iterator in KeyValueStore).
 */
export function copyLegacyKeys(store: KeyValueStore, keys: string[]): number {
  if (store.getItem(MIGRATED_KEY)) return 0;
  let n = 0;
  for (const k of keys) {
    if (!k.startsWith(LEGACY_PREFIX)) continue;
    const to = STORE_PREFIX + k.slice(LEGACY_PREFIX.length);
    const v = store.getItem(k);
    if (v !== null && store.getItem(to) === null) { store.setItem(to, v); n++; }
  }
  store.setItem(MIGRATED_KEY, '1');
  return n;
}
/** Stay well under the ~5 MB localStorage limit; above this the log is compacted. */
const MAX_SAVE_CHARS = 1_000_000;
const CALM_LINE = 'Một năm bình lặng trôi qua.';

/** The part of `Storage` the save system uses (tests pass a Map-backed fake). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Data kept across lives (PLAN.md C.5 `meta`). Grows in later phases.
 * rebirthPoints: Luân Hồi points to spend (task 5b.1); credited: life seed → points already
 * given for it, so a death screen shown twice (or a quỷ tu dying again) is not paid twice.
 */
export interface SaveMeta {
  livesPlayed: number;
  rebirthPoints: number;
  credited: Record<string, number>;
  /** Task 5b.8: Phúc báo waiting for the next new life (from: the seed of the life that earned them). */
  blessings: { from: string; list: GameState['blessings'] } | null;
  /** Task 5b.1: thiên phú luân hồi bought (id → level), given to every new life. */
  rebirthTalents: Record<string, number>;
  /** Task 5b.2: lives begun since the last one born with a Kim Thủ Chỉ (bảo hiểm). */
  fingerPity: number;
  /** Task 5b.4: Thiên Thư. */
  codex: Codex;
  /** Task 5b.5: thành tựu held → the life that first earned it (name, and which life it was). */
  achievements: Record<string, { name: string; life: number }>;
  /** Task 5b.6: thử thách tuần per week: challenge id, tries, best score, goal ever met. */
  weekly: Record<string, { id: string; tries: number; best: number; done: boolean }>;
  /** Task 5b.7: the sect a past life ran, for later lives to meet again. */
  pastSect: PastSectRecord | null;
  /** Backlog 11: people kept in the Sổ nhân vật, to bring into later lives. */
  library: SavedPerson[];
  /** 9.R8: Sổ luân hồi (lives, endings, regions). */
  chronicle: Chronicle;
  /** 9.R9: ties past lives left, carried into the next life. */
  karmaLedger: KarmaTie[];
}
/** Seeds remembered in `credited`; older ones are dropped. */
const MAX_CREDITED = 30;

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

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Paths whose absence is meaningful (a fresh life's value would be wrong for an old one). */
const BACKFILL_SKIP = new Set(['events.followUps', 'pastSect', 'log']);
const BACKFILL_NOTE = 'Game vừa cập nhật: đời này được bổ sung dữ liệu cho các hệ thống mới.';

/**
 * Copy into `life` every field it lacks (undefined) from `defaults`, a fresh life of the same world,
 * recursing into plain objects only. Values that exist (even null, 0 or false) are never touched.
 * Returns the paths added, so a new feature needs no hand-written migration step.
 */
export function backfillLife(life: GameState, defaults: GameState): { life: GameState; added: string[] } {
  const added: string[] = [];
  const merge = (cur: Record<string, unknown>, def: Record<string, unknown>, path: string): Record<string, unknown> => {
    let out = cur;
    for (const [k, dv] of Object.entries(def)) {
      const at = path ? `${path}.${k}` : k;
      if (BACKFILL_SKIP.has(at)) continue;
      const cv = cur[k];
      if (cv === undefined) {
        if (out === cur) out = { ...cur };
        out[k] = structuredClone(dv);
        added.push(at);
      } else if (isPlain(cv) && isPlain(dv) && at.split('.').length < 3) {
        const m = merge(cv, dv, at);
        if (m !== cv) {
          if (out === cur) out = { ...cur };
          out[k] = m;
        }
      }
    }
    return out;
  };
  const merged = merge(life as unknown as Record<string, unknown>, defaults as unknown as Record<string, unknown>, '') as unknown as GameState;
  return { life: merged, added };
}

/**
 * Upgrade a save written by an older version. Each saveVersion bump adds a step here; then, when
 * `defaults` (a fresh life) is given, whatever fields are still missing are backfilled from it.
 */
export function migrate(save: SaveFile, defaults?: GameState): SaveFile {
  const stepped = migrateSteps(save);
  if (!defaults) return stepped;
  const { life, added } = backfillLife(stepped.life, defaults);
  if (added.length === 0) return stepped;
  const log = life.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text: BACKFILL_NOTE, tone: 'normal' }] };
  return { ...stepped, life: { ...life, log } };
}

/** Before saveVersion 2 a special body lived in `root.body`; it is now `cult.bodyId` (children: `bodyId`). */
function splitBody(life: GameState): GameState {
  type OldRoot = { grade: string; elements: string[]; body?: string | null };
  const old = life.cult.root as OldRoot | null;
  const strip = (r: OldRoot) => ({ grade: r.grade, elements: r.elements });
  let out = life;
  if ((life.cult as Partial<GameState['cult']>).bodyId === undefined) {
    out = { ...out, cult: { ...out.cult, root: old ? strip(old) : null, bodyId: old?.body ?? null } };
  }
  if (out.family.some((r) => (r.root as OldRoot | null | undefined)?.body)) {
    out = { ...out, family: out.family.map((r) => {
      const root = r.root as OldRoot | null | undefined;
      return root?.body ? { ...r, root: strip(root), bodyId: root.body } : r;
    }) };
  }
  return out;
}

/** The five basic elements, as written in roots.json when saveVersion 3 was made (migrations stay frozen in time). */
const BASIC_ELEMENTS = ['kim', 'moc', 'thuy', 'hoa', 'tho'];

/**
 * SaveVersion 3: before it, a special body took the root's place (grade `the_chat`, no elements). The
 * body stays and the life is given the root it would have had, drawn from the life's own seed (a Tam
 * or Song linh căn, so the body-born keep a decent start).
 */
function restoreRoots(life: GameState): GameState {
  const fix = (key: string) => {
    const rng = new Rng(`${life.seed}:restore-root:${key}`);
    const count = rng.chance(0.5) ? 3 : 2;
    const pool = BASIC_ELEMENTS.slice();
    const picked: string[] = [];
    while (picked.length < count) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
    return { grade: count === 3 ? 'tam' : 'song', elements: BASIC_ELEMENTS.filter((e) => picked.includes(e)) };
  };
  let out = life;
  if (out.cult.root?.grade === 'the_chat') out = { ...out, cult: { ...out.cult, root: fix('self') } };
  if (out.family.some((r) => r.root?.grade === 'the_chat')) {
    out = { ...out, family: out.family.map((r) => (r.root?.grade === 'the_chat' ? { ...r, root: fix(r.id) } : r)) };
  }
  // Hóa cảnh now brings the cao nhân's gift: a mortal already at Hóa cảnh or Tam hoa gets it late (no lifespan top-up).
  if (out.cult.realm === 'pham_nhan' && out.martial.stage >= 4 && !out.flags.cao_nhan_vo_dao) {
    const scrolls = out.cult.scrolls.includes('cuu_chuyen_kim_cot_quyet') ? out.cult.scrolls : [...out.cult.scrolls, 'cuu_chuyen_kim_cot_quyet'];
    out = { ...out, flags: { ...out.flags, cao_nhan_vo_dao: true }, martial: { ...out.martial, manual: 'duong_nguyen_van_the_cong' }, cult: { ...out.cult, scrolls } };
  }
  // Ngũ khí triều nguyên used to give a plain Ngũ linh căn; now it gives the Ngũ khí root and Tiên Võ thể.
  if (out.flags.vo_dao_nhap_tien && out.cult.root?.grade === 'ngu') {
    out = { ...out, cult: { ...out.cult, root: { ...out.cult.root, grade: 'ngu_khi' }, bodyId: 'tien_vo_the' } };
  }
  return out;
}

/** SaveVersion 4: the tầng an older life is in, from its realm (ids as when v4 was made); no nhập đạo screen. */
function placeTier(life: GameState): GameState {
  if (life.tier !== undefined) return life;
  const cultivator = life.cult.realm !== 'pham_nhan';
  return { ...life, tier: cultivator ? 'tu_chan' : 'pham_gian', tierHistory: cultivator ? { pham_gian: 0, tu_chan: life.character.age } : { pham_gian: 0 }, tierScreen: null };
}

/** SaveVersion 5: Ngao du became the activity "ngao_du"; its last trip is kept so it stays once a year. */
function moveLeisure(life: GameState): GameState {
  if (life.activities !== undefined) return life;
  const age = life.extremes.lastLeisure;
  return { ...life, activities: age === null || age === undefined ? { last: {}, year: -1, uses: {} } : { last: { ngao_du: age }, year: age, uses: { ngao_du: 1 } } };
}

/** SaveVersion 6: hương danh (lang_xa) joins the faction reputations at 0. */
function addVillageName(life: GameState): GameState {
  if (life.social.reputation.lang_xa !== undefined) return life;
  return { ...life, social: { ...life.social, reputation: { ...life.social.reputation, lang_xa: 0 } } };
}

function migrateSteps(save: SaveFile): SaveFile {
  // Fields added within saveVersion 1 get their empty defaults.
  let life = save.life as GameState & { extremes?: GameState['extremes'] };
  if (!life.extremes) life = { ...life, extremes: { streak: {}, active: {}, givenAt: {}, lastLeisure: null } };
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
  if (life.blessings === undefined) life = { ...life, blessings: [] };
  // Task 5b.1: no thiên phú luân hồi.
  if (life.rebirthTalents === undefined) life = { ...life, rebirthTalents: {} };
  // Task 5b.3: old lives drew the slots they show, nothing locked.
  if (life.destiny.slots === undefined) life = { ...life, destiny: { ...life.destiny, slots: life.destiny.offered.length || 3, locked: [], maxLocks: 1 } };
  // Task 5b.6: not a weekly challenge.
  if (life.challenge === undefined) life = { ...life, challenge: null };
  // Task 5b.2: no Kim Thủ Chỉ.
  if (life.goldenFinger === undefined) life = { ...life, goldenFinger: null };
  if (life.checkpoints === undefined) life = { ...life, checkpoints: { age6: null, realm: null } };
  // Task 5.1: no sect of one's own.
  if (life.ownSect === undefined) life = { ...life, ownSect: null };
  if (life.pastSect === undefined) life = { ...life, pastSect: null };
  // Task 4.2: đan văn.
  if (life.cult.corePattern === undefined) life = { ...life, cult: { ...life.cult, corePattern: null } };
  // Task 4.8: at home.
  if (life.region === undefined) life = { ...life, region: { id: null, visited: [], movedAt: null } };
  // Task 4.3: Nguyên Anh form.
  if (life.cult.soulForm === undefined) life = { ...life, cult: { ...life.cult, soulForm: null } };
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
  life = addVillageName(moveLeisure(placeTier(restoreRoots(splitBody(life)))));
  // 9.R4d: no mass root test any more: an untested life drops the booked visit (the tiên duyên gates take over).
  const booked = life.events.followUps.filter((f) => /^thu_linh_can/.test(f.event));
  if (!life.cult.root && booked.length) life = { ...life, events: { ...life.events, followUps: life.events.followUps.filter((f) => !booked.includes(f)) } };
  return life === save.life ? save : { ...save, life };
}

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: string };

/** Check and upgrade raw save data (from a slot or an imported file). */
export function parseSave(raw: unknown, knownWorlds: string[], defaults?: GameState): ParseResult {
  const parsed = SaveShape.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'File không phải save của Bách Thế Luân Hồi, hoặc đã hỏng.' };
  if (parsed.data.saveVersion > SAVE_VERSION) {
    return { ok: false, error: 'Save này từ bản game mới hơn, hãy tải lại trang để cập nhật.' };
  }
  const save = migrate(parsed.data as unknown as SaveFile, defaults);
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

export function readSlot(store: KeyValueStore, slot: number, knownWorlds: string[], defaults?: GameState): ParseResult | null {
  let text: string | null;
  try {
    text = store.getItem(slotKey(slot));
  } catch {
    return null;
  }
  if (text === null) return null;
  try {
    return parseSave(JSON.parse(text), knownWorlds, defaults);
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
  return { fileName: `bach-the-${who || 'save'}-${save.life.character.age}-tuoi.json`, text: JSON.stringify(save, null, 2) };
}

export function readMeta(store: KeyValueStore): SaveMeta {
  try {
    const m = JSON.parse(store.getItem(META_KEY) ?? '{}') as Partial<SaveMeta>;
    return {
      livesPlayed: typeof m.livesPlayed === 'number' ? m.livesPlayed : 0,
      rebirthPoints: typeof m.rebirthPoints === 'number' ? m.rebirthPoints : 0,
      credited: m.credited && typeof m.credited === 'object' ? m.credited : {},
      blessings: m.blessings && Array.isArray(m.blessings.list) ? m.blessings : null,
      rebirthTalents: m.rebirthTalents && typeof m.rebirthTalents === 'object' ? m.rebirthTalents : {},
      fingerPity: typeof m.fingerPity === 'number' ? m.fingerPity : 0,
      codex: withBasicKnowledge(readCodex(m.codex), m),
      achievements: m.achievements && typeof m.achievements === 'object' ? m.achievements : {},
      weekly: m.weekly && typeof m.weekly === 'object' ? m.weekly : {},
      pastSect: m.pastSect && typeof m.pastSect.name === 'string' ? m.pastSect : null,
      library: Array.isArray(m.library) ? m.library.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string') : [],
      chronicle: readChronicle(m.chronicle),
      karmaLedger: readKarmaLedger(m.karmaLedger),
    };
  } catch {
    return { livesPlayed: 0, rebirthPoints: 0, credited: {}, blessings: null, rebirthTalents: {}, fingerPity: 0, codex: EMPTY_CODEX, achievements: {}, weekly: {}, pastSect: null, library: [], chronicle: EMPTY_CHRONICLE, karmaLedger: [] };
  }
}

function writeMeta(store: KeyValueStore, meta: SaveMeta): SaveMeta {
  try {
    store.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* meta is a bonus; the game still runs without it */
  }
  return meta;
}

/**
 * A new life begins: count it; the Phúc báo waiting for it are now spent, and so are the
 * Luân Hồi points paid for its origin (task 5b.9 Cầu đầu thai).
 */
export function recordNewLife(store: KeyValueStore, cost = 0, bornWithFinger = false, challenge = false): SaveMeta {
  const meta = readMeta(store);
  // Task 5b.6: a weekly challenge leaves the Phúc báo and the pity count for the next ordinary life.
  if (challenge) return writeMeta(store, { ...meta, livesPlayed: meta.livesPlayed + 1, rebirthPoints: Math.max(0, meta.rebirthPoints - cost) });
  // Task 5b.2: the pity count starts again from a life born with a Kim Thủ Chỉ.
  const fingerPity = bornWithFinger ? 0 : meta.fingerPity + 1;
  return writeMeta(store, { ...meta, livesPlayed: meta.livesPlayed + 1, blessings: null, rebirthPoints: Math.max(0, meta.rebirthPoints - cost), fingerPity });
}

/**
 * Task 5b.1: add a finished life's Luân Hồi points (only what was not given for this seed yet).
 * Task 5b.8: the first time a life is credited, its Phúc báo wait for the next new life.
 */
export function creditRebirth(store: KeyValueStore, seed: string, points: number, blessings: GameState['blessings'] = []): { meta: SaveMeta; gained: number } {
  const meta = readMeta(store);
  const first = !(seed in meta.credited);
  const gained = Math.max(0, points - (meta.credited[seed] ?? 0));
  if (!first && gained === 0) return { meta, gained };
  const kept = Object.entries(meta.credited).filter(([k]) => k !== seed).slice(-(MAX_CREDITED - 1));
  const credited = Object.fromEntries([...kept, [seed, Math.max(points, meta.credited[seed] ?? 0)]]);
  const pending = first ? (blessings.length > 0 ? { from: seed, list: blessings } : null) : meta.blessings;
  return { meta: writeMeta(store, { ...meta, rebirthPoints: meta.rebirthPoints + gained, credited, blessings: pending }), gained };
}

/** Task 5b.1: buy the next level of a thiên phú luân hồi (cost from rebirthTalents.nextTalentCost); null when too poor. */
export function buyRebirthTalent(store: KeyValueStore, id: string, cost: number): SaveMeta | null {
  const meta = readMeta(store);
  if (cost > meta.rebirthPoints) return null;
  const rebirthTalents = { ...meta.rebirthTalents, [id]: (meta.rebirthTalents[id] ?? 0) + 1 };
  return writeMeta(store, { ...meta, rebirthPoints: meta.rebirthPoints - cost, rebirthTalents });
}

/** 9.R5b: a browser that played before the Sổ tri thức existed starts with the basics (knowledge.ts). */
function withBasicKnowledge(codex: Codex, raw: Partial<SaveMeta>): Codex {
  const old = (raw.livesPlayed ?? 0) > 0 && !(raw.codex && Array.isArray((raw.codex as Partial<Codex>).knowledge));
  return old ? { ...codex, knowledge: [...BASIC_KNOWLEDGE] } : codex;
}

function readCodex(raw: unknown): Codex {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<Codex>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return { traits: list(c.traits), combos: list(c.combos), fingers: list(c.fingers), stories: Array.isArray(c.stories) ? c.stories : [], knowledge: list(c.knowledge) };
}

/** Task 5b.4: fold what a life saw into the Thiên Thư (codex.ts codexOf). */
export function recordCodex(store: KeyValueStore, add: Codex): SaveMeta {
  const meta = readMeta(store);
  return writeMeta(store, { ...meta, codex: mergeCodex(meta.codex, add) });
}

/** Task 5b.5: keep the thành tựu a finished life earned; returns the ids new to this browser. */
export function recordAchievements(store: KeyValueStore, ids: string[], name: string): { meta: SaveMeta; fresh: string[] } {
  const meta = readMeta(store);
  const fresh = ids.filter((id) => !(id in meta.achievements));
  if (fresh.length === 0) return { meta, fresh };
  const achievements = { ...meta.achievements, ...Object.fromEntries(fresh.map((id) => [id, { name, life: meta.livesPlayed }])) };
  return { meta: writeMeta(store, { ...meta, achievements }), fresh };
}

/** Task 5b.6: a weekly challenge life ended (once per life seed is the caller's job: call it with creditRebirth's first time). */
export function recordChallenge(store: KeyValueStore, week: string, id: string, score: number, done: boolean): SaveMeta {
  const meta = readMeta(store);
  const prev = meta.weekly[week];
  const entry = { id, tries: (prev?.tries ?? 0) + 1, best: Math.max(prev?.best ?? 0, score), done: !!prev?.done || done };
  // Keep the last 12 weeks.
  const kept = Object.entries(meta.weekly).filter(([k]) => k !== week).sort(([a], [b]) => a.localeCompare(b)).slice(-11);
  return writeMeta(store, { ...meta, weekly: Object.fromEntries([...kept, [week, entry]]) });
}

/** Task 5b.7: keep the sect a past life ran (pastSect.nextPastSectRecord decides what), once per life. */
export function recordPastSect(store: KeyValueStore, record: PastSectRecord | null): SaveMeta {
  return writeMeta(store, { ...readMeta(store), pastSect: record });
}

/** Backlog 11: replace the Sổ nhân vật. */
/** 9.R9: the ledger of ties after a life (karmaLedger.nextKarmaLedger decides what), once per life. */
export function recordKarmaLedger(store: KeyValueStore, ledger: KarmaTie[]): SaveMeta {
  return writeMeta(store, { ...readMeta(store), karmaLedger: ledger });
}

/** 9.R8: fold one finished life into the Sổ luân hồi. */
export function recordChronicle(store: KeyValueStore, add: Chronicle): SaveMeta {
  const meta = readMeta(store);
  return writeMeta(store, { ...meta, chronicle: mergeChronicle(meta.chronicle, add) });
}

export function recordLibrary(store: KeyValueStore, library: SavedPerson[]): SaveMeta {
  return writeMeta(store, { ...readMeta(store), library });
}

/** Developer mode: write a changed meta back (systems/dev builds it). */
export function replaceMeta(store: KeyValueStore, meta: SaveMeta): SaveMeta {
  return writeMeta(store, meta);
}
