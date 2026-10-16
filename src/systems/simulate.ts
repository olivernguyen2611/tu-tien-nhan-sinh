// Giai đoạn 6.1: mô phỏng tự động. Một "người chơi máy" sống trọn một đời theo seed, đi qua mọi
// màn chặn (khí vận, sự kiện, trận đấu, kết đan, tâm ma, thiên phú) bằng chính các hàm của game,
// rồi gom thống kê nhiều đời để xem cân bằng. Không có logic game riêng ở đây: chỉ gọi hệ thống.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import { advanceYear, createLife } from '../core/state';
import type { GameState } from '../core/types';
import { act, settle } from './combat';
import { attemptMajorBreakthrough, enterFirstRealm, majorBreakthroughInfo, rootUsable } from './cultivation';
import { confirmDestiny, rollDestiny } from './destiny';
import { doFingerAction, fingerActionViews } from './fingerActions';
import { resolveChoice, findEvent, visibleChoices } from './events/engine';
import { chooseFate } from './fate';
import { placeStrand } from './goldenCore';
import { meetIllusion } from './heartDemon';
import { goLeisure } from './leisure';
import { caveView, rentCave } from './cave';
import { runSeclusion } from './seclusion';
import { doMission, joinSect, missionViews, requestMaster, masterBlocked, sectEligibility, sectTechniques } from './sect';
import { buyTreasury, treasuryViews } from './sectTreasury';
import { learnBlocked, learnTechnique, techniqueById, techniqueCapReason, techniqueMaxRealm } from './technique';
import { buyScroll, openMarkets, techniqueOffers } from './market';
import { checkDeath } from './time';
import { lifeEnding } from './chronicle';
import { BalanceSchema } from '../core/schemas';

/**
 * How the bot decides. `random` picks event choices at random and always tries to break through; `steady` takes the first open choice and only breaks through at 50% or better.
 * `player` (6b, from the 2026-10-12 playtest) lives like a typical player: random choices, joins a sect, does the best mission
 * each year, asks for a master, spends contribution at the treasury, moves to the technique that reaches furthest, and breaks through at 40% or better.
 */
export type BotProfile = 'random' | 'steady' | 'player';
export const BOT_PROFILES: BotProfile[] = ['random', 'steady', 'player'];

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
}

