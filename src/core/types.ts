// Shared game-state types. Stat layers follow PLAN.md section K.2.
import type { RngState } from './rng';
import type { APTITUDES, Fight, MORTAL_STATS } from './schemas';

export type MortalStat = (typeof MORTAL_STATS)[number];
export type Aptitude = (typeof APTITUDES)[number];
export type Gender = 'nam' | 'nu';
export type Tone = 'normal' | 'good' | 'bad' | 'rare';

export interface LogLine { text: string; tone: Tone }
export interface LogYear { age: number; lines: LogLine[] }

export interface Relative {
  id: string;
  role: 'father' | 'mother' | 'sibling' | 'child';
  gender: Gender;
  name: string;
  age: number;
  alive: boolean;
  /** Age at which this relative dies of old age. */
  lifespan: number;
  /** Thiện cảm 0–100. */
  affinity: number;
  /** Family action id → player's age when last done (each once a year). */
  lastActions: Record<string, number>;
  /** Task 3.7: a child's spirit root, rolled at birth and shown from the root-test age. */
  root?: SpiritRoot | null;
}

/** Spirit root found by the test at 6–12 (task 2.2); ids from roots.json. */
export interface SpiritRoot {
  grade: string;
  /** Element ids; empty for no root or a special body. */
  elements: string[];
  /** Special body id when grade is a body. */
  body: string | null;
}

export type DeathCause = 'old_age' | 'illness' | 'breakthrough' | 'ordeal' | 'combat' | 'tribulation';

