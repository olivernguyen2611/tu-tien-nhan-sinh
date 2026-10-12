// Creating a new life. Pure: same seed + same input → same character.
import { ageNpcs, npcById } from '../systems/npcs';
import type { Content } from './content';
import { Rng } from './rng';
import { APTITUDES, MORTAL_STATS } from './schemas';
import type { GameState, Gender } from './types';
import { rollYearEvent } from '../systems/events/engine';
import { ageFamily, createFamily } from '../systems/relationships';
import { ageExtremes } from '../systems/extremes';
import { ageBody, checkDeath } from '../systems/time';
import { makeName, splitName } from '../systems/names';
import { cultivateYear, rootTestAge } from '../systems/cultivation';
import { applyJobCrafts } from '../systems/crafts';
import { careerYear } from '../systems/career';
import { sectYear } from '../systems/sect';
import { lineageYear, rollPaths } from '../systems/paths';
import { rankingYear } from '../systems/rankings';
import { romanceYear, romanceTarget } from '../systems/romance';
import { ownSectYear } from '../systems/ownSect';
import { clanYear } from '../systems/clan';
import { blessingRerolls } from '../systems/blessings';
import { withCheckpoints } from '../systems/rewind';
import { awakenGoldenFinger } from '../systems/goldenFinger';
import { ownedRebirthTalents, rebirthTalentBonus } from '../systems/rebirthTalents';

