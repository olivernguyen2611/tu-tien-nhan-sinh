// Zod schemas for every JSON file under content/. The game loader and the
// validator (npm run validate) both use these, so they never disagree.
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9_]+$/, 'id chỉ dùng chữ thường không dấu, số và dấu _');
const ids = z.array(id).default([]);

/** Stat keys from PLAN.md K.2 (mortal body + aptitudes). */
export const MORTAL_STATS = ['health', 'happiness', 'intellect', 'charm'] as const;
export const APTITUDES = ['physique', 'comprehension', 'luck', 'daoHeart'] as const;
/** Values an event can read or change, named like the trait hooks (K.6). */
export const STAT_KEYS = [...MORTAL_STATS, ...APTITUDES].map((k) => `stat.${k}`);
export const NUMERIC_KEYS = [...STAT_KEYS, 'silver', 'spiritStones', 'karma', 'age'];
const statKey = z.string().refine((k) => STAT_KEYS.includes(k), (k) => ({ message: `"${k}" không phải chỉ số (dùng stat.<tên>)` }));
const numericKey = z.string().refine((k) => NUMERIC_KEYS.includes(k), (k) => ({ message: `"${k}" không phải giá trị đọc được` }));

export const StatConditionSchema = z
  .object({
    stat: numericKey,
    gte: z.number().optional(),
    lte: z.number().optional(),
  })
  .strict();

export const ConditionsSchema = z
  .object({
    age: z.object({ min: z.number().int().optional(), max: z.number().int().optional() }).strict().optional(),
    realm: z.object({ min: id.optional(), max: id.optional() }).strict().optional(),
    region: ids,
    flagsAll: ids,
    flagsNone: ids,
    traitsAny: ids,
    traitsAll: ids,
    traitsNone: ids,
    goldenFinger: id.nullable().optional(),
    stats: z.array(StatConditionSchema).default([]),
  })
  .strict();

export const FollowUpSchema = z
  .object({
    event: id,
    afterYears: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
  })
  .strict();

/** Known list-type effects; any other key is a numeric stat change (e.g. "health": -30). */
export const EffectsSchema = z
  .object({
    setFlags: ids,
    clearFlags: ids,
    addItems: ids,
    removeItems: ids,
    addTraits: ids,
    followUp: FollowUpSchema.optional(),
    /** Test the spirit root now (task 2.2); does nothing if it is already known. */
    testRoot: z.boolean().optional(),
  })
  .catchall(z.number())
  .superRefine((e, ctx) => {
    const lists = ['setFlags', 'clearFlags', 'addItems', 'removeItems', 'addTraits', 'followUp', 'testRoot'];
    for (const key of Object.keys(e)) {
      if (!lists.includes(key) && (key === 'age' || !NUMERIC_KEYS.includes(key))) {
        ctx.addIssue({ code: 'custom', path: [key], message: `hiệu ứng "${key}" không hợp lệ (dùng stat.<tên>, silver, spiritStones, karma)` });
      }
    }
  });

export const OutcomeSchema = z
  .object({
    text: z.string().min(1),
    effects: EffectsSchema.default({}),
  })
  .strict();

export const ChoiceSchema = z
  .object({
    text: z.string().min(1),
    requires: ConditionsSchema.partial().optional(),
    hidden: z.boolean().default(false),
    check: z.object({ stat: statKey, difficulty: z.number().min(0).max(100) }).strict().optional(),
    success: OutcomeSchema.optional(),
    fail: OutcomeSchema.optional(),
    result: OutcomeSchema.optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.check) {
      if (!c.success || !c.fail) ctx.addIssue({ code: 'custom', message: 'lựa chọn có "check" phải có cả "success" và "fail"' });
      if (c.result) ctx.addIssue({ code: 'custom', message: 'lựa chọn có "check" không dùng "result"' });
    } else if (!c.result) {
      ctx.addIssue({ code: 'custom', message: 'lựa chọn không có "check" phải có "result"' });
    }
  });

export const EVENT_TAGS = ['violence', 'dark', 'mature', 'funny', 'rare'] as const;

