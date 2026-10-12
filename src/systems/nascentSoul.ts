// Hình thái Nguyên Anh (task 4.3): when the golden core shatters into a Nguyên Anh,
// its form follows the road walked: a top-grade core, the đạo thống, then the
// main fighting path. Forms and their hooks in nascent-souls.json (first match wins).
import type { Content } from '../core/content';
import type { NascentSoulFile } from '../core/schemas';
import type { GameState } from '../core/types';
import { mainPath } from './paths';

type SoulForm = NascentSoulFile['forms'][number];

export function soulFormFor(state: GameState, content: Content): SoulForm | undefined {
  const grade = state.cult.coreGrade;
  const path = mainPath(state, content).id;
  return content.nascentSouls.forms.find(({ when: w }) =>
    (w.maxCoreGrade === undefined || (grade !== null && grade <= w.maxCoreGrade))
    && (w.lineage === undefined || state.cult.lineage === w.lineage)
    && (w.path === undefined || path === w.path));
}
