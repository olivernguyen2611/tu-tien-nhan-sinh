// Giai đoạn 6.1: mô phỏng tự động. Một "người chơi máy" sống trọn một đời theo seed, đi qua mọi
// màn chặn (khí vận, sự kiện, trận đấu, kết đan, tâm ma, thiên phú) bằng chính các hàm của game,
// rồi gom thống kê nhiều đời để xem cân bằng. Không có logic game riêng ở đây: chỉ gọi hệ thống.
import type { Content } from '../core/content';
import { answerExam, examView, resolveIncident } from './exams';
import { takeJob } from './jobs';
import { assetPrice, buyAsset } from './assets';
import { Rng } from '../core/rng';
import { advanceYear, createLife } from '../core/state';
import type { GameState } from '../core/types';
import type { GameEvent } from '../core/schemas';
import { act, settle } from './combat';
import { attemptMajorBreakthrough, enterFirstRealm, majorBreakthroughInfo, rootUsable } from './cultivation';
import { confirmDestiny, rollDestiny } from './destiny';
import { seeSpecial } from './specialOrigin';
import { doFingerAction, fingerActionViews } from './fingerActions';
import { resolveChoice, findEvent, visibleChoices } from './events/engine';
import { chooseFate } from './fate';
import { placeStrand } from './goldenCore';
import { meetIllusion } from './heartDemon';
import { doActivity } from './activities';
import { monthsUsed } from './timeBudget';
import { caveView, rentCave } from './cave';
import { runSeclusion } from './seclusion';
import { doMission, joinSect, missionViews, requestMaster, masterBlocked, sectEligibility, sectTechniques } from './sect';
import { buyTreasury, treasuryViews } from './sectTreasury';
import { learnBlocked, learnTechnique, techniqueById, techniqueCapReason, techniqueMaxRealm } from './technique';
import { buyScroll, openMarkets, techniqueOffers } from './market';
import { checkDeath } from './time';
import { joinCareer } from './career';
import { trainMartial } from './martial';
import { lifeEnding } from './chronicle';
import { BalanceSchema } from '../core/schemas';

/**
 * How the bot decides. `random` picks event choices at random and always tries to break through; `steady` takes the first open choice and only breaks through at 50% or better.
 * `player` (6b, from the 2026-10-12 playtest) lives like a typical player: random choices, joins a sect, does the best mission
 * each year, asks for a master, spends contribution at the treasury, moves to the technique that reaches furthest, and breaks through at 40% or better.
 */
export type BotProfile = 'random' | 'steady' | 'player' | 'full' | MortalPersona;
/** 9.4 `full` ("sống đủ") plays like `player` and also spends up to FULL_MONTHS of each year visiting home, escorting goods, travelling, feasting. */
export const BOT_PROFILES: BotProfile[] = ['random', 'steady', 'player', 'full'];

/**
 * 9.8 Persona phàm nhân: lives that stay mortal (never seek an entry technique nor break through) and live
 * one way. `choice`: first open choice, random, the kindest (karma up) or the cruellest (karma down).
 */
export type MortalPersona = 'nong_dan' | 'thu_sinh' | 'thuong_nhan' | 'ke_cuop' | 'hiep_khach' | 'ke_luoi';
interface PersonaDef { name: string; career?: string; jobs?: string[]; assets?: string[]; activities: string[]; months: number; train?: boolean; choice: 'first' | 'random' | 'good' | 'evil' }
export const MORTAL_PERSONAS: Record<MortalPersona, PersonaDef> = {
  nong_dan: { name: 'Nông dân an phận', jobs: ['lam_ruong'], assets: ['leu_tranh', 'ruong', 'trau'], activities: ['hoc_nghe_moc', 'lam_thue', 've_tham_que', 'ket_giao', 'lam_cham', 'te_to', 'an_uong_dieu_do', 'hop_ho'], months: 6, choice: 'first' },
  thu_sinh: { name: 'Thư sinh thi cử', career: 'quan', jobs: ['thay_do', 'thu_lai'], activities: ['xin_hoc_truong_lang', 'leu_chong_di_thi', 'cham_hoc', 'on_thi', 'thu_quan', 'ket_giao', 'ngao_du', 'doc_sach', 'te_to'], months: 5, choice: 'first' },
  thuong_nhan: { name: 'Thương nhân', career: 'thuong', jobs: ['ban_rong', 'tieu_nhi'], assets: ['quan_tra', 'nha_ngoi'], activities: ['hoc_nghe_may', 'lam_cham', 'xin_tang_luong', 'ket_giao', 'lam_thue', 'song_bac', 'tuu_lau'], months: 5, choice: 'random' },
  ke_cuop: { name: 'Kẻ cướp', jobs: ['do_te', 'phu_khuan_vac'], activities: ['tron_hoc', 'pp_moc_tui', 'pp_trom_nha_giau', 'pp_cuop_duong', 'pp_lua_dao', 'pp_tron_di_xa', 'pp_gianh_cho', 'pp_ket_giao_ban_tu', 'pp_dao_ham', 'an_bot', 'song_bac', 'luyen_quyen_som', 'dau_quan_hac_dao', 'lam_nhiem_vu_bang'], months: 6, train: true, choice: 'evil' },
  hiep_khach: { name: 'Hiệp khách', career: 'vo_lam', jobs: ['tieu_su', 'ho_vien'], activities: ['theo_vo_duong', 'hoc_nghe_ren', 'luyen_quyen_som', 'ap_tieu', 'ngao_du', 'ket_giao', 'bai_nhap_mon_phai', 'lam_nhiem_vu_bang', 'doi_cong_hien_vo_hoc'], months: 5, train: true, choice: 'good' },
  ke_luoi: { name: 'Kẻ lười', activities: ['ngao_du', 'song_bac', 'tuu_lau'], months: 4, choice: 'first' },
};
export const MORTAL_PROFILES = Object.keys(MORTAL_PERSONAS) as MortalPersona[];
/** 10.12: everyday pastimes any mortal persona tries a few of each year (the ones not open are skipped). */
const MORTAL_EXTRAS = ['tra_quan', 'hoi_cho', 'xem_hat', 'xin_que', 'cau_ca', 'danh_co', 'leo_nui', 'chuc_tet', 'tha_den', 'dap_thanh', 'dua_thuyen', 'mua_thu_nuoi', 'choi_voi_thu', 'tap_duong_sinh', 'tam_suoi_nong', 've_tham_que', 'sua_sang_nha', 'xem_boi', 'danh_thang', 'luyen_chu'];
const personaOf = (p: BotProfile): PersonaDef | null => MORTAL_PERSONAS[p as MortalPersona] ?? null;

