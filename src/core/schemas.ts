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
/** Task 3.9: faction reputation is readable too. */
export const REPUTATION_KEYS = ['chinh', 'ma', 'tan_tu', 'yeu', 'trieu_dinh', 'giang_ho'].map((f) => `reputation.${f}`);
export const READ_KEYS = [...NUMERIC_KEYS, ...CRAFT_KEYS, 'sect.contribution', ...REPUTATION_KEYS];
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
    /** Task 5b.2: Kim Thủ Chỉ: has one (or not), one of these, awakened to at least this level. */
    goldenFinger: z.object({ has: z.boolean().optional(), id: ids.optional(), minLevel: z.number().int().min(1).optional() }).strict().optional(),
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
    /** Martial stage index range (task 3.11; -1 = not yet Tam lưu). */
    martial: z.object({ min: z.number().int().optional(), max: z.number().int().optional(), ready: z.boolean().optional() }).strict().optional(),
    /** Born into one of these origins. */
    origins: ids,
    /** Task 3.9: items carried (all of them). */
    itemsAll: ids,
    /**
     * Task 3.6: romance. Any romance condition also needs the player of age (balance.romance.minAge),
     * not on the Phật đạo, and the target (if any) alive and of age. `target` makes the event about
     * that person ({npc}, {lover}, npc effects).
     */
    romance: z
      .object({
        /** ex: the most recent person who turned the player down or was left, still alive. */
        target: z.enum(['lover', 'partner', 'beloved', 'ex']).optional(),
        lover: z.boolean().optional(),
        couple: z.boolean().optional(),
        partner: z.boolean().optional(),
        /** The target's affinity range. */
        minAffinity: z.number().optional(),
        maxAffinity: z.number().optional(),
        /** The target cultivates (has a root) or is a mortal. */
        targetRooted: z.boolean().optional(),
        /** Someone who turned the player down, or whom the player left, is still alive. */
        ex: z.boolean().optional(),
      })
      .strict()
      .optional(),
    /** Task 5.3: the sect this life founded: has one, member range, a building at least this level. */
    ownSect: z
      .object({
        has: z.boolean().optional(),
        minMembers: z.number().int().optional(),
        maxMembers: z.number().int().optional(),
        building: z.object({ id, min: z.number().int().min(1) }).strict().optional(),
      })
      .strict()
      .optional(),
    /** Task 5.5: the khí vận chi tử disciple: this life has (had) one; alive, of these templates, taken at least minYears ago. */
    chosen: z
      .object({
        has: z.boolean().optional(),
        template: ids.optional(),
        minYears: z.number().int().min(0).optional(),
        /** Task 5.6: the master's role so far ("none" = not chosen yet). */
        role: z.array(z.enum(['protect', 'exploit', 'ignore', 'none'])).optional(),
      })
      .strict()
      .optional(),
    /** Task 3.9: family state ({deceased} = a relative who has died). */
    family: z.object({ deadAny: z.boolean().optional(), parentAlive: z.boolean().optional() }).strict().optional(),
    /** Task 4.10: nearEnd = years left ≤ balance.lifespan.pressureLeftPct of the lifespan; maxLeft = at most this many years left. */
    lifespan: z.object({ nearEnd: z.boolean().optional(), maxLeft: z.number().int().min(0).optional() }).strict().optional(),
    /** Task 3.4: the NPC this event is about (met earlier, or picked by an npcTrigger). */
    npc: z
      .object({
        present: z.boolean().optional(),
        minGrudge: z.number().optional(),
        minFavor: z.number().optional(),
        /** Kin of someone the player killed. */
        heir: z.boolean().optional(),
        natureKnown: z.boolean().optional(),
        /** Their hidden nature does not match the face they show. */
        masked: z.boolean().optional(),
        /** Their realm compared to the player's: -1 lower, 0 same, 1 higher. */
        minRealmGap: z.number().int().optional(),
        maxRealmGap: z.number().int().optional(),
      })
      .strict()
      .optional(),
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
    /** Task 3.8: combat path aptitude gained. */
    pathAffinity: z.record(z.enum(['sword', 'body', 'spell', 'weapon', 'arts']), z.number()).optional(),
    /** Mortal careers. */
    joinCareer: id.optional(),
    careerPromote: z.boolean().optional(),
    leaveCareer: z.boolean().optional(),
    /** Task 3.12: this choice kills someone (Phật đạo precepts). */
    kill: z.boolean().optional(),
    /** Task 3.11: martial path. */
    martialPromote: z.boolean().optional(),
    martialAttempt: z.boolean().optional(),
    martialYears: z.number().int().optional(),
    /** Extra % for the next martial breakthrough. */
    martialBonus: z.number().optional(),
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
    /** Task 3.4: meet someone new; they become this event's NPC ({npc} in texts). affinity is added to a stranger's 50. */
    meetNpc: z
      .object({
        role: z.string().min(1),
        /** Task 3.9: always an adult (romance.minAge), e.g. someone rescued in a mature event. */
        adult: z.boolean().optional(),
        realm: z.string().optional(),
        stage: z.number().int().min(0).optional(),
        root: z.boolean().optional(),
        affinity: z.number().optional(),
        favor: z.number().optional(),
        grudge: z.number().optional(),
      })
      .strict()
      .optional(),
    /** Task 5.3: the founded sect gains or loses members, treasury, next year's growth. */
    ownSect: z.object({ members: z.number().int().optional(), treasury: z.number().int().optional(), growthBonus: z.number().optional() }).strict().optional(),
    /** Task 5.5: take a khí vận chi tử of this template as a disciple (beyond the realm's disciple limit). */
    chosenOne: id.optional(),
    /** Task 5b.2: gain this Kim Thủ Chỉ ("random": any), only when the life has none yet. */
    goldenFinger: id.optional(),
    /** Task 5b.2: the Kim Thủ Chỉ is gone (given up, taken, or the remnant soul driven out). */
    loseGoldenFinger: z.boolean().optional(),
    /** Task 5.6: the master's role towards the khí vận chi tử; "ignore" lets them leave the master's door. */
    chosenRole: z.enum(['protect', 'exploit', 'ignore']).optional(),
    /** Task 4.6: the next step of a multi-step event (bí cảnh); it opens right after this one, the same year. */
    chain: id.optional(),
    /** Task 4.1: close the door for this many years right after the event. */
    seclusionYears: z.number().int().min(1).optional(),
    /** Task 3.9: years of lifespan (burning blood: −10). */
    lifespanYears: z.number().int().optional(),
    /** Task 4.10: share of the current lifespan added (a seized young body: +0.3); scales with the realm. */
    lifespanPct: z.number().optional(),
    /** Task 3.9: tâm ma seeds (counted for the heart-demon system to come). */
    /** Tâm ma gained (task 3.9); gains shrink by the heartDemonResist hook (task 3.10), losses do not. */
    heartDemon: z.number().int().optional(),
    /** Task 3.9: the oldest living parent dies at the end of the year (grief as usual). */
    relativeDies: z.enum(['mother', 'father', 'parent']).optional(),
    /** Task 3.6: romance with the event's NPC: start courting them, lose them, become a couple; rivals appear or are exposed. */
    romance: z
      .object({
        pursue: z.boolean().optional(),
        lose: z.boolean().optional(),
        couple: z.boolean().optional(),
        rival: z.number().int().optional(),
        rivalExposed: z.boolean().optional(),
        /** Task 3.7: wed the event's NPC (a political match starts at this affinity). */
        marry: z.object({ affinity: z.number().optional() }).strict().optional(),
        /** Task 3.7: the đạo lữ's cultivation progress (+% of a stage). */
        partnerProgress: z.number().optional(),
        /** Task 3.9: the lover's (else the đạo lữ's) affinity, when the event is about someone else. */
        loverAffinity: z.number().optional(),
      })
      .strict()
      .optional(),
    /** Task 3.4: change this event's NPC (sổ ân oán); kill passes the grudge on to kin. */
    npc: z
      .object({
        affinity: z.number().optional(),
        favor: z.number().optional(),
        grudge: z.number().optional(),
        reveal: z.boolean().optional(),
        kill: z.boolean().optional(),
        role: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .catchall(z.number())
  .superRefine((e, ctx) => {
    const lists = ['setFlags', 'clearFlags', 'addItems', 'removeItems', 'addTraits', 'followUp', 'testRoot', 'grantRoot', 'learnTechnique', 'joinSect', 'sectContribution', 'sectPromote', 'leaveSect',
      'cultProgress', 'speedBuff', 'craftXp', 'reputation', 'nextBreakthroughBonus', 'reducePeakFails', 'gainTechnique',
      'joinCareer', 'careerPromote', 'leaveCareer', 'gainMaster', 'martialPromote', 'martialAttempt', 'martialYears', 'martialBonus', 'kill', 'pathAffinity', 'meetNpc', 'npc', 'romance', 'lifespanYears', 'lifespanPct', 'chain', 'heartDemon', 'relativeDies', 'seclusionYears', 'ownSect', 'chosenOne', 'chosenRole', 'goldenFinger', 'loseGoldenFinger'];
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
    /** Task 5.3: the foe attacks the founded sect: Hộ Sơn Đại Trận weakens them (balance.founding.defensePerLevel). */
    againstSect: z.boolean().default(false),
    /** Task 3.4: the foe is this event's NPC, at their own realm and stage (name, realm, stage are ignored). */
    fromNpc: z.boolean().default(false),
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
    /** Task 5b.8: fighting to save someone; dying in it sets flag chet_vi_cuu_nguoi (Phúc báo). */
    rescue: z.boolean().optional(),
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
    /** Task 3.4: not in the yearly pool; fires when an NPC's ledger calls for it (that NPC is the event's NPC). */
    npcTrigger: z.enum(['revenge', 'repay', 'reveal']).optional(),
    /** Task 4.10: fires as soon as it is eligible, ahead of the yearly roll (due follow-ups still come first). */
    urgent: z.boolean().default(false),
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
    /** Task 5b.9 Cầu đầu thai: choosing this origin costs Luân Hồi points (random draws are free). */
    rebirthCost: z.number().int().min(1).optional(),
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
      // Task 4.5: share of each thiên lôi a carried array or artifact takes; task 4.12: chance to linger as a ghost.
      'tribulationDefense', 'continueAfterDeath',
      // Task 5b.8: extra spirit-root rolls at the root test, best kept (Phúc báo).
      'rootReroll',
      // Special bodies (realms-roots-paths.md B5); takes effect from task 2.3.
      'lineage\\.(tien|ma|phat|quy|yeu)\\.cultivationSpeed',
    ].join('|') +
    ')$',
);
const MUL_HOOK = /^eventWeight\.[a-z0-9_]+$/;
const FLAG_HOOK = /^(agingSlow|unlockChain\.[a-z0-9_]+|cannotWork|noLineageChange|blockEvent\.[a-z0-9_]+|ignoreElementWeakness|rewindOnDeath|readMind)$/;

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
        /** Task 5b.3: slots never go above this (thiên phú luân hồi add up to it). */
        maxSlots: z.number().int().min(1),
        /** Task 5b.3: slots one may lock before rerolling, and the Luân Hồi points each lock costs (paid on confirming). */
        locks: z.number().int().min(0),
        lockCost: z.number().int().min(0),
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
          .object({ father: griefRange, mother: griefRange, sibling: griefRange, child: griefRange, parentDaoHeart: z.number() })
          .strict(),
      })
      .strict(),
    lifespan: z
      .object({
        mortalBase: z.number().int().min(1),
        mortalVariance: z.number().int().min(0),
        healthAdjustMax: z.number().int().min(0),
        /** Task 4.10: "đại hạn sắp tới" once the years left are at most this share of the lifespan. */
        pressureLeftPct: probability,
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
        /** agingSlow hook: decline, illness and milestones come this many years later. */
        slowAgingYears: z.number().int().min(0),
        /** |karma| at or above this picks a good/bad epitaph. */
        epitaphKarma: z.number().min(0).max(100),
        /** At these ages the body takes a visible blow (stat-extremes-approved.md §3). */
        milestoneAges: z.array(z.number().int().min(1)),
        milestoneHealth: z.number(),
        milestoneCharm: z.number(),
      })
      .strict(),
    /** Task 3.4: NPCs with their own fate. */
    npcs: z
      .object({
        /** Most NPCs remembered; past that the least important one is forgotten. */
        max: z.number().int().min(1),
        /** New NPC's age = player's age + a value in this range (never under minAge). */
        ageOffset: z.tuple([z.number().int(), z.number().int()]),
        minAge: z.number().int().min(0),
        /** Chance a new NPC has a spirit root, and their aptitude range (0–100). */
        rootChance: probability,
        aptitude: z.tuple([z.number().int(), z.number().int()]),
        /** NPC cultivation: % of a stage a year = realm speedPct × (speedBase + aptitude / speedDivisor). */
        speedBase: z.number().min(0),
        speedDivisor: z.number().positive(),
        /** Chance of a sudden death each year (before old age). */
        deathPerYear: probability,
        /** Ân and oán fade by this much a year. */
        fadePerYear: z.number().min(0),
        /** Nature shows once affinity reaches this. */
        revealAffinity: z.number(),
        /** The log reports big news only for NPCs this close, or with a grudge. */
        newsAffinity: z.number(),
        /** Revenge: grudge at least revengeAt; chance a year (higher if the NPC is stronger). */
        revengeAt: z.number(),
        revengeChance: probability,
        /** Repaying a kindness: favor at least repayAt; chance a year. */
        repayAt: z.number(),
        repayChance: probability,
        /** Revenge chance × this when the NPC's realm is above the player's. */
        revengeStrongerMul: z.number().min(0),
        /** Chance a year that a masked NPC (nature ≠ surface) shows their true face. */
        revealChance: probability,
        /** Share of a dead NPC's grudge their kin inherits. */
        inheritShare: probability,
      })
      .strict(),
    /** Task 5.4: founding a cultivation clan. */
    clan: z
      .object({
        minRealm: id,
        /** Living children needed, and the spirit stones for the ancestral hall. */
        minChildren: z.number().int().min(0),
        cost: z.number().int().min(0),
        maxRules: z.number().int().min(1),
      })
      .strict(),
    /** Task 5.7: going on as an heir. */
    heir: z
      .object({
        /** Youngest heir who can carry on. */
        minAge: z.number().int().min(0),
        /** Share of silver and spirit stones passed on; share of karma and reputation (phúc ấm). */
        inheritMoney: probability,
        inheritKarma: probability,
      })
      .strict(),
    /** Task 5.1: founding one's own sect. */
    founding: z
      .object({
        minRealm: id,
        /** Spirit stones to open a mountain gate. */
        cost: z.number().int().min(0),
        /** How many tông quy to pick, and how long a name may be. */
        maxRules: z.number().int().min(1),
        nameLength: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
        /** Members on the founding day: base + reputation of the founder's realm. */
        startMembers: z.record(id, z.number().int().min(0)),
        /** Task 5.2 yearly running: growth = members × growth (+ buildings, rules), at least baseRecruit; attrition share leaves. */
        growth: z.number().min(0),
        baseRecruit: z.number().int().min(0),
        attrition: probability,
        /** Spirit stones each member brings the treasury a year. */
        tithe: z.number().min(0),
        /** Most members the founder's realm can hold. */
        maxMembers: z.record(id, z.number().int().min(0)),
        /** Task 5.3: each level of sect defense takes this share off an attacker's power (capped at maxDefense). */
        defensePerLevel: z.number().min(0),
        maxDefense: z.number().min(0).max(1),
        /** Spirit stones the master puts into the treasury with one tap. */
        donation: z.number().int().min(1),
        /** How many decisions a yearly report asks for. */
        decisions: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
      })
      .strict(),
    /** Task 4.9: taking disciples. */
    disciples: z
      .object({
        /** Realm → most disciples at once (realms not listed take none). */
        maxByRealm: z.record(id, z.number().int().min(0)),
        /** A new disciple's age and aptitude ranges, and starting affinity. */
        age: z.tuple([z.number().int(), z.number().int()]),
        aptitude: z.tuple([z.number().int(), z.number().int()]),
        affinity: z.number(),
        /** Teaching once a year: the disciple's progress (+% of a stage × (0.5 + teacher's comprehension / 100)), affinity, favor; the teacher's own progress. */
        teachProgress: z.number(),
        teachAffinity: z.number(),
        teachFavor: z.number(),
        teacherProgress: z.number(),
      })
      .strict(),
    /** Task 5.5: khí vận chi tử. Hào quang: faster cultivation, an easier breakthrough, no sudden death. */
    chosen: z
      .object({
        age: z.tuple([z.number().int(), z.number().int()]),
        affinity: z.number(),
        progressMul: z.number().min(1),
        breakthroughBonus: probability,
      })
      .strict(),
    /** Task 4.7: making pills and artifacts. */
    crafting: z
      .object({
        /** Chance = base + (level − recipe.minLevel) × perLevel + (comprehension − 50) × perComprehension + craft.<id>.success hooks. */
        base: z.number(),
        perLevel: z.number(),
        perComprehension: z.number(),
        min: probability,
        max: probability,
        /** Craft levels gained by a success and by a failure. */
        xpSuccess: z.number().int().min(0),
        xpFail: z.number().int().min(0),
        /** What a failed attempt leaves in the furnace, by craft (Phế Đan for alchemy). */
        failProduct: z.record(id, id),
      })
      .strict(),
    /** Task 4.4: tâm ma chiến before a big breakthrough into these realms. */
    heartDemon: z
      .object({
        realms: ids,
        /** It comes when tâm ma seeds ≥ seeds, or đạo tâm < daoHeartBelow, or karma ≤ karmaAtMost. */
        seeds: z.number().int().min(1),
        daoHeartBelow: z.number(),
        karmaAtMost: z.number(),
        rounds: z.number().int().min(1),
        /** Rounds won needed to pass. */
        toPass: z.number().int().min(1),
        /** Check difficulty: base + seeds × perSeed; chant gets heartDemonResist × 100 as bonus points. */
        difficulty: z.number(),
        perSeed: z.number(),
        /** Passing: seeds cleared by this many, chance bonus; failing: đạo tâm lost (plus a failed breakthrough). */
        passClears: z.number().int().min(0),
        passBonusPct: z.number(),
        failDaoHeart: z.number(),
        /** Facing a wrong owned up to: đạo tâm gained on a win. */
        faceDaoHeart: z.number(),
      })
      .strict(),
    /** Task 4.5: thiên kiếp when a big breakthrough succeeds into these realms. */
    tribulation: z
      .object({
        /** Realm → number of thiên lôi and the health each takes before any defense. */
        realms: z.record(id, z.object({ strikes: z.number().int().min(1), power: z.number().min(0) }).strict()),
        /** Each strike's power × a random factor in this range; the last strike × finalMul. */
        variance: z.tuple([z.number().positive(), z.number().positive()]),
        finalMul: z.number().min(1),
        /** Reduction: injuryReduce + tribulationDefense hooks + (physique − 50) × physiquePerPoint + root element bonuses, capped at maxReduce. */
        physiquePerPoint: z.number(),
        elementReduce: z.record(id, z.number()),
        maxReduce: z.number().min(0).max(1),
        /** Thân thể tôi luyện: physique gained by surviving. */
        survivePhysique: z.number().int(),
      })
      .strict(),
    /** Task 4.12: quỷ tu after death (mortal-path.md 2.6). */
    ghost: z
      .object({
        /** Chance of a lingering obsession by cause of death, + (luck − 50) × luckPerPoint + continueAfterDeath hooks. */
        causeChance: z.record(z.enum(['old_age', 'illness', 'breakthrough', 'ordeal', 'combat', 'tribulation']), probability),
        luckPerPoint: z.number(),
        maxChance: probability,
        /** The ghost's realm (at least), its technique, health on rising and years of afterlife. */
        realm: id,
        technique: id,
        health: z.number().int().min(1).max(100),
        lifespanYears: z.number().int().min(1),
      })
      .strict(),
    /** Task 4.2: kết đan, three rounds of placing qi strands into the core. */
    coreForming: z
      .object({
        /** The realm entered through kết đan. */
        realm: id,
        rounds: z.number().int().min(1),
        /** Strands offered each round, and the chance one of them is a variant element. */
        offered: z.number().int().min(1),
        variantChance: probability,
        /** Starting purity: base + (comprehension − 50) × perPoint + the Trúc Cơ foundation's bonus. */
        startPurity: z.number(),
        comprehensionPerPoint: z.number(),
        foundationBonus: z.record(id, z.number()),
        /** Purity per strand: always, matching the root, flowing from the last (generates), matching the technique. */
        baseGain: z.number(),
        rootMatch: z.number(),
        flow: z.number(),
        techniqueMatch: z.number(),
        /** Clashing with the last strand (one beats the other): purity lost and a crack; this many cracks break the core. */
        clashPurity: z.number(),
        crackLimit: z.number().int().min(1),
        /** Ngũ hành tương sinh: element → the element it feeds. */
        generates: z.record(id, id),
        /** Breakthrough chance + (purity − 50) × this. */
        purityChancePerPoint: z.number(),
        /** Minimum purity for grades 1..8 (else 9); speed × and fate-talent tier (a foundation id) for grades 1..9. */
        gradeThresholds: z.array(z.number()).length(8),
        gradeSpeed: z.array(z.number().positive()).length(9),
        fateTier: z.array(id).length(9),
      })
      .strict(),
    /** Task 4.1: bế quan (PLAN G.1: ×1.5 speed, no ordinary events). */
    seclusion: z
      .object({
        speedMul: z.number().min(1),
        /** Year counts offered at each realm (higher realms close the door for longer). */
        options: z.record(id, z.array(z.number().int().min(1)).min(1)),
        /** Come out early when this few years of lifespan are left. */
        lifespanStop: z.number().int().min(0),
        /** Lover and đạo lữ grow distant: affinity change per year in seclusion. */
        lonelyAffinity: z.number(),
      })
      .strict(),
    /** Task 3.6: romance (thiện cảm, theo đuổi, tặng quà, tỏ tình). */
    romance: z
      .object({
        /** Nobody younger takes part in romance (PLAN H). */
        minAge: z.number().int().min(18),
        /** Gift: silver for a mortal player, spirit stones for a cultivator; affinity gained (+ charm above 50 ÷ giftCharmDivisor). */
        giftSilver: z.number().int().min(0),
        giftStones: z.number().int().min(0),
        giftAffinity: z.tuple([z.number().int(), z.number().int()]),
        giftCharmDivisor: z.number().positive(),
        /** Below this affinity a gift may be turned down. */
        rejectBelow: z.number(),
        rejectChance: probability,
        rejectAffinity: z.number(),
        /** A masked lover (nature hidden behind a kind face) may use the player: extra money lost. */
        usedChance: probability,
        usedSilver: z.number().int().min(0),
        usedStones: z.number().int().min(0),
        /** Confession: needs this affinity; chance = base + (affinity − confessAt) × perAffinity + (charm − 50) × perCharm. */
        confessAt: z.number(),
        confessBase: z.number(),
        confessPerAffinity: z.number(),
        confessPerCharm: z.number(),
        confessMin: probability,
        confessMax: probability,
        confessHappiness: z.number(),
        rejectHappiness: z.number(),
        rejectDaoHeart: z.number(),
        /** Losing a lover or partner to death. */
        griefHappiness: z.number(),
        /** Each rival costs this much affinity a year with the lover. */
        rivalAffinityPerYear: z.number(),
        /** Task 3.7: wedding cost (silver for a mortal, spirit stones for a cultivator) and joy. */
        weddingSilver: z.number().int().min(0),
        weddingStones: z.number().int().min(0),
        weddingHappiness: z.number(),
        /** Song tu with a cultivating đạo lữ: yearly cultivation × this (PLAN G.1). */
        dualCultivationMul: z.number().min(1),
        /** Trying for a child once a year: base chance, × cultivatorFertility per cultivating parent; the mother's age limit. */
        birthChance: probability,
        cultivatorFertility: z.number().min(0).max(1),
        motherMaxAge: z.number().int(),
        cultivatorMotherMaxAge: z.number().int(),
        maxChildren: z.number().int().min(0),
        childHappiness: z.number(),
        /** Inheritance: roll the root this many extra times per rooted parent and keep the best; elements come from the player's first. */
        rootRollsPerParent: z.number().int().min(0),
        /** Chance the child mutates into a variant root, or inherits the player's special body. */
        mutationChance: probability,
        bodyInheritChance: probability,
      })
      .strict(),
    /** Task 3.5: Thiên kiêu bảng, the world's young prodigies. */
    rankings: z
      .object({
        /** Prodigies the world keeps; size of the board shown. */
        count: z.number().int().min(1),
        size: z.number().int().min(1),
        /** First prodigies' age = player's age + this; replacements start at newAge. */
        ageOffset: z.tuple([z.number().int(), z.number().int()]),
        newAge: z.tuple([z.number().int(), z.number().int()]),
        /** Age they start cultivating; past maxAge nobody counts as a prodigy (the player neither). */
        startAge: z.number().int().min(0),
        maxAge: z.number().int().min(1),
        aptitude: z.tuple([z.number().int(), z.number().int()]),
        /** % of a stage a year = realm speedPct × (speedBase + aptitude / speedDivisor). */
        speedBase: z.number().min(0),
        speedDivisor: z.number().positive(),
        /** Big breakthrough chance = balance.realms breakthroughChance × this. */
        breakthroughMul: z.number().min(0),
        deathPerYear: probability,
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
        /** Escape chance + divineSense × this. */
        divineSenseEscape: z.number().min(0),
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
        /** Task 3.10: the most the priceDiscount hook (Khéo Mồm, Mắt Tinh…) can take off buying prices. */
        maxDiscount: probability,
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
    /** Task 3.12: Phật đạo precepts (techniques.md C5): killing costs đạo tâm; too many breaks and the temple expels you. */
    buddhism: z
      .object({ precepts: z.object({ killDaoHeart: z.number(), maxBreaks: z.number().int().min(1) }).strict() })
      .strict(),
    /** Task 3.11: martial path for mortals (mortal-path.md 2b). Index i = stage V(i+1). */
    martial: z
      .object({
        minAge: z.number().int().min(0),
        combatPower: z.array(z.number().min(0)).min(1),
        /** Lifespan added on reaching each stage. */
        lifespan: z.array(z.number().int().min(0)).min(1),
        /** Training into stage i (steps[0] = into Tam lưu). Stages past the list need a kỳ ngộ. */
        steps: z.array(
          z
            .object({
              years: z.number().int().min(1),
              /** Averaged for the check. */
              stats: z.array(z.enum([...MORTAL_STATS, ...APTITUDES])).min(1),
              difficulty: z.number(),
              needsTeacher: z.boolean().optional(),
              minPhysique: z.number().optional(),
              /** Overrides the default years lost on a failed attempt. */
              failYearsBack: z.number().int().min(0).optional(),
            })
            .strict(),
        ),
        chanceBase: probability,
        chancePerPoint: z.number().min(0),
        chanceMin: probability,
        chanceMax: probability,
        /** Training years lost on a failed attempt. */
        failYearsBack: z.number().int().min(0),
        oldAge: z.number().int(),
        oldAgeMul: z.number().min(0),
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
    /** Task 5b.1: Luân Hồi points a life earns (rebirth.ts rebirthPoints). */
    rebirth: z
      .object({
        yearsPerPoint: z.number().int().min(1),
        /** Per realm above Phàm Nhân, plus per stage in the realm reached. */
        perRealm: z.number().int().min(0),
        perStage: z.number().int().min(0),
        /** Mortals only: per martial stage reached. */
        perMartialStage: z.number().int().min(0),
        perCareerRung: z.number().int().min(0),
        eventsPerPoint: z.number().int().min(1),
        /** |karma| at or above this gives karmaPoints (đại thiện or đại ác). */
        karmaAt: z.number().int().min(0).max(100),
        karmaPoints: z.number().int().min(0),
        perChild: z.number().int().min(0),
        ownSect: z.number().int().min(0),
        clan: z.number().int().min(0),
        ranked: z.number().int().min(0),
        /** Rare moments of the log shown on the death screen. */
        highlights: z.number().int().min(0),
      })
      .strict(),
    /** Task 5b.2: Kim Thủ Chỉ at birth: chance + per life played (capped), sure after pityLives lives without one. */
    goldenFinger: z
      .object({
        birthChance: probability,
        perLife: probability,
        maxChance: probability,
        pityLives: z.number().int().min(1),
        /** Task 5b.5: Luân Hồi points to choose a Kim Thủ Chỉ unlocked by a thành tựu. */
        chooseCost: z.number().int().min(0),
      })
      .strict(),
    /** Task 5b.5: huy hiệu cuối đời shown on the death screen and the obituary card. */
    badges: z.object({ max: z.number().int().min(1) }).strict(),
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
    roles: z.array(z.enum(['father', 'mother', 'sibling', 'child'])).default([]),
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
    /** Task 4.5: struck down by thiên kiếp. */
    deathTribulation: lines,
    deathIllness: lines,
    /** Task 4.12 quỷ tu: the offer on the death screen, and the line when the soul rises. */
    ghostOffer: z.string().min(1),
    ghostRise: z.string().min(1),
    /** Task 5b.10 Trùng sinh: the offer on the death screen, and the line on going back ({age} died, {back} back to). */
    rewindOffer: z.string().min(1),
    rewindAge6: z.string().min(1),
    rewindRealm: z.string().min(1),
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
    /** Task 4.5 thiên kiếp. {count} = strikes, {n} = this strike, {damage} = health lost. */
    tribulationStart: z.string().min(1),
    tribulationStrike: z.array(z.string().min(1)).min(1),
    tribulationJade: z.string().min(1),
    tribulationPassed: z.string().min(1),
    /** Task 4.1. {years}, {realm}, {stage}. */
    seclusionStart: z.string().min(1),
    seclusionYear: z.string().min(1),
    seclusionEnd: z.string().min(1),
    seclusionPeak: z.string().min(1),
    seclusionLifespan: z.string().min(1),
    /** Task 4.2 kết đan. {grade} = "Tam phẩm", {element} = an element name. */
    coreStart: z.string().min(1),
    coreRoot: z.string().min(1),
    coreFlow: z.string().min(1),
    coreClash: z.string().min(1),
    corePlain: z.string().min(1),
    coreSuccess: z.string().min(1),
    coreShattered: z.string().min(1),
    /** Task 4.2: the đan văn that formed ({pattern}, {text}). */
    corePattern: z.string().min(1),
    /** Task 4.3: the Nguyên Anh's form ({form}, {text}). */
    soulForm: z.string().min(1),
      })
      .strict(),
    /** Display names for technique grades and lineages (task 2.4). */
    /** Task 4.2: Kim Đan grade names, 1..9. */
  coreGradeNames: z.array(z.string().min(1)).length(9),
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
          /** Phật duyên (task 3.12): takes people without a usable root when đạo tâm reaches this. */
          rootlessMinDaoHeart: z.number().optional(),
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
        /** Task 3.12: a Phật đạo cultivator kills; expelled after too many breaks ({sect}). */
        preceptBroken: z.string().min(1),
        expelled: z.string().min(1),
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

/** content/worlds/<id>/regions.json (task 4.8): the đại vực of a world; the first one is home. */
export const RegionFileSchema = z.array(
  z
    .object({
      id,
      name: z.string().min(1),
      description: z.string().min(1),
      /** Realm needed to travel there; none = open from birth. */
      minRealm: id.optional(),
      /** Linh khí of the region (PLAN G.1, 0.5 to 2.0); multiplies the world's. */
      qi: z.number().min(0.5).max(2),
      /** Event theme → weight × while here (yêu thú in the mountains…). */
      eventWeight: z.record(id, z.number().min(0)).default({}),
      /** K.6 hooks while here. */
      effects: z.array(EffectHookSchema).default([]),
      /** One line for the map: what living here is like. */
      summary: z.string().min(1),
      /** Logged on arrival. */
      enterText: z.string().min(1),
      /** Đại năng trấn giữ: who keeps this region, shown on the map and met on the first visit. */
      guardian: z.object({ name: z.string().min(1), title: z.string().min(1), realm: id, text: z.string().min(1) }).strict(),
    })
    .strict(),
);
export type Region = z.infer<typeof RegionFileSchema>[number];

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
  `^(stat\\.(${[...MORTAL_STATS, ...APTITUDES].join('|')})|cultivationProgress|breakthroughNext|lifespanYears|noAgingCharm|clearFlag\\.[a-z0-9_]+|combatPowerNext|escapeNext|karma)$`,
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
    /** Burnt during a fight (task 3.3), not from the bag. */
    combatOnly: z.boolean().default(false),
    /** Only this lineage (đạo thống) can use it (Nội đan: ma tu hấp thu). */
    lineage: id.optional(),
    /** Lineage id → effects that replace `effects` for that lineage (Huyết Đan ×1.5 for ma tu). */
    lineageEffects: z.record(z.array(ItemUseEffectSchema)).default({}),
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
      /** False: markets buy it but never put it on the stall (rare finds). */
      forSale: z.boolean().default(true),
      /** Used up automatically on a breakthrough out of `realm`: a stage (major false) or into the next realm (major true). */
      breakthrough: z.object({ realm: id, major: z.boolean(), add: z.number() }).strict().optional(),
      use: ItemUseSchema.optional(),
      /** K.6 hooks while the item is in the bag; the same hook from several items counts once, the strongest. */
      carried: z.array(EffectHookSchema).default([]),
    })
    .strict(),
);
export type Item = z.infer<typeof ItemFileSchema>[number];

