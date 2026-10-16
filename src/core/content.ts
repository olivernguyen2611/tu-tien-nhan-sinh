// Loads all JSON under content/ at build time and checks it with the same
// rules as `npm run validate`.
import {
  AptitudesFileSchema, DifficultyFileSchema, TutorialFileSchema, type TutorialFile, CareersFileSchema, type CareersFile, SectFileSchema, TechniqueFileSchema, SectLifeSchema, FateTalentFileSchema, ItemFileSchema, MartialFileSchema, LineageFileSchema, MarketFileSchema, RegionFileSchema, type Region, JianghuFactionFileSchema, type JianghuFaction, NationFileSchema, type Nation, FigureFileSchema, type Figure, WorldEventFileSchema, type WorldEvent, WorldClanFileSchema, type WorldClan, RaceFileSchema, type Race, KnowledgeFileSchema, type KnowledgeEntry, ImmortalGateFileSchema, type ImmortalGate, CombatTextsSchema, type CombatTexts, type Market, type FateTalent, type Item, type Lineage, type MartialFile, type Sect, type SectLife, type Technique, RealmsFileSchema, type Difficulty, RootsFileSchema, type AptitudesFile, type RealmsFile, type RootsFile, NpcTraitsFileSchema, RankingTextsSchema, type RankingTexts, RomanceFileSchema, type RomanceFile, HeartDemonFileSchema, type HeartDemonFile, RecipeFileSchema, type RecipeFile, CorePatternFileSchema, type CorePattern, NascentSoulFileSchema, type NascentSoulFile, DisciplesFileSchema, type DisciplesFile, FoundingFileSchema, type FoundingFile, HeirFileSchema, type HeirFile, ChosenFileSchema, type ChosenFile, ClanFileSchema, type ClanFile, BlessingFileSchema, type BlessingFile, RebirthTalentFileSchema, type RebirthTalentFile, GoldenFingerFileSchema, type GoldenFingerFile, TraitComboFileSchema, type TraitComboFile, CodexFileSchema, type CodexFile, EndingFileSchema, type Ending, ThienDaoKyFileSchema, type ThienDaoKyFile, SpecialOriginFileSchema, type SpecialOrigin, SystemFileSchema, type SystemDef, TrungSinhFileSchema, type TrungSinhFile, ThanDaoFileSchema, type ThanDaoFile, AchievementFileSchema, type AchievementFile, ChallengeFileSchema, type ChallengeFile, type NpcTraitsFile,
  BalanceSchema, EventFileSchema, FamilyActionFileSchema, GlossarySchema, NpcActFileSchema, EffectLabelsSchema, LifeTextsSchema, NamesSchema, OriginFileSchema, StatExtremesFileSchema, TraitFileSchema, WorldSchema,
  type Balance, type FamilyAction, type NpcAct, type EffectLabels, type GameEvent, type Glossary, type LifeTexts, type Names, type Origin, type StatExtremesFile, type Trait, type World,
} from './schemas';
import { splitWorldPath, validateContent } from './validate';

/** The world played when none is chosen (world picker comes later). */
export const DEFAULT_WORLD_ID = 'thuong_lan';

/**
 * Everything the engine needs for one life: shared files (balance, traits,
 * glossary) plus the files of the chosen world (origins, names, events).
 */