export interface GameState {
  version: 1;
  /** Items carried (items.json id → count); the full bag is task 3.1. */
  inventory: Record<string, number>;
  /** Task 3.1: item id → age last used (one use a year); ids whose once-per-life effect is spent; bonus for the next breakthrough; combat % for the next fight. */
  itemUse: { lastAge: Record<string, number>; spent: string[]; nextBreakthrough: number; nextCombat: number };
  /** Task 3.4: people met outside the family, each with their own fate. */
  npcs: Npc[];
  /** Task 3.3: the fight in progress; blocks the next year like a pending event. */
  combat: Battle | null;
  /** Task 3.2: market id → this year's bargain result (price multiplier). */
  bargains: Record<string, { age: number; mul: number }>;
  /** Nghịch Thiên Cải Mệnh talents taken (fate-talents.json, task 2.7). */
  talents: string[];
  /** A talent choice waiting for the player (after a big breakthrough); blocks the next year. */
  fate: { offered: string[]; refreshesLeft: number } | null;
  /** Task 5.4: the cultivation clan of this line: gia quy, sản nghiệp (property id → count). Passed on to heirs. */
  clan: { name: string; founded: number; founder: string; rules: string[]; properties: Record<string, number> } | null;
  /** Task 5.7: lives before this one in the same line (tộc phả), oldest first. */
  ancestry: { name: string; age: number; realm: string; cause: DeathCause; relation: 'child' | 'disciple' | null }[];
  /**
   * Task 5.1: the sect this life founded (it is its master). Members, treasury and buildings
   * grow from task 5.2 on.
   */
  ownSect: {
    name: string; lineage: string; rules: string[]; founded: number; members: number; treasury: number; buildings: Record<string, number>;
    /** Task 5.2: next year's growth bonus from decisions, and this year's report (decisions still open, decisions taken). */
    growthBonus?: number;
    report?: { age: number; text: string; decisions: string[]; done: string[] } | null;
  } | null;
  /**
   * Bế quan (task 4.1): the age the door opens again, and when it closed; null when not in seclusion.
   * fixed: set by an event, so reaching the peak does not end it early (the point is to sit out the years).
   */
  seclusion: { until: number; since: number; fixed?: boolean } | null;
  /** Task 4.8: the đại vực the player is in (null = the world's first, home), regions seen, last year moved. */
  region: { id: string | null; visited: string[]; movedAt: number | null };
  /**
   * Romance (task 3.6): the NPC being courted, whether they said yes (couple), the đạo lữ
   * (task 3.7), people who turned the player down or were left, rivals around the lover,
   * and the age each romance action was last done (once a year each).
   */
  romance: { lover: string | null; couple: boolean; partner: string | null; exes: string[]; rivals: number; lastActions: Record<string, number> };
  /** Thiên kiêu bảng (task 3.5): the world's prodigies and the player's rank last year (null = not on the board). */
  ranking: { prodigies: Prodigy[]; rank: number | null };
  /** Base aptitude 0–100 for each combat path (task 3.8); hooks add on top. */
  paths: Record<string, number>;
  /** Martial path (task 3.11): stage index (-1 before Tam lưu), training years toward the next, extra % for it. */
  martial: { stage: number; years: number; bonus: number; lastTrain: number | null };
  /** Sect membership (task 2.5). */
  sect: {
    id: string | null;
    /** Index into the sect's ranks. */
    rank: number;
    /** Age when the current rank was reached. */
    since: number;
    contribution: number;
    /** Master's name once taken as a personal disciple. */
    master: string | null;
    /** Ages of the last mission and the last request to a master (once a year each). */
    lastMission: number | null;
    lastMasterTry: number | null;
    /** Sects this life has left (no coming back). */
    left: string[];
  };
  /** Mortal career (task 2.11): careers.json id, rung index, age the rung was reached. */
  career: { id: string | null; rung: number; since: number };
  /** Bách nghệ (task 2.12): craft id → level and aptitude 0–100; age of the last practice. */
  crafts: { skills: Record<string, { level: number; affinity: number }>; lastPractice: number | null };
  /** First-life tips (task 2.9): on for the first life; tip ids already shown. */
  tutorial: { enabled: boolean; seen: string[] };
  /** Dễ/Thường/Khó id (difficulties.json), fixed when the life starts. */
  difficulty: string;
  /** Which world (content/worlds/<id>) this life is in. */
  worldId: string;
  seed: string;
  rng: RngState;
  alive: boolean;
  /** Set when the life ends. */
  /** ghostOffer: a lingering obsession lets this life go on as a quỷ tu (task 4.12). */
  death: { age: number; cause: DeathCause; epitaph: string; ghostOffer?: boolean } | null;
  character: {
    name: string;
    gender: Gender;
    originId: string;
    hometown: string;
    age: number;
  };
  /** Mortal body: changes year to year. */
  stats: Record<MortalStat, number>;
  /** Innate aptitudes: fixed at birth, changed only by fortune/traits. */
  aptitudes: Record<Aptitude, number>;
  cult: {
    realm: string;     // id from realms.json (GĐ 2); "pham_nhan" for now
    stage: number;
    progress: number;  // % of current stage
    root: SpiritRoot | null; // null until tested at 6–12
    lifespan: number;  // max age
    /** Failed breakthroughs per milestone ("<realm>:<stage>"), for the G.2 penalty. */
    fails: Record<string, number>;
    /** Meridian injury slows cultivation until this age (exclusive). */
    injuredUntil: number | null;
    /** Main technique id (techniques.json); null for mortals. */
    technique: string | null;
    /** Every technique learned this life (one-time stat hooks are given once). */
    learned: string[];
    /** Đạo cơ grade id after Trúc Cơ (realms.json foundations). */
    foundation: string | null;
    /** Age of the last big breakthrough attempt (one per year). */
    lastMajorAttempt: number | null;
    /** Scrolls found but not yet practised (task 2.8: gainTechnique). */
    scrolls: string[];
    /** Temporary speed multipliers until an age (exclusive). */
    buffs: { mul: number; until: number }[];
    /** Bonus % for the next big breakthrough only. */
    nextBonus: number;
    /** Task 4.2: the core being formed (blocks the year), and the Kim Đan grade 1–9 once formed. */
    coreForming: { round: number; offered: string[]; placed: string[]; purity: number; cracks: number; chancePct: number } | null;
    coreGrade: number | null;
    /** Đan văn of the golden core (task 4.2, core-patterns.json). */
    corePattern: string | null;
    /** Hình thái Nguyên Anh (task 4.3, nascent-souls.json). */
    soulForm: string | null;
    /** Task 4.4: tâm ma chiến in progress (blocks the year), before the big breakthrough it guards. */
    heartDemonTrial: { illusions: string[]; round: number; wins: number; losses: number; chancePct: number; target: string } | null;
    /** Tâm ma seeds from dark choices (task 3.9; read by the heart-demon system later). */
    heartDemon: number;
    /** Lineages this life has followed (one-time onAdopt stats, task 3.8). */
    lineagesAdopted: string[];
    /** Phật đạo precepts broken (task 3.12). */
    preceptBreaks: number;
    /** Đạo thống (Tiên/Ma/Phật/Quỷ), chosen in GĐ 3; reads lineage.<x>.* hooks. */
    lineage: string | null;
  };
  money: { silver: number; spiritStones: number };
  social: {
    karma: number; // -100 evil … +100 good
    reputation: Record<'chinh' | 'ma' | 'tan_tu' | 'yeu' | 'trieu_dinh' | 'giang_ho', number>;
  };
  flags: Record<string, boolean>;
  /** Tiên Thiên Khí Vận: offered at birth, kept after confirming. */
  destiny: {
    offered: string[];
    rerollsLeft: number;
    confirmed: boolean;
  };
  traits: string[];
  family: Relative[];
  events: {
    /** Event waiting for the player's choice, if any. */
    pending: string | null;
    /** Event id → age it last happened (once-per-life, cooldowns). */
    history: Record<string, number>;
    /** Follow-up events booked by earlier choices. */
    followUps: { event: string; atAge: number }[];
    /** Task 3.4: id of the NPC the pending event is about ({npc}). */
    npc: string | null;
  };
  /** Stats stuck at an extreme (stat-extremes.json). */
  extremes: {
    /** Stat (or "karma") → consecutive years in the low / high zone. */
    streak: Record<string, { low: number; high: number }>;
    /** Active state id → age it started. */
    active: Record<string, number>;
    /** State id → age its once-effects were last given; "<id>#<n>" for its specials. */
    givenAt: Record<string, number>;
  };
  log: LogYear[];
}