/** content/martial.json: martial stages for mortals (task 3.11, mortal-path.md 2b). */
export const MartialFileSchema = z
  .object({
    stages: z.array(z.object({ name: z.string().min(1), description: z.string().min(1) }).strict()).min(1),
    /** What counts as "bí kíp hoặc sư phụ" for stages that need a teacher. */
    teacher: z.object({ flags: ids, careers: ids, origins: ids }).strict(),
    /** Kept after Ngũ khí triều nguyên brings the life into Luyện Khí. */
    ascendEffects: z.array(EffectHookSchema),
    /** {years}, {need}, {next}, {stage}, {description}. */
    texts: z.object({ train: z.string().min(1), promote: z.string().min(1), fail: z.string().min(1), ascend: z.string().min(1) }).strict(),
  })
  .strict();
export type MartialFile = z.infer<typeof MartialFileSchema>;

/** content/lineages.json: đạo thống (task 3.8, PLAN K.3.1). Speed multipliers live in balance.techniques.lineageMul. */
const StatDeltaSchema = z.record(z.enum([...MORTAL_STATS, ...APTITUDES]), z.number());
export const LineageFileSchema = z.array(
  z
    .object({
      id: z.enum(LINEAGES),
      name: z.string().min(1),
      strengths: z.string().min(1),
      costs: z.string().min(1),
      /** K.6 hooks while following this lineage. */
      effects: z.array(EffectHookSchema),
      /** Stats changed once, the first time this life takes up the lineage. */
      onAdopt: StatDeltaSchema,
      /** Stats changed every year while following it (Quỷ đạo: health wears away). */
      perYear: StatDeltaSchema,
      karmaPerYear: z.number().optional(),
    })
    .strict(),
);
export type Lineage = z.infer<typeof LineageFileSchema>[number];
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

