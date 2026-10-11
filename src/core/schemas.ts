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
  })
  .catchall(z.number())
  .superRefine((e, ctx) => {
    const lists = ['setFlags', 'clearFlags', 'addItems', 'removeItems', 'addTraits', 'followUp'];
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
  })
  .strict();
export type World = z.infer<typeof WorldSchema>;

export const NamesSchema = z
  .object({
    surnames: z.array(z.string().min(1)).min(1),
    male: z.array(z.string().min(1)).min(1),
    female: z.array(z.string().min(1)).min(1),
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
    ].join('|') +
    ')$',
);
const MUL_HOOK = /^eventWeight\.[a-z0-9_]+$/;
const FLAG_HOOK = /^(agingSlow|unlockChain\.[a-z0-9_]+)$/;

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
        deathHappiness: z.number(),
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
    deathOldAge: lines,
    deathIllness: lines,
    epitaph: z.object({ good: lines, bad: lines, plain: lines }).strict(),
  })
  .strict();
export type LifeTexts = z.infer<typeof LifeTextsSchema>;
