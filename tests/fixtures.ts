// Shared parsed content for tests that build a Content object by hand.
import { parseCultivationTables } from '../src/core/content';
import realms from '../content/realms.json';
import roots from '../content/roots.json';
import aptitudes from '../content/aptitudes.json';
import difficultyFile from '../content/difficulties.json';
import { CareersFileSchema, DifficultyFileSchema, FateTalentFileSchema, SectFileSchema, SectLifeSchema, TechniqueFileSchema, TutorialFileSchema } from '../src/core/schemas';
import techniquesFile from '../content/techniques.json';
import fateFile from '../content/fate-talents.json';
import sectsFile from '../content/worlds/thuong_lan/sects.json';
import sectLifeFile from '../content/worlds/thuong_lan/sect-life.json';
import careersFile from '../content/careers.json';
import tutorialFile from '../content/tutorial.json';

export const cultivation = parseCultivationTables(realms, roots, aptitudes);
export const difficulties = DifficultyFileSchema.parse(difficultyFile);
export const tutorial = TutorialFileSchema.parse(tutorialFile);
export const careers = CareersFileSchema.parse(careersFile);
export const techniques = TechniqueFileSchema.parse(techniquesFile);
export const sects = SectFileSchema.parse(sectsFile);
export const sectLife = SectLifeSchema.parse(sectLifeFile);
export const fateTalents = FateTalentFileSchema.parse(fateFile);