/** content/npc-traits.json (task 3.4): NPC personalities and life goals. */
const npcTrait = z.object({ id, name: z.string().min(1), text: z.string().min(1) }).strict();
export const NpcTraitsFileSchema = z
  .object({
    /** Bề ngoài: what the player sees. */
    surface: z.array(npcTrait),
    /** Bản chất: hidden until affinity is high or an event shows it. */
    nature: z.array(
      npcTrait.extend({
        /** Grudge fades at this × balance.npcs.fadePerYear (0: never forgets). */
        grudgeFade: z.number().min(0).default(1),
        /** Cultivation speed multiplier. */
        speedMul: z.number().positive().default(1),
        /** Extra chance of a sudden death each year. */
        riskPerYear: z.number().min(0).max(1).default(0),
        /** Surface id this nature always comes with (Chân thành: what you see is what you get). */
        surface: id.optional(),
        /** Chân thành: what you see is what you get, so the nature is known from the start. */
        honest: z.boolean().default(false),
        /** Surfaces that hide this nature (Ôn hòa hiding Tham lam): such an NPC may show their true face (npcTrigger "reveal"). */
        masks: ids,
        /** Revenge / repay chance multipliers and how fast affinity grows. */
        revengeMul: z.number().min(0).default(1),
        repayMul: z.number().min(0).default(1),
        affinityMul: z.number().min(0).default(1),
      }).strict(),
    ),
    goals: z.array(npcTrait),
  })
  .strict();
