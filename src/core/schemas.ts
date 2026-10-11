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
/** Also readable by conditions and skill checks (task 2.8): craft levels and sect contribution. */
export const CRAFT_KEYS = ['alchemy', 'forging', 'formation', 'talisman', 'farming', 'beast'].map((c) => `craft.${c}`);
export const READ_KEYS = [...NUMERIC_KEYS, ...CRAFT_KEYS, 'sect.contribution'];
const statKey = z.string().refine((k) => STAT_KEYS.includes(k) || CRAFT_KEYS.includes(k), (k) => ({ message: `"${k}" không phải chỉ số (dùng stat.<tên> hoặc craft.<nghệ>)` }));
const numericKey = z.string().refine((k) => READ_KEYS.includes(k), (k) => ({ message: `"${k}" không phải giá trị đọc được` }));

export const StatConditionSchema = z
  .object({
    stat: numericKey,
    gte: z.number().optional(),
    lte: z.number().optional(),
  })
  .strict();

const BaseConditionsSchema = z
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
    /** Sect membership (task 2.5): in a sect (or this one), rank range, or able to join `eligible`. */
    sect: z
      .object({ member: z.boolean().optional(), id: id.optional(), notId: id.optional(), minRank: z.number().int().optional(), maxRank: z.number().int().optional(), eligible: id.optional() })
      .strict()
      .optional(),
    /** Spirit root (task 2.11): tested or not; usable = can cultivate. */
    root: z.object({ tested: z.boolean().optional(), usable: z.boolean().optional() }).strict().optional(),
    /** Stage within the current realm, 0-based (task 2.8: "Luyện Khí tầng 4+" = min 3). */
    stage: z.object({ min: z.number().int().optional(), max: z.number().int().optional() }).strict().optional(),
    /** Mortal career (task 2.8). */
    career: z
      .object({ member: z.boolean().optional(), id: id.optional(), minRung: z.number().int().optional(), maxRung: z.number().int().optional() })
      .strict()
      .optional(),
    /** Failed big breakthroughs at the current realm's peak (task 2.8). */
    peakFails: z.object({ min: z.number().int().min(0) }).strict().optional(),
    /** Fate talents (task 2.8 hidden choices). */
    talentsAny: ids,
  })
  .strict();

export const ConditionsSchema = BaseConditionsSchema.extend({
  /** At least one of these must hold (task 2.8). */
  anyOf: z.array(BaseConditionsSchema.partial()).optional(),
}).strict();

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
    /** Task 2.8: % of the current bar (±). */
    cultProgress: z.number().optional(),
    /** Cultivation speed ×mul for some years (đan điền ấm, kinh mạch tổn thương…). */
    speedBuff: z.object({ mul: z.number().positive(), years: z.number().int().min(1) }).strict().optional(),
    /** Craft levels gained. */
    craftXp: z.record(z.enum(['alchemy', 'forging', 'formation', 'talisman', 'farming', 'beast']), z.number()).optional(),
    reputation: z.record(z.enum(['chinh', 'ma', 'tan_tu', 'yeu', 'trieu_dinh', 'giang_ho']), z.number()).optional(),
    /** Added to the next big breakthrough only. */
    nextBreakthroughBonus: z.number().optional(),
    /** Fewer counted failures at the current peak (bình cảnh nới ra). */
    reducePeakFails: z.number().int().min(1).optional(),
    /** A scroll to learn later from the Tu luyện sheet. */
    gainTechnique: id.optional(),
    /** Mortal careers. */
    joinCareer: id.optional(),
    careerPromote: z.boolean().optional(),
    leaveCareer: z.boolean().optional(),
    /** An elder of the sect takes you as a personal disciple. */
    gainMaster: z.boolean().optional(),
    /** Sect life (task 2.5): join a sect, add contribution, promote one rank, leave. */
    joinSect: id.optional(),
    sectContribution: z.number().optional(),
    sectPromote: z.boolean().optional(),
    leaveSect: z.boolean().optional(),
    /** Learn this technique now (task 2.4; switching costs part of the bar). */
    learnTechnique: id.optional(),
    /** Thiên địa kỳ vật (task 2.11): a rootless mortal gains a root (balance.kyVat). */
    grantRoot: z.boolean().optional(),
  })
  .catchall(z.number())
  .superRefine((e, ctx) => {
    const lists = ['setFlags', 'clearFlags', 'addItems', 'removeItems', 'addTraits', 'followUp', 'testRoot', 'grantRoot', 'learnTechnique', 'joinSect', 'sectContribution', 'sectPromote', 'leaveSect',
      'cultProgress', 'speedBuff', 'craftXp', 'reputation', 'nextBreakthroughBonus', 'reducePeakFails', 'gainTechnique',
      'joinCareer', 'careerPromote', 'leaveCareer', 'gainMaster'];
    for (const key of Object.keys(e)) {
      if (!lists.includes(key) && (key === 'age' || !NUMERIC_KEYS.includes(key))) {
        ctx.addIssue({ code: 'custom', path: [key], message: `hiệu ứng "${key}" không hợp lệ (dùng stat.<tên>, silver, spiritStones, karma)` });
      }
    }
  });