export interface SimOptions {
  profile?: BotProfile;
  difficulty?: string;
  /** Safety limits; a life that passes them is reported as stuck. */
  maxAge?: number;
  maxSteps?: number;
  /** Called at each event the bot answers and each blow of a fight (for finding what kills lives). */
  observe?: (kind: 'event' | 'combat', state: GameState) => void;
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
  const born = createLife({ seed, difficulty: opts.difficulty, goldenFinger: opts.goldenFinger, knowledge }, content);
  const offered = opts.traits ? { ...born, destiny: { ...born.destiny, offered: opts.traits } } : rollDestiny(born, content);
  let s: GameState = confirmDestiny(offered, content);
  let peak = 0;
  const reachedAt: Record<string, number> = {};
  let steps = 0;
  let happyZeroYears = 0;
  const topYears = { happiness: 0, intellect: 0, charm: 0, lived: 0 };
  let daoHeartZero = false;
  let fullBarYears = 0;
  let capYears = 0;
  const aptSum = (x: GameState) => x.aptitudes.physique + x.aptitudes.comprehension + x.aptitudes.luck;
  const aptStart = aptSum(s);
  while (s.alive && s.character.age < maxAge && steps++ < maxSteps) {
    peak = Math.max(peak, realms.indexOf(s.cult.realm));
    reachedAt[s.cult.realm] ??= s.character.age;
    if (s.events.pending) {
      opts.observe?.('event', s);
      const event = findEvent(content, s.events.pending);
      const open = event ? visibleChoices(s, content, event).filter((c) => !c.disabled) : [];
      // An event with nothing to pick is cleared by choosing its first choice.
      const pick = open.length === 0 ? 0 : profile === 'random' ? botRng.pick(open).index : open[0].index;
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
    if (s.cult.heartDemonTrial) { s = meetIllusion(s, content, 'face').state; continue; }
    // A rooted mortal finds an entry technique (9.R4c: bought at a market it can reach, or one it holds) and begins to cultivate.
    if (s.cult.realm === 'pham_nhan' && rootUsable(s, content)) {
      const learned = s.cult.technique ? { state: s } : buyEntryTechnique(s, content);
      if (learned) {
        const started = enterFirstRealm(learned.state, content);
        if (started !== s) { s = started; continue; }
      }
    }
    if (profile === 'player' && !s.seclusion) s = playerYear(s, content);
    // 9.R3d: every bot uses each finger action that is open (so the finger's price is paid too).
    if (s.goldenFinger && !s.seclusion && !s.events.pending) {
      for (const v of fingerActionViews(s, content)) if (!v.blocked) s = doFingerAction(s, content, v.id)?.state ?? s;
      if (s.events.pending || s.combat) continue;
    }
    const info = majorBreakthroughInfo(s, content);
    const minPct = profile === 'random' ? 0 : profile === 'player' ? 30 : 50;
    if (info && !info.blocked && info.chancePct >= minPct) {
      const r = attemptMajorBreakthrough(s, content);
      if (r) { s = checkDeath(r.state, content); continue; }
    }
    const before = s.character.age;
    s = s.seclusion ? runSeclusion(s, content) : advanceYear(s, content);
    s = checkDeath(s, content);
    const years = s.character.age - before;
    if (years > 0) {
      if (s.stats.happiness <= 0) happyZeroYears += years;
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
  return {
    seed, age: s.character.age, alive: s.alive, cause: s.death?.cause ?? (s.alive ? 'stuck' : 'unknown'), realm: s.cult.realm,
    peak: Math.max(peak, realms.indexOf(s.cult.realm)), rootGrade: s.cult.root?.grade ?? 'none', bodyId: s.cult.bodyId ?? null,
    martialStage: s.martial.stage, knowledge: s.knowledgeFound ?? 0, reachedAt, stage: s.cult.stage, stuck: s.alive,
    happyZeroYears, topYears, daoHeartZero, fullBarYears, capYears,
    aptitudeGain: aptSum(s) - aptStart,
    aptitudeHigh: Math.max(s.aptitudes.physique, s.aptitudes.comprehension, s.aptitudes.luck) >= 90,
    seen: { ...(s.events.seen ?? {}) },
    stonesLeft: s.money.spiritStones,
    gates: Object.keys(s.flags).filter((f) => s.flags[f] && f.startsWith('tien_duyen_')).map((f) => f.slice('tien_duyen_'.length)),
    finger: s.goldenFinger?.id ?? null,
    traits: [...s.traits],
    ending: lifeEnding(s, content, 1),
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
  if (s.stats.happiness < 30) s = goLeisure(s, content)?.state ?? s;
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
    daoHeartZero: n ? results.filter((r) => r.daoHeartZero).length / n : 0,
    fullBarYears: mean(results.map((r) => r.fullBarYears)),
    capYears: mean(results.map((r) => r.capYears)),
    aptitudeGain: mean(results.map((r) => r.aptitudeGain)),
    aptitudeHigh: n ? results.filter((r) => r.aptitudeHigh).length / n : 0,
    topRepeats: topRepeats(results),
    byGate: (() => { const o: Record<string, number> = {}; for (const r of results) for (const g of r.gates ?? []) o[g] = (o[g] ?? 0) + 1 / n; return o; })(),
    byFinger: groupBy(results, (r) => (r.finger ? [r.finger] : []), n, kd),
    byTrait: groupBy(results, (r) => r.traits ?? [], n, kd),
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
  ];
  return lines.join('\n');
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