export type NpcTraitsFile = z.infer<typeof NpcTraitsFileSchema>;

/** content/rankings.json: Thiên kiêu bảng texts (task 3.5). {name}, {rank}, {prodigy}, {realm}. */
export const RankingTextsSchema = z
  .object({
    title: z.string().min(1),
    note: z.string().min(1),
    enter: z.string().min(1),
    rise: z.string().min(1),
    top: z.string().min(1),
    drop: z.string().min(1),
    age: z.string().min(1),
    fallen: z.string().min(1),
  })
  .strict();
export type RankingTexts = z.infer<typeof RankingTextsSchema>;

/** content/romance.json (task 3.6): affinity tiers and the texts of romance actions. {npc} = the person, {name} = player. */
export const RomanceFileSchema = z
  .object({
    /** Highest min not above the affinity wins. */
    tiers: z.array(z.object({ min: z.number(), name: z.string().min(1) }).strict()).min(1),
    texts: z
      .object({
        pursue: z.string().min(1),
        giveUp: z.string().min(1),
        gift: z.string().min(1),
        giftRejected: z.string().min(1),
        used: z.string().min(1),
        confessYes: z.string().min(1),
        confessNo: z.string().min(1),
        lost: z.string().min(1),
        died: z.string().min(1),
        rivals: z.string().min(1),
        /** Task 3.7. {npc}, {child} = the child's name, {root} = the child's spirit root. */
        wedMortal: z.string().min(1),
        wedCultivator: z.string().min(1),
        child: z.string().min(1),
        adopt: z.string().min(1),
        noChild: z.string().min(1),
        childRoot: z.string().min(1),
        childNoRoot: z.string().min(1),
      })
      .strict(),
    /** Labels for the Người quen tab (partner: a cultivator's đạo lữ; spouse: a mortal's). */
    labels: z.object({ lover: z.string().min(1), couple: z.string().min(1), ex: z.string().min(1), partner: z.string().min(1), spouse: z.string().min(1) }).strict(),
  })
  .strict();