/** A choice that leads into the Dao (joins a sect, takes up a technique): a mortal persona turns it down when it can. */
function leadsToDao(event: GameEvent, index: number): boolean {
  const c = event.choices[index];
  return [c?.result, c?.success].some((o) => {
    const eff = o?.effects as Record<string, unknown> | undefined;
    return !!eff && (eff.joinSect !== undefined || eff.learnTechnique !== undefined);
  });
}

/** Karma a choice moves (its plain result, or a check's success). */
function choiceKarma(event: GameEvent, index: number): number {
  const c = event.choices[index];
  const eff = (c?.result ?? c?.success)?.effects as Record<string, unknown> | undefined;
  return typeof eff?.karma === 'number' ? eff.karma : 0;
}
const FULL_MONTHS = 4;
const FULL_ACTIVITIES = ['ve_tham_que', 'ap_tieu', 'ngao_du', 'ket_giao'];

export interface LifeResult {
  seed: string;
  /** Age at death (or where the run stopped). */
  age: number;
  alive: boolean;
  cause: string;
  /** Realm id at the end and the highest realm index reached. */
  realm: string;
  peak: number;
  rootGrade: string;
  bodyId: string | null;
  martialStage: number;
  /** 9.R5a: Sổ tri thức entries found by chance in this life. */
  knowledge: number;
  /** Age at which each realm was first entered. */
  reachedAt: Record<string, number>;
  /** Stage within the final realm. */
  stage: number;
  /** True when the run hit the safety limit instead of ending in death. */
  stuck: boolean;
  /** Years lived with happiness at 0; whether đạo tâm ever hit 0. */
  happyZeroYears: number;
  /** 9.4: mean happiness over the years lived, silver left at the end, months spent on activities per year. */
  happyMean?: number;
  silverLeft?: number;
  monthsPerYear?: number;
  /** Years lived with happiness / trí tuệ / mị lực at 95 or more (6c.4), and all years lived. */
  topYears: { happiness: number; intellect: number; charm: number; lived: number };
  daoHeartZero: boolean;
  /** Years with a full bar that could not go on, and how many of them the technique blocked. */
  fullBarYears: number;
  capYears: number;
  /** 6b.9: căn cốt + ngộ tính + khí vận gained over the life (end − start), and whether one reached 90. */
  aptitudeGain: number;
  aptitudeHigh: boolean;
  /** 6b.12: how many times each event fired this life. */
  seen: Record<string, number>;
  /** 6b.14: spirit stones left at death. */
  stonesLeft: number;
  /** 9.R12: tiên duyên gates that opened, the Kim Thủ Chỉ, the khí vận, the kết cục. */
  gates: string[];
  finger: string | null;
  traits: string[];
  ending: string | null;
  special: string[];
  /** 9.3: log lines, how many repeat an earlier line of the same life (numbers ignored), the most repeated. */
  lines?: number;
  repeatLines?: number;
  topLines?: [string, number][];
  /** 9.8: different activities done, share of years with something notable, the tầng at death. */
  activityKinds?: number;
  eventKinds?: number;
  eventfulShare?: number;
  tier?: string;
  /** 10.1: went to school at some point; highest trade level reached (-1 = none). */
  schooled?: boolean;
  /** 11.1: given a ngoại hiệu. */
  alias?: boolean;
  /** 11.2: was in a thế lực at some point. */
  faction?: boolean;
  tradeLevel?: number;
  /** 10.2: highest khoa cử level passed (-1 = none). */
  examRank?: number;
}

