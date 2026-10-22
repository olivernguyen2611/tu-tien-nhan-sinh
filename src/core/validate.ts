// Cross-file checks on top of the schemas. Pure: takes parsed-JSON files keyed
// by their path under content/, returns problems. Used by tools/validate-content.ts
// and by the in-game loader.
import type { ZodTypeAny } from 'zod';
import { isChosenEvent } from '../systems/chosen';
import { KY_KEYS } from '../systems/thienDaoKy';
import { AptitudesFileSchema, BalanceSchema, DifficultyFileSchema, TutorialFileSchema, CareersFileSchema, SectFileSchema, SectLifeSchema, TechniqueFileSchema, FateTalentFileSchema, ItemFileSchema, MartialFileSchema, LineageFileSchema, MarketFileSchema, type Market, RegionFileSchema, type Region, JianghuFactionFileSchema, type JianghuFaction, NationFileSchema, FigureFileSchema, type Figure, WorldClanFileSchema, RaceFileSchema, WorldEventFileSchema, type WorldEvent, KnowledgeFileSchema, type KnowledgeEntry, ImmortalGateFileSchema, type ImmortalGate, CombatTextsSchema, LINEAGES, type Fight, type MartialFile, type Sect, type SectLife, type Technique, FamilyActionFileSchema, NpcActFileSchema, RealmsFileSchema, RootsFileSchema, EventFileSchema, GlossarySchema, LifeTextsSchema, NamesSchema, OriginFileSchema, StatExtremesFileSchema, TraitFileSchema, WorldSchema, type AptitudesFile, type Balance, type GameEvent, type Origin, type RealmsFile, type RootsFile, type TutorialFile, type StatExtremesFile, type Trait, type World, NpcTraitsFileSchema, RankingTextsSchema, RomanceFileSchema, HeartDemonFileSchema, RecipeFileSchema, type RecipeFile, DisciplesFileSchema, CorePatternFileSchema, NascentSoulFileSchema, FoundingFileSchema, type FoundingFile, HeirFileSchema, ClanFileSchema, BlessingFileSchema, ChosenFileSchema, RebirthTalentFileSchema, GoldenFingerFileSchema, type GoldenFingerFile, TraitComboFileSchema, CodexFileSchema, EndingFileSchema, SpecialOriginFileSchema, type SpecialOrigin, ActivityFileSchema, type Activity, DockFileSchema, type DockButton, WorldStateFileSchema, type WorldStateFile, RelationsFileSchema, type RelationsFile, StatLabelsFileSchema, SchoolingFileSchema, ExamsFileSchema, JobsFileSchema, AssetsFileSchema, LeisureFileSchema, HealthFileSchema, CrimesFileSchema, KinFileSchema, CalendarFileSchema, JianghuFileSchema, TierTermsFileSchema, type TierTermsFile, STAT_KEYS, SystemFileSchema, type SystemFile, TrungSinhFileSchema, type TrungSinhFile, ThanDaoFileSchema, type ThanDaoFile, ThienDaoKyFileSchema, type ThienDaoKyFile, type Ending, MORTAL_STATS, APTITUDES, AchievementFileSchema, ChallengeFileSchema, EffectLabelsSchema } from './schemas';

export interface Problem {
  file: string;
  level: 'error' | 'warning';
  message: string;
}

/** Which schema applies to which content file. */
/** "worlds/<id>/rest" → { worldId, rest }; shared files have no world. */
export function splitWorldPath(path: string): { worldId: string | null; rest: string } {
  const m = /^worlds\/([^/]+)\/(.+)$/.exec(path);
  return m ? { worldId: m[1], rest: m[2] } : { worldId: null, rest: path };
}

export function schemaFor(path: string): ZodTypeAny | null {
  const { worldId, rest } = splitWorldPath(path);
  if (worldId === null) {
    // Shared by every world.
    if (rest === 'config/balance.json') return BalanceSchema;
    if (rest === 'glossary.json') return GlossarySchema;
    if (rest === 'traits.json') return TraitFileSchema;
    if (rest === 'family-actions.json') return FamilyActionFileSchema;
    if (rest === 'npc-acts.json') return NpcActFileSchema;
    if (rest === 'effect-labels.json') return EffectLabelsSchema;
    if (rest === 'life-texts.json') return LifeTextsSchema;
    if (rest === 'stat-extremes.json') return StatExtremesFileSchema;
    if (rest === 'realms.json') return RealmsFileSchema;
    if (rest === 'roots.json') return RootsFileSchema;
    if (rest === 'aptitudes.json') return AptitudesFileSchema;
    if (rest === 'difficulties.json') return DifficultyFileSchema;
    if (rest === 'tutorial.json') return TutorialFileSchema;
    if (rest === 'careers.json') return CareersFileSchema;
    if (rest === 'techniques.json') return TechniqueFileSchema;
    if (rest === 'fate-talents.json') return FateTalentFileSchema;
    if (rest === 'items.json') return ItemFileSchema;
    if (rest === 'martial.json') return MartialFileSchema;
    if (rest === 'lineages.json') return LineageFileSchema;
    if (rest === 'combat.json') return CombatTextsSchema;
    if (rest === 'npc-traits.json') return NpcTraitsFileSchema;
    if (rest === 'rankings.json') return RankingTextsSchema;
    if (rest === 'romance.json') return RomanceFileSchema;
    if (rest === 'heart-demon.json') return HeartDemonFileSchema;
    if (rest === 'recipes.json') return RecipeFileSchema;
    if (rest === 'core-patterns.json') return CorePatternFileSchema;
    if (rest === 'nascent-souls.json') return NascentSoulFileSchema;
    if (rest === 'disciples.json') return DisciplesFileSchema;
    if (rest === 'founding.json') return FoundingFileSchema;
    if (rest === 'heir.json') return HeirFileSchema;
    if (rest === 'chosen-ones.json') return ChosenFileSchema;
    if (rest === 'clan.json') return ClanFileSchema;
    if (rest === 'blessings.json') return BlessingFileSchema;
    if (rest === 'rebirth-talents.json') return RebirthTalentFileSchema;
    if (rest === 'golden-fingers.json') return GoldenFingerFileSchema;
    if (rest === 'trait-combos.json') return TraitComboFileSchema;
    if (rest === 'codex.json') return CodexFileSchema;
    if (rest === 'endings.json') return EndingFileSchema;
    if (rest.startsWith('special-origins/')) return SpecialOriginFileSchema;
    if (/^activities\/[^/]+\.json$/.test(rest)) return ActivityFileSchema;
    if (rest === 'systems.json') return SystemFileSchema;
    if (rest === 'dock.json') return DockFileSchema;
    if (rest === 'relations.json') return RelationsFileSchema;
    if (rest === 'stat-labels.json') return StatLabelsFileSchema;
    if (rest === 'schooling.json') return SchoolingFileSchema;
    if (rest === 'exams.json') return ExamsFileSchema;
    if (rest === 'jobs.json') return JobsFileSchema;
    if (rest === 'assets.json') return AssetsFileSchema;
    if (rest === 'leisure.json') return LeisureFileSchema;
    if (rest === 'health.json') return HealthFileSchema;
    if (rest === 'crimes.json') return CrimesFileSchema;
    if (rest === 'kin.json') return KinFileSchema;
    if (rest === 'calendar.json') return CalendarFileSchema;
    if (rest === 'jianghu.json') return JianghuFileSchema;
    if (rest === 'thien-dao-ky.json') return ThienDaoKyFileSchema;
    if (rest === 'achievements.json') return AchievementFileSchema;
    return null;
  }
  // Belongs to one world.
  if (rest === 'world.json') return WorldSchema;
  if (rest === 'character/origins.json') return OriginFileSchema;
  if (rest === 'character/names.json') return NamesSchema;
  if (rest === 'sects.json') return SectFileSchema;
  if (rest === 'sect-life.json') return SectLifeSchema;
  if (rest === 'markets.json') return MarketFileSchema;
  if (rest === 'regions.json') return RegionFileSchema;
  if (rest === 'jianghu-factions.json') return JianghuFactionFileSchema;
  if (rest === 'nations.json') return NationFileSchema;
  if (rest === 'figures.json') return FigureFileSchema;
  if (rest === 'world-events.json') return WorldEventFileSchema;
  if (rest === 'world-state.json') return WorldStateFileSchema;
  if (rest === 'tier-terms.json') return TierTermsFileSchema;
  if (rest === 'clans.json') return WorldClanFileSchema;
  if (rest === 'races.json') return RaceFileSchema;
  if (rest === 'knowledge.json') return KnowledgeFileSchema;
  if (rest === 'trung-sinh.json') return TrungSinhFileSchema;
  if (rest === 'than-dao.json') return ThanDaoFileSchema;
  if (rest === 'immortal-gates.json') return ImmortalGateFileSchema;
  if (rest === 'challenges.json') return ChallengeFileSchema;
  if (/^events\/[^/]+\.json$/.test(rest)) return EventFileSchema;
  if (/^activities\/[^/]+\.json$/.test(rest)) return ActivityFileSchema;
  return null;
}

const wordRe = (w: string) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');

function eventTexts(o: unknown, out: string[] = []): string[] {
  if (Array.isArray(o)) for (const v of o) eventTexts(v, out);
  else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if ((k === 'title' || k === 'text') && typeof v === 'string') out.push(v);
      else eventTexts(v, out);
    }
  }
  return out;
}

/** 9.10: the tier-term warnings of one event (`lowest`: the world's first tầng, which mortal-only events belong to). */
export function tierTermWarnings(event: GameEvent, terms: TierTermsFile, lowest?: string): string[] {
  const out: string[] = [];
  const c = event.conditions;
  const inTier = (t: string, cats: string[]) =>
    (c.tier?.length ? c.tier.every((x) => x === t) : false)
    || (t === lowest && (c.maxTier === t || c.realm?.max === 'pham_nhan'))
    || cats.includes(event.category);
  if (!event.crossTier) {
    const text = eventTexts(event).join('\n');
    for (const tier of terms.tiers) {
      if (!inTier(tier.tier, tier.categories)) continue;
      for (const w of tier.words) if (wordRe(w.word).test(text)) out.push(`sự kiện "${event.id}" (tầng ${tier.tier}) dùng "${w.word}"; nên dùng: ${w.use} (cố ý thì đặt "crossTier": true)`);
    }
  }
  for (const w of terms.selfWords) {
    for (const ch of event.choices) {
      const flags = [...(c.flagsAll ?? []), ...(ch.requires?.flagsAll ?? [])];
      if (wordRe(w.word).test(ch.text) && !w.allowFlags.some((f) => flags.includes(f))) out.push(`sự kiện "${event.id}": lựa chọn "${ch.text}" tự xưng "${w.word}" (${w.use})`);
    }
  }
  return out;
}

/** Flags the engine sets itself (not via events). */
export const ENGINE_FLAGS = ['no_aging_charm', 'no_parents', 'no_father', 'no_mother', 'mua_hang_gia', 'vo_dao_nhap_tien', 'cao_nhan_vo_dao', 'moi_cuoi', 'da_tung_cuoi', 'goa_bua', 'tai_gia', 'boi_uoc', 'di_chuc', 'giau_ruong', 'buon_lau', 'lam_tru_no', 'nghien_bac', 'nghien_ruou', 'da_cai_ruou', 'tien_an', 'vuot_nguc', 'tha_huong', 'tu_tai_gia'];
/** Words naming a parent in event text, and the flag the engine sets once that parent is gone. */
// "cha ta", "mẹ hắn", "yêu thú mẹ"… are someone else's parents (task 3.9), not the player's.
const PARENT_WORDS = [
  { name: 'cha', flag: 'no_father', word: /(^|[^\p{L}])(?<!thú\s)cha(?![\p{L}])(?!\s+(ta|hắn|nó|y|của)(?![\p{L}]))/iu },
  { name: 'mẹ', flag: 'no_mother', word: /(^|[^\p{L}])(?<!thú\s)mẹ(?![\p{L}])(?!\s+(ta|hắn|nó|y|của)(?![\p{L}]))/iu },
];