export interface Content {
  world: World;
  balance: Balance;
  events: GameEvent[];
  glossary: Glossary;
  origins: Origin[];
  names: Names;
  traits: Trait[];
  familyActions: FamilyAction[];
  /** 9.0.3: what to do with people met along the way, by closeness. */
  npcActs?: NpcAct[];
  /** 9.R2c: readable effect lines (optional so hand-built test content can skip it). */
  effectLabels?: EffectLabels;
  lifeTexts: LifeTexts;
  extremes: StatExtremesFile;
  /** Realms, spirit roots, combat paths and crafts (task 2.1). */
  cultivation: CultivationTables;
  /** Dễ/Thường/Khó names (task 2.10); numbers are in balance.difficulty. */
  difficulties: Difficulty[];
  /** Goals and first-life tips (task 2.9). */
  tutorial: TutorialFile;
  /** Mortal careers (task 2.11). */
  careers: CareersFile;
  /** Main cultivation methods (task 2.4), shared by every world. */
  techniques: Technique[];
  /** This world's sects (task 2.4). */
  sects: Sect[];
  /** Sect texts and missions of this world (task 2.5); null when it has no sects. */
  sectLife: SectLife | null;
  markets: Market[];
  /** Task 4.8: đại vực of this world; regions[0] is home. */
  regions: Region[];
  /** 9.W: giang hồ forces of this world, apart from the cultivation sects. */
  jianghuFactions?: JianghuFaction[];
  /** 9.R7c: phàm quốc, tu tiên thế gia and peoples of the world. */
  nations?: Nation[];
  /** 9.R7f: đại năng and famous people. */
  figures?: Figure[];
  /** 9.R7e: sự kiện thiên hạ. */
  worldEvents?: WorldEvent[];
  worldClans?: WorldClan[];
  races?: Race[];
  /** 9.R5a: the Sổ tri thức of this world. */
  knowledge?: KnowledgeEntry[];
  /** 9.S3: what a Trùng sinh soul remembers (this world). */
  trungSinh?: TrungSinhFile;
  /** 9.S5: thành thần paths (this world). */
  thanDao?: ThanDaoFile;
  /** 9.R4b: the tiên duyên gates of this world. */
  immortalGates?: ImmortalGate[];
  /** Fight texts (task 3.3). */
  combat: CombatTexts;
  /** NPC personalities and goals (task 3.4). */
  npcTraits: NpcTraitsFile;
  /** Cultivation clans (task 5.4). */
  clan: ClanFile;
  /** Phúc báo for the next life (task 5b.8). */
  blessings: BlessingFile;
  /** Task 5b.1: thiên phú luân hồi. */
  rebirthTalents: RebirthTalentFile;
  /** Task 5b.2: Kim Thủ Chỉ. */
  goldenFingers: GoldenFingerFile;
  /** Task 5b.3: tổ hợp ẩn. */
  traitCombos: TraitComboFile;
  /** Task 5b.4: Thiên Thư texts. */
  codex: CodexFile;
  /** 9.R8: kết cục of a life (Sổ luân hồi). */
  endings?: Ending[];
  /** 9.R10: Thiên Đạo Ký templates. */
  thienDaoKy?: ThienDaoKyFile;
  /** 9.S1: Tình tiết đặc biệt hiếm, every special-origins/*.json. */
  specialOrigins?: SpecialOrigin[];
  /** 9.S2: Hệ thống definitions. */
  systems?: SystemDef[];
  /** Task 5b.5: thành tựu, huy hiệu cuối đời, cáo phó. */
  achievements: AchievementFile;
  /** Task 5b.6: thử thách tuần of this world. */
  challenges: ChallengeFile;
  /** Going on as an heir (task 5.7). */
  heir: HeirFile;
  /** Khí vận chi tử templates (task 5.5). */
  chosenOnes: ChosenFile;
  /** Founding a sect (task 5.1). */
  founding: FoundingFile;
  /** Disciple texts (task 4.9). */
  disciples: DisciplesFile;
  /** Luyện đan / Luyện khí recipes (task 4.7). */
  recipes: RecipeFile;
  /** Đan văn on a new golden core (task 4.2). */
  corePatterns: CorePattern[];
  /** Nguyên Anh forms (task 4.3). */
  nascentSouls: NascentSoulFile;
  /** Tâm ma illusions (task 4.4). */
  heartDemon: HeartDemonFile;
  /** Romance tiers and texts (task 3.6). */
  romance: RomanceFile;
  /** Thiên kiêu bảng texts (task 3.5). */
  rankings: RankingTexts;
  /** Nghịch Thiên Cải Mệnh talents (task 2.7). */
  fateTalents: FateTalent[];
  /** Items known so far (task 2.8). */
  items: Item[];
  /** Martial stages for mortals (task 3.11). */
  martial: MartialFile;
  /** Đạo thống (task 3.8). */
  lineages: Lineage[];
}

export interface CultivationTables {
  realms: RealmsFile;
  roots: RootsFile;
  aptitudes: AptitudesFile;
}

export function parseCultivationTables(realms: unknown, roots: unknown, aptitudes: unknown): CultivationTables {
  return { realms: RealmsFileSchema.parse(realms), roots: RootsFileSchema.parse(roots), aptitudes: AptitudesFileSchema.parse(aptitudes) };
}

const modules = import.meta.glob('../../content/**/*.json', { eager: true, import: 'default' });