export const EventSchema = z
  .object({
    id,
    category: z.string().min(1),
    title: z.string().min(1),
    text: z.string().min(1),
    /** Content-filter tags (violence, mature…). */
    tags: z.array(z.enum(EVENT_TAGS)).default([]),
    /** Story themes that traits weight via eventWeight.<theme> (K.6). */
    themes: ids,
    image: z.string().nullable().default(null),
    conditions: ConditionsSchema.default({}),
    weight: z.number().min(0),
    luckAffected: z.boolean().default(false),
    cooldownYears: z.number().int().min(0).default(0),
    oncePerLife: z.boolean().default(false),
    choices: z.array(ChoiceSchema).min(1),
  })
  .strict();

export const EventFileSchema = z.array(EventSchema);

export const GlossarySchema = z.array(
  z
    .object({
      id,
      term: z.string().min(1),
      definition: z.string().min(1),
      aliases: z.array(z.string()).default([]),
    })
    .strict(),
);

const probability = z.number().min(0).max(1);
const weightMap = z.record(id, z.number().min(0));

// ---------- Character creation ----------

const statHook = z.enum([...MORTAL_STATS, ...APTITUDES].map((k) => `stat.${k}`) as [string, ...string[]]);

export const OriginSchema = z
  .object({
    id,
    name: z.string().min(1),
    description: z.string().min(1),
    weight: z.number().min(0),
    effects: z.record(statHook, z.number()).default({}),
    silver: z.number().int().min(0),
    spiritStones: z.number().int().min(0),
    noParents: z.boolean().default(false),
    /** Clan of cultivators: the spirit root is rolled balance.roots.clanDescendantRolls times, best kept. */
    cultivatorClan: z.boolean().default(false),
    birthText: z.string().min(1),
  })
  .strict();
export const OriginFileSchema = z.array(OriginSchema).min(1);

/** content/worlds/<id>/world.json: one playable world with its own storylines. */
export const WorldSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+$/),
    name: z.string().min(1),
    description: z.string(),
    order: z.number().int(),
    /** Spiritual qi of this world; default balance.cultivation.regionQi. */
    qi: z.number().positive().optional(),
    /** Event booked for every life at an age in balance.roots.testAge (task 2.2). */
    rootTestEvent: z.string().regex(/^[a-z0-9_]+$/).optional(),
  })
  .strict();
export type World = z.infer<typeof WorldSchema>;

export const NamesSchema = z
  .object({
    surnames: z.array(z.string().min(1)).min(1),
    /** Curated two-syllable given names. */
    male: z.array(z.string().min(1)).min(1),
    female: z.array(z.string().min(1)).min(1),
    /** Syllables combined as middle + given for many more names. */
    maleMiddle: z.array(z.string().min(1)).min(1),
    maleGiven: z.array(z.string().min(1)).min(2),
    femaleMiddle: z.array(z.string().min(1)).min(1),
    femaleGiven: z.array(z.string().min(1)).min(2),
    hometowns: z.array(z.string().min(1)).min(1),
  })
  .strict();

// ---------- Effect hooks (PLAN.md K.6) ----------
// Traits, talents and items may only touch the game through these hooks.
// Adding a hook is its own code task.

const ELEMENTS = 'kim|moc|thuy|hoa|tho|loi|bang|phong|am|root'; // "root" = the main spirit root's element
const PATHS = 'sword|body|spell|weapon|arts';                    // Kiếm, Thể, Pháp, Binh, Thuật
const CRAFTS = 'alchemy|forging|formation|talisman|farming|beast'; // Đan, Khí, Trận, Phù, Linh thực, Ngự thú

