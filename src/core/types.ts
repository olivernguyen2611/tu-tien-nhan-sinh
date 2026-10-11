// Shared game-state types. Stat layers follow PLAN.md section K.2.
import type { RngState } from './rng';
import type { APTITUDES, MORTAL_STATS } from './schemas';

export type MortalStat = (typeof MORTAL_STATS)[number];
export type Aptitude = (typeof APTITUDES)[number];
export type Gender = 'nam' | 'nu';
export type Tone = 'normal' | 'good' | 'bad' | 'rare';

export interface LogLine { text: string; tone: Tone }
export interface LogYear { age: number; lines: LogLine[] }

export interface GameState {
  version: 1;
  seed: string;
  rng: RngState;
  alive: boolean;
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
    root: string | null; // spirit root, tested at 6–12 (GĐ 2)
    lifespan: number;  // max age
  };
  money: { silver: number; spiritStones: number };
  social: {
    karma: number; // -100 evil … +100 good
    reputation: Record<'chinh' | 'ma' | 'tan_tu' | 'yeu', number>;
  };
  flags: Record<string, boolean>;
  log: LogYear[];
}
