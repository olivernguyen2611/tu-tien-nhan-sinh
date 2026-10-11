// Shared parsed content for tests that build a Content object by hand.
import { parseCultivationTables } from '../src/core/content';
import realms from '../content/realms.json';
import roots from '../content/roots.json';
import aptitudes from '../content/aptitudes.json';
import difficultyFile from '../content/difficulties.json';
import { DifficultyFileSchema } from '../src/core/schemas';

export const cultivation = parseCultivationTables(realms, roots, aptitudes);
export const difficulties = DifficultyFileSchema.parse(difficultyFile);