/** A foe built from a FoeSpec (task 3.3). */
export interface Foe {
  name: string;
  realm: string;
  stage: number;
  power: number;
  speed: number;
  element: string | null;
  path: string | null;
  lineage: string;
  intent: 'teach' | 'rob' | 'kill';
  mercy: number;
}

/** A fight in progress: up to 3 rounds, first to balance.combat.winRounds. */
export interface Battle {
  foe: Foe;
  won: number;
  lost: number;
  /** Blow-by-blow lines of this fight (shown in the fight card, summed up in the log). */
  lines: LogLine[];
  /** "won": the player picks spare / loot / kill. */
  phase: 'fight' | 'won';
  /** Combat % bonus waiting for the next round (Huyết Khí Hoàn, talismans). */
  nextBonus: number;
  /** What ends the fight: from the event outcome. */
  outcomes: Pick<Fight, 'win' | 'lose' | 'fled'>;
  /** Event title that started it, for the log. */
  source: string | null;
  /** Task 3.4: the foe is this NPC (killing them goes through killNpc). */
  npcId: string | null;
}

/** Task 3.5: a young prodigy on the Thiên kiêu bảng (not someone the player has met). */
export interface Prodigy {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  /** Sect id of this world, or null for a tán tu. */
  sect: string | null;
  aptitude: number;
  realm: string;
  stage: number;
  progress: number;
}

/** Task 3.4: an NPC who lives, cultivates, ages and remembers what the player did. */
export interface Npc {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  lifespan: number;
  alive: boolean;
  /** How the player knows them: bằng hữu, ân nhân, kẻ thù, đồng môn… (free text from the event). */
  role: string;
  /** Cultivation; root false = a mortal who never cultivates. */
  root: boolean;
  aptitude: number;
  realm: string;
  stage: number;
  progress: number;
  /** npc-traits.json ids; nature stays hidden until natureKnown. */
  surface: string | null;
  nature: string | null;
  natureKnown: boolean;
  goal: string | null;
  /** Thiện cảm 0–100. */
  affinity: number;
  /** Sổ ân oán: kindness owed to the player and grudge held against them (0–100 each). */
  favor: number;
  grudge: number;
  /** Id of the NPC whose grudge this one inherited (kin of someone the player killed). */
  heirOf: string | null;
  /** Task 4.9: the player's disciple, and the age they were last taught. */
  disciple?: { since: number; lastTaught: number | null };
  /** Task 5.5: a khí vận chi tử (template id) and the age of the player when they came. */
  chosen?: { template: string; since: number };
}