/** Paths relative to content/, e.g. "events/childhood.json". */
function rawFiles(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(modules)) {
    out[path.replace(/^.*\/content\//, '')] = data;
  }
  return out;
}

function checkedFiles(): Record<string, unknown> {
  const files = rawFiles();
  const errors = validateContent(files).filter((p) => p.level === 'error');
  if (errors.length > 0) {
    throw new Error('Dữ liệu game lỗi:\n' + errors.map((e) => `${e.file}: ${e.message}`).join('\n'));
  }
  return files;
}

/** All worlds found under content/worlds/, in display order. */
export function listWorlds(): World[] {
  return Object.entries(rawFiles())
    .filter(([path]) => splitWorldPath(path).rest === 'world.json')
    .map(([, data]) => WorldSchema.parse(data))
    .sort((a, b) => a.order - b.order);
}

export function loadContent(worldId: string = DEFAULT_WORLD_ID): Content {
  const files = checkedFiles();
  const dir = `worlds/${worldId}/`;
  if (!files[`${dir}world.json`]) throw new Error(`Không có thế giới "${worldId}"`);
  const events = Object.entries(files)
    .filter(([path]) => path.startsWith(`${dir}events/`))
    .flatMap(([, data]) => EventFileSchema.parse(data));
  return {
    world: WorldSchema.parse(files[`${dir}world.json`]),
    balance: BalanceSchema.parse(files['config/balance.json']),
    events,
    glossary: GlossarySchema.parse(files['glossary.json'] ?? []),
    origins: OriginFileSchema.parse(files[`${dir}character/origins.json`]),
    names: NamesSchema.parse(files[`${dir}character/names.json`]),
    traits: TraitFileSchema.parse(files['traits.json']),
    familyActions: FamilyActionFileSchema.parse(files['family-actions.json'] ?? []),
    npcActs: NpcActFileSchema.parse(files['npc-acts.json'] ?? []),
    effectLabels: files['effect-labels.json'] ? EffectLabelsSchema.parse(files['effect-labels.json']) : undefined,
    lifeTexts: LifeTextsSchema.parse(files['life-texts.json']),
    extremes: StatExtremesFileSchema.parse(files['stat-extremes.json']),
    cultivation: parseCultivationTables(files['realms.json'], files['roots.json'], files['aptitudes.json']),
    difficulties: DifficultyFileSchema.parse(files['difficulties.json']),
    tutorial: TutorialFileSchema.parse(files['tutorial.json']),
    careers: CareersFileSchema.parse(files['careers.json']),
    techniques: TechniqueFileSchema.parse(files['techniques.json']),
    sects: SectFileSchema.parse(files[`${dir}sects.json`] ?? []),
    fateTalents: FateTalentFileSchema.parse(files['fate-talents.json']),
    items: ItemFileSchema.parse(files['items.json'] ?? []),
    martial: MartialFileSchema.parse(files['martial.json']),
    lineages: LineageFileSchema.parse(files['lineages.json']),
    sectLife: files[`${dir}sect-life.json`] ? SectLifeSchema.parse(files[`${dir}sect-life.json`]) : null,
    markets: MarketFileSchema.parse(files[`${dir}markets.json`] ?? []),
    regions: RegionFileSchema.parse(files[`${dir}regions.json`] ?? []),
    jianghuFactions: JianghuFactionFileSchema.parse(files[`${dir}jianghu-factions.json`] ?? []),
    nations: NationFileSchema.parse(files[`${dir}nations.json`] ?? []),
    figures: FigureFileSchema.parse(files[`${dir}figures.json`] ?? []),
    worldEvents: WorldEventFileSchema.parse(files[`${dir}world-events.json`] ?? []),
    worldClans: WorldClanFileSchema.parse(files[`${dir}clans.json`] ?? []),
    races: RaceFileSchema.parse(files[`${dir}races.json`] ?? []),
    knowledge: KnowledgeFileSchema.parse(files[`${dir}knowledge.json`] ?? []),
    thanDao: files[`${dir}than-dao.json`] ? ThanDaoFileSchema.parse(files[`${dir}than-dao.json`]) : undefined,
    trungSinh: files[`${dir}trung-sinh.json`] ? TrungSinhFileSchema.parse(files[`${dir}trung-sinh.json`]) : undefined,
    immortalGates: ImmortalGateFileSchema.parse(files[`${dir}immortal-gates.json`] ?? []),
    combat: CombatTextsSchema.parse(files['combat.json']),
    rankings: RankingTextsSchema.parse(files['rankings.json']),
    romance: RomanceFileSchema.parse(files['romance.json']),
    heartDemon: HeartDemonFileSchema.parse(files['heart-demon.json']),
    recipes: RecipeFileSchema.parse(files['recipes.json']),
    corePatterns: CorePatternFileSchema.parse(files['core-patterns.json'] ?? []),
    nascentSouls: NascentSoulFileSchema.parse(files['nascent-souls.json'] ?? { realm: 'nguyen_anh', forms: [] }),
    disciples: DisciplesFileSchema.parse(files['disciples.json']),
    founding: FoundingFileSchema.parse(files['founding.json']),
    heir: HeirFileSchema.parse(files['heir.json']),
    chosenOnes: ChosenFileSchema.parse(files['chosen-ones.json']),
    clan: ClanFileSchema.parse(files['clan.json']),
    blessings: BlessingFileSchema.parse(files['blessings.json']),
    rebirthTalents: RebirthTalentFileSchema.parse(files['rebirth-talents.json']),
    goldenFingers: GoldenFingerFileSchema.parse(files['golden-fingers.json']),
    traitCombos: TraitComboFileSchema.parse(files['trait-combos.json']),
    codex: CodexFileSchema.parse(files['codex.json']),
    endings: EndingFileSchema.parse(files['endings.json'] ?? []),
    systems: files['systems.json'] ? SystemFileSchema.parse(files['systems.json']).systems : [],
    specialOrigins: Object.entries(files).filter(([p]) => p.startsWith('special-origins/')).sort(([a], [b]) => a.localeCompare(b)).flatMap(([, d]) => SpecialOriginFileSchema.parse(d)),
    thienDaoKy: files['thien-dao-ky.json'] ? ThienDaoKyFileSchema.parse(files['thien-dao-ky.json']) : undefined,
    achievements: AchievementFileSchema.parse(files['achievements.json']),
    challenges: ChallengeFileSchema.parse(files[`${dir}challenges.json`] ?? []),
    npcTraits: NpcTraitsFileSchema.parse(files['npc-traits.json'] ?? { surface: [], nature: [], goals: [] }),
  };
}