/** Task 3.3: who the player fights. Power is built like the player's (K.4.1). */
export const FoeSpecSchema = z
  .object({
    name: z.string().min(1),
    /** Realm id, or relative to the player: "same", "above" (one realm up), "below". */
    realm: z.string().default('same'),
    /** Stage within the realm; default the player's stage when "same", else 0. */
    stage: z.number().int().min(0).optional(),
    powerMul: z.number().positive().default(1),
    /** Element id, "random", or none. */
    element: z.string().nullable().default(null),
    /** Combat path id for the flavour of the foe's blows. */
    path: id.optional(),
    lineage: id.default('tien'),
    /** What the foe wants: dạy dỗ, cướp, giết. Decides what losing costs. */
    intent: z.enum(['teach', 'rob', 'kill']),
    /** Base chance the foe accepts a plea (balance.combat.pleaIntent when left out). */
    mercy: z.number().min(0).max(1).optional(),
  })
  .strict();

const PlainOutcomeSchema = z.object({ text: z.string().min(1), effects: EffectsSchema.default({}) }).strict();

/** A 3-round fight started by an event choice; its win/lose outcomes apply when it ends. */
export const FightSchema = z
  .object({
    foe: FoeSpecSchema,
    win: PlainOutcomeSchema,
    lose: PlainOutcomeSchema,
    /** When the player gets away (default: no further effect). */
    fled: PlainOutcomeSchema.optional(),
  })
  .strict();