export type RomanceFile = z.infer<typeof RomanceFileSchema>;

/** content/heart-demon.json (task 4.4): tâm ma illusions built from the life's own past. {npc}, {deceased}. */
export const HeartDemonFileSchema = z
  .object({
    intro: z.string().min(1),
    illusions: z
      .object({
        grudge: z.string().min(1),
        killed: z.string().min(1),
        deceased: z.string().min(1),
        ex: z.string().min(1),
        fear: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    /** Flag → the dark deed it recalls. */
    deeds: z.record(id, z.string().min(1)),
    options: z.object({ face: z.string().min(1), slash: z.string().min(1), chant: z.string().min(1) }).strict(),
    results: z.object({ win: z.string().min(1), lose: z.string().min(1), pass: z.string().min(1), fail: z.string().min(1) }).strict(),
  })
  .strict();
export type HeartDemonFile = z.infer<typeof HeartDemonFileSchema>;

/** content/recipes.json (task 4.7): Luyện đan and Luyện khí recipes. {product}, {count}. */
export const RecipeFileSchema = z
  .object({
    texts: z.object({ success: z.string().min(1), fail: z.string().min(1), failAlchemy: z.string().min(1) }).strict(),
    recipes: z.array(
      z
        .object({
          id,
          craft: z.enum(['alchemy', 'forging']),
          product: id,
          count: z.number().int().min(1).default(1),
          /** Craft level needed. */
          minLevel: z.number().int().min(0).max(100),
          /** Item id → how many are used up. */
          materials: z.record(id, z.number().int().min(1)),
          cost: z.object({ silver: z.number().int().min(0).optional(), spiritStones: z.number().int().min(0).optional() }).strict(),
          /** A mortal craftsman can make it (phàm dược). */
          mortal: z.boolean().default(false),
        })
        .strict(),
    ),
  })
  .strict();
export type RecipeFile = z.infer<typeof RecipeFileSchema>;
export type Recipe = RecipeFile['recipes'][number];

/** content/disciples.json (task 4.9): texts for taking and teaching disciples. {npc}, {name}. */
export const DisciplesFileSchema = z
  .object({
    role: z.string().min(1),
    recruit: z.string().min(1),
    teach: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type DisciplesFile = z.infer<typeof DisciplesFileSchema>;

/** content/founding.json (task 5.1): founding one's own sect: name parts, tông quy, texts. */
export const FoundingFileSchema = z
  .object({
    nameParts: z.object({ first: z.array(z.string().min(1)).min(1), second: z.array(z.string().min(1)).min(1), suffix: z.array(z.string().min(1)).min(1) }).strict(),
    rules: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          text: z.string().min(1),
          /** New members a year × this. */
          recruitMul: z.number().min(0),
          karmaPerYear: z.number(),
          /** Faction reputation changed once on founding. */
          reputation: z.record(z.enum(['chinh', 'ma', 'tan_tu', 'yeu', 'trieu_dinh', 'giang_ho']), z.number()),
          /** K.6 hooks on the founder while the rule stands. */
          effects: z.array(EffectHookSchema),
        })
        .strict(),
    ),
    /** Task 5.2: buildings, levels 1..cost.length; per level: hooks on the founder, member growth, income, defense, pills a year. */
    buildings: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          text: z.string().min(1),
          cost: z.array(z.number().int().min(0)).min(1),
          upkeep: z.number().min(0),
          effects: z.array(EffectHookSchema),
          growth: z.number().min(0),
          income: z.number().min(0),
          defense: z.number().min(0),
          pills: ids,
        })
        .strict(),
    ),
    /** Task 5.2: what the yearly report may ask the master to decide. default: what the elders do when the master does not answer. */
    decisions: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          text: z.string().min(1),
          cost: z.number().int().min(0),
          members: z.number().int(),
          growthBonus: z.number(),
          withdrawPct: z.number().min(0).max(1),
          karma: z.number(),
          default: z.boolean(),
        })
        .strict(),
    ),
    texts: z
      .object({
        founded: z.string().min(1),
        leftOld: z.string().min(1),
        /** {sect}, {members}, {membersDelta}, {treasury}, {treasuryDelta}. */
        report: z.string().min(1),
        /** {building}, {sect}, {level}. */
        built: z.string().min(1),
        /** {count}, {item}. */
        pills: z.string().min(1),
        /** {decision}. */
        decided: z.string().min(1),
        /** {count}, {sect}. */
        donated: z.string().min(1),
      })
      .strict(),
  })
  .strict();
