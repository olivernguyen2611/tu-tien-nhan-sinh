// Shared parsed content for tests that build a Content object by hand.
import { parseCultivationTables } from '../src/core/content';
import realms from '../content/realms.json';
import roots from '../content/roots.json';
import aptitudes from '../content/aptitudes.json';
import difficultyFile from '../content/difficulties.json';
import { CombatTextsSchema, CareersFileSchema, DifficultyFileSchema, FateTalentFileSchema, ItemFileSchema, MartialFileSchema, LineageFileSchema, RankingTextsSchema, RomanceFileSchema, HeartDemonFileSchema, RecipeFileSchema, DisciplesFileSchema, FoundingFileSchema, HeirFileSchema, ClanFileSchema, BlessingFileSchema, SectFileSchema, SectLifeSchema, TechniqueFileSchema, TutorialFileSchema } from '../src/core/schemas';
import techniquesFile from '../content/techniques.json';
import fateFile from '../content/fate-talents.json';
import itemsFile from '../content/items.json';
import martialFile from '../content/martial.json';
import lineagesFile from '../content/lineages.json';
import rankingsFile from '../content/rankings.json';
import romanceFile from '../content/romance.json';
import heartDemonFile from '../content/heart-demon.json';
import recipesFile from '../content/recipes.json';
import disciplesFile from '../content/disciples.json';
import foundingFile from '../content/founding.json';
import heirFile from '../content/heir.json';
import clanFile from '../content/clan.json';
import blessingsFile from '../content/blessings.json';
import sectsFile from '../content/worlds/thuong_lan/sects.json';
import sectLifeFile from '../content/worlds/thuong_lan/sect-life.json';
import careersFile from '../content/careers.json';
import tutorialFile from '../content/tutorial.json';
import combatFile from '../content/combat.json';

export const cultivation = parseCultivationTables(realms, roots, aptitudes);
export const difficulties = DifficultyFileSchema.parse(difficultyFile);
export const tutorial = TutorialFileSchema.parse(tutorialFile);
export const careers = CareersFileSchema.parse(careersFile);
export const techniques = TechniqueFileSchema.parse(techniquesFile);
export const sects = SectFileSchema.parse(sectsFile);
export const sectLife = SectLifeSchema.parse(sectLifeFile);
export const fateTalents = FateTalentFileSchema.parse(fateFile);
export const items = ItemFileSchema.parse(itemsFile);
export const martial = MartialFileSchema.parse(martialFile);
export const lineages = LineageFileSchema.parse(lineagesFile);
export const rankings = RankingTextsSchema.parse(rankingsFile);
export const romance = RomanceFileSchema.parse(romanceFile);
export const heartDemon = HeartDemonFileSchema.parse(heartDemonFile);
export const recipes = RecipeFileSchema.parse(recipesFile);
export const disciples = DisciplesFileSchema.parse(disciplesFile);
export const founding = FoundingFileSchema.parse(foundingFile);
export const heir = HeirFileSchema.parse(heirFile);
export const clan = ClanFileSchema.parse(clanFile);
export const blessings = BlessingFileSchema.parse(blessingsFile);
export const combat = CombatTextsSchema.parse(combatFile);

// GĐ 5b content (task 5b.1 on): spread `...legacy` into hand-built Content objects.
import { AchievementFileSchema, CodexFileSchema, GoldenFingerFileSchema, RebirthTalentFileSchema, TraitComboFileSchema } from '../src/core/schemas';
import codexFile from '../content/codex.json';
import achievementsFile from '../content/achievements.json';
import traitCombosFile from '../content/trait-combos.json';
import goldenFingersFile from '../content/golden-fingers.json';
import rebirthTalentsFile from '../content/rebirth-talents.json';
export const legacy = {
  rebirthTalents: RebirthTalentFileSchema.parse(rebirthTalentsFile),
  goldenFingers: GoldenFingerFileSchema.parse(goldenFingersFile),
  traitCombos: TraitComboFileSchema.parse(traitCombosFile),
  codex: CodexFileSchema.parse(codexFile),
  achievements: AchievementFileSchema.parse(achievementsFile),
};