export const OutcomeSchema = z
  .object({
    text: z.string().min(1),
    effects: EffectsSchema.default({}),
    /** Task 3.3: this outcome starts a fight. */
    fight: FightSchema.optional(),
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
    /** Event booked 1–3 years after a usable root is found (task 2.5). */
    sectRecruitEvent: z.string().regex(/^[a-z0-9_]+$/).optional(),
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

const ELEMENTS = 'kim|moc|thuy|hoa|tho|loi|bang|phong|am|root|all'; // "root" = the main spirit root's element, "all" = every element
const PATHS = 'sword|body|spell|weapon|arts';                    // Kiếm, Thể, Pháp, Binh, Thuật
const CRAFTS = 'alchemy|forging|formation|talisman|farming|beast|all'; // Đan, Khí, Trận, Phù, Linh thực, Ngự thú; "all" = every craft

/** Hooks that take a number to add. */
const ADD_HOOK = new RegExp(
  '^(' +
    [
      `stat\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      'cultivationSpeed', 'breakthroughChance(\\.major|\\.minor)?', 'bottleneckResist',
      'lifespanPct',
      'combatPower(\\.vsHigherRealm)?', 'speed', 'divineSense', 'escapeChance', 'injuryReduce', 'lifesteal',
      `element\\.(${ELEMENTS})\\.power`, `path\\.(${PATHS})\\.(affinity|power)`,
      `craft\\.(${CRAFTS})\\.(success|yield|affinity)`,
      'heartDemonResist', 'charmResist',
      'npcAffinityStart', 'faction\\.(chinh|ma|tan_tu|yeu|trieu_dinh|giang_ho)\\.reputation', 'karmaShift',
      'priceDiscount', 'incomePct', 'lootPct',
      'trigger\\.cheatDeath',
      // Task 3.3: a storage bag keeps the goods when a robber wins.
      'keepItemsOnLoss',
      // Stat extremes (stat-extremes-approved.md): yearly drift, floors, risk.
      `statPerYear\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      `statFloor\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})`,
      'silverPerYear', 'deathChancePerYear', 'illnessChancePct', 'tribulationPct',
      // Fate talents (fate-talents.md, task 2.7).
      'artifactPct', 'tribulationPower',
      // Special bodies (realms-roots-paths.md B5); takes effect from task 2.3.
      'lineage\\.(tien|ma|phat|quy|yeu)\\.cultivationSpeed',
    ].join('|') +
    ')$',
);
const MUL_HOOK = /^eventWeight\.[a-z0-9_]+$/;
const FLAG_HOOK = /^(agingSlow|unlockChain\.[a-z0-9_]+|cannotWork|noLineageChange|blockEvent\.[a-z0-9_]+|ignoreElementWeakness|rewindOnDeath)$/;

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
    /** Only while these hold (task 2.4: Ngũ Hành Luân Chuyển Kinh, Tàng Phong Kiếm Kinh). */
    activeIf: z
      .object({ minRootElements: z.number().int().min(1).optional(), daoHeartBelow: z.number().optional() })
      .strict()
      .optional(),
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
    /** Task 3.3: fights (PLAN.md K.4). */
    combat: z
      .object({
        /** Power × (1 + stagePct × stage). */
        stagePct: z.number().min(0),
        /** Power × (physiqueBase + căn cốt / physiqueDivisor). */
        physiqueBase: z.number().min(0),
        physiqueDivisor: z.number().positive(),
        /** Power multiplier by lineage (đạo thống). */
        lineagePower: z.record(z.number().positive()),
        /** Round win chance A^k / (A^k + B^k). */
        k: z.number().positive(),
        /** Rounds to win the fight (of 3). */
        winRounds: z.number().int().min(1),
        allOutMul: z.number().positive(),
        allOutInjuryMul: z.number().min(0),
        defendMul: z.number().positive(),
        defendInjuryMul: z.number().min(0),
        /** Health lost when a round is lost. */
        roundInjury: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
        /** Speed = speedBase × (1 + realm index) × (1 + path + hooks). */
        speedBase: z.number().positive(),
        pathSpeed: z.record(z.number()),
        fleeMin: probability,
        fleeMax: probability,
        /** Plea chance = foe mercy + (charm − 50) × pleaPerCharm, ma đạo foes less. */
        pleaIntent: z.object({ teach: probability, rob: probability, kill: probability }).strict(),
        pleaPerCharm: z.number(),
        pleaMaPenalty: z.number(),
        pleaMin: probability,
        pleaMax: probability,
        /** Foe power × a random factor in this range. */
        foeVariance: z.tuple([z.number().positive(), z.number().positive()]),
        /** Losing: lessons hurt, robbers take a share of money and an item, killers kill unless luck saves you. */
        lose: z
          .object({
            teachHealth: z.number(),
            robShare: probability,
            robItems: z.number().int().min(0),
            killEscapeBase: probability,
            killEscapePerLuck: z.number().min(0),
            killEscapeHealth: z.number(),
          })
          .strict(),
        /** Winning: what each choice costs or gives. */
        win: z
          .object({
            /** Loot = foe power × this (silver from a mortal foe, spirit stones from a cultivator). */
            lootStonesPerPower: z.number().min(0),
            lootSilverPerPower: z.number().min(0),
            spareKarma: z.number(),
            killKarma: z.number(),
            killDaoHeartPhat: z.number(),
          })
          .strict(),
      })
      .strict(),
    /** Task 3.2: buying, selling, bargaining. */
    market: z
      .object({
        /** Youngest age that can go to market alone. */
        minAge: z.number().int().nonnegative(),
        /** Selling gets this share of the base price. */
        sellShare: probability,
        /** Bargain: chance = base + ((charm + intellect)/2 − 50) × perPoint, clamped to [min, max]. */
        bargainBase: probability,
        bargainPerPoint: z.number(),
        bargainMin: probability,
        bargainMax: probability,
        /** Price multiplier for the rest of the year after a won / lost bargain. */
        bargainWinMul: z.number().min(0),
        bargainLoseMul: z.number().min(0),
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
    /** Mortal careers (task 2.11). */
    careers: z
      .object({
        joinAge: range,
        /** Silver per year at each rung (index 0 = first rung); longer ladders reuse the last value. */
        income: z.array(z.number().int().min(0)).min(1),
        /** Years at a rung before a promotion can happen. */
        yearsPerRung: z.number().int().min(1),
        /** Promotion chance = base + (avg main stats − difficulty[rung]) × perPoint, clamped. */
        promoteBase: probability,
        promotePerPoint: z.number().min(0),
        promoteMin: probability,
        promoteMax: probability,
        /** Difficulty to climb into rung i+1 (index 0 = into the second rung). */
        difficulty: z.array(z.number()).min(1),
        /** Added to the chance when a bonus flag or origin applies. */
        bonusChance: probability,
        eavesdropChance: probability,
        longLifeAge: z.number().int().min(1),
      })
      .strict(),
    /** Thiên địa kỳ vật (mortal-path.md 2.1). */
    kyVat: z
      .object({
        /** Chance the root is Tứ instead of Ngũ. */
        tuChance: probability,
        healthLoss: z.number(),
        /** Above this age each year adds deathPerYear to the death chance, up to deathMax. */
        safeAge: z.number().int().min(0),
        deathPerYear: probability,
        deathMax: probability,
      })
      .strict(),
    /** Task 2.4: technique multipliers (PLAN G.1, K.3.1) and rules. */
    techniques: z
      .object({
        /** Technique a new cultivator gets from the root test. */
        default: id,
        gradeMul: z.record(id, z.number().positive()),
        /** Highest realm each grade reaches; a grade not listed has no limit. */
        gradeMaxRealm: z.record(id, id),
        mismatchMul: z.number().positive(),
        lineageMul: z.record(id, z.number().positive()),
        /** Rootless techniques (Phật duyên): root multiplier = min(this, đạo tâm / 100). */
        rootlessDaoHeartMax: z.number().positive(),
        /** Switching techniques loses this % of the current bar. */
        switchLossPct: z.number().min(0).max(100),
      })
      .strict(),
    /** Task 2.4/2.5: sect numbers keyed by sect id (worlds/<id>/sects.json). */
    sects: z
      .object({
        /** Spirit stones a year at the outer-disciple rank. */
        stipend: z.record(id, z.number().min(0)),
        /** Stipend multiplier per rank index. */
        rankStipendMul: z.array(z.number().min(0)).min(1),
        karmaPerYear: z.record(id, z.number()),
        joinReputation: z.record(id, z.record(z.enum(['chinh', 'ma', 'tan_tu', 'yeu', 'trieu_dinh', 'giang_ho']), z.number())),
        recruitAfterYears: range,
        /** Ký danh becomes the next rank after this many years. */
        outerAfterYears: z.number().int().min(0),
        /** Climbing to `rank` needs this contribution and realm/stage. */
        promotion: z.array(z.object({ rank: z.number().int().min(1), contribution: z.number().min(0), realm: id, stage: z.number().int().min(0) }).strict()),
        masterMinRank: z.number().int().min(0),
        /** Chance to be taken as a personal disciple = base + (comprehension − 50) × perPoint. */
        masterChanceBase: probability,
        masterChancePerPoint: z.number().min(0),
        /** Cultivation speed bonus while having a master. */
        masterSpeed: z.number().min(0),
      })
      .strict(),
    /** Task 2.7: Nghịch Thiên Cải Mệnh (fate-talents.md). */
    fate: z
      .object({
        /** Rarity weights per foundation grade (row), e.g. { ha: { luong: 60, uu: 30, tuyet: 10 } }. */
        rarityByFoundation: z.record(id, z.record(id, z.number().min(0))),
        /** Foundation row used without a foundation. */
        defaultFoundation: id,
        /** Each 10 khí vận above 50 moves this many points from the lowest to the highest rarity of the row. */
        luckShiftPer10: z.number().min(0),
        slots: z.number().int().min(1),
        refreshes: z.number().int().min(0),
        /** Khí vận at or above this gives one more refresh. */
        extraRefreshLuck: z.number(),
      })
      .strict(),
    /** Combat path modifiers (realms-roots-paths.md C); keyed by path id. */
    paths: z
      .object({ startAffinity: range })
      .catchall(z.record(z.string(), z.number())),
    crafts: z
      .object({
        /** Youngest age that can practise a craft (task 2.12). */
        minAge: z.number().int().min(0),
        /** Aptitude (tư chất) for a craft, rolled the first time it is practised. */
        startAffinity: range,
        /** Levels per practice = base × (0.5 + affinity/100) × (0.5 + comprehension/100). */
        practiceBase: z.number().min(0),
        affinityPerPractice: z.number().min(0),
        /** Silver per practice (herbs, iron, paper…). */
        practiceCost: z.record(id, z.number().int().min(0)),
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
    /** Task 3.1: a rootless mortal takes a cultivator's pill; a once-per-life pill taken again. */
    itemMortal: lines,
    itemRepeat: lines,
    deathOldAge: lines,
    /** Died breaking into a new realm (task 2.6); {age}. */
    deathBreakthrough: lines,
    /** Died taking a heaven-and-earth treasure (task 2.11); {age}. */
    deathOrdeal: lines,
    /** Task 3.3: killed in a fight. */
    deathCombat: lines,
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
        /** Task 2.4: {technique}, {grade}, {lineage}, {old}, {realm}. */
        learnTechnique: z.string().min(1),
        switchTechnique: z.string().min(1),
        techniqueCap: z.string().min(1),
      })
      .strict(),
    /** Display names for technique grades and lineages (task 2.4). */
    gradeNames: z.record(id, z.string().min(1)),
    lineageNames: z.record(id, z.string().min(1)),
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
    /** Log lines (task 2.12): {craft}, {from}, {to}, {title}. */
    practiceText: z.string().min(1),
    titleUpText: z.string().min(1),
    /** Starting level from a job (nghề thuốc, nghề rèn). */
    jobStartText: z.string().min(1),
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

/** When a goal or tip applies (task 2.9); every key given must hold. */
const TutorialWhenSchema = z
  .object({
    minAge: z.number().int().min(0).optional(),
    /** Answered events so far. */
    minEvents: z.number().int().min(0).optional(),
    rootTested: z.boolean().optional(),
    /** A root that can cultivate (not "Không linh căn"); false only once tested. */
    hasRoot: z.boolean().optional(),
    realm: id.optional(),
    /** Full bar at the last stage of the realm. */
    atPeak: z.boolean().optional(),
    /** In a sect (task 2.5). */
    inSect: z.boolean().optional(),
  })
  .strict();
export type TutorialWhen = z.infer<typeof TutorialWhenSchema>;

/** content/tutorial.json: "Mục tiêu hiện tại" (first match wins) and first-life tips. */
export const TutorialFileSchema = z
  .object({
    goals: z.array(z.object({ id, text: z.string().min(1), when: TutorialWhenSchema }).strict()).min(1),
    tips: z.array(z.object({ id, text: z.string().min(1), when: TutorialWhenSchema }).strict()),
  })
  .strict();
export type TutorialFile = z.infer<typeof TutorialFileSchema>;

/** content/careers.json: mortal life paths (task 2.11, mortal-path.md mục 1, 2.3). */
export const CareersFileSchema = z
  .object({
    careers: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            description: z.string().min(1),
            /** Stats averaged for promotions (stat or aptitude names). */
            mainStats: z.array(z.enum([...MORTAL_STATS, ...APTITUDES])).min(1),
            rungs: z.array(z.string().min(1)).min(1),
            /** Flags from earlier events that make promotions easier. */
            bonusFlags: ids,
            bonusOrigins: ids,
            requires: z.object({ rootless: z.boolean().optional() }).strict().default({}),
            /** {rung} = the new rung's name. */
            promoteText: z.string().min(1),
            /** End-of-life title when the last rung is reached. */
            title: z.string().min(1).optional(),
            /** K.6 hooks while in this career. */
            effects: z.array(EffectHookSchema).default([]),
          })
          .strict(),
      )
      .min(1),
    /** {career}, {rung}. */
    joinText: z.string().min(1),
    leaveText: z.string().min(1),
    /** Tạp dịch hears the sect's lessons: comprehension +1. */
    eavesdropText: z.string().min(1),
    /** Title for a mortal who lives to balance.careers.longLifeAge. */
    longLifeTitle: z.string().min(1),
  })
  .strict();
export type CareersFile = z.infer<typeof CareersFileSchema>;

// ---------- Techniques and sects (task 2.4) ----------

export const TECHNIQUE_GRADES = ['hoang', 'huyen', 'dia', 'thien'] as const;
export const LINEAGES = ['tien', 'ma', 'phat', 'quy', 'yeu'] as const;

/** content/techniques.json (shared): main cultivation methods, docs/design/techniques.md. */
export const TechniqueFileSchema = z.array(
  z
    .object({
      id,
      name: z.string().min(1),
      grade: z.enum(TECHNIQUE_GRADES),
      lineage: z.enum(LINEAGES),
      /** "root": follows the main root · "any": fits every root · "none": no element, never penalised · "five": fits any basic element · or element ids. */
      elements: z.union([z.enum(['root', 'any', 'none', 'five']), z.array(id).min(1)]),
      requires: z
        .object({
          /** Learnable without a usable root (cultivation speed from đạo tâm). */
          rootless: z.boolean().optional(),
          minDaoHeart: z.number().optional(),
          minRootElements: z.number().int().min(1).optional(),
          /** Only for ghost cultivators (later task). */
          ghostOnly: z.boolean().optional(),
        })
        .strict()
        .default({}),
      /** Overrides balance.techniques.gradeMaxRealm (tàn quyển). */
      maxRealm: id.optional(),
      flavor: z.string().min(1),
      /** Rules the engine does not apply yet, shown to the player. */
      note: z.string().optional(),
      effects: z.array(EffectHookSchema),
    })
    .strict(),
);
export type Technique = z.infer<typeof TechniqueFileSchema>[number];

const SectStatsSchema = z.record(z.enum([...MORTAL_STATS, ...APTITUDES]), z.number());

/** content/worlds/<id>/sects.json: sects of one world (docs/design/sects.md). */
export const SectFileSchema = z.array(
  z
    .object({
      id,
      name: z.string().min(1),
      faction: z.enum(['chinh', 'ma', 'tan_tu', 'yeu']),
      lineage: z.enum(LINEAGES),
      /** False: in the world but not taking disciples yet. */
      recruitable: z.boolean(),
      description: z.string().min(1),
      /** Rank names from lowest (index 0) to highest. */
      ranks: z.array(z.string().min(1)).min(2),
      requires: z
        .object({
          minStats: SectStatsSchema.optional(),
          /** At least one must hold. */
          oneOf: z.array(z.object({ rootElements: z.array(id).optional(), minStats: SectStatsSchema.optional() }).strict()).optional(),
        })
        .strict(),
      /** Techniques taught, from the given rank index. */
      techniques: z.array(z.object({ id, rank: z.number().int().min(0) }).strict()),
      /** K.6 hooks while a disciple. */
      effects: z.array(EffectHookSchema),
      duty: z.string().min(1),
    })
    .strict(),
);
export type Sect = z.infer<typeof SectFileSchema>[number];

/** content/worlds/<id>/sect-life.json: sect log lines and yearly missions (task 2.5). */
const MissionOutcomeSchema = z
  .object({
    text: z.string().min(1),
    contribution: z.number(),
    spiritStones: z.number().int().min(0),
    stats: z.record(z.enum([...MORTAL_STATS, ...APTITUDES]), z.number()),
  })
  .strict();
export const SectLifeSchema = z
  .object({
    /** {sect}, {rank}, {reason}, {stones}, {master}. */
    texts: z
      .object({
        join: z.string().min(1),
        refused: z.string().min(1),
        promote: z.string().min(1),
        stipend: z.string().min(1),
        leave: z.string().min(1),
        master: z.string().min(1),
        masterRefused: z.string().min(1),
        masterTitle: z.string().min(1),
      })
      .strict(),
    missions: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1),
            minRank: z.number().int().min(0),
            text: z.string().min(1),
            stat: z.enum([...MORTAL_STATS, ...APTITUDES]),
            difficulty: z.number().min(0).max(100),
            success: MissionOutcomeSchema,
            fail: MissionOutcomeSchema,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type SectLife = z.infer<typeof SectLifeSchema>;

/** content/fate-talents.json: Nghịch Thiên Cải Mệnh talents (task 2.7, fate-talents.md). */
export const FateTalentFileSchema = z.array(
  z
    .object({
      id,
      rarity: z.enum(TRAIT_RARITIES),
      name: z.string().min(1),
      flavor: z.string().min(1),
      summary: z.string().min(1),
      /** Build tags it suits: path ids, craft ids, lineages, "cau_dao". */
      fits: ids,
      /** Only offered to this lineage. */
      requiresLineage: z.enum(LINEAGES).optional(),
      effects: z.array(EffectHookSchema).min(1),
    })
    .strict(),
);
export type FateTalent = z.infer<typeof FateTalentFileSchema>[number];

/** content/worlds/<id>/markets.json (task 3.2): where things are bought and sold. */
export const MarketFileSchema = z.array(
  z
    .object({
      id,
      name: z.string().min(1),
      description: z.string().min(1),
      /** Cultivators only (spirit stones). Mortal markets trade in silver. */
      needsRoot: z.boolean().default(false),
      currency: z.enum(['silver', 'spiritStones']),
      priceMul: z.number().min(0).default(1),
      /** Chance a bought pill is a fake (Vô Chủ Phường); sets flag `mua_hang_gia`. */
      fakeChance: probability.default(0),
      /** Item kinds on sale (items priced in this market's currency). */
      kinds: z.array(id).min(1),
      /** Log lines: a bargain won / lost ({name} = market). */
      bargainWin: z.string().min(1),
      bargainLose: z.string().min(1),
      fakeText: z.string().min(1).optional(),
    })
    .strict(),
);
export type Market = z.infer<typeof MarketFileSchema>[number];

/** What using an item does right away (task 3.1). */
const ITEM_USE_HOOK = new RegExp(
  `^(stat\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})|cultivationProgress|breakthroughNext|lifespanYears|noAgingCharm|clearFlag\\.[a-z0-9_]+|combatPowerNext|escapeNext)$`,
);
const ItemUseEffectSchema = z
  .object({ hook: z.string().regex(ITEM_USE_HOOK, 'móc dùng vật phẩm không hợp lệ'), add: z.number().optional() })
  .strict();
const ItemUseSchema = z
  .object({
    /** Log line when used (the stat changes are added after it). */
    text: z.string().min(1),
    effects: z.array(ItemUseEffectSchema).default([]),
    /** One of these happens instead, by weight (Phế Đan). */
    random: z.array(z.object({ weight: z.number().min(0), text: z.string().min(1), effects: z.array(ItemUseEffectSchema) }).strict()).default([]),
    /** Only the first use in a life works; later ones give `repeatEffects`. */
    oncePerLife: z.boolean().default(false),
    repeatEffects: z.array(ItemUseEffectSchema).default([]),
    /** Works for someone without a spirit root. */
    mortalOk: z.boolean().default(false),
    /** Kept for combat (task 3.3): cannot be used from the bag yet. */
    combatOnly: z.boolean().default(false),
  })
  .strict();

/** content/items.json (tasks 2.8, 3.1). */
export const ITEM_KINDS = ['pill', 'artifact', 'array', 'talisman', 'material', 'misc'] as const;
export const ItemFileSchema = z.array(
  z
    .object({
      id,
      name: z.string().min(1),
      kind: z.enum(ITEM_KINDS),
      description: z.string().min(1),
      /** One line for the bag: what it does. */
      summary: z.string().min(1).optional(),
      /** Base price for the market (task 3.2); none = not for sale. */
      price: z.object({ silver: z.number().int().min(0).optional(), spiritStones: z.number().int().min(0).optional() }).strict().optional(),
      /** Used up automatically on a breakthrough out of `realm`: a stage (major false) or into the next realm (major true). */
      breakthrough: z.object({ realm: id, major: z.boolean(), add: z.number() }).strict().optional(),
      use: ItemUseSchema.optional(),
      /** K.6 hooks while the item is in the bag; the same hook from several items counts once, the strongest. */
      carried: z.array(EffectHookSchema).default([]),
    })
    .strict(),
);
export type Item = z.infer<typeof ItemFileSchema>[number];

/** content/combat.json: fight texts (task 3.3). {foe} = foe name, {name} = player. */
const pool = z.array(z.string().min(1)).min(1);
export const COMBAT_ACTIONS = ['all_out', 'item', 'defend', 'flee', 'plead'] as const;
const actionText = z.object({ name: z.string().min(1), hint: z.string().min(1) }).strict();
export const CombatTextsSchema = z
  .object({
    start: z.string().min(1),
    intent: z.object({ teach: z.string().min(1), rob: z.string().min(1), kill: z.string().min(1) }).strict(),
    actions: z.object(Object.fromEntries(COMBAT_ACTIONS.map((a) => [a, actionText])) as Record<CombatAction, typeof actionText>).strict(),
    /** Round won, by the player's path ("none" when no path yet). */
    hit: z.record(pool),
    /** Extra words when the player's element beats the foe's. */
    counter: pool,
    /** Round lost. */
    miss: pool,
    defendHit: pool,
    defendMiss: pool,
    itemHit: pool,
    fleeOk: pool,
    fleeFail: pool,
    pleaOk: z.object({ teach: pool, rob: pool, kill: pool }).strict(),
    pleaFail: pool,
    won: z.string().min(1),
    after: z.object({ spare: z.string().min(1), loot: z.string().min(1), kill: z.string().min(1) }).strict(),
    lost: z.object({ teach: z.string().min(1), rob: z.string().min(1), kill: z.string().min(1), killEscape: z.string().min(1) }).strict(),
  })
  .strict();
export type CombatTexts = z.infer<typeof CombatTextsSchema>;
export type FoeSpec = z.infer<typeof FoeSpecSchema>;
export type Fight = z.infer<typeof FightSchema>;
export type CombatAction = (typeof COMBAT_ACTIONS)[number];