export function validateContent(files: Record<string, unknown>): Problem[] {
  const problems: Problem[] = [];
  const events: { file: string; event: GameEvent }[] = [];
  let traitIds: Set<string> | null = null;
  const rootTests: { file: string; event: string }[] = [];
  let difficultyIds: string[] | null = null;
  let techniques: Technique[] | null = null;
  let fateIds: string[] | null = null;
  let itemIds: string[] | null = null;
  let recipeFile: { file: string; data: RecipeFile } | null = null;
  let foundingPills: { file: string; pills: string[] } | null = null;
  let martialFile: MartialFile | null = null;
  const regionFiles: { file: string; regions: Region[] }[] = [];
  const factionFiles: { file: string; factions: JianghuFaction[] }[] = [];
  /** 9.R7c: nations, clans and races name the regions they live in. */
  const loreFiles: { file: string; items: { id: string; region?: string; regions?: string[] }[] }[] = [];
  const worldEventFiles: { file: string; events: WorldEvent[] }[] = [];
  const figureFiles: { file: string; figures: Figure[] }[] = [];
  const knowledgeFiles: { file: string; entries: KnowledgeEntry[] }[] = [];
  const originFiles: { file: string; origins: SpecialOrigin[] }[] = [];
  let systemsFile: { file: string; data: SystemFile } | null = null;
  const activityFiles: { file: string; activities: Activity[] }[] = [];
  const trungSinhFiles: { file: string; data: TrungSinhFile }[] = [];
  const worldDefs = new Map<string, World>();
  let dockFile: { file: string; data: DockButton[] } | null = null;
  const worldStates = new Map<string, WorldStateFile>();
  const tierTerms = new Map<string, TierTermsFile>();
  const thanDaoFiles: { file: string; data: ThanDaoFile }[] = [];
  const gateFiles: { file: string; gates: ImmortalGate[] }[] = [];
  /** 9.R5b: things that wait for a Sổ tri thức entry. */
  const knowledgeRefs: { file: string; what: string; id: string }[] = [];
  let glossaryIds: string[] | null = null;
  const marketFiles: { file: string; markets: Market[] }[] = [];
  let chosenIds: string[] | null = null;
  let fingerIds: string[] | null = null;
  const fingerRealms: { file: string; finger: string; realm: string }[] = [];
  const hookRealms: { file: string; realm: string }[] = [];
  const comboTraits: { file: string; combo: string; traits: string[] }[] = [];
  const achievementRefs: { file: string; id: string; realm?: string; finger?: string }[] = [];
  const originIdsByWorld = new Map<string, Set<string>>();
  const challengeRefs: { file: string; id: string; rules: { origin?: string; difficulty?: string; traits?: string[] }; goal: { realmMin?: string } }[] = [];
  let careerIds: string[] | null = null;
  const sectFiles: { file: string; sects: Sect[] }[] = [];
  const missionSects: { file: string; missions: SectLife['missions'] }[] = [];
  const parsedShared: { balance?: Balance; realms?: RealmsFile; roots?: RootsFile; aptitudes?: AptitudesFile } = {};

  for (const [file, raw] of Object.entries(files)) {
    const schema = schemaFor(file);
    if (!schema) {
      problems.push({ file, level: 'warning', message: 'chưa có schema cho file này, bỏ qua' });
      continue;
    }
    problems.push(...checkHookUnits(file, raw));
    // 9.R2b: breakthroughChance.at.<realm> must name a real realm (checked below).
    for (const m of JSON.stringify(raw).matchAll(/"hook":"breakthroughChance\.at\.([a-z0-9_]+)"/g)) hookRealms.push({ file, realm: m[1] });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({ file, level: 'error', message: `${issue.path.join('.') || '(gốc)'}: ${issue.message}` });
      }
      continue;
    }
    if (schema === ChosenFileSchema) {
      const templates = (parsed.data as { templates: { id: string }[] }).templates;
      problems.push(...duplicates(file, 'mô bản khí vận chi tử', templates));
      chosenIds = templates.map((t) => t.id);
    }
    if (schema === GoldenFingerFileSchema) {
      const fingers = (parsed.data as GoldenFingerFile).fingers;
      problems.push(...duplicates(file, 'Kim Thủ Chỉ', fingers));
      for (const f of fingers) {
        problems.push(...duplicates(file, `hành động của ${f.id}`, f.actions));
        for (const a of f.actions) {
          if (a.minLevel > f.levels.length) problems.push({ file, level: 'error', message: `${f.id} / ${a.id}: minLevel vượt số tầng` });
          for (const o of [a.success, a.fail, a.result]) {
            if (o && !Object.entries(o.effects).some(([k, v]) => k.startsWith('stat.') && typeof v === 'number' && v !== 0)) {
              problems.push({ file, level: 'error', message: `${f.id} / ${a.id}: kết quả không đổi chỉ số nào` });
            }
          }
        }
      }
      fingerIds = fingers.map((f) => f.id);
      fingerRealms.push(...fingers.flatMap((f) => f.levels.map((l) => ({ file, finger: f.id, realm: l.realm }))));
    }
    if (schema === ChallengeFileSchema) {
      const list = parsed.data as { id: string; rules: { origin?: string; difficulty?: string; traits?: string[] }; goal: { realmMin?: string } }[];
      problems.push(...duplicates(file, 'thử thách tuần', list));
      challengeRefs.push(...list.map((c) => ({ file, ...c })));
    }
    if (schema === AchievementFileSchema) {
      const a = parsed.data as { achievements: { id: string; unlockFinger?: string; when: { realmMin?: string } }[]; badges: { id: string; when: { realmMin?: string } }[] };
      problems.push(...duplicates(file, 'thành tựu', a.achievements), ...duplicates(file, 'huy hiệu', a.badges));
      achievementRefs.push(...[...a.achievements, ...a.badges].map((x) => ({ file, id: x.id, realm: x.when.realmMin, finger: 'unlockFinger' in x ? (x.unlockFinger as string | undefined) : undefined })));
    }
    if (schema === TraitComboFileSchema) {
      const combos = (parsed.data as { combos: { id: string; traits: string[] }[] }).combos;
      problems.push(...duplicates(file, 'tổ hợp ẩn', combos));
      comboTraits.push(...combos.map((c) => ({ file, combo: c.id, traits: c.traits })));
    }
    if (schema === RebirthTalentFileSchema) {
      for (const t of (parsed.data as { talents: { id: string; requiresKnowledge?: string }[] }).talents) if (t.requiresKnowledge) knowledgeRefs.push({ file, what: `thiên phú "${t.id}"`, id: t.requiresKnowledge });
    }
    if (schema === RebirthTalentFileSchema) problems.push(...duplicates(file, 'thiên phú luân hồi', (parsed.data as { talents: { id: string }[] }).talents));
    if (schema === StatExtremesFileSchema) {
      const ids = new Set<string>();
      const zones = new Set<string>();
      for (const d of (parsed.data as StatExtremesFile).states) {
        if (ids.has(d.id)) problems.push({ file, level: 'error', message: `trùng id trạng thái "${d.id}"` });
        const zone = `${d.stat}/${d.zone}`;
        if (zones.has(zone)) problems.push({ file, level: 'error', message: `"${d.id}": đã có trạng thái khác cho ${d.stat} vùng ${d.zone}` });
        ids.add(d.id);
        zones.add(zone);
      }
    }
    if (schema === WorldSchema && (parsed.data as World).id !== splitWorldPath(file).worldId) {
      problems.push({ file, level: 'error', message: `id thế giới "${(parsed.data as World).id}" phải trùng tên thư mục` });
    }
    if (schema === WorldSchema) worldDefs.set(splitWorldPath(file).worldId ?? '', parsed.data as World);
    if (schema === WorldSchema && (parsed.data as World).rootTestEvent) rootTests.push({ file, event: (parsed.data as World).rootTestEvent! });
    if (schema === OriginFileSchema) {
      for (const o of parsed.data as Origin[]) if (o.requiresKnowledge) knowledgeRefs.push({ file, what: `xuất thân "${o.id}"`, id: o.requiresKnowledge });
      const seenOrigin = new Set<string>();
      for (const o of parsed.data as Origin[]) {
        if (seenOrigin.has(o.id)) problems.push({ file, level: 'error', message: `trùng id xuất thân "${o.id}"` });
        seenOrigin.add(o.id);
      }
      originIdsByWorld.set(splitWorldPath(file).worldId ?? '', seenOrigin);
    }
    if (schema === TraitFileSchema) {
      const seenTrait = new Set<string>();
      traitIds = seenTrait;
      for (const t of parsed.data as Trait[]) {
        if (seenTrait.has(t.id)) problems.push({ file, level: 'error', message: `trùng id khí vận "${t.id}"` });
        seenTrait.add(t.id);
        // PLAN.md mục H: romance-related event weights only from age 18.
        for (const e of t.effects) {
          if (e.hook.startsWith('eventWeight.romance') && (e.activeFrom?.age ?? 0) < 18) {
            problems.push({ file, level: 'error', message: `khí vận "${t.id}": móc "${e.hook}" phải có activeFrom.age ≥ 18` });
          }
        }
      }
    }
    if (schema === FamilyActionFileSchema) {
      const seenAction = new Set<string>();
      for (const a of parsed.data as { id: string }[]) {
        if (seenAction.has(a.id)) problems.push({ file, level: 'error', message: `trùng id tương tác "${a.id}"` });
        seenAction.add(a.id);
      }
    }
    if (schema === EventFileSchema) {
      for (const event of parsed.data as GameEvent[]) events.push({ file, event });
    }
    if (schema === BalanceSchema) parsedShared.balance = parsed.data as Balance;
    if (schema === RealmsFileSchema) parsedShared.realms = parsed.data as RealmsFile;
    if (schema === RelationsFileSchema) {
      // 9.6: kinds sit in a group; a role text belongs to one kind; childhood kinds exist.
      const r = parsed.data as RelationsFile;
      const groups = r.groups.map((g) => g.id);
      const kinds = r.kinds.map((k) => k.id);
      problems.push(...duplicates(file, 'nhóm quan hệ', r.groups), ...duplicates(file, 'loại quan hệ', r.kinds), ...duplicates(file, 'nghề người quen', r.occupations));
      for (const k of r.kinds) if (!groups.includes(k.group)) problems.push({ file, level: 'error', message: `loại "${k.id}" thuộc nhóm lạ "${k.group}"` });
      const roles = r.kinds.flatMap((k) => k.roles);
      for (const role of new Set(roles)) if (roles.filter((x) => x === role).length > 1) problems.push({ file, level: 'error', message: `vai "${role}" nằm trong hai loại` });
      for (const id of [r.defaultKind, ...r.childhood.map((c) => c.kind)]) if (!kinds.includes(id)) problems.push({ file, level: 'error', message: `loại quan hệ lạ "${id}"` });
    }
    if (schema === DockFileSchema) dockFile = { file, data: parsed.data as DockButton[] };
    if (schema === TierTermsFileSchema) tierTerms.set(splitWorldPath(file).worldId ?? '', parsed.data as TierTermsFile);
    if (schema === WorldStateFileSchema) {
      // 9.5: phases lead to phases, targets and prices name variables.
      const ws = parsed.data as WorldStateFile;
      worldStates.set(splitWorldPath(file).worldId ?? '', ws);
      const varIds = ws.vars.map((v) => v.id);
      const phaseIds = ws.phases.map((x) => x.id);
      problems.push(...duplicates(file, 'biến thời cuộc', ws.vars), ...duplicates(file, 'pha thời thế', ws.phases));
      for (const ph of ws.phases) {
        for (const n of Object.keys(ph.next)) if (!phaseIds.includes(n)) problems.push({ file, level: 'error', message: `pha "${ph.id}" dẫn tới pha lạ "${n}"` });
        for (const v of Object.keys(ph.targets)) if (!varIds.includes(v)) problems.push({ file, level: 'error', message: `pha "${ph.id}" đặt đích cho biến lạ "${v}"` });
        if (ph.years[0] > ph.years[1]) problems.push({ file, level: 'error', message: `pha "${ph.id}": khoảng năm ngược` });
      }
      for (const p of ws.prices) if (!varIds.includes(p.var)) problems.push({ file, level: 'error', message: `giá theo biến lạ "${p.var}"` });
    }
    if (schema === RootsFileSchema) parsedShared.roots = parsed.data as RootsFile;
    if (schema === AptitudesFileSchema) parsedShared.aptitudes = parsed.data as AptitudesFile;
    // 9.R8–9.R10: endings have unique ids, end with a catch-all, and read real stat.<x> keys.
    if (schema === EndingFileSchema) {
      const list = parsed.data as Ending[];
      problems.push(...duplicates(file, 'kết cục', list));
      if (list.length > 0 && Object.keys(list[list.length - 1].check).length > 0) problems.push({ file, level: 'error', message: 'kết cục cuối cùng phải có check rỗng (kết cục dự phòng)' });
      const statKeys = new Set([...MORTAL_STATS, ...APTITUDES].map((k) => `stat.${k}`));
      for (const e of list) for (const k of Object.keys(e.check.statsMin ?? {})) {
        if (!statKeys.has(k)) problems.push({ file, level: 'error', message: `kết cục "${e.id}" đọc chỉ số lạ "${k}"` });
      }
    }
    // 9.R10: Thiên Đạo Ký lines use only the keys the system fills.
    if (schema === ThienDaoKyFileSchema) {
      for (const sec of (parsed.data as ThienDaoKyFile).sections) for (const l of sec.lines) {
        for (const t of typeof l.text === 'string' ? [l.text] : l.text) for (const m of t.matchAll(/\{(\w+)\}/g)) {
          if (!KY_KEYS.includes(m[1])) problems.push({ file, level: 'error', message: `mục "${sec.id}" dùng chữ lạ {${m[1]}}` });
        }
      }
    }
    if (schema === TutorialFileSchema) {
      const t = parsed.data as TutorialFile;
      problems.push(...duplicates(file, 'mục tiêu', t.goals), ...duplicates(file, 'mẹo', t.tips));
      if (Object.keys(t.goals[t.goals.length - 1].when).length > 0) {
        problems.push({ file, level: 'warning', message: 'mục tiêu cuối nên có "when": {} để luôn có một mục tiêu' });
      }
    }
    if (schema === FateTalentFileSchema) {
      const list = parsed.data as { id: string }[];
      problems.push(...duplicates(file, 'thiên phú', list));
      fateIds = list.map((x) => x.id);
    }
    if (schema === SectLifeSchema) {
      problems.push(...duplicates(file, 'nhiệm vụ', (parsed.data as SectLife).missions));
      missionSects.push({ file, missions: (parsed.data as SectLife).missions });
    }
    if (schema === WorldSchema && (parsed.data as World).sectRecruitEvent) rootTests.push({ file, event: (parsed.data as World).sectRecruitEvent! });
    if (schema === TechniqueFileSchema) techniques = parsed.data as Technique[];
    if (schema === SectFileSchema) sectFiles.push({ file, sects: parsed.data as Sect[] });
    if (schema === LineageFileSchema) problems.push(...duplicates(file, 'đạo thống', parsed.data as { id: string }[]));
    if (schema === MartialFileSchema) martialFile = parsed.data as MartialFile;
    if (schema === RegionFileSchema) regionFiles.push({ file, regions: parsed.data as Region[] });
    if (schema === JianghuFactionFileSchema) factionFiles.push({ file, factions: parsed.data as JianghuFaction[] });
    if (schema === WorldEventFileSchema) { worldEventFiles.push({ file, events: parsed.data as WorldEvent[] }); loreFiles.push({ file, items: parsed.data as WorldEvent[] }); }
    if (schema === FigureFileSchema) figureFiles.push({ file, figures: parsed.data as Figure[] });
    if (schema === NationFileSchema || schema === FigureFileSchema || schema === WorldClanFileSchema || schema === RaceFileSchema) loreFiles.push({ file, items: parsed.data as { id: string; region?: string; regions?: string[] }[] });
    if (schema === KnowledgeFileSchema) knowledgeFiles.push({ file, entries: parsed.data as KnowledgeEntry[] });
    if (schema === ThanDaoFileSchema) thanDaoFiles.push({ file, data: parsed.data as ThanDaoFile });
    if (schema === TrungSinhFileSchema) trungSinhFiles.push({ file, data: parsed.data as TrungSinhFile });
    if (schema === SystemFileSchema) systemsFile = { file, data: parsed.data as SystemFile };
    if (schema === ActivityFileSchema) activityFiles.push({ file, activities: parsed.data as Activity[] });
    if (schema === SpecialOriginFileSchema) originFiles.push({ file, origins: parsed.data as SpecialOrigin[] });
    if (schema === ImmortalGateFileSchema) gateFiles.push({ file, gates: parsed.data as ImmortalGate[] });
    if (schema === GlossarySchema) glossaryIds = (parsed.data as { id: string }[]).map((x) => x.id);
    if (schema === MarketFileSchema) {
      problems.push(...duplicates(file, 'phường thị', parsed.data as Market[]));
      marketFiles.push({ file, markets: parsed.data as Market[] });
    }
    if (schema === ItemFileSchema) itemIds = (parsed.data as { id: string }[]).map((x) => x.id);
    if (schema === RecipeFileSchema) recipeFile = { file, data: parsed.data as RecipeFile };
    if (schema === ClanFileSchema) {
      const c = parsed.data as { rules: { id: string }[]; properties: { id: string }[] };
      problems.push(...duplicates(file, 'gia quy', c.rules), ...duplicates(file, 'sản nghiệp', c.properties));
    }
    if (schema === FoundingFileSchema) {
      const f = parsed.data as FoundingFile;
      problems.push(...duplicates(file, 'tông quy', f.rules), ...duplicates(file, 'công trình', f.buildings), ...duplicates(file, 'quyết định', f.decisions));
      foundingPills = { file, pills: f.buildings.flatMap((b) => b.pills) };
    }
    if (schema === CareersFileSchema) careerIds = (parsed.data as { careers: { id: string }[] }).careers.map((c) => c.id);
    if (schema === CareersFileSchema) problems.push(...duplicates(file, 'đường đời', (parsed.data as { careers: { id: string }[] }).careers));
    if (schema === DifficultyFileSchema) difficultyIds = (parsed.data as { id: string }[]).map((d) => d.id);
  }

  problems.push(...checkCultivationTables(parsedShared));
  // Playtest 2: market specialities, scrolls, lots and regions must exist.
  const techIds = new Set((techniques ?? []).map((t) => t.id));
  for (const { file, markets } of marketFiles) {
    const regionIds = new Set(regionFiles.filter((r) => r.file.split('/')[1] === file.split('/')[1]).flatMap((r) => r.regions.map((x) => x.id)));
    for (const m of markets) {
      const err = (message: string) => problems.push({ file, level: 'error', message: `phường thị "${m.id}": ${message}` });
      const lots = m.auction?.lots ?? [];
      for (const it of [...m.items, ...lots.flatMap((l) => (l.item ? [l.item] : []))]) if (itemIds && !itemIds.includes(it)) err(`vật phẩm không tồn tại "${it}"`);
      for (const t of [...m.techniques.map((x) => x.id), ...lots.flatMap((l) => (l.technique ? [l.technique] : []))]) if (techniques && !techIds.has(t)) err(`công pháp không tồn tại "${t}"`);
      for (const r of m.regions ?? []) if (!regionIds.has(r)) err(`vùng không tồn tại "${r}"`);
    }
  }
  // Task 5.2: Luyện Đan Phòng sends real items.
  for (const it of foundingPills?.pills ?? []) {
    if (itemIds && !itemIds.includes(it)) problems.push({ file: foundingPills!.file, level: 'error', message: `công trình gửi vật phẩm không tồn tại "${it}"` });
  }
  // Task 4.7: recipes use and make real items.
  if (recipeFile) {
    const { file, data } = recipeFile;
    problems.push(...duplicates(file, 'công thức', data.recipes));
    for (const r of data.recipes) {
      for (const it of [r.product, ...Object.keys(r.materials)]) {
        if (itemIds && !itemIds.includes(it)) problems.push({ file, level: 'error', message: `công thức "${r.id}": vật phẩm không tồn tại "${it}"` });
      }
    }
    for (const it of Object.values(parsedShared.balance?.crafting.failProduct ?? {})) {
      if (itemIds && !itemIds.includes(it)) problems.push({ file: 'config/balance.json', level: 'error', message: `crafting.failProduct: vật phẩm không tồn tại "${it}"` });
    }
  }
  if (difficultyIds && parsedShared.balance) {
    const b = parsedShared.balance;
    problems.push(...sameKeys('config/balance.json', 'difficulty', difficultyIds, Object.keys(b.difficulty)));
    if (!difficultyIds.includes(b.defaultDifficulty)) {
      problems.push({ file: 'config/balance.json', level: 'error', message: `defaultDifficulty "${b.defaultDifficulty}" không có trong difficulties.json` });
    }
  }

  problems.push(...checkTechniquesAndSects(techniques, sectFiles, parsedShared));
  const knownSects = new Set(sectFiles.flatMap((f) => f.sects.map((x) => x.id)));
  for (const { file, missions } of missionSects) {
    for (const m of missions) for (const sid of m.sects ?? []) {
      if (!knownSects.has(sid)) problems.push({ file, level: 'error', message: `nhiệm vụ "${m.id}": tông môn không tồn tại "${sid}"` });
    }
  }
  if (martialFile && parsedShared.balance) {
    const m = parsedShared.balance.martial;
    const n = martialFile.stages.length;
    if (m.combatPower.length !== n || m.lifespan.length !== n) {
      problems.push({ file: 'config/balance.json', level: 'error', message: `martial.combatPower và martial.lifespan cần đúng ${n} giá trị (số cảnh giới võ đạo)` });
    }
    if (m.steps.length > n) problems.push({ file: 'config/balance.json', level: 'error', message: 'martial.steps nhiều hơn số cảnh giới võ đạo' });
    // Backlog 7: the quest chains lead out of a stage that has a next one, and every step has its level and aid item.
    const levels = m.quest.levels;
    for (const q of martialFile.quests) {
      const file = 'martial.json';
      if (q.fromStage >= n - 1) problems.push({ file, level: 'error', message: `chuỗi "${q.id}": cảnh giới ${q.fromStage} không có cảnh giới kế tiếp` });
      for (const st of q.steps) {
        if (st.game && !levels[`${st.game}_${st.level}`]) problems.push({ file, level: 'error', message: `chuỗi "${q.id}", bước "${st.id}": thiếu balance.martial.quest.levels.${st.game}_${st.level}` });
        if (st.aid && itemIds && !itemIds.includes(st.aid.item)) problems.push({ file, level: 'error', message: `chuỗi "${q.id}", bước "${st.id}": vật phẩm hỗ trợ không tồn tại "${st.aid.item}"` });
      }
    }
  }
  if (fateIds && traitIds) {
    for (const id of fateIds) if (traitIds.has(id)) problems.push({ file: 'fate-talents.json', level: 'error', message: `id thiên phú "${id}" trùng id khí vận` });
  }

  // The world's root-test event must exist among that world's events.
  for (const { file, event } of rootTests) {
    const world = splitWorldPath(file).worldId;
    if (!events.some((e) => e.event.id === event && splitWorldPath(e.file).worldId === world)) {
      problems.push({ file, level: 'error', message: `sự kiện "${event}" (world.json) không có trong sự kiện của thế giới này` });
    }
  }
  const realmIds = parsedShared.realms ? new Set(parsedShared.realms.realms.map((r) => r.id)) : null;

  // 9.W: giang hồ forces sit in a real region of their world, name real forces as allies / rivals, and never share an id with a sect.
  for (const { file, factions } of factionFiles) {
    const world = file.split('/')[1];
    const regionIds = new Set(regionFiles.filter((r) => r.file.split('/')[1] === world).flatMap((r) => r.regions.map((x) => x.id)));
    const sectIds = new Set(sectFiles.filter((f) => f.file.split('/')[1] === world).flatMap((f) => f.sects.map((x) => x.id)));
    const ids = new Set(factions.map((f) => f.id));
    problems.push(...duplicates(file, 'thế lực giang hồ', factions));
    for (const f of factions) {
      if (!regionIds.has(f.region)) problems.push({ file, level: 'error', message: `thế lực "${f.id}" ở vùng lạ "${f.region}"` });
      if (sectIds.has(f.id)) problems.push({ file, level: 'error', message: `thế lực "${f.id}" trùng id với một tông môn tu tiên` });
      for (const o of [...f.allies, ...f.rivals]) if (!ids.has(o) || o === f.id) problems.push({ file, level: 'error', message: `thế lực "${f.id}" nhắc tới thế lực lạ "${o}"` });
    }
  }
  // 9.R7e: events that wait for a sự kiện thiên hạ name one that exists.
  const worldEventIds = new Set(worldEventFiles.flatMap((f) => f.events.map((e) => e.id)));
  for (const { file, event } of events) {
    // 9.1: tầng and lối sống named by an event exist in its world.
    const wd = worldDefs.get(splitWorldPath(file).worldId ?? '');
    for (const c of [event.conditions, ...event.choices.map((ch) => ch.requires ?? {})]) {
      for (const t of [...(c.tier ?? []), ...(c.minTier ? [c.minTier] : []), ...(c.maxTier ? [c.maxTier] : [])]) if (wd && !wd.tiers.some((x) => x.id === t)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" nhắc tầng lạ "${t}"` });
      for (const l of c.lifestyle ?? []) if (wd && !wd.lifestyles.some((x) => x.id === l)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" nhắc lối sống lạ "${l}"` });
      for (const w of c.worldEvent?.id ?? []) if (!worldEventIds.has(w)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" chờ sự kiện thiên hạ lạ "${w}"` });
      const ws = worldStates.get(splitWorldPath(file).worldId ?? '');
      for (const ph of c.worldPhase ?? []) if (!ws?.phases.some((x) => x.id === ph)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" chờ pha thời thế lạ "${ph}"` });
      for (const v of c.worldVars ?? []) if (!ws?.vars.some((x) => x.id === v.id)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" đọc biến thời cuộc lạ "${v.id}"` });
    }
  }
  // 9.10: events of a tầng do not use the words of the tầng above (warnings; tier-terms.json of the world).
  for (const { file, event } of events) {
    const wid = splitWorldPath(file).worldId ?? '';
    const terms = tierTerms.get(wid);
    if (!terms) continue;
    const lowest = worldDefs.get(wid)?.tiers[0]?.id;
    for (const message of tierTermWarnings(event, terms, lowest)) problems.push({ file, level: 'warning', message });
  }
  // 9.R7f: famous people name real realms and sects of their world.
  for (const { file, figures } of figureFiles) {
    const world = file.split('/')[1];
    const sectIds = new Set(sectFiles.filter((f) => f.file.split('/')[1] === world).flatMap((f) => f.sects.map((x) => x.id)));
    for (const f of figures) {
      if (f.sect && !sectIds.has(f.sect)) problems.push({ file, level: 'error', message: `nhân vật "${f.id}" thuộc tông lạ "${f.sect}"` });
      if (parsedShared.realms && !parsedShared.realms.realms.some((r) => r.id === f.realm)) problems.push({ file, level: 'error', message: `nhân vật "${f.id}" ở cảnh giới lạ "${f.realm}"` });
    }
  }
  // 9.R7d: a sect sits in a real region of its world; allies and rival are sects of the same world.
  for (const { file, sects } of sectFiles) {
    const world = file.split('/')[1];
    const regionIds = new Set(regionFiles.filter((r) => r.file.split('/')[1] === world).flatMap((r) => r.regions.map((x) => x.id)));
    const ids = new Set(sects.map((x) => x.id));
    for (const x of sects) {
      if (x.region && regionIds.size > 0 && !regionIds.has(x.region)) problems.push({ file, level: 'error', message: `tông môn "${x.id}" ở vùng lạ "${x.region}"` });
      if (!x.roaming && !x.region) problems.push({ file, level: 'error', message: `tông môn "${x.id}" không đi chiêu mộ khắp nơi (roaming) nên phải có region` });
      for (const o of [...x.allies, ...(x.identity?.rival ? [x.identity.rival.sect] : [])]) {
        if (!ids.has(o) || o === x.id) problems.push({ file, level: 'error', message: `tông môn "${x.id}" nhắc tới tông lạ "${o}"` });
      }
    }
  }
  for (const { file, items } of loreFiles) {
    const world = file.split('/')[1];
    const regionIds = new Set(regionFiles.filter((r) => r.file.split('/')[1] === world).flatMap((r) => r.regions.map((x) => x.id)));
    problems.push(...duplicates(file, 'mục', items));
    for (const x of items) {
      for (const r of [...(x.region ? [x.region] : []), ...(x.regions ?? [])]) {
        if (!regionIds.has(r)) problems.push({ file, level: 'error', message: `"${x.id}" ở vùng lạ "${r}"` });
      }
    }
  }
  // Task 4.8: đại vực name real realms; their hooks act while the player stays, so no one-off stat.<x>.
  const regionIdsByWorld = new Map<string, Set<string>>();
  for (const { file, regions } of regionFiles) {
    problems.push(...duplicates(file, 'vùng', regions));
    regionIdsByWorld.set(splitWorldPath(file).worldId ?? '', new Set(regions.map((r) => r.id)));
    for (const r of regions) {
      for (const realm of [r.minRealm, r.guardian.realm]) {
        if (realm && realmIds && !realmIds.has(realm)) problems.push({ file, level: 'error', message: `vùng "${r.id}" nhắc tới cảnh giới không tồn tại "${realm}"` });
      }
      for (const e of r.effects.filter((x) => x.hook.startsWith('stat.'))) {
        problems.push({ file, level: 'error', message: `vùng "${r.id}": móc "${e.hook}" chỉ cộng một lần, không dùng được cho vùng` });
      }
    }
  }
  // Task 5.5: khí vận chi tử templates named by events must exist.
  if (chosenIds) {
    for (const { file, event } of events) {
      const outcomes = event.choices.flatMap((c) => [c.result, c.success, c.fail]).filter((o) => o !== undefined);
      const named = [
        ...(event.conditions.chosen?.template ?? []),
        ...outcomes.flatMap((o) => [o.effects.chosenOne, o.fight?.win.effects.chosenOne, o.fight?.lose.effects.chosenOne]),
      ].filter((x): x is string => !!x);
      for (const t of named) if (!chosenIds.includes(t)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" nhắc tới mô bản khí vận chi tử không tồn tại "${t}"` });
    }
  }
  // Task 5b.3: a tổ hợp ẩn needs real, different Tiên Thiên Khí Vận.
  for (const { file, combo, traits } of comboTraits) {
    if (new Set(traits).size !== traits.length) problems.push({ file, level: 'error', message: `tổ hợp "${combo}" có khí vận lặp lại` });
    for (const t of traits) if (traitIds && !traitIds.has(t)) problems.push({ file, level: 'error', message: `tổ hợp "${combo}" nhắc tới khí vận không tồn tại "${t}"` });
  }
  // Task 5b.5: thành tựu and huy hiệu name real realms and Kim Thủ Chỉ.
  for (const { file, id, realm, finger } of achievementRefs) {
    if (realm && realmIds && !realmIds.has(realm)) problems.push({ file, level: 'error', message: `"${id}" nhắc tới cảnh giới không tồn tại "${realm}"` });
    if (finger && fingerIds && !fingerIds.includes(finger)) problems.push({ file, level: 'error', message: `"${id}" mở khóa Kim Thủ Chỉ không tồn tại "${finger}"` });
  }
  // Task 5b.6: a challenge names real origins (of its world), difficulties, traits and realms.
  for (const c of challengeRefs) {
    const where = `thử thách "${c.id}"`;
    const origins = originIdsByWorld.get(splitWorldPath(c.file).worldId ?? '');
    if (c.rules.origin && origins && !origins.has(c.rules.origin)) problems.push({ file: c.file, level: 'error', message: `${where} nhắc tới xuất thân không tồn tại "${c.rules.origin}"` });
    if (c.rules.difficulty && parsedShared.balance && !parsedShared.balance.difficulty[c.rules.difficulty]) problems.push({ file: c.file, level: 'error', message: `${where} nhắc tới độ khó không tồn tại "${c.rules.difficulty}"` });
    for (const t of c.rules.traits ?? []) if (traitIds && !traitIds.has(t)) problems.push({ file: c.file, level: 'error', message: `${where} nhắc tới khí vận không tồn tại "${t}"` });
    if (c.goal.realmMin && realmIds && !realmIds.has(c.goal.realmMin)) problems.push({ file: c.file, level: 'error', message: `${where} nhắc tới cảnh giới không tồn tại "${c.goal.realmMin}"` });
  }
  for (const { file, realm } of hookRealms) {
    if (realmIds && !realmIds.has(realm)) problems.push({ file, level: 'error', message: `móc "breakthroughChance.at.${realm}" nhắc tới cảnh giới không tồn tại` });
  }
  // Task 5b.2: Kim Thủ Chỉ named by events must exist; their levels need real realms.
  if (fingerIds) {
    for (const { file, finger, realm } of fingerRealms) {
      if (realmIds && !realmIds.has(realm)) problems.push({ file, level: 'error', message: `Kim Thủ Chỉ "${finger}" nhắc tới cảnh giới không tồn tại "${realm}"` });
    }
    for (const { file, event } of events) {
      const outcomes = event.choices.flatMap((c) => [c.result, c.success, c.fail]).filter((o) => o !== undefined);
      const named = [
        ...[event.conditions, ...event.choices.map((c) => c.requires ?? {})].flatMap((c) => c.goldenFinger?.id ?? []),
        ...outcomes.flatMap((o) => [o.effects.goldenFinger, o.fight?.win.effects.goldenFinger, o.fight?.lose.effects.goldenFinger]),
      ].filter((x): x is string => !!x && x !== 'random');
      for (const f of named) if (!fingerIds.includes(f)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" nhắc tới Kim Thủ Chỉ không tồn tại "${f}"` });
    }
  }
  for (const { file, event } of events) {
    const known = regionIdsByWorld.get(splitWorldPath(file).worldId ?? '') ?? new Set<string>();
    const named = [event.conditions, ...event.choices.map((c) => c.requires ?? {})].flatMap((c) => c.region ?? []);
    for (const r of named) {
      if (!known.has(r)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" nhắc tới vùng không tồn tại "${r}"` });
    }
  }

  // Duplicate event ids across all event files.
  const seen = new Map<string, string>();
  for (const { file, event } of events) {
    const prev = seen.get(event.id);
    if (prev) problems.push({ file, level: 'error', message: `trùng id sự kiện "${event.id}" (đã có trong ${prev})` });
    else seen.set(event.id, file);
  }

  // Collect flags that some event sets, and follow-up targets.
  const flagsSet = new Set<string>(ENGINE_FLAGS);
  // 10.8: a thương tật sets its flag.
  const healthRaw = files['health.json'] ? HealthFileSchema.safeParse(files['health.json']) : null;
  if (healthRaw?.success) for (const i of healthRaw.data.injuries) flagsSet.add(i.flag);
  for (const { event } of events) {
    for (const choice of event.choices) {
      for (const outcome of [choice.result, choice.success, choice.fail]) {
        outcome?.effects.setFlags.forEach((f) => flagsSet.add(f));
        // Task 3.3 fights set flags when they end.
        for (const end of [outcome?.fight?.win, outcome?.fight?.lose, outcome?.fight?.fled]) end?.effects.setFlags.forEach((f) => flagsSet.add(f));
      }
    }
  }

  // 9.R5a: Sổ tri thức sources and unlocks name real things of the same world.
  for (const { file, entries } of knowledgeFiles) {
    const world = splitWorldPath(file).worldId ?? '';
    const regions = regionIdsByWorld.get(world) ?? new Set<string>();
    const sectIds = new Set(sectFiles.filter((f) => splitWorldPath(f.file).worldId === world).flatMap((f) => f.sects.map((x) => x.id)));
    const origins = originIdsByWorld.get(world) ?? new Set<string>();
    problems.push(...duplicates(file, 'tri thức', entries));
    for (const e of entries) {
      const err = (message: string) => problems.push({ file, level: 'error', message: `tri thức "${e.id}": ${message}` });
      for (const s of e.sources) {
        const known: Record<string, (x: string) => boolean> = {
          event: (x) => seen.has(x), flag: (x) => flagsSet.has(x), item: (x) => !itemIds || itemIds.includes(x),
          realm: (x) => !realmIds || realmIds.has(x), sect: (x) => sectIds.has(x), region: (x) => regions.has(x),
        };
        if (s.kind === 'martial') { if (s.stage === undefined) err('nguồn "martial" cần "stage"'); continue; }
        if (!s.id) { if (s.kind !== 'sect') err(`nguồn "${s.kind}" cần "id"`); continue; }
        if (!known[s.kind](s.id)) err(`nguồn ${s.kind} lạ "${s.id}"`);
      }
      for (const u of e.unlocks) {
        if (u.kind === 'term' && glossaryIds && !glossaryIds.includes(u.id)) err(`mở thuật ngữ lạ "${u.id}"`);
        if (u.kind === 'region' && !regions.has(u.id)) err(`mở vùng lạ "${u.id}"`);
        if (u.kind === 'origin' && !origins.has(u.id)) err(`mở xuất thân lạ "${u.id}"`);
      }
    }
  }

  // 9.R5b: what waits for knowledge names a real entry (any world: shared files have no world).
  const allKnowledge = new Set(knowledgeFiles.flatMap((k) => k.entries.map((e) => e.id)));
  for (const { file, event } of events) {
    for (const k of [...(event.conditions.knowledge?.all ?? []), ...(event.conditions.knowledge?.none ?? [])]) knowledgeRefs.push({ file, what: `sự kiện "${event.id}"`, id: k });
  }
  // 9.S1: tình tiết đặc biệt have unique ids and name real khí vận, events, Sổ tri thức entries and other tình tiết.
  const originIds = originFiles.flatMap((f) => f.origins.map((o) => o.id));
  const allEventIds = new Set(events.map((e) => e.event.id));
  for (const { file, origins } of originFiles) {
    for (const o of origins) {
      if (originIds.filter((x) => x === o.id).length > 1) problems.push({ file, level: 'error', message: `trùng id tình tiết "${o.id}"` });
      for (const t of Object.keys(o.traitWeight)) if (traitIds && !traitIds.has(t)) problems.push({ file, level: 'error', message: `tình tiết "${o.id}" nhắc tới khí vận không tồn tại "${t}"` });
      for (const e of o.startEvents) if (!allEventIds.has(e.event)) problems.push({ file, level: 'error', message: `tình tiết "${o.id}" mở sự kiện không tồn tại "${e.event}"` });
      for (const x of o.exclusiveWith) if (!originIds.includes(x)) problems.push({ file, level: 'error', message: `tình tiết "${o.id}" loại trừ tình tiết lạ "${x}"` });
      for (const k of o.unlock.requiresKnowledge) knowledgeRefs.push({ file, what: `tình tiết "${o.id}"`, id: k });
      if (o.system && !systemsFile?.data.systems.some((x) => x.id === o.system)) problems.push({ file, level: 'error', message: `tình tiết "${o.id}" gắn hệ thống lạ "${o.system}"` });
    }
  }
  // 9.2: hoạt động: ids unique over every file, each outcome changes a stat, pools have lines, events and items exist.
  const activityIds = activityFiles.flatMap((f) => f.activities.map((a) => a.id));
  for (const { file, activities } of activityFiles) {
    for (const a of activities) {
      const err = (message: string) => problems.push({ file, level: 'error', message: `hoạt động "${a.id}": ${message}` });
      if (activityIds.filter((x) => x === a.id).length > 1) err('trùng id');
      const lists: [string, typeof a.outcomes][] = [['outcomes', a.outcomes], ['failOutcomes', a.failOutcomes ?? []], ['free', a.free?.outcomes ?? []]];
      for (const [name, list] of lists) list.forEach((o, i) => {
        const where = `${name} ${i + 1}`;
        const keys = [...Object.entries(o.effects).filter(([, v]) => typeof v === 'number' && v !== 0).map(([k]) => k), ...Object.keys(o.roll)];
        if (!keys.some((k) => STAT_KEYS.includes(k))) err(`${where} không đổi chỉ số nào (mỗi kết quả phải ảnh hưởng ít nhất một trong 8 chỉ số)`);
        for (const [k, [lo, hi]] of Object.entries(o.roll)) if (lo > hi) err(`${where}: khoảng "${k}" ngược (${lo} > ${hi})`);
        const pool = typeof o.text === 'string' ? [o.text] : Array.isArray(o.text) ? o.text : [...o.text.lines, ...o.text.parts.flat()];
        if (pool.length === 0) err(`${where} không có câu nào`);
        if (o.startEvent && !allEventIds.has(o.startEvent)) err(`${where} mở sự kiện không tồn tại "${o.startEvent}"`);
        if (o.effects.followUp && !allEventIds.has(o.effects.followUp.event)) err(`${where} hẹn sự kiện không tồn tại "${o.effects.followUp.event}"`);
        for (const it of o.effects.addItems ?? []) if (itemIds && !itemIds.includes(it)) err(`${where} cho vật phẩm lạ "${it}"`);
      });
      if (a.free && a.cost.length === 0) err('"free" chỉ dùng khi có "cost"');
    }
  }
  // 9.7: dock buttons are unique; every tier's dock names a button there (or "nam", the +1 năm button).
  if (dockFile) {
    const { file, data } = dockFile;
    problems.push(...duplicates(file, 'nút dock', data));
    for (const [wid, wd] of worldDefs) {
      const lifestyleIds = wd.lifestyles.map((l) => l.id);
      for (const t of wd.tiers) for (const id of t.dock) {
        if (id !== 'nam' && !data.some((b) => b.id === id)) problems.push({ file: `worlds/${wid}/world.json`, level: 'error', message: `tầng "${t.id}": nút dock lạ "${id}" (không có trong dock.json)` });
      }
      for (const b of data) for (const l of b.early?.lifestyles ?? []) {
        if (!lifestyleIds.includes(l)) problems.push({ file, level: 'warning', message: `nút "${b.id}" chờ lối sống "${l}" mà thế giới "${wid}" không có` });
      }
    }
  }
  // 9.S2: Hệ thống: levels rise by points and act all life (no one-time stat hooks); items it gives exist.
  if (systemsFile) {
    const { file, data } = systemsFile;
    problems.push(...duplicates(file, 'hệ thống', data.systems));
    for (const sys of data.systems) {
      const err = (message: string) => problems.push({ file, level: 'error', message: `hệ thống "${sys.id}": ${message}` });
      sys.levels.forEach((l, i) => {
        if (i === 0 ? l.points !== 0 : l.points <= sys.levels[i - 1].points) err(`cấp "${l.name}" phải có điểm tăng dần, cấp đầu là 0`);
        for (const e of l.effects) if (e.hook.startsWith('stat.') || e.hook === 'lifespanPct' || e.hook === 'birthSilver') err(`cấp "${l.name}" dùng móc một lần "${e.hook}"`);
      });
      problems.push(...duplicates(file, `nhiệm vụ của "${sys.id}"`, sys.tasks), ...duplicates(file, `cửa hàng của "${sys.id}"`, sys.shop));
      const outs = [sys.quit, ...(sys.checkin?.rewards ?? []), ...sys.tasks.flatMap((t) => [t.reward, t.fail]), ...sys.shop.map((x) => x.result), ...(sys.trap ? [sys.trap.betray] : [])];
      for (const it of outs.flatMap((x) => [...(x.effects.addItems ?? []), ...(x.effects.removeItems ?? [])])) if (itemIds && !itemIds.includes(it)) err(`vật phẩm không tồn tại "${it}"`);
      const maxLevel = sys.levels.length - 1;
      for (const x of [...sys.tasks, ...sys.shop, ...(sys.checkin?.rewards ?? [])]) if (x.minLevel > maxLevel) err(`cần cấp ${x.minLevel} nhưng chỉ có ${maxLevel}`);
    }
  }
  for (const r of knowledgeRefs) if (!allKnowledge.has(r.id)) problems.push({ file: r.file, level: 'error', message: `${r.what} cần tri thức lạ "${r.id}"` });

  // 9.S3: a memory plays an event of its world; ages and realms make sense.
  for (const { file, data } of trungSinhFiles) {
    const world = splitWorldPath(file).worldId;
    const realmIds = parsedShared.realms?.realms.map((r) => r.id) ?? [];
    problems.push(...duplicates(file, 'ký ức trùng sinh', data.memories));
    if (realmIds.length && !realmIds.includes(data.expUntil)) problems.push({ file, level: 'error', message: `expUntil là cảnh giới lạ "${data.expUntil}"` });
    for (const m of data.memories) {
      if (!events.some((e) => e.event.id === m.event && splitWorldPath(e.file).worldId === world)) problems.push({ file, level: 'error', message: `ký ức "${m.id}" dẫn tới sự kiện lạ "${m.event}"` });
      if (m.age.min > m.age.max) problems.push({ file, level: 'error', message: `ký ức "${m.id}" có tuổi min > max` });
      if (realmIds.length && !realmIds.includes(m.recallRealm)) problems.push({ file, level: 'error', message: `ký ức "${m.id}" cần cảnh giới lạ "${m.recallRealm}"` });
    }
  }

  // 9.S5: thành thần paths play events of their world; milestones below the threshold; merit names a real path.
  const meritPaths = new Set(thanDaoFiles.flatMap((f) => f.data.paths.map((p) => p.id)));
  for (const { file, data } of thanDaoFiles) {
    const world = splitWorldPath(file).worldId;
    problems.push(...duplicates(file, 'đường thành thần', data.paths));
    for (const p of data.paths) {
      for (const ev of [p.ascendEvent, p.missEvent]) if (!events.some((e) => e.event.id === ev && splitWorldPath(e.file).worldId === world)) problems.push({ file, level: 'error', message: `đường "${p.id}" dẫn tới sự kiện lạ "${ev}"` });
      for (const m of p.milestones) if (m.at >= p.threshold) problems.push({ file, level: 'error', message: `đường "${p.id}": mốc ${m.at} phải nhỏ hơn ngưỡng ${p.threshold}` });
    }
  }
  for (const { file, event } of events) {
    for (const c of event.choices) for (const o of [c.result, c.success, c.fail]) for (const k of Object.keys(o?.effects.merit ?? {}))
      if (!meritPaths.has(k)) problems.push({ file, level: 'error', message: `sự kiện "${event.id}" cộng điểm cho đường lạ "${k}"` });
  }

  // 9.R4b: a gate brings an event of its world, names a real Sổ tri thức entry, and has its chance in balance.json.
  for (const { file, gates } of gateFiles) {
    const world = splitWorldPath(file).worldId;
    const entries = new Set(knowledgeFiles.filter((k) => splitWorldPath(k.file).worldId === world).flatMap((k) => k.entries.map((e) => e.id)));
    problems.push(...duplicates(file, 'cổng tiên duyên', gates));
    for (const g of gates) {
      if (!events.some((e) => e.event.id === g.event && splitWorldPath(e.file).worldId === world)) problems.push({ file, level: 'error', message: `cổng "${g.id}" dẫn tới sự kiện lạ "${g.event}"` });
      if (g.requiresKnowledge && !entries.has(g.requiresKnowledge)) problems.push({ file, level: 'error', message: `cổng "${g.id}" cần tri thức lạ "${g.requiresKnowledge}"` });
      if (parsedShared.balance && !(g.id in (parsedShared.balance.immortalGates?.chance ?? {}))) problems.push({ file, level: 'error', message: `cổng "${g.id}" thiếu immortalGates.chance trong balance.json` });
    }
  }

  for (const { file, event } of events) {
    const where = `sự kiện "${event.id}"`;

    // PLAN.md mục H: mature content only for adults.
    if (event.tags.includes('mature') && (event.conditions.age?.min ?? 0) < 18) {
      problems.push({ file, level: 'error', message: `${where} gắn tag "mature" nhưng conditions.age.min chưa ≥ 18` });
    }

    if (event.themes.some((t) => t.startsWith('romance')) && (event.conditions.age?.min ?? 0) < 18) {
      problems.push({ file, level: 'error', message: `${where} có chủ đề tình duyên nhưng conditions.age.min chưa ≥ 18` });
    }

    // Traits named in conditions must exist.
    if (traitIds) {
      const named = [event.conditions, ...event.choices.map((c) => c.requires ?? {})]
        .flatMap((c) => [...(c.traitsAny ?? []), ...(c.traitsAll ?? []), ...(c.traitsNone ?? [])]);
      for (const t of named) {
        if (!traitIds.has(t)) problems.push({ file, level: 'error', message: `${where} nhắc tới khí vận không tồn tại "${t}"` });
      }
    }

    if (realmIds) {
      for (const r of [event.conditions.realm?.min, event.conditions.realm?.max]) {
        if (r && !realmIds.has(r)) problems.push({ file, level: 'error', message: `${where} nhắc tới cảnh giới không tồn tại "${r}"` });
      }
    }

    for (const flag of event.conditions.flagsAll) {
      if (!flagsSet.has(flag)) {
        problems.push({ file, level: 'warning', message: `${where} cần flag "${flag}" nhưng không sự kiện nào đặt flag này` });
      }
    }

    // Text that names a parent needs that parent alive: the event (or the choice) must
    // exclude no_father / no_mother, or a dead father "falls ill" years later.
    const needsParent = (text: string, choiceFlags: string[]) => {
      const excluded = [...event.conditions.flagsNone, ...choiceFlags];
      return PARENT_WORDS.filter((p) => p.word.test(text) && !excluded.includes(p.flag));
    };
    for (const p of needsParent(`${event.title} ${event.text}`, [])) {
      problems.push({ file, level: 'error', message: `${where} nhắc tới ${p.name} nhưng conditions.flagsNone thiếu "${p.flag}"` });
    }

    const talentsNamed = [event.conditions, ...event.choices.map((c) => c.requires ?? {})].flatMap((c) => c.talentsAny ?? []);
    for (const t of talentsNamed) {
      if (fateIds && !fateIds.includes(t)) problems.push({ file, level: 'error', message: `${where} nhắc tới thiên phú không tồn tại "${t}"` });
    }
    const careerNamed = [event.conditions, ...event.choices.map((c) => c.requires ?? {})].map((c) => c.career?.id).filter(Boolean) as string[];
    for (const c of careerNamed) {
      if (careerIds && !careerIds.includes(c)) problems.push({ file, level: 'error', message: `${where} nhắc tới đường đời không tồn tại "${c}"` });
    }

    // Task 3.6 / PLAN H: romance and mature events never reach anyone under 18. conditions.romance
    // enforces the age of the player and of the lover; otherwise the event needs age.min ≥ 18.
    const adultOnly = !!event.conditions.romance || (event.conditions.age?.min ?? 0) >= 18;
    const romantic = event.themes.some((t) => t.startsWith('romance')) || event.tags.includes('mature')
      || event.choices.some((c) => !c.requires?.romance && [c.result, c.success, c.fail].some((o) => o?.effects.romance));
    if (romantic && !adultOnly) {
      problems.push({ file, level: 'error', message: `${where}: sự kiện tình duyên/mature cần conditions.romance hoặc age.min ≥ 18` });
    }
    const loverText = /\{lover(Self)?\}/.test(`${event.title} ${event.text} ${event.choices.map((c) => [c.text, c.result?.text, c.success?.text, c.fail?.text].join(' ')).join(' ')}`);
    if (loverText && !event.conditions.romance?.target && !event.conditions.romance?.lover && !event.conditions.romance?.partner) {
      problems.push({ file, level: 'error', message: `${where}: nhắc tới {lover} nhưng conditions.romance không yêu cầu có người trong lòng/đạo lữ` });
    }

    // Task 5.3: effects on the founded sect need an event (or that choice) only open to a founder.
    const founderOnly = event.conditions.ownSect?.has === true;
    if (event.choices.some((c) => !founderOnly && c.requires?.ownSect?.has !== true && [c.result, c.success, c.fail].some((o) => o?.effects.ownSect))) {
      problems.push({ file, level: 'error', message: `${where}: có hiệu ứng ownSect nhưng thiếu conditions.ownSect.has = true (ở sự kiện hoặc requires của lựa chọn)` });
    }
    if (/\{deceased\}/.test(`${event.text} ${event.choices.map((c) => [c.text, c.result?.text, c.success?.text, c.fail?.text].join(' ')).join(' ')}`) && !event.conditions.family?.deadAny) {
      problems.push({ file, level: 'error', message: `${where}: nhắc tới {deceased} nhưng thiếu conditions.family.deadAny` });
    }

    // Task 5b.7: {pastSect}, {pastFounder} and the pastSect effect need a past sect known to this life.
    const pastNeeded = /\{past(Sect|Founder)\}/.test(`${event.title} ${event.text} ${event.choices.map((c) => [c.text, c.result?.text, c.success?.text, c.fail?.text, c.result?.fight?.win.text, c.result?.fight?.lose.text].join(' ')).join(' ')}`)
      || event.choices.some((c) => [c.result, c.success, c.fail, c.result?.fight?.win, c.result?.fight?.lose].some((o) => o?.effects.pastSect));
    if (pastNeeded && event.conditions.pastSect?.has !== true && !event.conditions.pastSect?.status) {
      problems.push({ file, level: 'error', message: `${where}: nhắc tới tông môn đời trước nhưng thiếu conditions.pastSect (has = true hoặc status)` });
    }
    // 9.R9: {pastName}, {pastSelf} need a cố nhân: the reunion trigger or conditions.npc.pastLife.
    const allText = `${event.title} ${event.text} ${event.choices.map((c) => [c.text, c.result?.text, c.success?.text, c.fail?.text, c.result?.fight?.win.text, c.result?.fight?.lose.text].join(' ')).join(' ')}`;
    if (/\{past(Name|Self)\}/.test(allText) && event.npcTrigger !== 'reunion' && !event.conditions.npc?.pastLife) {
      problems.push({ file, level: 'error', message: `${where}: nhắc tới {pastName}/{pastSelf} nhưng không phải npcTrigger "reunion" và thiếu conditions.npc.pastLife` });
    }
    // 9.R9: a reunion event names which kinds of cố nhân it is for.
    if (event.npcTrigger === 'reunion' && !event.conditions.npc?.pastLife) {
      problems.push({ file, level: 'error', message: `${where}: npcTrigger "reunion" cần conditions.npc.pastLife (loại cố nhân)` });
    }

    event.choices.forEach((choice, i) => {
      const texts = [choice.text, choice.result?.text, choice.success?.text, choice.fail?.text].filter(Boolean).join(' ');
      for (const p of needsParent(texts, choice.requires?.flagsNone ?? [])) {
        problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1} nhắc tới ${p.name} nhưng sự kiện hoặc lựa chọn chưa loại "${p.flag}"` });
      }
      for (const outcome of [choice.result, choice.success, choice.fail]) {
        // Owner rule: every outcome changes at least one of the 8 stats (money, contribution, karma and flags do not count).
        // A root test or a granted root changes the character more than any stat, so it counts too.
        const fx = outcome?.effects;
        const changesStat = (e: typeof fx) => !!e && Object.entries(e).some(([k, v]) => k.startsWith('stat.') && typeof v === 'number' && v !== 0);
        // A fight always costs or gives something; its win and lose outcomes are checked instead.
        if (fx && !fx.testRoot && !fx.grantRoot && !fx.awakenBody && !outcome?.fight && !changesStat(fx)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: kết quả không đổi chỉ số nào (mỗi lựa chọn phải ảnh hưởng ít nhất một trong 8 chỉ số)` });
        }
        if (outcome?.fight) problems.push(...checkFight(file, `${where}, lựa chọn ${i + 1}`, outcome.fight, parsedShared, itemIds, changesStat));
        for (const it of [...(fx?.addItems ?? []), ...(fx?.removeItems ?? [])]) {
          if (itemIds && !itemIds.includes(it)) problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: vật phẩm không tồn tại "${it}"` });
        }
        if (fx?.gainTechnique && techniques && !techniques.some((x) => x.id === fx.gainTechnique)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: công pháp không tồn tại "${fx.gainTechnique}"` });
        }
        if (fx?.joinCareer && careerIds && !careerIds.includes(fx.joinCareer)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: đường đời không tồn tại "${fx.joinCareer}"` });
        }
        const tech = outcome?.effects.learnTechnique;
        if (tech && techniques && !techniques.some((x) => x.id === tech)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: công pháp không tồn tại "${tech}"` });
        }
        // Task 3.4: {npc}, npc effects and a foe fromNpc need an NPC: picked by npcTrigger, required by conditions, or met here.
        const hasNpc = !!event.npcTrigger || !!event.conditions.npc || !!event.conditions.romance?.target || !!choice.requires?.npc || !!fx?.meetNpc
          // Task 5.5: the khí vận chi tử of the story.
          || isChosenEvent(event);
        const npcText = /\{npc(Role|Kin)?\}/.test(`${event.text} ${choice.text} ${outcome?.text ?? ''} ${outcome?.fight?.win.text ?? ''} ${outcome?.fight?.lose.text ?? ''}`);
        const usesNpc = npcText || !!fx?.npc || !!outcome?.fight?.foe.fromNpc || !!outcome?.fight?.win.effects.npc || !!outcome?.fight?.lose.effects.npc;
        if (usesNpc && !hasNpc) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: nhắc tới NPC ({npc}, npc, fromNpc) nhưng sự kiện không có NPC (cần npcTrigger, conditions.npc hoặc meetNpc)` });
        }
        // Task 4.6: a chained step must exist; after a fight it belongs in win/lose, since the fight comes first.
        for (const step of [fx?.chain, outcome?.fight?.win.effects.chain, outcome?.fight?.lose.effects.chain, outcome?.fight?.fled?.effects.chain]) {
          if (step && !seen.has(step)) problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: chain tới sự kiện không tồn tại "${step}"` });
        }
        if (fx?.chain && outcome?.fight) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: có trận đánh thì đặt chain trong win/lose, không đặt ở kết quả` });
        }
        const target = outcome?.effects.followUp?.event;
        if (target && !seen.has(target)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: followUp tới sự kiện không tồn tại "${target}"` });
        }
        const range = outcome?.effects.followUp?.afterYears;
        if (range && range[0] > range[1]) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: afterYears [${range[0]}, ${range[1]}] bị ngược` });
        }
      }
    });
  }

  // 10.1: schools and trades named anywhere (effects, conditions) exist in schooling.json.
  const schooling = files['schooling.json'] ? SchoolingFileSchema.safeParse(files['schooling.json']) : null;
  if (schooling?.success) {
    const schoolIds = schooling.data.schools.map((x) => x.id);
    const tradeIds = schooling.data.trades.map((x) => x.id);
    const walk = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walk(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if (typeof r.enrollSchool === 'string' && !schoolIds.includes(r.enrollSchool)) problems.push({ file, level: 'error', message: `trường lạ "${r.enrollSchool}"` });
      if (typeof r.startTrade === 'string' && !tradeIds.includes(r.startTrade)) problems.push({ file, level: 'error', message: `nghề lạ "${r.startTrade}"` });
      const sc = r.school as { at?: unknown } | undefined;
      if (sc && typeof sc === 'object' && typeof sc.at === 'string' && !schoolIds.includes(sc.at)) problems.push({ file, level: 'error', message: `điều kiện trường lạ "${sc.at}"` });
      const tr = r.trade as { id?: unknown } | undefined;
      if (tr && typeof tr === 'object' && typeof tr.id === 'string' && !tradeIds.includes(tr.id)) problems.push({ file, level: 'error', message: `điều kiện nghề lạ "${tr.id}"` });
      for (const v of Object.values(r)) walk(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\//.test(file)) walk(file, raw);
  }

  // 10.3: jobs name real groups and careers; takeJob and job conditions name real jobs and groups.
  const jobsFile = files['jobs.json'] ? JobsFileSchema.safeParse(files['jobs.json']) : null;
  if (jobsFile?.success) {
    const groupIds = jobsFile.data.groups.map((g) => g.id);
    const jobIds = jobsFile.data.jobs.map((j) => j.id);
    const careersRaw = files['careers.json'] ? CareersFileSchema.safeParse(files['careers.json']) : null;
    const careerIds = careersRaw?.success ? careersRaw.data.careers.map((c) => c.id) : undefined;
    problems.push(...duplicates('jobs.json', 'nghề', jobsFile.data.jobs));
    for (const j of jobsFile.data.jobs) {
      if (!groupIds.includes(j.group)) problems.push({ file: 'jobs.json', level: 'error', message: `nghề "${j.id}": nhóm lạ "${j.group}"` });
      if (j.peak && careerIds && !careerIds.includes(j.peak.career)) problems.push({ file: 'jobs.json', level: 'error', message: `nghề "${j.id}": đường đời lạ "${j.peak.career}"` });
      if (j.pay.length > j.rungs.length) problems.push({ file: 'jobs.json', level: 'error', message: `nghề "${j.id}": nhiều mức lương hơn số bậc` });
    }
    const walkJob = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walkJob(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if (typeof r.takeJob === 'string' && !jobIds.includes(r.takeJob)) problems.push({ file, level: 'error', message: `nghề lạ "${r.takeJob}"` });
      const jb = r.job as { id?: unknown; group?: unknown } | undefined;
      if (jb && typeof jb === 'object' && typeof jb.id === 'string' && !jobIds.includes(jb.id)) problems.push({ file, level: 'error', message: `điều kiện nghề lạ "${jb.id}"` });
      if (jb && typeof jb === 'object' && typeof jb.group === 'string' && !groupIds.includes(jb.group)) problems.push({ file, level: 'error', message: `điều kiện nhóm nghề lạ "${jb.group}"` });
      for (const v of Object.values(r)) walkJob(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\//.test(file)) walkJob(file, raw);
  }

  // 10.4: effects and conditions name real assets, crops, ways of trading and loans.
  const assetsFile = files['assets.json'] ? AssetsFileSchema.safeParse(files['assets.json']) : null;
  if (assetsFile?.success) {
    const a = assetsFile.data;
    problems.push(...duplicates('assets.json', 'tài sản', a.assets));
    const known: Record<string, string[]> = {
      buyAsset: a.assets.map((x) => x.id), sellAsset: [...a.assets.map((x) => x.id), ...new Set(a.assets.map((x) => x.kind))], loseAsset: a.assets.map((x) => x.id),
      sowCrop: a.crops.map((x) => x.id), shopStrategy: a.strategies.map((x) => x.id), borrow: a.loans.map((x) => x.id),
    };
    const walkAsset = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walkAsset(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      for (const [k, list] of Object.entries(known)) if (typeof r[k] === 'string' && !list.includes(r[k] as string)) problems.push({ file, level: 'error', message: `${k}: id lạ "${r[k]}"` });
      const as = r.asset as { id?: unknown } | undefined;
      if (as && typeof as === 'object' && typeof as.id === 'string' && !known.buyAsset.includes(as.id)) problems.push({ file, level: 'error', message: `điều kiện tài sản lạ "${as.id}"` });
      for (const v of Object.values(r)) walkAsset(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\//.test(file)) walkAsset(file, raw);
  }

  // 10.7: festivals, arts and pets named in conditions and effects exist.
  const leisureFile = files['leisure.json'] ? LeisureFileSchema.safeParse(files['leisure.json']) : null;
  if (leisureFile?.success) {
    const l = leisureFile.data;
    problems.push(...duplicates('leisure.json', 'lễ hội', l.festivals), ...duplicates('leisure.json', 'thú nuôi', l.pets));
    const fest = l.festivals.map((x) => x.id), arts = l.arts.map((x) => x.id), pets = l.pets.map((x) => x.id);
    const walkLeisure = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walkLeisure(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      const bad = (what: string, v: unknown, list: string[]) => { if (typeof v === 'string' && !list.includes(v)) problems.push({ file, level: 'error', message: `${what} lạ "${v}"` }); };
      if (Array.isArray(r.festival)) for (const f of r.festival) bad('lễ hội', f, fest);
      bad('thú nuôi', r.adoptPet, pets);
      if (r.pet && typeof r.pet === 'object') bad('thú nuôi', (r.pet as { id?: unknown }).id, pets);
      if (r.art && typeof r.art === 'object') {
        const a = r.art as Record<string, unknown>;
        if (typeof a.id === 'string') bad('tài nghệ', a.id, arts);
        else for (const k of Object.keys(a)) bad('tài nghệ', k, arts);
      }
      for (const v of Object.values(r)) walkLeisure(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\//.test(file)) walkLeisure(file, raw);
  }

  // 10.8: diseases and injuries named in conditions and effects exist; injury flags count as set by the engine.
  const crimesFile = files['crimes.json'] ? CrimesFileSchema.safeParse(files['crimes.json']) : null;
  const crimeIds = crimesFile?.success ? crimesFile.data.crimes.map((c) => c.id) : null;
  if (crimesFile?.success) problems.push(...duplicates('crimes.json', 'tội danh', crimesFile.data.crimes));
  const kinFile = files['kin.json'] ? KinFileSchema.safeParse(files['kin.json']) : null;
  const kinRules = kinFile?.success ? kinFile.data.rules.map((r) => r.id) : null;
  if (kinFile?.success) problems.push(...duplicates('kin.json', 'gia quy', kinFile.data.rules));
  const healthFile = files['health.json'] ? HealthFileSchema.safeParse(files['health.json']) : null;
  if (healthFile?.success) {
    const h = healthFile.data;
    problems.push(...duplicates('health.json', 'bệnh', h.diseases), ...duplicates('health.json', 'thương tật', h.injuries));
    const dis = [...h.diseases.map((x) => x.id), 'random'], inj = h.injuries.map((x) => x.id);
    const walkHealth = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walkHealth(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      const bad = (what: string, v: unknown, list: string[]) => { if (typeof v === 'string' && !list.includes(v)) problems.push({ file, level: 'error', message: `${what} lạ "${v}"` }); };
      bad('bệnh', r.catchDisease, dis);
      bad('thương tật', r.injure, inj);
      if (crimeIds) bad('tội danh', r.crime, crimeIds);
      if (kinRules) bad('gia quy', r.kinRule, kinRules);
      if (r.ailment && typeof r.ailment === 'object') bad('bệnh', (r.ailment as { id?: unknown }).id, dis);
      if (r.injury && typeof r.injury === 'object') bad('thương tật', (r.injury as { id?: unknown }).id, inj);
      for (const v of Object.values(r)) walkHealth(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\//.test(file)) walkHealth(file, raw);
  }

  // 10.2: exams.json and balance.exams name the same levels, approaches and placings; conditions and careers name real levels.
  const exams = files['exams.json'] ? ExamsFileSchema.safeParse(files['exams.json']) : null;
  const examCfg = parsedShared.balance?.exams;
  if (exams?.success && examCfg) {
    const levelIds = exams.data.levels.map((l) => l.id);
    const same = (what: string, a: string[], b: string[]) => {
      for (const x of a) if (!b.includes(x)) problems.push({ file: 'exams.json', level: 'error', message: `${what} "${x}" có trong exams.json mà thiếu trong balance.exams` });
      for (const x of b) if (!a.includes(x)) problems.push({ file: 'config/balance.json', level: 'error', message: `${what} "${x}" có trong balance.exams mà thiếu trong exams.json` });
    };
    same('khoa thi', levelIds, Object.keys(examCfg.levels));
    same('cách làm bài', exams.data.approaches.map((a) => a.id), Object.keys(examCfg.approaches));
    same('thứ hạng', exams.data.placings.map((p) => p.id), examCfg.placings.map((p) => p.id));
    for (const inc of exams.data.incidents) for (const l of inc.levels) if (!levelIds.includes(l)) problems.push({ file: 'exams.json', level: 'error', message: `sự cố "${inc.id}" nhắc khoa thi lạ "${l}"` });
    const walkExam = (file: string, o: unknown) => {
      if (Array.isArray(o)) { for (const v of o) walkExam(file, v); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      const ex = r.exam as { passed?: unknown; notPassed?: unknown } | undefined;
      for (const l of [ex?.passed, ex?.notPassed]) if (ex && typeof ex === 'object' && typeof l === 'string' && !levelIds.includes(l)) problems.push({ file, level: 'error', message: `điều kiện khoa thi lạ "${l}"` });
      const rq = r.requires as { examRank?: unknown } | undefined;
      if (rq && typeof rq === 'object' && typeof rq.examRank === 'string' && !levelIds.includes(rq.examRank)) problems.push({ file, level: 'error', message: `đường đời đòi khoa thi lạ "${rq.examRank}"` });
      for (const v of Object.values(r)) walkExam(file, v);
    };
    for (const [file, raw] of Object.entries(files)) if (/events\/|activities\/|careers\.json/.test(file)) walkExam(file, raw);
  }
  return problems;
}

/** Duplicate ids in a list, as messages. */
/** Hooks read as a share (0.2 = +20%): a value past ±FRACTION_MAX is almost surely written in percent. */
const FRACTION_HOOK = /^(cultivationSpeed|speed|combatPower(\.vsHigherRealm)?|escapeChance|injuryReduce|lifesteal|heartDemonResist|charmResist|divineSense|bottleneckResist|priceDiscount|incomePct|lootPct|lifespanPct|artifactPct|tribulationPower|tribulationDefense|(element|path)\.[a-z_]+\.power|craft\.[a-z_]+\.success|lineage\.[a-z_]+\.cultivationSpeed)$/;
const FRACTION_MAX = 2;
/** Hooks read in percentage points (5 = +5%): a value under 1 is almost surely written as a share. */
const POINTS_HOOK = /^(breakthroughChance(\.major|\.minor|\.at\.[a-z0-9_]+)?|tribulationPct|illnessChancePct)$/;

/** Every { hook, add } anywhere in a file, checked against the unit its hook is read in. */
function checkHookUnits(file: string, raw: unknown): Problem[] {
  const out: Problem[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o.hook === 'string' && typeof o.add === 'number') {
      if (FRACTION_HOOK.test(o.hook) && Math.abs(o.add) > FRACTION_MAX) {
        out.push({ file, level: 'error', message: `móc "${o.hook}" tính theo tỉ lệ (0.2 = 20%), không phải ${o.add}` });
      }
      if (POINTS_HOOK.test(o.hook) && o.add !== 0 && Math.abs(o.add) < 1) {
        out.push({ file, level: 'error', message: `móc "${o.hook}" tính theo điểm phần trăm (5 = 5%), không phải ${o.add}` });
      }
    }
    Object.values(o).forEach(walk);
  };
  walk(raw);
  return out;
}

function duplicates(file: string, what: string, list: { id: string }[]): Problem[] {
  const seen = new Set<string>();
  const out: Problem[] = [];
  for (const { id } of list) {
    if (seen.has(id)) out.push({ file, level: 'error', message: `trùng id ${what} "${id}"` });
    seen.add(id);
  }
  return out;
}

/** Content ids and their numbers in balance.json must name the same things. */
function sameKeys(file: string, what: string, contentIds: string[], balanceKeys: string[]): Problem[] {
  const out: Problem[] = [];
  for (const k of contentIds) if (!balanceKeys.includes(k)) out.push({ file, level: 'error', message: `${what}: thiếu số liệu cho "${k}"` });
  for (const k of balanceKeys) if (!contentIds.includes(k)) out.push({ file, level: 'error', message: `${what}: "${k}" không có trong nội dung` });
  return out;
}

/** Cross-checks for realms.json, roots.json, aptitudes.json against balance.json (task 2.1). */
function checkCultivationTables(t: { balance?: Balance; realms?: RealmsFile; roots?: RootsFile; aptitudes?: AptitudesFile }): Problem[] {
  const out: Problem[] = [];
  const bal = 'config/balance.json';
  const realmIds = t.realms?.realms.map((r) => r.id) ?? [];
  if (t.realms) {
    out.push(...duplicates('realms.json', 'cảnh giới', t.realms.realms), ...duplicates('realms.json', 'phẩm đạo cơ', t.realms.foundations));
    if (t.balance) {
      const mb = t.balance.majorBreakthrough;
      const grades = t.realms.foundations.map((g) => g.id);
      out.push(
        ...sameKeys(bal, 'realms', realmIds, Object.keys(t.balance.realms)),
        ...sameKeys(bal, 'majorBreakthrough.foundationSpeed', grades, Object.keys(mb.foundationSpeed)),
      );
      for (const g of Object.keys(mb.foundationThresholds)) {
        if (!grades.includes(g)) out.push({ file: bal, level: 'error', message: `majorBreakthrough.foundationThresholds: "${g}" không có trong realms.json` });
      }
      for (const r of mb.openRealms) {
        if (!realmIds.includes(r)) out.push({ file: bal, level: 'error', message: `majorBreakthrough.openRealms: cảnh giới không tồn tại "${r}"` });
      }
      if (!realmIds.includes(t.balance.clan.minRealm)) out.push({ file: bal, level: 'error', message: `clan.minRealm: cảnh giới không tồn tại "${t.balance.clan.minRealm}"` });
      for (const r of [t.balance.founding.minRealm, ...Object.keys(t.balance.founding.startMembers), ...Object.keys(t.balance.founding.maxMembers)]) {
        if (!realmIds.includes(r)) out.push({ file: bal, level: 'error', message: `founding: cảnh giới không tồn tại "${r}"` });
      }
      for (const r of Object.keys(t.balance.disciples.maxByRealm)) {
        if (!realmIds.includes(r)) out.push({ file: bal, level: 'error', message: `disciples.maxByRealm: cảnh giới không tồn tại "${r}"` });
      }
      for (const r of Object.keys(t.balance.tribulation.realms)) {
        if (!realmIds.includes(r)) out.push({ file: bal, level: 'error', message: `tribulation.realms: cảnh giới không tồn tại "${r}"` });
      }
      if (!realmIds.includes(t.balance.ghost.realm)) out.push({ file: bal, level: 'error', message: `ghost.realm: cảnh giới không tồn tại "${t.balance.ghost.realm}"` });
      // Task 4.2: kết đan leads into a real realm; its fate tiers are foundation grades.
      const cf = t.balance.coreForming;
      if (!realmIds.includes(cf.realm)) out.push({ file: bal, level: 'error', message: `coreForming.realm: cảnh giới không tồn tại "${cf.realm}"` });
      for (const g of [...cf.fateTier, ...Object.keys(cf.foundationBonus)]) {
        if (!grades.includes(g)) out.push({ file: bal, level: 'error', message: `coreForming: phẩm đạo cơ không tồn tại "${g}"` });
      }
    }
  }
  if (t.roots) {
    const f = 'roots.json';
    out.push(...duplicates(f, 'linh căn', t.roots.grades), ...duplicates(f, 'hệ', t.roots.elements), ...duplicates(f, 'thể chất', t.roots.bodies));
    const elements = new Set(t.roots.elements.map((e) => e.id));
    for (const [a, b] of Object.entries(t.balance?.coreForming.generates ?? {})) {
      if (!elements.has(a) || !elements.has(b)) out.push({ file: bal, level: 'error', message: `coreForming.generates: hệ không tồn tại "${a}" → "${b}"` });
    }
    for (const e of t.roots.elements) {
      for (const b of e.beats) {
        if (!elements.has(b)) out.push({ file: f, level: 'error', message: `hệ "${e.id}" khắc hệ không tồn tại "${b}"` });
        if (b === e.id) out.push({ file: f, level: 'error', message: `hệ "${e.id}" không thể tự khắc mình` });
      }
      // Playtest 2026-10-12: a variant = exactly two distinct basic elements.
      const basic = (id: string) => t.roots!.elements.some((x) => x.id === id && !x.variant);
      const parts = e.components ?? [];
      if (e.variant && (parts.length !== 2 || parts[0] === parts[1] || !parts.every(basic))) {
        out.push({ file: f, level: 'error', message: `hệ biến dị "${e.id}" cần components là 2 hệ ngũ hành khác nhau` });
      }
      if (!e.variant && parts.length > 0) out.push({ file: f, level: 'error', message: `hệ "${e.id}" không phải biến dị, không có components` });
    }
    for (const body of t.roots.bodies) {
      for (const h of body.effects) {
        if (h.activeUntil && t.realms && !realmIds.includes(h.activeUntil.realm)) {
          out.push({ file: f, level: 'error', message: `thể chất "${body.id}": activeUntil tới cảnh giới không tồn tại "${h.activeUntil.realm}"` });
        }
      }
    }
    if (t.balance) {
      const grades = t.roots.grades.map((g) => g.id);
      const r = t.balance.roots;
      out.push(
        ...sameKeys(bal, 'roots.gradeWeights', grades, Object.keys(r.gradeWeights)),
        ...sameKeys(bal, 'roots.gradeSpeed', grades, Object.keys(r.gradeSpeed)),
        ...sameKeys(bal, 'roots.elementCount', grades, Object.keys(r.elementCount)),
        ...sameKeys(bal, 'roots.bodyWeights', t.roots.bodies.map((b) => b.id), Object.keys(r.bodyWeights)),
      );
    }
  }
  if (t.aptitudes) {
    const f = 'aptitudes.json';
    out.push(...duplicates(f, 'con đường', t.aptitudes.paths), ...duplicates(f, 'bách nghệ', t.aptitudes.crafts));
    const titles = t.aptitudes.craftTitles;
    if (titles[0].minLevel !== 0) out.push({ file: f, level: 'error', message: 'craftTitles phải bắt đầu từ minLevel 0' });
    titles.forEach((x, i) => {
      if (i > 0 && x.minLevel <= titles[i - 1].minLevel) out.push({ file: f, level: 'error', message: 'craftTitles phải tăng dần theo minLevel' });
    });
    if (t.balance) {
      const { startAffinity: _, ...paths } = t.balance.paths;
      out.push(...sameKeys(bal, 'paths', t.aptitudes.paths.map((p) => p.id), Object.keys(paths)));
      const craftIds = t.aptitudes.crafts.map((c) => c.id);
      out.push(...sameKeys(bal, 'crafts.practiceCost', craftIds, Object.keys(t.balance.crafts.practiceCost)));
      const starts = { ...t.balance.crafts.mortalStartLevel, ...t.balance.crafts.cultivatorStartLevel };
      for (const [job, levels] of Object.entries(starts)) {
        for (const c of Object.keys(levels)) {
          if (!craftIds.includes(c)) out.push({ file: bal, level: 'error', message: `crafts: nghề "${job}" nhắc tới bách nghệ không tồn tại "${c}"` });
        }
      }
    }
  }
  return out;
}

/** Task 2.4: techniques name real realms; sects teach real techniques and have balance numbers. */
function checkTechniquesAndSects(
  techniques: Technique[] | null,
  sectFiles: { file: string; sects: Sect[] }[],
  t: { balance?: Balance; realms?: RealmsFile },
): Problem[] {
  const out: Problem[] = [];
  const bal = 'config/balance.json';
  const realmIds = t.realms?.realms.map((r) => r.id);
  if (techniques) {
    out.push(...duplicates('techniques.json', 'công pháp', techniques));
    for (const tech of techniques) {
      if (tech.maxRealm && realmIds && !realmIds.includes(tech.maxRealm)) {
        out.push({ file: 'techniques.json', level: 'error', message: `công pháp "${tech.id}": maxRealm không tồn tại "${tech.maxRealm}"` });
      }
    }
    if (t.balance) {
      const tb = t.balance.techniques;
      if (!techniques.some((x) => x.id === tb.default)) out.push({ file: bal, level: 'error', message: `techniques.default "${tb.default}" không có trong techniques.json` });
      const ghostTech = t.balance.ghost.technique;
      if (!techniques.some((x) => x.id === ghostTech)) out.push({ file: bal, level: 'error', message: `ghost.technique "${ghostTech}" không có trong techniques.json` });
      for (const g of ['hoang', 'huyen', 'dia', 'thien', 'vo_thuong']) {
        if (tb.gradeMul[g] === undefined) out.push({ file: bal, level: 'error', message: `techniques.gradeMul thiếu phẩm "${g}"` });
      }
      for (const l of ['tien', 'ma', 'phat', 'quy', 'yeu']) {
        if (tb.lineageMul[l] === undefined) out.push({ file: bal, level: 'error', message: `techniques.lineageMul thiếu đạo thống "${l}"` });
      }
      for (const r of Object.values(tb.gradeMaxRealm)) {
        if (realmIds && !realmIds.includes(r)) out.push({ file: bal, level: 'error', message: `techniques.gradeMaxRealm: cảnh giới không tồn tại "${r}"` });
      }
    }
  }
  for (const { file, sects } of sectFiles) {
    out.push(...duplicates(file, 'tông môn', sects));
    for (const sect of sects) {
      for (const tech of sect.techniques) {
        if (techniques && !techniques.some((x) => x.id === tech.id)) out.push({ file, level: 'error', message: `tông môn "${sect.id}" truyền công pháp không tồn tại "${tech.id}"` });
        if (tech.rank >= sect.ranks.length) out.push({ file, level: 'error', message: `tông môn "${sect.id}": cấp bậc ${tech.rank} vượt số cấp bậc` });
      }
      if (t.balance && t.balance.sects.stipend[sect.id] === undefined) {
        out.push({ file: bal, level: 'error', message: `sects.stipend thiếu tông môn "${sect.id}"` });
      }
    }
    if (t.balance && sects.length > 0 && t.balance.sects.rankStipendMul.length < Math.max(...sects.map((s) => s.ranks.length))) {
      out.push({ file: bal, level: 'error', message: 'sects.rankStipendMul ngắn hơn số cấp bậc tông môn' });
    }
  }
  return out;
}

/** Task 3.3: a fight's foe must name real realms, elements, paths and lineages; its endings must change a stat. */
function checkFight(
  file: string, where: string, fight: Fight,
  t: { realms?: RealmsFile; roots?: RootsFile; aptitudes?: AptitudesFile },
  itemIds: string[] | null, changesStat: (e: Fight['win']['effects']) => boolean,
): Problem[] {
  const out: Problem[] = [];
  const err = (message: string) => out.push({ file, level: 'error', message: `${where}: ${message}` });
  const foe = fight.foe;
  if (t.realms && !['same', 'above', 'below', ...t.realms.realms.map((r) => r.id)].includes(foe.realm)) err(`cảnh giới đối thủ không tồn tại "${foe.realm}"`);
  if (t.roots && foe.element !== null && foe.element !== 'random' && !t.roots.elements.some((e) => e.id === foe.element)) err(`hệ đối thủ không tồn tại "${foe.element}"`);
  if (t.aptitudes && foe.path && !t.aptitudes.paths.some((p) => p.id === foe.path)) err(`con đường đối thủ không tồn tại "${foe.path}"`);
  if (!(LINEAGES as readonly string[]).includes(foe.lineage)) err(`đạo thống đối thủ không tồn tại "${foe.lineage}"`);
  for (const [name, o] of [['thắng', fight.win], ['thua', fight.lose], ['chạy', fight.fled]] as const) {
    if (!o) continue;
    if (!changesStat(o.effects)) err(`kết quả ${name} không đổi chỉ số nào`);
    for (const it of [...o.effects.addItems, ...o.effects.removeItems]) if (itemIds && !itemIds.includes(it)) err(`vật phẩm không tồn tại "${it}"`);
  }
  return out;
}