export type FoundingFile = z.infer<typeof FoundingFileSchema>;

const ChosenRoleSchema = z.object({ name: z.string().min(1), text: z.string().min(1), effects: z.array(EffectHookSchema) }).strict();

/** content/chosen-ones.json (task 5.5): khí vận chi tử templates. Their stories are world events (conditions.chosen). */
export const ChosenFileSchema = z
  .object({
    templates: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          /** One line for the disciple list. */
          summary: z.string().min(1),
          aptitude: z.tuple([z.number().int().min(0).max(100), z.number().int().min(0).max(100)]),
          /** Log line when taken in; {npc}, {name}. */
          recruit: z.string().min(1),
        })
        .strict(),
    ),
    /** Task 5.6: Hộ đạo / Lợi dụng / Mặc kệ: name, log line ({npc}), K.6 hooks on the master while the chosen one lives. */
    roles: z.object({ protect: ChosenRoleSchema, exploit: ChosenRoleSchema, ignore: ChosenRoleSchema }).strict(),
  })
  .strict();
export type ChosenFile = z.infer<typeof ChosenFileSchema>;

/** content/heir.json (task 5.7): going on as a child or disciple. {name} = heir, {parent} = the one who died, {sect}. */
export const HeirFileSchema = z
  .object({ offer: z.string().min(1), child: z.string().min(1), disciple: z.string().min(1), sect: z.string().min(1) })
  .strict();