/** 9.3: log lines of a life, counted with numbers blanked so "+12 linh thạch" and "+15 linh thạch" match. */
function lineRepeats(state: GameState): { lines: number; repeatLines: number; topLines: [string, number][] } {
  const counts = new Map<string, number>();
  let lines = 0;
  for (const y of state.log) for (const l of y.lines) {
    lines++;
    const k = l.text.replace(/\d+/g, '#');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const repeatLines = [...counts.values()].reduce((n, c) => n + c - 1, 0);
  const topLines = [...counts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { lines, repeatLines, topLines };
}

export interface SimOptions {
  profile?: BotProfile;
  difficulty?: string;
  /** Safety limits; a life that passes them is reported as stuck. */
  maxAge?: number;
  maxSteps?: number;
  /** Called at each event the bot answers and each blow of a fight (for finding what kills lives). */
  observe?: (kind: 'event' | 'combat' | 'end', state: GameState) => void;
  /** 9.R2d: skip the roll and take exactly these khí vận ([] = none), for A/B runs on the same seeds. */
  traits?: string[];
  /** 9.R3d: start with this Kim Thủ Chỉ (absent = none, as before). */
  goldenFinger?: string;
  /** 9.R4b: a seasoned player knows the whole Sổ tri thức (default, so every gate is open); 'none' plays a first life. */
  knowledge?: 'all' | 'none';
}

/** 9.R4c: the bot buys the first scroll it can afford and learn at a market it can enter, then learns it. */
function buyEntryTechnique(state: GameState, content: Content): { state: GameState } | null {
  for (const m of openMarkets(state, content)) {
    for (const o of techniqueOffers(state, content, m.id)) {
      const tech = techniqueById(content, o.id);
      if (o.blocked || !tech || learnBlocked(state, content, tech)) continue;
      const bought = buyScroll(state, content, m.id, o.id).state;
      const learned = learnTechnique(bought, content, o.id, { quiet: true });
      if (learned) return learned;
    }
  }
  return null;
}

/** Live one life to its end. Deterministic for a seed, profile and content. */
export function simulateLife(content: Content, seed: string, opts: SimOptions = {}): LifeResult {
  const profile = opts.profile ?? 'random';
  // A Hóa Thần with every lifespan bonus can pass 3000 (realm base 2000 × hooks); 6b.11 raised the limit.
  const maxAge = opts.maxAge ?? 6000;
  const maxSteps = opts.maxSteps ?? 20000;
  const botRng = new Rng(`bot:${seed}`);
  const realms = content.cultivation.realms.realms.map((r) => r.id);
  const knowledge = opts.knowledge === 'none' ? [] : (content.knowledge ?? []).map((e) => e.id);
  // 9.S1: a seasoned player is on a later life, so a Tình tiết đặc biệt hiếm can come.
  const born = createLife({ seed, difficulty: opts.difficulty, goldenFinger: opts.goldenFinger, knowledge, lifeNo: opts.knowledge === 'none' ? 1 : 10 }, content);
  const offered = opts.traits ? { ...born, destiny: { ...born.destiny, offered: opts.traits } } : rollDestiny(born, content);
  let s: GameState = seeSpecial(confirmDestiny(offered, content), content);
  let peak = 0;
  const reachedAt: Record<string, number> = {};
  let steps = 0;
  let happyZeroYears = 0;
  let happySum = 0;
  let monthsSum = 0;
  const topYears = { happiness: 0, intellect: 0, charm: 0, lived: 0 };
  let daoHeartZero = false;
  let fullBarYears = 0;
  let capYears = 0;
  const aptSum = (x: GameState) => x.aptitudes.physique + x.aptitudes.comprehension + x.aptitudes.luck;
  const aptStart = aptSum(s);
  const persona = personaOf(profile);
  const eventful = new Set<number>();
  const statSum = (x: GameState) => x.stats.health + x.stats.happiness + x.stats.intellect + x.stats.charm + aptSum(x) + x.aptitudes.daoHeart;
  /** An activity counts toward a notable year when it moves the stats by 2 or more in all. */
  const doAct = (st: GameState, id: string): GameState => {
    const r = doActivity(st, content, id);
    if (!r) return st;
    if (Math.abs(statSum(r.state) - statSum(st)) >= 2) eventful.add(st.character.age);
    return r.state;
  };
  while (s.alive && s.character.age < maxAge && steps++ < maxSteps) {
    peak = Math.max(peak, realms.indexOf(s.cult.realm));
    reachedAt[s.cult.realm] ??= s.character.age;
    if (s.events.pending) {
      opts.observe?.('event', s);
      const event = findEvent(content, s.events.pending);
      const shown = event ? visibleChoices(s, content, event).filter((c) => !c.disabled) : [];
      const mortalOnly = persona && event ? shown.filter((c) => !leadsToDao(event, c.index)) : shown;
      const open = mortalOnly.length > 0 ? mortalOnly : shown;
      // An event with nothing to pick is cleared by choosing its first choice.
      const byKarma = (sign: number) => [...open].sort((a, b) => sign * (choiceKarma(event!, b.index) - choiceKarma(event!, a.index)))[0].index;
      const how = persona?.choice ?? (profile === 'random' ? 'random' : 'first');
      const pick = open.length === 0 ? 0 : how === 'random' ? botRng.pick(open).index : how === 'good' ? byKarma(1) : how === 'evil' ? byKarma(-1) : open[0].index;
      eventful.add(s.character.age);
      s = checkDeath(resolveChoice(s, content, pick).state, content);
      s = runSeclusion(s, content);
      continue;
    }
    if (s.fate) { s = runSeclusion(chooseFate(s, content, s.fate.offered[0]), content); continue; }
    if (s.combat) {
      if (s.combat.phase === 'fight') {
        opts.observe?.('combat', s);
        // A sensible fighter backs out when hurt: plead with someone who only wants a lesson or a purse, else run.
        const hurtBelow = profile === 'steady' ? 60 : 30;
        const action = s.stats.health > hurtBelow ? 'all_out' : s.combat.foe.intent === 'kill' ? 'flee' : 'plead';
        const r = act(s, content, action);
        s = r.state.combat ? r.state : checkDeath(r.state, content, r.state.stats.health <= 0 ? 'combat' : undefined);
      } else {
        s = runSeclusion(checkDeath(settle(s, content, 'spare').state, content), content);
      }
      continue;
    }
    if (s.cult.coreForming) { s = placeStrand(s, content, s.cult.coreForming.offered[0]).state; continue; }
    // 10.2 Trường thi: the incident's first choice (the honest one), else the way of writing with the best expected score.
    const exam = examView(s, content);
    if (exam) {
      const best = [...exam.approaches].sort((a, b) => (b.pct * b.win + (100 - b.pct) * b.lose) - (a.pct * a.win + (100 - a.pct) * a.lose))[0];
      const r = exam.incident ? resolveIncident(s, content, 0) : answerExam(s, content, best.id);
      s = r ? checkDeath(r.state, content) : { ...s, exam: { ...s.exam!, sitting: null } };
      continue;
    }
    if (s.cult.heartDemonTrial) { s = meetIllusion(s, content, 'face').state; continue; }
    // A rooted mortal finds an entry technique (9.R4c: bought at a market it can reach, or one it holds) and begins to cultivate.
    if (!persona && s.cult.realm === 'pham_nhan' && rootUsable(s, content)) {
      const learned = s.cult.technique ? { state: s } : buyEntryTechnique(s, content);
      if (learned) {
        const started = enterFirstRealm(learned.state, content);
        if (started !== s) { s = started; continue; }
      }
    }
    if ((profile === 'player' || profile === 'full') && !s.seclusion) s = playerYear(s, content);
    if (profile === 'full' && !s.seclusion && !s.events.pending && !s.combat) {
      for (const id of FULL_ACTIVITIES) {
        // A careful player escorts goods only while healthy.
        if (monthsUsed(s) >= FULL_MONTHS || (id === 'ap_tieu' && s.stats.health < 60)) continue;
        s = doAct(s, id);
      }
    }
    if (persona && !s.seclusion && !s.events.pending && !s.combat) {
      if (persona.career && s.career.id !== persona.career) s = joinCareer(s, content, persona.career)?.state ?? s;
      // 10.3: the first open job of the persona's list (a better one waits until the persona quits).
      if (persona.jobs && !s.job?.id) for (const id of persona.jobs) { const r = takeJob(s, content, id); if (r) { s = r.state; break; } }
      // 10.4: buy one listed asset a year while the silver keeps a reserve.
      // 10.12: at most two of each.
      if (persona.assets) for (const id of persona.assets) { if (s.money.silver < assetPrice(s, content, id) * 2 || (s.assets?.owned.filter((o) => o.id === id).length ?? 0) >= 2) continue; const r = buyAsset(s, content, id); if (r) { s = r.state; break; } }
      if (persona.train) s = trainMartial(s, content)?.state ?? s;
      // 10.8: a sick persona sees a lang trung (when it can pay, else the tiệm thuốc) the year it falls ill and every other year after.
      const sick = s.body?.ailments.find((a) => (s.character.age - a.since) % 2 === 0);
      if (sick) s = doAct(s, s.money.silver >= 60 ? 'moi_lang_trung' : 'boc_thuoc');
      // 10.12: the persona's own activities in a new order each year, then a couple of everyday ones; at most one crime a year.
      // Gambling only with silver to spare; escorting only while healthy.
      const year = [...botRng.shuffle(persona.activities.slice()), ...botRng.shuffle(MORTAL_EXTRAS.slice()).slice(0, 5)];
      let crimed = false;
      for (const id of year) {
        if (monthsUsed(s) >= persona.months + 2 || s.events.pending || s.combat) break;
        if ((id === 'song_bac' && s.money.silver < 30) || (id === 'ap_tieu' && s.stats.health < 60)) continue;
        if (id === 'pp_tron_di_xa' && (s.law?.wanted ?? 0) < 3) continue;
        const crime = !!content.crimes?.crimes.some((c) => `pp_${c.id}` === id);
        if (crime && crimed) continue;
        const before = s;
        s = doAct(s, id);
        if (crime && s !== before) crimed = true;
      }
      if (s.stats.happiness < 30 && !s.events.pending) s = doAct(s, 'ngao_du');
      if (s.events.pending || s.combat) continue;
    }
    // 9.R3d: every bot uses each finger action that is open (so the finger's price is paid too).
    if (s.goldenFinger && !s.seclusion && !s.events.pending) {
      for (const v of fingerActionViews(s, content)) if (!v.blocked) s = doFingerAction(s, content, v.id)?.state ?? s;
      if (s.events.pending || s.combat) continue;
    }
    const info = persona ? null : majorBreakthroughInfo(s, content);
    const minPct = profile === 'random' ? 0 : profile === 'player' ? 30 : 50;
    if (info && !info.blocked && info.chancePct >= minPct) {
      const r = attemptMajorBreakthrough(s, content);
      if (r) { s = checkDeath(r.state, content); continue; }
    }
    const before = s.character.age;
    const spent = monthsUsed(s);
    s = s.seclusion ? runSeclusion(s, content) : advanceYear(s, content);
    s = checkDeath(s, content);
    const years = s.character.age - before;
    if (years > 0) {
      if (s.stats.happiness <= 0) happyZeroYears += years;
      happySum += s.stats.happiness * years;
      monthsSum += spent;
      topYears.lived += years;
      for (const k of ['happiness', 'intellect', 'charm'] as const) if (s.stats[k] >= 95) topYears[k] += years;
      if (s.aptitudes.daoHeart <= 0) daoHeartZero = true;
      const next = realms[realms.indexOf(s.cult.realm) + 1];
      if (s.cult.realm !== 'pham_nhan' && s.cult.progress >= 100 && next) {
        fullBarYears += years;
        if (techniqueCapReason(s, content, next)) capYears += years;
      }
    }
  }
  opts.observe?.('end', s);
  return {
    seed, age: s.character.age, alive: s.alive, cause: s.death?.cause ?? (s.alive ? 'stuck' : 'unknown'), realm: s.cult.realm,
    peak: Math.max(peak, realms.indexOf(s.cult.realm)), rootGrade: s.cult.root?.grade ?? 'none', bodyId: s.cult.bodyId ?? null,
    martialStage: s.martial.stage, knowledge: s.knowledgeFound ?? 0, reachedAt, stage: s.cult.stage, stuck: s.alive,
    happyZeroYears, topYears, daoHeartZero, fullBarYears, capYears,
    happyMean: topYears.lived ? happySum / topYears.lived : 0, silverLeft: s.money.silver, monthsPerYear: topYears.lived ? monthsSum / topYears.lived : 0,
    aptitudeGain: aptSum(s) - aptStart,
    aptitudeHigh: Math.max(s.aptitudes.physique, s.aptitudes.comprehension, s.aptitudes.luck) >= 90,
    seen: { ...(s.events.seen ?? {}) },
    stonesLeft: s.money.spiritStones,
    gates: Object.keys(s.flags).filter((f) => s.flags[f] && f.startsWith('tien_duyen_')).map((f) => f.slice('tien_duyen_'.length)),
    finger: s.goldenFinger?.id ?? null,
    traits: [...s.traits],
    ending: lifeEnding(s, content, 1),
    special: s.special?.ids ?? [],
    ...lineRepeats(s),
    activityKinds: Object.keys(s.activities?.last ?? {}).length,
    eventKinds: Object.keys(s.events.seen ?? {}).length,
    eventfulShare: topYears.lived ? Math.min(1, eventful.size / topYears.lived) : 0,
    tier: s.tier,
    schooled: !!s.school?.ever,
    alias: !!s.jianghu?.alias,
    faction: !!s.jianghu?.faction || (s.jianghu?.left?.length ?? 0) > 0,
    tradeLevel: s.trade?.id ? s.trade.level : -1,
    examRank: s.exam?.rank ?? -1,
  };
}

/** The `player` bot's own moves in a year, before it passes: only the game's own actions. */
function playerYear(state: GameState, content: Content): GameState {
  let s = state;
  if (!s.sect.id) {
    const sect = content.sects.find((x) => x.recruitable && !sectEligibility(s, content, x.id));
    if (sect) s = enterFirstRealm(joinSect(s, content, sect.id).state, content);
  }
  if (s.sect.id) {
    const best = missionViews(s, content).filter((m) => !m.blocked).sort((a, b) => b.chance - a.chance)[0];
    if (best) s = doMission(s, content, best.id)?.state ?? s;
    if (!masterBlocked(s, content)) s = requestMaster(s, content)?.state ?? s;
    const buy = treasuryViews(s, content).find((t) => !t.blocked);
    if (buy) s = buyTreasury(s, content, buy.id)?.state ?? s;
  }
  // A player who sees the warning goes on a trip.
  if (s.stats.happiness < 30) s = doActivity(s, content, 'ngao_du')?.state ?? s;
  // 6b.14: with stones to spare (twice a long lease), rent a cave on a spirit vein.
  const lease = caveView(s, content).leases.at(-1);
  if (lease && !lease.blocked && s.money.spiritStones >= lease.cost * 2) s = rentCave(s, content, lease.years)?.state ?? s;
  // Move to the technique that reaches furthest (no limit counts as furthest).
  const order = content.cultivation.realms.realms.map((r) => r.id);
  const reach = (id: string | null) => {
    const t = techniqueById(content, id);
    if (!t) return -1;
    const max = techniqueMaxRealm(t, content);
    return max ? order.indexOf(max) : order.length;
  };
  const options = [...sectTechniques(s, content).filter((t) => t.open).map((t) => t.id), ...s.cult.scrolls]
    .filter((id) => { const t = techniqueById(content, id); return !!t && !learnBlocked(s, content, t); });
  const better = options.sort((a, b) => reach(b) - reach(a))[0];
  if (better && s.cult.technique && reach(better) > reach(s.cult.technique)) s = learnTechnique(s, content, better, { quiet: true })?.state ?? s;
  return s;
}

export interface Report {
  count: number;
  stuck: number;
  age: { mean: number; p10: number; p50: number; p90: number; max: number };
  byCause: Record<string, number>;
  /** Share of lives that ever reached each realm (by realm id). */
  reached: Record<string, number>;
  /** Mean age when each realm was first entered, among the lives that got there. */
  reachedAge: Record<string, number>;
  /** Share of lives by root grade, their mean age at death, share reaching Kim Đan, and mean years blocked by the technique. */
  byRoot: Record<string, { share: number; meanAge: number; kimDan: number; capYears: number }>;
  /** Share of lives that ever sat at happiness 0, mean such years; share whose đạo tâm hit 0. */
  happyZero: { share: number; meanYears: number };
  /** 9.4: mean happiness over all years, mean silver at death, mean months a year spent on activities. */
  happyMean?: number;
  silverLeft?: number;
  monthsPerYear?: number;
  daoHeartZero: number;
  /** Share of all years lived with each stat at 95+. */
  topShare: { happiness: number; intellect: number; charm: number };
  /** Mean years per life with a full bar that could not go on, and how many of those the technique blocked. */
  fullBarYears: number;
  capYears: number;
  /** Mean aptitude gained per life (three stats summed) and share of lives ending with one at 90+. */
  aptitudeGain: number;
  aptitudeHigh: number;
  /** The events that repeat most: mean times per 100 years lived, among lives that had them (max = most in one life). */
  topRepeats: { id: string; max: number; perCentury: number }[];
  /** Spirit stones left at death: mean, median and share of lives dying with 500 or more. */
  stonesLeft: { mean: number; p50: number; rich: number };
  /** 9.R12: share of lives each tiên duyên gate opened for; by Kim Thủ Chỉ and by khí vận (share, mean age, Kim Đan share); kết cục shares. */
  byGate: Record<string, number>;
  byFinger: Record<string, Group>;
  byTrait: Record<string, Group>;
  byEnding: Record<string, number>;
  /** 9.S1: Tình tiết đặc biệt hiếm drawn (share, mean age, Kim Đan share), and the share of lives with any. */
  bySpecial: Record<string, Group>;
  specialAny: number;
  /** 9.3: share of log lines that repeat an earlier line of the same life; the lines repeated most (total uses). */
  repeatRate?: number;
  topLines?: [string, number][];
  /** 9.8: mean different activities per life, share of years with something notable, silver at death (median), causes of death by tầng. */
  activityKinds?: number;
  eventKinds?: number;
  eventfulShare?: number;
  silverP50?: number;
  /** 10.1: share of lives that went to school, and that learnt a trade. */
  schooledShare?: number;
  aliasShare?: number;
  factionShare?: number;
  tradeShare?: number;
  /** 10.2: share of lives reaching at least Tú tài, Cử nhân, Tiến sĩ. */
  examShares?: [number, number, number];
  causeByTier?: Record<string, Record<string, number>>;
}

export interface Group { share: number; meanAge: number; kimDan: number }

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

export function summarize(results: LifeResult[], content: Content): Report {
  const n = results.length;
  const ages = results.map((r) => r.age).sort((a, b) => a - b);
  const byCause: Record<string, number> = {};
  for (const r of results) byCause[r.cause] = (byCause[r.cause] ?? 0) + 1;
  const realms = content.cultivation.realms.realms;
  const reached: Record<string, number> = {};
  realms.forEach((r, i) => { reached[r.id] = n ? results.filter((x) => x.peak >= i).length / n : 0; });
  const reachedAge: Record<string, number> = {};
  for (const r of realms) {
    const ages = results.map((x) => x.reachedAt[r.id]).filter((a): a is number => a !== undefined);
    if (ages.length > 0) reachedAge[r.id] = ages.reduce((a, b) => a + b, 0) / ages.length;
  }
  const roots: Record<string, LifeResult[]> = {};
  for (const r of results) (roots[r.rootGrade] ??= []).push(r);
  const kd = realms.findIndex((r) => r.id === 'kim_dan');
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const byRoot: Report['byRoot'] = {};
  for (const [g, list] of Object.entries(roots)) {
    byRoot[g] = { share: list.length / n, meanAge: mean(list.map((x) => x.age)), kimDan: list.filter((x) => kd >= 0 && x.peak >= kd).length / list.length, capYears: mean(list.map((x) => x.capYears)) };
  }
  const sad = results.filter((r) => r.happyZeroYears > 0);
  return {
    count: n, stuck: results.filter((r) => r.stuck).length,
    age: { mean: n ? ages.reduce((a, b) => a + b, 0) / n : 0, p10: pct(ages, 10), p50: pct(ages, 50), p90: pct(ages, 90), max: ages[n - 1] ?? 0 },
    byCause, reached, reachedAge, byRoot,
    topShare: (() => { const t = (k: 'happiness' | 'intellect' | 'charm') => results.reduce((a, r) => a + r.topYears[k], 0) / Math.max(1, results.reduce((a, r) => a + r.topYears.lived, 0)); return { happiness: t('happiness'), intellect: t('intellect'), charm: t('charm') }; })(),
    happyZero: { share: n ? sad.length / n : 0, meanYears: mean(results.map((r) => r.happyZeroYears)) },
    happyMean: mean(results.map((r) => r.happyMean ?? 0)),
    silverLeft: mean(results.map((r) => r.silverLeft ?? 0)),
    monthsPerYear: mean(results.map((r) => r.monthsPerYear ?? 0)),
    daoHeartZero: n ? results.filter((r) => r.daoHeartZero).length / n : 0,
    fullBarYears: mean(results.map((r) => r.fullBarYears)),
    capYears: mean(results.map((r) => r.capYears)),
    aptitudeGain: mean(results.map((r) => r.aptitudeGain)),
    aptitudeHigh: n ? results.filter((r) => r.aptitudeHigh).length / n : 0,
    topRepeats: topRepeats(results),
    byGate: (() => { const o: Record<string, number> = {}; for (const r of results) for (const g of r.gates ?? []) o[g] = (o[g] ?? 0) + 1 / n; return o; })(),
    byFinger: groupBy(results, (r) => (r.finger ? [r.finger] : []), n, kd),
    byTrait: groupBy(results, (r) => r.traits ?? [], n, kd),
    bySpecial: groupBy(results, (r) => r.special ?? [], n, kd),
    specialAny: n ? results.filter((r) => (r.special ?? []).length > 0).length / n : 0,
    repeatRate: (() => { const t = results.reduce((a, r) => a + (r.lines ?? 0), 0); return t ? results.reduce((a, r) => a + (r.repeatLines ?? 0), 0) / t : 0; })(),
    topLines: (() => { const o = new Map<string, number>(); for (const r of results) for (const [k, c] of r.topLines ?? []) o.set(k, (o.get(k) ?? 0) + c); return [...o.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5); })(),
    activityKinds: mean(results.map((r) => r.activityKinds ?? 0)),
    eventKinds: mean(results.map((r) => r.eventKinds ?? 0)),
    eventfulShare: mean(results.map((r) => r.eventfulShare ?? 0)),
    schooledShare: mean(results.map((r) => (r.schooled ? 1 : 0))),
    aliasShare: mean(results.map((r) => (r.alias ? 1 : 0))),
    factionShare: mean(results.map((r) => (r.faction ? 1 : 0))),
    tradeShare: mean(results.map((r) => ((r.tradeLevel ?? -1) >= 0 ? 1 : 0))),
    examShares: [1, 2, 4].map((k) => mean(results.map((r) => ((r.examRank ?? -1) >= k ? 1 : 0)))) as [number, number, number],
    silverP50: (() => { const v = results.map((r) => r.silverLeft ?? 0).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] ?? 0; })(),
    causeByTier: (() => {
      const o: Record<string, Record<string, number>> = {};
      for (const r of results) { const t = (o[r.tier ?? '?'] ??= {}); t[r.cause] = (t[r.cause] ?? 0) + 1; }
      return o;
    })(),
    byEnding: (() => { const o: Record<string, number> = {}; for (const r of results) if (r.ending) o[r.ending] = (o[r.ending] ?? 0) + 1 / n; return o; })(),
    stonesLeft: (() => {
      const st = results.map((r) => r.stonesLeft).sort((a, b) => a - b);
      return { mean: mean(st), p50: st[Math.floor(st.length / 2)] ?? 0, rich: n ? st.filter((v) => v >= 500).length / n : 0 };
    })(),
  };
}

function groupBy(results: LifeResult[], keys: (r: LifeResult) => string[], n: number, kd: number): Record<string, Group> {
  const lists: Record<string, LifeResult[]> = {};
  for (const r of results) for (const k of keys(r)) (lists[k] ??= []).push(r);
  const out: Record<string, Group> = {};
  for (const [k, list] of Object.entries(lists)) {
    out[k] = { share: list.length / n, meanAge: list.reduce((a, x) => a + x.age, 0) / list.length, kimDan: list.filter((x) => kd >= 0 && x.peak >= kd).length / list.length };
  }
  return out;
}

/** 9.R12: content with part of balance.json replaced (objects merge, arrays and numbers replace), checked by the schema. */
export function withBalancePatch(content: Content, patch: unknown): { content: Content; error: string | null } {
  if (patch === null || patch === undefined || (typeof patch === 'object' && Object.keys(patch as object).length === 0)) return { content, error: null };
  if (typeof patch !== 'object' || Array.isArray(patch)) return { content, error: 'Bản chỉnh phải là một đối tượng JSON, ví dụ {"karmaLedger": {"chance": 0.1}}' };
  const merge = (a: unknown, b: unknown): unknown => {
    if (!b || typeof b !== 'object' || Array.isArray(b) || !a || typeof a !== 'object' || Array.isArray(a)) return b;
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = merge(out[k], v);
    return out;
  };
  const parsed = BalanceSchema.safeParse(merge(content.balance, patch));
  if (!parsed.success) return { content, error: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  return { content: { ...content, balance: parsed.data as Content['balance'] }, error: null };
}

function topRepeats(results: LifeResult[]): Report['topRepeats'] {
  const per: Record<string, { k: number; rate: number }[]> = {};
  for (const r of results) for (const [id, k] of Object.entries(r.seen)) (per[id] ??= []).push({ k, rate: (k * 100) / Math.max(r.age, 20) });
  return Object.entries(per)
    .map(([id, xs]) => ({ id, max: Math.max(...xs.map((x) => x.k)), perCentury: xs.reduce((a, x) => a + x.rate, 0) / xs.length }))
    .sort((a, b) => b.perCentury - a.perCentury)
    .slice(0, 8);
}

/** The report as plain text for the terminal. */
export function formatReport(rep: Report, content: Content, title: string): string {
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id;
  const p = (v: number) => `${(v * 100).toFixed(1)}%`;
  const lines = [
    `== ${title} ==`,
    `${rep.count} đời, ${rep.stuck} đời kẹt (quá giới hạn an toàn)`,
    `Tuổi thọ: trung bình ${rep.age.mean.toFixed(1)}, trung vị ${rep.age.p50}, p10 ${rep.age.p10}, p90 ${rep.age.p90}, cao nhất ${rep.age.max}`,
    'Nguyên nhân chết: ' + Object.entries(rep.byCause).sort((a, b) => b[1] - a[1]).map(([c, k]) => `${c} ${p(k / rep.count)}`).join(', '),
    'Từng đạt cảnh giới: ' + Object.entries(rep.reached).map(([id, v]) => `${realmName(id)} ${p(v)}`).join(', '),
    'Tuổi trung bình khi vào cảnh giới: ' + Object.entries(rep.reachedAge).map(([id, v]) => `${realmName(id)} ${v.toFixed(0)}`).join(', '),
    'Theo linh căn: ' + Object.entries(rep.byRoot).sort((a, b) => b[1].share - a[1].share)
      .map(([g, v]) => `${g} ${p(v.share)} (tuổi TB ${v.meanAge.toFixed(0)}, Kim Đan ${p(v.kimDan)}, kẹt công pháp ${v.capYears.toFixed(0)} năm)`).join(', '),
    `Hạnh phúc chạm 0: ${p(rep.happyZero.share)} số đời, trung bình ${rep.happyZero.meanYears.toFixed(1)} năm ở 0 mỗi đời; đạo tâm chạm 0: ${p(rep.daoHeartZero)}`,
    `Số năm sống có chỉ số từ 95: hạnh phúc ${p(rep.topShare.happiness)}, trí tuệ ${p(rep.topShare.intellect)}, mị lực ${p(rep.topShare.charm)}`,
    `Năm đầy thanh tu vi mà không tiến được: trung bình ${rep.fullBarYears.toFixed(1)} năm mỗi đời, trong đó ${rep.capYears.toFixed(1)} năm vì công pháp`,
    `Tư chất (căn cốt + ngộ tính + khí vận) tăng trung bình ${rep.aptitudeGain.toFixed(1)} điểm mỗi đời; ${p(rep.aptitudeHigh)} số đời kết thúc với một chỉ số từ 90`,
    `Linh thạch lúc chết: trung bình ${rep.stonesLeft.mean.toFixed(0)}, trung vị ${rep.stonesLeft.p50}, ${p(rep.stonesLeft.rich)} số đời còn từ 500`,
    'Sự kiện lặp dày nhất (lần mỗi 100 năm sống, nhiều nhất một đời): ' + rep.topRepeats.map((t) => `${t.id} ${t.perCentury.toFixed(1)} (${t.max})`).join(', '),
    // 9.R12: tiên duyên gates and kết cục.
    'Cổng tiên duyên mở: ' + (Object.entries(rep.byGate ?? {}).sort((a, b) => b[1] - a[1]).map(([g, v]) => `${g} ${p(v)}`).join(', ') || 'không'),
    `Thiên cơ biến động: ${p(rep.specialAny ?? 0)} số đời` + (Object.keys(rep.bySpecial ?? {}).length ? ' (' + Object.entries(rep.bySpecial).map(([id, g]) => `${id} ${p(g.share)}`).join(', ') + ')' : ''),
    `Hạnh phúc trung bình ${(rep.happyMean ?? 0).toFixed(1)} · bạc cuối đời ${Math.round(rep.silverLeft ?? 0)} · tháng hoạt động mỗi năm ${(rep.monthsPerYear ?? 0).toFixed(1)}`,
    `Câu lặp trong nhật ký: ${p(rep.repeatRate ?? 0)} số dòng` + ((rep.topLines ?? []).length ? '; lặp nhiều nhất: ' + rep.topLines!.map(([t, c]) => `"${t.slice(0, 50)}" ×${c}`).join(', ') : ''),
    `Hoạt động khác nhau mỗi đời: ${(rep.activityKinds ?? 0).toFixed(1)} · sự kiện khác nhau ${(rep.eventKinds ?? 0).toFixed(1)} · năm có chuyện đáng kể: ${p(rep.eventfulShare ?? 0)} · bạc cuối đời trung vị ${rep.silverP50 ?? 0}`,
    `Đi học: ${p(rep.schooledShare ?? 0)} · học nghề: ${p(rep.tradeShare ?? 0)} · khoa cử Tú tài/Cử nhân/Tiến sĩ: ${(rep.examShares ?? [0, 0, 0]).map(p).join('/')}`,
    'Chết theo tầng: ' + Object.entries(rep.causeByTier ?? {}).map(([t, c]) => `${t}: ` + Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${v}`).join(', ')).join(' | '),
    'Kết cục: ' + Object.entries(rep.byEnding ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([e, v]) => `${e} ${p(v)}`).join(', '),
  ];
  return lines.join('\n');
}

/** 9.8: one row per persona phàm nhân, for the terminal. */
export function formatPersonaTable(rows: { profile: BotProfile; report: Report }[]): string {
  const p = (v: number) => `${Math.round(v * 100)}%`;
  const head = 'Persona | Đời | Vào tu tiên | Tuổi TB | Hạnh phúc TB | Bạc cuối (TB/trung vị) | Hoạt động khác nhau | Sự kiện khác nhau | Năm có chuyện | Câu lặp | Đi học/Học nghề | Tú tài/Cử nhân/Tiến sĩ | Ngoại hiệu | Thế lực | Chết vì (nhiều nhất)';
  const lines = rows.map(({ profile, report: r }) => {
    const causes = Object.entries(r.byCause).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, k]) => `${c} ${p(k / r.count)}`).join(', ');
    return [personaOf(profile)?.name ?? profile, r.count, p(r.reached.luyen_khi ?? 0), r.age.mean.toFixed(1), (r.happyMean ?? 0).toFixed(1), `${Math.round(r.silverLeft ?? 0)}/${r.silverP50 ?? 0}`,
      (r.activityKinds ?? 0).toFixed(1), (r.eventKinds ?? 0).toFixed(1), p(r.eventfulShare ?? 0), p(r.repeatRate ?? 0), `${p(r.schooledShare ?? 0)}/${p(r.tradeShare ?? 0)}`, (r.examShares ?? [0, 0, 0]).map(p).join('/'), p(r.aliasShare ?? 0), p(r.factionShare ?? 0), causes].join(' | ');
  });
  return [head, ...lines].join('\n');
}

/** Run `count` lives with seeds `${prefix}-0 …` and summarise them. */
export function simulateMany(content: Content, count: number, prefix: string, opts: SimOptions = {}): { results: LifeResult[]; report: Report } {
  const results = Array.from({ length: count }, (_, i) => simulateLife(content, `${prefix}-${i}`, opts));
  return { results, report: summarize(results, content) };
}

/** 9.R2d: what one khí vận changes, against the same seeds with none. */
export interface TraitImpact {
  id: string;
  /** Change in mean peak realm (realm steps), mean age, and share of lives reaching Kim Đan. */
  peak: number;
  age: number;
  kimDan: number;
  /** Over its rarity's budget (or a mixed / ác vận one that is all upside). */
  over: boolean;
}

export function traitImpacts(content: Content, ids: string[], count: number, prefix: string, opts: SimOptions = {}): { base: Report; impacts: TraitImpact[] } {
  const kd = content.cultivation.realms.realms.findIndex((r) => r.id === 'kim_dan');
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const stats = (rs: LifeResult[]) => ({ peak: mean(rs.map((r) => r.peak)), age: mean(rs.map((r) => r.age)), kimDan: mean(rs.map((r) => (r.peak >= kd ? 1 : 0))) });
  // The baseline for each rarity is an empty khí vận of that rarity, so the stat lift every rarity gives
  // (backlog 5, fateLift) is in both sides and only the khí vận's own effects are measured.
  const blank = (rarity: string) => `__blank_${rarity}`;
  const rarities = [...new Set(ids.map((id) => content.traits.find((x) => x.id === id)?.rarity ?? 'pham'))];
  const withBlanks: Content = { ...content, traits: [...content.traits, ...rarities.map((r) => ({ id: blank(r), rarity: r, name: '—', flavor: '—', summary: '—', effects: [] }))] };
  const bases = new Map(rarities.map((r) => [r, simulateMany(withBlanks, count, prefix, { ...opts, traits: [blank(r)] })]));
  const base = bases.get(rarities[0])!;
  const budget = content.balance.traits.budget;
  const impacts = ids.map((id) => {
    const t = content.traits.find((x) => x.id === id);
    const b = stats(bases.get(t?.rarity ?? 'pham')!.results);
    const r = stats(simulateMany(content, count, prefix, { ...opts, traits: [id] }).results);
    const peak = r.peak - b.peak;
    const max = budget?.max[t?.rarity ?? ''] ?? Infinity;
    const mixed = t?.nature === 'hon_hop' || t?.rarity === 'ac';
    return { id, peak, age: r.age - b.age, kimDan: r.kimDan - b.kimDan, over: peak > max || (mixed && peak > (budget?.mixedMax ?? Infinity)) };
  });
  return { base: base.report, impacts };
}

/** 9.R3d: what one Kim Thủ Chỉ changes, against the same seeds with none (relative lift per axis, and its price). */
export interface FingerImpact {
  id: string;
  /** Relative lift: mean peak realm, mean age, spirit stones at death (best of the three is `gain`). */
  cultivation: number;
  lifespan: number;
  wealth: number;
  gain: number;
  /** Change in the share of lives dying in a fight / to a heart demon or đạo tâm at 0 (its price). */
  combatDeath: number;
  heartDemon: number;
  /** Against balance.goldenFinger.impactTarget: under half of it, over twice it, or in range. */
  verdict: 'yeu' | 'manh' | 'vua';
}

export function fingerImpacts(content: Content, ids: string[], count: number, prefix: string, opts: SimOptions = {}): { base: Report; impacts: FingerImpact[] } {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const share = (rs: LifeResult[], f: (r: LifeResult) => boolean) => rs.filter(f).length / Math.max(1, rs.length);
  const stats = (rs: LifeResult[]) => ({
    peak: mean(rs.map((r) => r.peak)), age: mean(rs.map((r) => r.age)), stones: mean(rs.map((r) => r.stonesLeft)),
    combat: share(rs, (r) => r.cause === 'combat'), demon: share(rs, (r) => r.cause.includes('demon') || r.cause.includes('tam_ma') || r.daoHeartZero),
  });
  const { results, report: base } = simulateMany(content, count, prefix, { ...opts, goldenFinger: undefined });
  const b = stats(results);
  const targets = content.balance.goldenFinger.impactTarget ?? {};
  const impacts = ids.map((id) => {
    const f = content.goldenFingers.fingers.find((x) => x.id === id);
    const r = stats(simulateMany(content, count, prefix, { ...opts, goldenFinger: id }).results);
    // Floors keep a tiny baseline (e.g. almost no stones) from turning a small change into a huge ratio.
    const cultivation = (r.peak - b.peak) / Math.max(b.peak, 0.5);
    const lifespan = (r.age - b.age) / Math.max(b.age, 1);
    const wealth = (r.stones - b.stones) / Math.max(b.stones, 100);
    const gain = Math.max(cultivation, lifespan, wealth);
    const target = targets[f?.rarity ?? 'pham'] ?? 0;
    const verdict: FingerImpact['verdict'] = gain < target / 2 ? 'yeu' : gain > target * 2 ? 'manh' : 'vua';
    return { id, cultivation, lifespan, wealth, gain, combatDeath: r.combat - b.combat, heartDemon: r.demon - b.demon, verdict };
  });
  return { base, impacts };
}