/** Hooks that take a number to add. */
const ADD_HOOK = new RegExp(
  '^(' +
    [
      `stat\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      'cultivationSpeed', 'breakthroughChance(\\.major)?', 'bottleneckResist',
      'lifespanPct',
      'combatPower(\\.vsHigherRealm)?', 'speed', 'divineSense', 'escapeChance', 'injuryReduce', 'lifesteal',
      `element\\.(${ELEMENTS})\\.power`, `path\\.(${PATHS})\\.(affinity|power)`,
      `craft\\.(${CRAFTS})\\.(success|yield|affinity)`,
      'heartDemonResist', 'charmResist',
      'npcAffinityStart', 'faction\\.(chinh|ma|tan_tu|yeu)\\.reputation', 'karmaShift',
      'priceDiscount', 'incomePct', 'lootPct',
      'trigger\\.cheatDeath',
      // Stat extremes (stat-extremes-approved.md): yearly drift, floors, risk.
      `statPerYear\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      `statFloor\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      'silverPerYear', 'deathChancePerYear', 'illnessChancePct', 'tribulationPct',
      // Special bodies (realms-roots-paths.md B5); takes effect from task 2.3.
      'lineage\\.(tien|ma|phat|quy)\\.cultivationSpeed',
    ].join('|') +
    ')$',
);
const MUL_HOOK = /^eventWeight\.[a-z0-9_]+$/;
const FLAG_HOOK = /^(agingSlow|unlockChain\.[a-z0-9_]+|cannotWork|noLineageChange|blockEvent\.[a-z0-9_]+)$/;

export const EffectHookSchema = z
  .object({
    hook: z.string(),
    add: z.number().optional(),
    mul: z.number().min(0).optional(),
    years: z.number().int().min(1).optional(),
    tag: id.optional(),
    id: id.optional(),
    on: id.optional(),
    at: z.number().int().min(1).optional(),
    then: id.optional(),
    activeFrom: z.object({ age: z.number().int().min(0) }).strict().optional(),
    /** Off once the character reaches this realm (e.g. Thiên Tuyệt Mạch); takes effect from task 2.3. */
    activeUntil: z.object({ realm: id }).strict().optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message: `móc "${e.hook}": ${message}` });
    if (ADD_HOOK.test(e.hook)) {
      if (e.add === undefined) fail('cần "add"');
    } else if (MUL_HOOK.test(e.hook)) {
      if (e.mul === undefined) fail('cần "mul"');
    } else if (FLAG_HOOK.test(e.hook)) {
      if (e.add !== undefined || e.mul !== undefined) fail('không nhận giá trị');
    } else if (e.hook === 'trigger.everyNYears') {
      if (!e.years || !e.tag) fail('cần "years" và "tag"');
    } else if (e.hook === 'counter') {
      if (!e.id || !e.on || !e.at || !e.then) fail('cần "id", "on", "at", "then"');
    } else {
      fail('không có trong bộ móc K.6 (thêm móc mới là một task code riêng)');
    }
  });

/** Special states from a stat stuck at an extreme (stat-extremes-approved.md). */
export const EXTREME_STATS = [...MORTAL_STATS, ...APTITUDES, 'karma'] as const;
const OnceEffectSchema = z
  .object({ hook: z.string().regex(/^(stat\.[a-zA-Z]+|lifespanPct)$/, 'chỉ dùng stat.<tên> hoặc lifespanPct'), add: z.number() })
  .strict();
export const StatExtremeSchema = z
  .object({
    id,
    stat: z.enum(EXTREME_STATS),
    zone: z.enum(['low', 'high']),
    /** Years in the zone before the state starts; default balance.extremes.years. */
    years: z.number().int().min(1).optional(),
    name: z.string().min(1),
    /** Logged when the state starts and shown in the profile while it lasts. */
    text: z.string().min(1),
    /** Lasting effects while the state is on. */
    effects: z.array(EffectHookSchema).min(1),
    /** Given when the state starts; again only after balance.extremes.onceCooldownYears. */
    onceEffects: z.array(OnceEffectSchema).default([]),
    /** One-off twists while the state lasts: after N years in it, or by chance each year. */
    specials: z
      .array(
        z
          .object({ afterYears: z.number().int().min(1).optional(), chancePerYear: probability.optional(), text: z.string().min(1), effects: z.array(OnceEffectSchema).min(1) })
          .strict()
          .refine((s) => (s.afterYears === undefined) !== (s.chancePerYear === undefined), 'cần đúng một trong "afterYears" hoặc "chancePerYear"'),
      )
      .default([]),
    /** What the state costs or opens up later (cultivation, combat…); for the profile card. */
    note: z.string().optional(),
  })
  .strict();
export const StatExtremesFileSchema = z
  .object({
    /** Log lines: the year before a state starts ({stat}), when it starts and ends ({name}, {text}). */
    warn: z.object({ low: z.string().min(1), high: z.string().min(1) }).strict(),
    enter: z.string().min(1),
    exit: z.string().min(1),
    states: z.array(StatExtremeSchema).min(1),
  })
  .strict();
export type StatExtreme = z.infer<typeof StatExtremeSchema>;
export type StatExtremesFile = z.infer<typeof StatExtremesFileSchema>;

export const TRAIT_RARITIES = ['pham', 'luong', 'uu', 'tuyet', 'thien', 'than', 'ac'] as const;

export const TraitSchema = z
  .object({
    id,
    rarity: z.enum(TRAIT_RARITIES),
    name: z.string().min(1),
    flavor: z.string().min(1),
    summary: z.string().min(1),
    effects: z.array(EffectHookSchema).min(1),
  })
  .strict();
export const TraitFileSchema = z.array(TraitSchema).min(1);

/** [loss when distant, loss when close] (both ≤ 0). */
const griefRange = z.tuple([z.number().max(0), z.number().max(0)]);
const range = z.tuple([z.number(), z.number()]).refine(([a, b]) => a <= b, 'khoảng [min, max] bị ngược');

export const BalanceSchema = z
  .object({
    version: z.number().int(),
    events: z
      .object({
        popupChanceLowRealm: probability,
        popupChanceHighRealm: probability,
        logLineChance: probability,
        /** Skill check: chance = base + (stat − difficulty) × perPoint, clamped to [min, max]. */
        check: z
          .object({ base: probability, perPoint: z.number().min(0), min: probability, max: probability })
          .strict(),
      })
      .strict(),
    traits: z
      .object({
        slots: z.number().int().min(1),
        rerolls: z.number().int().min(0),
        badLuckChance: probability,
        rarityWeights: z.record(id, z.number().min(0)),
      })
      .strict(),
    character: z
      .object({
        mortalStatRange: range,
        aptitudeRange: range,
        aptitudeRolls: z.number().int().min(1),
      })
      .strict(),
    family: z
      .object({
        fatherAge: range,
        motherAge: range,
        affinityStart: range,
        olderSiblings: range,
        olderSiblingGap: range,
        youngerSiblingChance: probability,
        motherMinAgeForChild: z.number().int(),
        motherMaxAgeForChild: z.number().int(),
        maxSiblings: z.number().int().min(0),
        affinityDecay: z.number().min(0),
        /** When a relative dies: happiness [distant, close] scaled by affinity, plus Đạo tâm for a parent. */
        grief: z
          .object({ father: griefRange, mother: griefRange, sibling: griefRange, parentDaoHeart: z.number() })
          .strict(),
      })
      .strict(),
    lifespan: z
      .object({
        mortalBase: z.number().int().min(1),
        mortalVariance: z.number().int().min(0),
        healthAdjustMax: z.number().int().min(0),
      })
      .strict(),
    /** Task 1.11: "Tua nhanh" stops after at most this many years. */
    fastForward: z.object({ maxYears: z.number().int().min(1) }).strict(),
    aging: z
      .object({
        /** Before declineStartAge, health below recoverCap heals recoverPerYear each year. */
        recoverPerYear: z.number().min(0),
        recoverCap: z.number().min(0).max(100),
        /** Health drops healthDeclinePerYear each year from this age. */
        declineStartAge: z.number().int().min(0),
        healthDeclinePerYear: z.number().min(0),
        /** PLAN.md G.3: from this age, illness chance = (age − start) × illnessChancePerYear. */
        illnessStartAge: z.number().int().min(0),
        illnessChancePerYear: probability,
        illnessHealthLoss: range,
        illnessHappinessLoss: z.number().min(0),
        /** |karma| at or above this picks a good/bad epitaph. */
        epitaphKarma: z.number().min(0).max(100),
        /** At these ages the body takes a visible blow (stat-extremes-approved.md §3). */
        milestoneAges: z.array(z.number().int().min(1)),
        milestoneHealth: z.number(),
        milestoneCharm: z.number(),
      })
      .strict(),
    /** Stats stuck at an extreme (stat-extremes-approved.md). */
    extremes: z
      .object({
        lowAt: z.number(),
        highAt: z.number(),
        /** A state ends once the stat is back to exitLow (low zone) or exitHigh (high zone). */
        exitLow: z.number(),
        exitHigh: z.number(),
        karmaLowAt: z.number(),
        karmaHighAt: z.number(),
        karmaExitLow: z.number(),
        karmaExitHigh: z.number(),
        years: z.number().int().min(1),
        onceCooldownYears: z.number().int().min(0),
        /** Quiet years pull happiness this much toward happinessRest. */
        happinessDrift: z.number().min(0),
        happinessRest: z.number(),
      })
      .strict(),
    /** Per realm (ids from realms.json): PLAN.md G and realms-roots-paths.md A. */
    realms: z.record(
      id,
      z
        .object({
          /** Base cultivation gain, % of the realm per year. */
          speedPct: z.number().min(0),
          /** Missing = mortal lifespan (balance.lifespan). */
          lifespan: z.number().int().min(1).optional(),
          lifespanVariance: z.number().int().min(0).optional(),
          combatPower: z.number().min(0),
          /** Mortals: combat power grows up to this through the martial stages. */
          combatPowerMax: z.number().min(0).optional(),
          /** Chance to break through into this realm. */
          breakthroughChance: probability,
        })
        .strict(),
    ),
    realmStages: z
      .object({
        luyenKhiLevelUpChance: probability,
        minorStageChance: probability,
        perfectFoundationLifespan: z.number().int().min(0),
        goldenCoreLifespanPerGradeAbove5: z.number().int().min(0),
      })
      .strict(),
    roots: z
      .object({
        gradeWeights: weightMap,
        /** Cultivation speed multiplier per grade. */
        gradeSpeed: z.record(id, z.number().min(0)),
        elementCount: z.record(id, z.number().int().min(0)),
        bodyWeights: weightMap,
        /** Origin "Hậu duệ gia tộc tu tiên" rolls this many times and keeps the best. */
        clanDescendantRolls: z.number().int().min(1),
        /** Age range of the spirit-root test. */
        testAge: range,
        /** Combat bonus when your element beats the enemy's (K.3.3). */
        elementCounterBonus: z.number().min(0),
      })
      .strict(),
    /** PLAN.md G.1 / G.2: yearly cultivation and minor breakthroughs (task 2.3). */
    cultivation: z
      .object({
        /** Aptitude factor = aptitudeBase + (physique + comprehension) / aptitudeDivisor. */
        aptitudeBase: z.number(),
        aptitudeDivisor: z.number().positive(),
        /** Spiritual qi of the place; a world may override it (world.json "qi"). */
        regionQi: z.number().positive(),
        /** Until techniques exist (task 2.4) every cultivator uses this multiplier. */
        techniqueMul: z.number().positive(),
        breakthrough: z
          .object({
            comprehensionPerPoint: z.number(),
            daoHeartPerPoint: z.number(),
            failPenaltyPct: z.number().min(0),
            minPct: z.number().min(0).max(100),
            maxPct: z.number().min(0).max(100),
          })
          .strict(),
        minorFailure: z
          .object({
            weights: z.object({ lose: z.number().min(0), injury: z.number().min(0), lifespan: z.number().min(0) }).strict(),
            /** Percent of the bar lost. */
            loseProgress: z.number().min(0).max(100),
            injuryHealth: z.number(),
            injurySpeedMul: z.number().min(0),
            injuryYears: z.number().int().min(1),
            lifespanLossPct: z.number().min(0),
          })
          .strict(),
      })
      .strict(),
    /** PLAN.md G.2 big breakthroughs (task 2.6). */
    majorBreakthrough: z
      .object({
        /** Realms a player may break into for now; later tasks add Kim Đan and up. */
        openRealms: z.array(id),
        failureWeights: z
          .object({ lose: z.number().min(0), injury: z.number().min(0), lifespan: z.number().min(0), deviation: z.number().min(0), death: z.number().min(0) })
          .strict(),
        deviationHealth: z.number(),
        deviationDaoHeart: z.number(),
        /** Failures at a realm's peak before the bottleneck slows cultivation. */
        bottleneckFails: z.number().int().min(1),
        bottleneckSpeedMul: z.number().min(0).max(1),
        /** Foundation grade score = d100 + (comprehension − 50) × perPoint + (daoHeart − 50) × perPoint. */
        foundationPerPoint: z.number().min(0),
        /** Minimum score for each grade id; grades not listed are the floor. */
        foundationThresholds: z.record(id, z.number()),
        /** Cultivation speed multiplier per foundation grade. */
        foundationSpeed: z.record(id, z.number().min(0)),
      })
      .strict(),
    /** Task 2.10: difficulty id (difficulties.json) used when none is chosen. */
    defaultDifficulty: id,
    /** Per difficulty: K.6 hooks for the whole life, extra destiny rerolls, and whether saves are locked. */
    difficulty: z.record(
      id,
      z
        .object({
          rerollBonus: z.number().int(),
          /** No export/import while the life is alive: what happens, stays. */
          noReload: z.boolean(),
          effects: z.array(EffectHookSchema),
        })
        .strict(),
    ),
    /** Combat path modifiers (realms-roots-paths.md C); keyed by path id. */
    paths: z
      .object({ startAffinity: range })
      .catchall(z.record(z.string(), z.number())),
    crafts: z
      .object({
        /** Job flag → starting craft levels. Mortals get them at once, cultivators once they have a root. */
        mortalStartLevel: z.record(id, z.record(id, z.number().int().min(0).max(100))),
        cultivatorStartLevel: z.record(id, z.record(id, z.number().int().min(0).max(100))),
      })
      .strict(),
  })
  .passthrough(); // later tasks add sections (cultivation, lifespan…)

export type GameEvent = z.infer<typeof EventSchema>;
export type Glossary = z.infer<typeof GlossarySchema>;
// ---------- Family actions (content/family-actions.json) ----------

const affinityRange = z.tuple([z.number().int(), z.number().int()]).refine(([a, b]) => a <= b, 'khoảng [min, max] bị ngược');
const familyEffects = z.record(numericKey, z.number()).default({});
const ActionOutcomeSchema = z
  .object({ affinity: affinityRange, effects: familyEffects, texts: z.array(z.string().min(1)).min(1) })
  .strict();

/** One thing the player can do with a relative ("Tặng quà", "Dẫn đi du ngoạn"…). Once a year per relative. */
export const FamilyActionSchema = z
  .object({
    id,
    name: z.string().min(1),
    /** Player age range. */
    minAge: z.number().int().min(0).default(0),
    maxAge: z.number().int().optional(),
    /** Only for these roles; empty = everyone. */
    roles: z.array(z.enum(['father', 'mother', 'sibling'])).default([]),
    minTargetAge: z.number().int().optional(),
    /** Silver spent. */
    cost: z.number().int().min(0).default(0),
    /** Silver received (e.g. "Xin tiền"). */
    silver: affinityRange.optional(),
    /** Below this affinity the relative refuses (outcome `refused`). */
    needAffinity: z.number().optional(),
    refused: ActionOutcomeSchema.optional(),
    mishapChance: z.number().min(0).max(1).default(0),
    mishap: ActionOutcomeSchema.optional(),
    affinity: affinityRange,
    effects: familyEffects,
    texts: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.needAffinity !== undefined && !a.refused) ctx.addIssue({ code: 'custom', message: 'có "needAffinity" thì phải có "refused"' });
    if (a.mishapChance > 0 && !a.mishap) ctx.addIssue({ code: 'custom', message: 'có "mishapChance" thì phải có "mishap"' });
  });
export const FamilyActionFileSchema = z.array(FamilyActionSchema);
export type FamilyAction = z.infer<typeof FamilyActionSchema>;

export type Balance = z.infer<typeof BalanceSchema>;
export type Origin = z.infer<typeof OriginSchema>;
export type Names = z.infer<typeof NamesSchema>;
export type Trait = z.infer<typeof TraitSchema>;
export type EffectHook = z.infer<typeof EffectHookSchema>;

// ---------- Aging and death texts (content/life-texts.json) ----------

const lines = z.array(z.string().min(1)).min(1);
/** Log and summary lines for aging, illness and death. `{age}` is replaced by the age. */
export const LifeTextsSchema = z
  .object({
    illness: lines,
    /** Old-age milestones (balance.aging.milestoneAges); {age}. */
    agingMilestone: lines,
    deathOldAge: lines,
    /** Died breaking into a new realm (task 2.6); {age}. */
    deathBreakthrough: lines,
    deathIllness: lines,
    epitaph: z.object({ good: lines, bad: lines, plain: lines }).strict(),
  })
  .strict();
export type LifeTexts = z.infer<typeof LifeTextsSchema>;

// ---------- Realms, spirit roots, paths, crafts (task 2.1) ----------

/** content/realms.json: realm order is the array order (Phàm Nhân first). */
export const RealmsFileSchema = z
  .object({
    realms: z
      .array(z.object({ id, name: z.string().min(1), stages: z.array(z.string().min(1)).min(1), description: z.string().min(1) }).strict())
      .min(1),
    /** Log lines for cultivation (task 2.3). {realm}, {stage} are filled in. */
    texts: z
      .object({
        /** Root found: the first technique and the first stage. */
        start: z.string().min(1),
        stageUp: z.array(z.string().min(1)).min(1),
        /** Bar full at the last stage of a realm: waiting for the big breakthrough. */
        peak: z.string().min(1),
        failLose: z.string().min(1),
        failInjury: z.string().min(1),
        failLifespan: z.string().min(1),
        injuryHealed: z.string().min(1),
        /** Big breakthrough (task 2.6): {realm} = new realm, {grade} = foundation grade name. */
        majorSuccess: z.string().min(1),
        /** Tẩu hỏa nhập ma. */
        majorDeviation: z.string().min(1),
        /** Two failures at a realm's peak: cultivation slows (PLAN G.2 bình cảnh). */
        bottleneck: z.string().min(1),
      })
      .strict(),
    /** Đạo cơ grades after breaking into Trúc Cơ, worst to best (task 2.6). */
    foundations: z.array(z.object({ id, name: z.string().min(1), description: z.string().min(1) }).strict()).min(1),
    /** Shown as a greyed-out "???" after the last realm. */
    beyond: z.object({ name: z.string().min(1), description: z.string().min(1) }).strict(),
  })
  .strict();
export type RealmsFile = z.infer<typeof RealmsFileSchema>;

/** content/roots.json: root grades, elements with what they beat, special bodies. */
export const RootsFileSchema = z
  .object({
    grades: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            description: z.string().min(1),
            /** "variant": elements drawn from the variant ones; "body": a special body instead of elements. */
            special: z.enum(['variant', 'body']).optional(),
          })
          .strict(),
      )
      .min(1),
    /** Log line when the root is revealed: {root} = name with elements, {description}. */
    revealText: z.string().min(1),
    elements: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            /** Biến dị (Lôi, Băng, Phong, Ám). */
            variant: z.boolean(),
            /** Elements this one beats; "weak to" is derived from the others. */
            beats: ids,
            description: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    bodies: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            description: z.string().min(1),
            /** Every technique counts as matching the root (Lưu Ly Linh Thể). */
            anyTechnique: z.boolean().default(false),
            effects: z.array(EffectHookSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type RootsFile = z.infer<typeof RootsFileSchema>;

/** content/aptitudes.json: five combat paths and six crafts. */
export const AptitudesFileSchema = z
  .object({
    paths: z.array(z.object({ id, name: z.string().min(1), description: z.string().min(1) }).strict()).min(1),
    crafts: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            /** Used in level titles: "Đan" → Đan Sư, Đại Đan Sư… */
            prefix: z.string().min(1),
            /** Mortals can learn it without a spirit root. */
            mortal: z.boolean(),
            makes: z.string().min(1),
            description: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    /** Ascending by minLevel; {craft} = craft name in lower case, {prefix} = its prefix. */
    craftTitles: z.array(z.object({ minLevel: z.number().int().min(0).max(100), title: z.string().min(1) }).strict()).min(1),
  })
  .strict();
export type AptitudesFile = z.infer<typeof AptitudesFileSchema>;

/** content/difficulties.json: names shown when creating a life (task 2.10). */
export const DifficultyFileSchema = z
  .array(z.object({ id, name: z.string().min(1), description: z.string().min(1) }).strict())
  .min(1);
export type Difficulty = z.infer<typeof DifficultyFileSchema>[number];
