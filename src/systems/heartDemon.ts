// Tâm ma chiến (task 4.4): before a big breakthrough into a realm listed in
// balance.heartDemon, a life carrying tâm ma seeds (dark choices, task 3.9), a
// weak đạo tâm or heavy bad karma must first pass through illusions built from
// its own past: those who still bear a grudge (sổ ân oán), those it killed,
// its dark deeds, the dead it mourns, the lover it left. Each illusion is met by
// owning up (Đạo tâm), cutting it down (Ngộ tính) or chanting (Đạo tâm + kháng
// tâm ma). Passing clears seeds and steadies the breakthrough; failing turns the
// demon on the cultivator and the breakthrough fails.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import { fillTemplate } from '../core/state';
import type { GameState, LogLine } from '../core/types';
import { hookSum, majorFailure, majorSuccess, type BreakthroughResult } from './cultivation';
import { checkChance } from './events/engine';
import { startCoreForming } from './goldenCore';

export type HeartDemonOption = 'face' | 'slash' | 'chant';

export function needsHeartDemonTrial(state: GameState, content: Content, target: string): boolean {
  const cfg = content.balance.heartDemon;
  if (!cfg.realms.includes(target)) return false;
  return state.cult.heartDemon >= cfg.seeds || state.aptitudes.daoHeart < cfg.daoHeartBelow || state.social.karma <= cfg.karmaAtMost;
}

/** The illusions this life would meet: its own past first, nameless fears to fill the rest. */
export function buildIllusions(state: GameState, content: Content, rng: Rng): string[] {
  const t = content.heartDemon;
  const n = content.balance.heartDemon.rounds;
  const withNpc = (text: string, id: string) => fillTemplate(text, { ...state, events: { ...state.events, npc: id } }, content);
  const killed = state.npcs.filter((x) => !x.alive && state.npcs.some((h) => h.heirOf === x.id)).map((x) => withNpc(t.illusions.killed, x.id));
  const deeds = Object.entries(t.deeds).filter(([flag]) => state.flags[flag]).map(([, text]) => text);
  const grudges = state.npcs.filter((x) => x.alive && x.grudge >= content.balance.npcs.revengeAt).map((x) => withNpc(t.illusions.grudge, x.id));
  const exes = state.romance.exes.filter((id) => state.npcs.some((x) => x.id === id && x.alive)).map((id) => withNpc(t.illusions.ex, id));
  const mourned = state.family.some((r) => !r.alive) ? [fillTemplate(t.illusions.deceased, state, content)] : [];
  const out: string[] = [];
  for (const pool of [deeds, killed, grudges, exes, mourned]) {
    const left = pool.slice();
    while (left.length > 0 && out.length < n) out.push(left.splice(rng.int(0, left.length - 1), 1)[0]);
  }
  const fears = t.illusions.fear.slice();
  while (out.length < n) out.push(fears.length > 0 ? fears.splice(rng.int(0, fears.length - 1), 1)[0] : rng.pick(t.illusions.fear));
  return out;
}

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Begin the trial (called by attemptMajorBreakthrough). */
export function startHeartDemonTrial(state: GameState, content: Content, chancePct: number, target: string): GameState {
  const rng = Rng.fromState(state.rng);
  const illusions = buildIllusions(state, content, rng);
  const s = pushLine(state, { text: content.heartDemon.intro, tone: 'bad' });
  return { ...s, rng: rng.getState(), cult: { ...s.cult, heartDemonTrial: { illusions, round: 0, wins: 0, losses: 0, chancePct, target } } };
}

/** Chance to overcome the current illusion with this response. */
export function optionChance(state: GameState, content: Content, option: HeartDemonOption): number {
  const cfg = content.balance.heartDemon;
  const diff = cfg.difficulty + state.cult.heartDemon * cfg.perSeed;
  if (option === 'face') return checkChance(state, content, 'stat.daoHeart', diff);
  if (option === 'slash') return checkChance(state, content, 'stat.comprehension', diff);
  return checkChance(state, content, 'stat.daoHeart', diff - hookSum(state, content, 'heartDemonResist') * 100);
}

/** Meet the current illusion; when the trial is decided, the breakthrough goes on or fails. */
export function meetIllusion(state: GameState, content: Content, option: HeartDemonOption): { state: GameState; result: BreakthroughResult | null } {
  const trial = state.cult.heartDemonTrial;
  if (!trial) return { state, result: null };
  const cfg = content.balance.heartDemon;
  const t = content.heartDemon;
  const rng = Rng.fromState(state.rng);
  const won = rng.chance(optionChance(state, content, option));
  let s = pushLine(state, { text: `${trial.illusions[trial.round]} ${won ? t.results.win : t.results.lose}`, tone: won ? 'good' : 'bad' });
  if (won && option === 'face') s = { ...s, aptitudes: { ...s.aptitudes, daoHeart: Math.min(100, s.aptitudes.daoHeart + cfg.faceDaoHeart) } };
  const next = { ...trial, round: trial.round + 1, wins: trial.wins + (won ? 1 : 0), losses: trial.losses + (won ? 0 : 1) };
  const passed = next.wins >= cfg.toPass;
  const failed = next.losses > cfg.rounds - cfg.toPass;
  if (!passed && !failed) return { state: { ...s, rng: rng.getState(), cult: { ...s.cult, heartDemonTrial: next } }, result: null };

  s = { ...s, cult: { ...s.cult, heartDemonTrial: null } };
  if (failed) {
    s = { ...s, aptitudes: { ...s.aptitudes, daoHeart: Math.max(0, s.aptitudes.daoHeart + cfg.failDaoHeart) } };
    const r = majorFailure(state, s, content, rng, t.results.fail);
    return { state: r.state, result: r };
  }
  s = pushLine({ ...s, cult: { ...s.cult, heartDemon: Math.max(0, s.cult.heartDemon - cfg.passClears) } }, { text: t.results.pass, tone: 'good' });
  const chance = next.chancePct + cfg.passBonusPct;
  // Kim Đan still has kết đan ahead (task 4.2); other realms roll now.
  if (next.target === content.balance.coreForming.realm) {
    return { state: startCoreForming({ ...s, rng: rng.getState() }, content, chance), result: null };
  }
  const target = content.cultivation.realms.realms.find((r) => r.id === next.target)!;
  const r = rng.chance(chance / 100)
    ? majorSuccess(state, s, content, rng, { id: target.id, name: target.name }, null)
    : majorFailure(state, s, content, rng);
  return { state: r.state, result: r };
}