export type HeirFile = z.infer<typeof HeirFileSchema>;

/** content/clan.json (task 5.4): gia tộc tu tiên: gia quy, sản nghiệp, texts. {clan}, {property}, {income}. */
const moneySpec = z.object({ silver: z.number().int().min(0).optional(), spiritStones: z.number().int().min(0).optional() }).strict();
export const ClanFileSchema = z
  .object({
    rules: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          text: z.string().min(1),
          /** Extra root rolls for children born into the clan (keep the best). */
          rootRolls: z.number().int().min(0),
          /** Property income × this. */
          incomeMul: z.number().min(0),
          /** Added to the share of money an heir inherits. */
          inheritMoney: z.number().min(0).max(1),
          karmaPerYear: z.number(),
        })
        .strict(),
    ),
    properties: z.array(
      z.object({ id, name: z.string().min(1), text: z.string().min(1), cost: moneySpec, income: moneySpec, max: z.number().int().min(1) }).strict(),
    ),
    texts: z.object({ founded: z.string().min(1), bought: z.string().min(1), income: z.string().min(1) }).strict(),
  })
  .strict();
export type ClanFile = z.infer<typeof ClanFileSchema>;

/** content/core-patterns.json (task 4.2): đan văn on a new golden core, first match wins. */
export const CorePatternSchema = z
  .object({
    id,
    name: z.string().min(1),
    /** Which strands formed it: cracked once or more, every strand flowed from the last, all one element, a variant strand, or the most placed element. */
    when: z
      .object({ cracked: z.boolean().optional(), allFlow: z.boolean().optional(), allSame: z.boolean().optional(), variant: id.optional(), element: id.optional() })
      .strict(),
    text: z.string().min(1),
    summary: z.string().min(1),
    effects: z.array(EffectHookSchema),
  })
  .strict();
export const CorePatternFileSchema = z.array(CorePatternSchema);
export type CorePattern = z.infer<typeof CorePatternSchema>;

/** content/nascent-souls.json (task 4.3): the Nguyên Anh's form, first match wins. */
export const NascentSoulFileSchema = z
  .object({
    /** Realm whose breakthrough forms the Nguyên Anh. */
    realm: id,
    forms: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          /** Kim Đan grade this good or better (1 = Nhất phẩm), đạo thống, main fighting path; {} always fits. */
          when: z.object({ maxCoreGrade: z.number().int().min(1).max(9).optional(), lineage: id.optional(), path: id.optional() }).strict(),
          text: z.string().min(1),
          summary: z.string().min(1),
          effects: z.array(EffectHookSchema),
        })
        .strict(),
    ),
  })
  .strict();
export type NascentSoulFile = z.infer<typeof NascentSoulFileSchema>;


