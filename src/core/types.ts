// Shared game-state types. Stat layers follow PLAN.md section K.2.
import type { RngState } from './rng';
import type { APTITUDES, MORTAL_STATS } from './schemas';

export type MortalStat = (typeof MORTAL_STATS)[number];
export type Aptitude = (typeof APTITUDES)[number];
export type Gender = 'nam' | 'nu';
export type Tone = 'normal' | 'good' | 'bad' | 'rare';

export interface LogLine { text: string; tone: Tone }
export interface LogYear { age: number; lines: LogLine[] }

export interface Relative {
  id: string;
  role: 'father' | 'mother' | 'sibling';
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
}

/** Spirit root found by the test at 6–12 (task 2.2); ids from roots.json. */
export interface SpiritRoot {
  grade: string;
  /** Element ids; empty for no root or a special body. */
  elements: string[];
  /** Special body id when grade is a body. */
  body: string | null;
}

export type DeathCause = 'old_age' | 'illness' | 'breakthrough' | 'ordeal';

export interface GameState {
  version: 1;
  /** Nghịch Thiên Cải Mệnh talents taken (fate-talents.json, task 2.7). */
  talents: string[];
  /** A talent choice waiting for the player (after a big breakthrough); blocks the next year. */
  fate: { offered: string[]; refreshesLeft: number } | null;
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
  death: { age: number; cause: DeathCause; epitaph: string } | null;
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
    /** Đạo thống (Tiên/Ma/Phật/Quỷ), chosen in GĐ 3; reads lineage.<x>.* hooks. */
    lineage: string | null;
  };
  money: { silver: number; spiritStones: number };
  social: {
    karma: number; // -100 evil … +100 good
    reputation: Record<'chinh' | 'ma' | 'tan_tu' | 'yeu', number>;
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
