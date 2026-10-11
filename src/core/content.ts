// Loads all JSON under content/ at build time and checks it with the same
// rules as `npm run validate`.
import {
  AptitudesFileSchema, DifficultyFileSchema, TutorialFileSchema, type TutorialFile, CareersFileSchema, type CareersFile, SectFileSchema, TechniqueFileSchema, SectLifeSchema, type Sect, type SectLife, type Technique, RealmsFileSchema, type Difficulty, RootsFileSchema, type AptitudesFile, type RealmsFile, type RootsFile,
  BalanceSchema, EventFileSchema, FamilyActionFileSchema, GlossarySchema, LifeTextsSchema, NamesSchema, OriginFileSchema, StatExtremesFileSchema, TraitFileSchema, WorldSchema,
  type Balance, type FamilyAction, type GameEvent, type Glossary, type LifeTexts, type Names, type Origin, type StatExtremesFile, type Trait, type World,
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
    lifeTexts: LifeTextsSchema.parse(files['life-texts.json']),
    extremes: StatExtremesFileSchema.parse(files['stat-extremes.json']),
    cultivation: parseCultivationTables(files['realms.json'], files['roots.json'], files['aptitudes.json']),
    difficulties: DifficultyFileSchema.parse(files['difficulties.json']),
    tutorial: TutorialFileSchema.parse(files['tutorial.json']),
    careers: CareersFileSchema.parse(files['careers.json']),
    techniques: TechniqueFileSchema.parse(files['techniques.json']),
    sects: SectFileSchema.parse(files[`${dir}sects.json`] ?? []),
    sectLife: files[`${dir}sect-life.json`] ? SectLifeSchema.parse(files[`${dir}sect-life.json`]) : null,
  };
}
