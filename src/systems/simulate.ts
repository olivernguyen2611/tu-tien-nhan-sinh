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
import { resolveChoice, findEvent, visibleChoices } from './events/engine';
import { chooseFate } from './fate';
import { placeStrand } from './goldenCore';
import { meetIllusion } from './heartDemon';
import { runSeclusion } from './seclusion';
import { learnTechnique } from './technique';
import { checkDeath } from './time';

/** How the bot decides. `random` picks event choices at random and always tries to break through; `steady` takes the first open choice and only breaks through at 50% or better. */
export type BotProfile = 'random' | 'steady';
export const BOT_PROFILES: BotProfile[] = ['random', 'steady'];

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
  /** True when the run hit the safety limit instead of ending in death. */
  stuck: boolean;
}

export interface SimOptions {
  profile?: BotProfile;
  difficulty?: string;
  /** Safety limits; a life that passes them is reported as stuck. */
  maxAge?: number;
  maxSteps?: number;
}

/** Live one life to its end. Deterministic for a seed, profile and content. */
export function simulateLife(content: Content, seed: string, opts: SimOptions = {}): LifeResult {
  const profile = opts.profile ?? 'random';
  const maxAge = opts.maxAge ?? 3000;
  const maxSteps = opts.maxSteps ?? 20000;
  const botRng = new Rng(`bot:${seed}`);
  const realms = content.cultivation.realms.realms.map((r) => r.id);
  let s: GameState = confirmDestiny(rollDestiny(createLife({ seed, difficulty: opts.difficulty }, content), content), content);
  let peak = 0;
  let steps = 0;
  while (s.alive && s.character.age < maxAge && steps++ < maxSteps) {
    peak = Math.max(peak, realms.indexOf(s.cult.realm));
    if (s.events.pending) {
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
        const r = act(s, content, 'all_out');
        s = r.state.combat ? r.state : checkDeath(r.state, content, r.state.stats.health <= 0 ? 'combat' : undefined);
      } else {
        s = runSeclusion(checkDeath(settle(s, content, 'spare').state, content), content);
      }
      continue;
    }
    if (s.cult.coreForming) { s = placeStrand(s, content, s.cult.coreForming.offered[0]).state; continue; }
    if (s.cult.heartDemonTrial) { s = meetIllusion(s, content, 'face').state; continue; }
    // A rooted mortal takes the starter technique and begins to cultivate.
    if (s.cult.realm === 'pham_nhan' && rootUsable(s, content)) {
      const learned = s.cult.technique ? { state: s } : learnTechnique(s, content, content.balance.techniques.default, { quiet: true });
      if (learned) {
        const started = enterFirstRealm(learned.state, content);
        if (started !== s) { s = started; continue; }
      }
    }
    const info = majorBreakthroughInfo(s, content);
    if (info && !info.blocked && (profile === 'random' || info.chancePct >= 50)) {
      const r = attemptMajorBreakthrough(s, content);
      if (r) { s = checkDeath(r.state, content); continue; }
    }
    s = s.seclusion ? runSeclusion(s, content) : advanceYear(s, content);
    s = checkDeath(s, content);
  }
  return {
    seed, age: s.character.age, alive: s.alive, cause: s.death?.cause ?? (s.alive ? 'stuck' : 'unknown'), realm: s.cult.realm,
    peak: Math.max(peak, realms.indexOf(s.cult.realm)), rootGrade: s.cult.root?.grade ?? 'none', bodyId: s.cult.bodyId ?? null,
    martialStage: s.martial.stage, stuck: s.alive,
  };
}

export interface Report {
  count: number;
  stuck: number;
  age: { mean: number; p10: number; p50: number; p90: number; max: number };
  byCause: Record<string, number>;
  /** Share of lives that ever reached each realm (by realm id). */
  reached: Record<string, number>;
  /** Share of lives by root grade, and their mean age at death. */
  byRoot: Record<string, { share: number; meanAge: number }>;
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

export function summarize(results: LifeResult[], content: Content): Report {
  const n = results.length;
  const ages = results.map((r) => r.age).sort((a, b) => a - b);
  const byCause: Record<string, number> = {};
  for (const r of results) byCause[r.cause] = (byCause[r.cause] ?? 0) + 1;
  const realms = content.cultivation.realms.realms;
  const reached: Record<string, number> = {};
  realms.forEach((r, i) => { reached[r.id] = n ? results.filter((x) => x.peak >= i).length / n : 0; });
  const roots: Record<string, number[]> = {};
  for (const r of results) (roots[r.bodyId ? 'the_chat' : r.rootGrade] ??= []).push(r.age);
  const byRoot: Report['byRoot'] = {};
  for (const [g, list] of Object.entries(roots)) byRoot[g] = { share: list.length / n, meanAge: list.reduce((a, b) => a + b, 0) / list.length };
  return {
    count: n, stuck: results.filter((r) => r.stuck).length,
    age: { mean: n ? ages.reduce((a, b) => a + b, 0) / n : 0, p10: pct(ages, 10), p50: pct(ages, 50), p90: pct(ages, 90), max: ages[n - 1] ?? 0 },
    byCause, reached, byRoot,
  };
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
    'Theo linh căn: ' + Object.entries(rep.byRoot).sort((a, b) => b[1].share - a[1].share).map(([g, v]) => `${g} ${p(v.share)} (tuổi TB ${v.meanAge.toFixed(0)})`).join(', '),
  ];
  return lines.join('\n');
}

/** Run `count` lives with seeds `${prefix}-0 …` and summarise them. */
export function simulateMany(content: Content, count: number, prefix: string, opts: SimOptions = {}): { results: LifeResult[]; report: Report } {
  const results = Array.from({ length: count }, (_, i) => simulateLife(content, `${prefix}-${i}`, opts));
  return { results, report: summarize(results, content) };
}