export interface NewLifeInput {
  seed: string;
  name?: string;      // empty → random
  gender?: Gender;    // undefined → random
  originId?: string;  // undefined → weighted random
  difficulty?: string; // undefined → balance.defaultDifficulty
  tutorial?: boolean;  // show first-life tips
  /** Task 5b.8: Phúc báo earned by the last life. */
  blessings?: GameState['blessings'];
  /** Task 5b.1: thiên phú luân hồi owned (id → level). */
  rebirthTalents?: Record<string, number>;
  /** Task 5b.2: a Kim Thủ Chỉ drawn at birth (rollBirthFinger), awakened when the destiny is confirmed. */
  goldenFinger?: string | null;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export function randomName(rng: Rng, content: Content, gender: Gender): string {
  return makeName(rng, content.names, gender);
}

export function fillTemplate(text: string, state: GameState, content?: Content): string {
  // The founded sect (task 5.1) when there is one, else the sect the player belongs to.
  const sect = state.ownSect?.name ?? content?.sects.find((s) => s.id === state.sect.id)?.name ?? 'tông môn';
  // Task 3.4: {npc} = the event's NPC, {npcRole} = how the player knows them, {npcKin} = the dead relative an heir avenges.
  const npc = npcById(state, state.events.npc);
  const kin = npcById(state, npc?.heirOf);
  return text
    .replace(/\{name\}/g, state.character.name)
    .replace(/\{hometown\}/g, state.character.hometown)
    .replace(/\{sect\}/g, sect)
    .replace(/\{npc\}/g, npc?.name ?? 'người kia')
    .replace(/\{npcRole\}/g, npc?.role ?? 'người quen')
    .replace(/\{npcKin\}/g, kin?.name ?? 'người thân')
    // Task 3.4: the NPC's outward character and true nature, lower-case for mid-sentence use.
    .replace(/\{npcSurface\}/g, (content?.npcTraits.surface.find((x) => x.id === npc?.surface)?.name ?? 'dễ gần').toLowerCase())
    .replace(/\{npcNature\}/g, (content?.npcTraits.nature.find((x) => x.id === npc?.nature)?.name ?? 'khó đoán').toLowerCase())
    // Task 3.6: {lover} = the đạo lữ, else the one being courted.
    .replace(/\{lover\}/g, romanceTarget(state, 'beloved')?.name ?? 'người ấy')
    // Task 3.9: forms of address by gender: the lover calls themself muội/huynh, calls the player chàng/nàng.
    .replace(/\{loverSelf\}/g, romanceTarget(state, 'beloved')?.gender === 'nam' ? 'huynh' : 'muội')
    .replace(/\{playerDear\}/g, state.character.gender === 'nam' ? 'chàng' : 'nàng')
    // Task 3.9: {deceased} = a parent who has died, else any relative.
    .replace(/\{deceased\}/g, deceasedName(state));
}

function deceasedName(state: GameState): string {
  const dead = state.family.filter((r) => !r.alive);
  const parent = dead.find((r) => r.role === 'father' || r.role === 'mother');
  const r = parent ?? dead[0];
  if (!r) return 'người đã khuất';
  const call = r.role === 'father' ? 'cha' : r.role === 'mother' ? 'mẹ' : r.role === 'child' ? 'đứa con' : 'người thân';
  return `${call} ${r.name}`;
}

export function createLife(input: NewLifeInput, content: Content): GameState {
  const rng = new Rng(input.seed);
  const cfg = content.balance.character;
  const life = content.balance.lifespan;

  const gender: Gender = input.gender ?? (rng.chance(0.5) ? 'nam' : 'nu');
  const name = input.name?.trim() || randomName(rng, content, gender);
  const origin = content.origins.find((o) => o.id === input.originId) ?? rng.weighted(content.origins, (o) => o.weight);
  const hometown = rng.pick(content.names.hometowns);
  const difficulty = input.difficulty && content.balance.difficulty[input.difficulty] ? input.difficulty : content.balance.defaultDifficulty;

  const stats = Object.fromEntries(MORTAL_STATS.map((k) => [k, rng.int(cfg.mortalStatRange[0], cfg.mortalStatRange[1])])) as GameState['stats'];
  // Aptitudes average several rolls so extremes are rare.
  const rollAptitude = () => {
    let sum = 0;
    for (let i = 0; i < cfg.aptitudeRolls; i++) sum += rng.int(cfg.aptitudeRange[0], cfg.aptitudeRange[1]);
    return sum / cfg.aptitudeRolls;
  };
  const aptitudes = Object.fromEntries(APTITUDES.map((k) => [k, clamp(rollAptitude())])) as GameState['aptitudes'];

  // Origin effects use the stat hooks from PLAN.md K.6 ("stat.<name>").
  for (const [hook, delta] of Object.entries(origin.effects)) {
    const key = hook.slice('stat.'.length);
    if (key in stats) stats[key as keyof typeof stats] = clamp(stats[key as keyof typeof stats] + delta);
    else if (key in aptitudes) aptitudes[key as keyof typeof aptitudes] = clamp(aptitudes[key as keyof typeof aptitudes] + delta);
  }

  // PLAN.md G.3: mortal lifespan = base ± variance, health shifts it up to ±healthAdjustMax.
  const healthShift = Math.round(((stats.health - 50) / 50) * life.healthAdjustMax);
  const lifespan = life.mortalBase + rng.int(-life.mortalVariance, life.mortalVariance) + healthShift;

  const blessings = (input.blessings ?? []).filter((b) => content.blessings.blessings.some((x) => x.id === b.id));
  const rebirthTalents = ownedRebirthTalents(input.rebirthTalents ?? {}, content);
  const family = createFamily(rng, content, splitName(name, content.names).surname, !!origin.noParents, name);

  const state: GameState = {
    version: 1,
    difficulty,
    tutorial: { enabled: !!input.tutorial, seen: [] },
    crafts: { skills: {}, lastPractice: null },
    career: { id: null, rung: 0, since: 0 },
    inventory: {},
    martial: { stage: -1, years: 0, bonus: 0, lastTrain: null },
    paths: rollPaths(input.seed, content),
    itemUse: { lastAge: {}, spent: [], nextBreakthrough: 0, nextCombat: 0 },
    bargains: {},
    combat: null,
    npcs: [],
    ranking: { prodigies: [], rank: null },
    seclusion: null,
    ownSect: null,
    ancestry: [],
    blessings,
    rebirthTalents,
    goldenFinger: input.goldenFinger && content.goldenFingers.fingers.some((f) => f.id === input.goldenFinger) ? { id: input.goldenFinger, level: 0, since: 0 } : null,
    checkpoints: { age6: null, realm: null },
    clan: null,
    region: { id: null, visited: [], movedAt: null },
    romance: { lover: null, couple: false, partner: null, exes: [], rivals: 0, lastActions: {} },
    talents: [],
    fate: null,
    sect: { id: null, rank: 0, since: 0, contribution: 0, master: null, lastMission: null, lastMasterTry: null, left: [] },
    worldId: content.world.id,
    seed: input.seed,
    rng: rng.getState(),
    alive: true,
    death: null,
    character: { name, gender, originId: origin.id, hometown, age: 0 },
    stats,
    aptitudes,
    cult: { realm: 'pham_nhan', stage: 0, progress: 0, root: null, lifespan, fails: {}, injuredUntil: null, technique: null, learned: [], scrolls: [], buffs: [], nextBonus: 0, preceptBreaks: 0, lineagesAdopted: [], heartDemon: 0, coreForming: null, coreGrade: null, corePattern: null, soulForm: null, heartDemonTrial: null, foundation: null, lastMajorAttempt: null, lineage: null },
    money: { silver: origin.silver + rebirthTalentBonus(rebirthTalents, content, 'startSilver'), spiritStones: origin.spiritStones },
    social: { karma: 0, reputation: { chinh: 0, ma: 0, tan_tu: 0, yeu: 0, trieu_dinh: 0, giang_ho: 0 } },
    flags: origin.noParents ? { no_parents: true, no_father: true, no_mother: true } : {},
    destiny: { offered: [], rerollsLeft: Math.max(0, content.balance.traits.rerolls + (content.balance.difficulty[difficulty]?.rerollBonus ?? 0) + blessingRerolls(blessings, content) + rebirthTalentBonus(rebirthTalents, content, 'destinyRerolls')), confirmed: false,
      slots: Math.min(content.balance.traits.maxSlots, content.balance.traits.slots + rebirthTalentBonus(rebirthTalents, content, 'destinySlots')),
      locked: [], maxLocks: content.balance.traits.locks + rebirthTalentBonus(rebirthTalents, content, 'destinyLocks') },
    traits: [],
    family,
    events: {
      pending: null,
      history: {},
      // Every life meets the world's root test once, at an age in balance.roots.testAge.
      followUps: content.world.rootTestEvent ? [{ event: content.world.rootTestEvent, atAge: rootTestAge(input.seed, content) }] : [],
      npc: null,
    },
    extremes: { streak: {}, active: {}, givenAt: {} },
    log: [],
  };
  state.log.push({ age: 0, lines: [{ text: fillTemplate(origin.birthText, state), tone: 'normal' }] });
  return state;
}

const withYear = (s: GameState): GameState => ({ ...s, log: [...s.log, { age: s.character.age, lines: [] }] });

/** One year passes; at most one event is rolled for the player to answer. */
export function advanceYear(state: GameState, content: Content): GameState {
  if (!state.alive || state.events.pending || state.fate || state.combat || state.cult.coreForming || state.cult.heartDemonTrial) return state;
  // Task 5b.10: moments a Trùng sinh can go back to.
  state = withCheckpoints(state);
  // Task 5b.2: the Kim Thủ Chỉ awakens further once the realm allows.
  state = awakenGoldenFinger(state, content);
  const age = state.character.age + 1;
  const aged: GameState = { ...state, character: { ...state.character, age } };
  const body = checkDeath(clanYear(ownSectYear(romanceYear(rankingYear(lineageYear(sectYear(careerYear(applyJobCrafts(cultivateYear(ageExtremes(ageBody(ageNpcs(ageFamily(withYear(aged), content), content), content), content), content), content), content), content), content), content), content), content), content), content);
  // Task 4.1: in seclusion no ordinary event comes (follow-ups wait for the door to open);
  // the door opens by itself when the years are up.
  const secluded = body.seclusion && age >= body.seclusion.until ? { ...body, seclusion: null } : body;
  const next = body.alive && !state.seclusion ? rollYearEvent(secluded, content) : secluded;
  // The year's log block exists before family news and the event are added to it.
  const log = next.log.slice();
  const block = log[log.length - 1];
  if (state.seclusion && block.lines.length === 0) {
    log[log.length - 1] = { ...block, lines: [{ text: content.cultivation.realms.texts.seclusionYear, tone: 'normal' }] };
    return { ...next, log };
  }
  if (!next.events.pending && block.lines.length === 0) {
    log[log.length - 1] = { ...block, lines: [{ text: 'Một năm bình lặng trôi qua.', tone: 'normal' }] };
    // A quiet year eases happiness back toward its resting point.
    const { happinessDrift: drift, happinessRest: rest } = content.balance.extremes;
    const h = next.stats.happiness;
    const eased = h > rest ? Math.max(rest, h - drift) : Math.min(rest, h + drift);
    return { ...next, stats: { ...next.stats, happiness: eased }, log };
  }
  return { ...next, log };
}

/**
 * "Tua nhanh" (task 1.11): pass years until something needs the player's eye —
 * an event to answer, death, or a year with good/bad/rare news — or until
 * balance.fastForward.maxYears have passed.
 */
export function fastForward(state: GameState, content: Content): GameState {
  let s = state;
  for (let i = 0; i < content.balance.fastForward.maxYears; i++) {
    const next = advanceYear(s, content);
    if (next === s) break;
    s = next;
    const year = s.log[s.log.length - 1];
    if (!s.alive || s.events.pending || year.lines.some((l) => l.tone !== 'normal')) break;
  }
  return s;
}