/** content/blessings.json (task 5b.8, mortal-path.md 3.1): Phúc báo a life earns for the next one. */
export const BlessingFileSchema = z
  .object({
    /** Only a life that ends as a Phàm Nhân earns them ("thành tựu đời phàm nhân"). */
    mortalOnly: z.boolean(),
    blessings: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          /** Why it was earned (death screen) and what it gives (next life). */
          earned: z.string().min(1),
          text: z.string().min(1),
          /** All given must hold at death: karma, career rung index reached, age, flag set when dying. */
          earn: z
            .object({ karmaMin: z.number().optional(), careerRung: z.number().int().min(0).optional(), ageMin: z.number().int().min(0).optional(), deathFlag: id.optional() })
            .strict(),
          /** Added to the first main stat of the career that earned it. */
          careerMainStat: z.number().int().optional(),
          /** Extra Tiên Thiên Khí Vận rerolls. */
          destinyRerolls: z.number().int().min(0).optional(),
          effects: z.array(EffectHookSchema),
        })
        .strict(),
    ),
  })
  .strict();
export type BlessingFile = z.infer<typeof BlessingFileSchema>;

/** Task 5b.1: thiên phú luân hồi, bought with Luân Hồi points and kept for every later life. */
export const RebirthTalentFileSchema = z
  .object({
    talents: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          text: z.string().min(1),
          /** Level n (1-based) gives levels[n-1] in full (not added to the levels below). */
          levels: z
            .array(
              z
                .object({
                  cost: z.number().int().min(1),
                  summary: z.string().min(1),
                  /** stat.* and lifespanPct are given once at birth; other hooks last the whole life. */
                  effects: z.array(EffectHookSchema).default([]),
                  destinyRerolls: z.number().int().min(0).optional(),
                  fateRefreshes: z.number().int().min(0).optional(),
                  startSilver: z.number().int().min(0).optional(),
                  /** Task 5b.3: more Tiên Thiên Khí Vận slots (up to balance.traits.maxSlots) and locks. */
                  destinySlots: z.number().int().min(0).optional(),
                  destinyLocks: z.number().int().min(0).optional(),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    ),
  })
  .strict();
export type RebirthTalentFile = z.infer<typeof RebirthTalentFileSchema>;

/** Task 5b.2: Kim Thủ Chỉ, one a life at most, awakening level by level as the realm rises. */
export const GoldenFingerFileSchema = z
  .object({
    fingers: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          flavor: z.string().min(1),
          summary: z.string().min(1),
          /** The risk it carries (shown with it; the exposure events carry it out). */
          risk: z.string().min(1),
          /** Chance among the fingers when one is drawn at random. */
          weight: z.number().min(0),
          /** Level n is reached at levels[n-1].realm; each level adds its hooks to the ones below. */
          levels: z
            .array(
              z
                .object({
                  realm: id,
                  name: z.string().min(1),
                  /** Logged when this level awakens. */
                  text: z.string().min(1),
                  /** stat.* and lifespanPct are given once on awakening; other hooks last while it is kept. */
                  effects: z.array(EffectHookSchema).default([]),
                  setFlags: ids,
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    ),
  })
  .strict();
export type GoldenFingerFile = z.infer<typeof GoldenFingerFileSchema>;

/** Task 5b.3: tổ hợp ẩn: owning all these Tiên Thiên Khí Vận wakes a secret effect. */
export const TraitComboFileSchema = z
  .object({
    combos: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          traits: z.array(id).min(2).max(3),
          /** Logged when found. */
          text: z.string().min(1),
          summary: z.string().min(1),
          /** stat.* and lifespanPct are given once at birth; other hooks last the whole life. */
          effects: z.array(EffectHookSchema).min(1),
        })
        .strict(),
    ),
  })
  .strict();
export type TraitComboFile = z.infer<typeof TraitComboFileSchema>;

/** Task 5b.4: Thiên Thư texts; stories: how a khí vận chi tử's tale ended ({npc}, {master}). */
export const CodexFileSchema = z
  .object({
    intro: z.string().min(1),
    stories: z.object({
      protect: z.string().min(1), exploit_won: z.string().min(1), exploit: z.string().min(1),
      ignore: z.string().min(1), dead: z.string().min(1), none: z.string().min(1),
    }).strict(),
  })
  .strict();
export type CodexFile = z.infer<typeof CodexFileSchema>;

/** Task 5b.5: what a finished life must show for a thành tựu or huy hiệu (all given must hold). */
export const LifeCheckSchema = z
  .object({
    realmMin: id.optional(),
    /** Died as a Phàm Nhân. */
    mortal: z.boolean().optional(),
    ageMin: z.number().int().min(0).optional(),
    ageMax: z.number().int().min(0).optional(),
    cause: z.array(z.enum(['old_age', 'illness', 'breakthrough', 'ordeal', 'combat', 'tribulation'])).optional(),
    karmaMin: z.number().optional(),
    karmaMax: z.number().optional(),
    happinessMin: z.number().optional(),
    silverMin: z.number().int().optional(),
    childrenMin: z.number().int().min(0).optional(),
    childrenMax: z.number().int().min(0).optional(),
    disciplesMin: z.number().int().min(0).optional(),
    partner: z.boolean().optional(),
    ownSect: z.boolean().optional(),
    clan: z.boolean().optional(),
    /** Best place reached on the Thiên kiêu bảng at the end. */
    rankMax: z.number().int().min(1).optional(),
    lineage: ids.optional(),
    flagsAll: ids.optional(),
    /** Kim Thủ Chỉ at death: any (true), none (false), or one of these. */
    goldenFinger: z.union([z.boolean(), z.array(id)]).optional(),
    combosMin: z.number().int().min(1).optional(),
    chosenTemplate: ids.optional(),
    chosenRole: z.array(z.enum(['protect', 'exploit', 'ignore'])).optional(),
    /** The khí vận chi tử's tale (codex.json stories). */
    chosenEnding: z.array(z.enum(['protect', 'exploit_won', 'exploit', 'ignore', 'dead', 'none'])).optional(),
    /** Lives begun on this browser, this one included. */
    livesMin: z.number().int().min(1).optional(),
  })
  .strict();
export type LifeCheck = z.infer<typeof LifeCheckSchema>;

/** Task 5b.5: thành tựu kept across lives, and huy hiệu cuối đời given to one life. */
export const AchievementFileSchema = z
  .object({
    achievements: z.array(
      z
        .object({
          id,
          name: z.string().min(1),
          /** How it is earned (hidden ones show "???" until earned). */
          text: z.string().min(1),
          hidden: z.boolean().default(false),
          when: LifeCheckSchema,
          /** This Kim Thủ Chỉ may then be chosen when a new life is made (for balance.goldenFinger.chooseCost). */
          unlockFinger: id.optional(),
        })
        .strict(),
    ),
    /** The life's badges: those that fit, highest priority first, at most balance... maxBadges. */
    badges: z.array(
      z
        .object({ id, name: z.string().min(1), text: z.string().min(1), priority: z.number().int(), when: LifeCheckSchema })
        .strict(),
    ),
    /** Obituary card texts: {name}, {years}. */
    obituary: z.object({ title: z.string().min(1), footer: z.string().min(1) }).strict(),
  })
  .strict();
export type AchievementFile = z.infer<typeof AchievementFileSchema>;
