// Thiên kiêu bảng (task 3.5): the world's young prodigies cultivate on their own;
// each year they and the player (a cultivator under maxAge) are ranked by
// realm, stage and progress. Numbers in balance.rankings, texts in rankings.json.
// Rolls use their own seeded stream so the rest of the life is unchanged.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Prodigy } from '../core/types';
import { makeName } from './names';

function newProdigy(content: Content, rng: Rng, age: number, taken: string[]): Prodigy {
  const cfg = content.balance.rankings;
  const gender = rng.chance(0.5) ? 'nam' : 'nu';
  const sects = content.sects.filter((s) => s.recruitable !== false);
  return {
    id: `tk_${rng.int(100000, 999999)}`,
    name: makeName(rng, content.names, gender, { taken }),
    gender,
    age,
    sect: sects.length > 0 && rng.chance(0.8) ? rng.pick(sects).id : null,
    aptitude: rng.int(cfg.aptitude[0], cfg.aptitude[1]),
    realm: 'pham_nhan',
    stage: 0,
    progress: 0,
  };
}

/** The first prodigies, ages around the player's; those already past startAge catch up on the years they cultivated. */
export function rollProdigies(seed: string, content: Content, playerAge: number): Prodigy[] {
  const cfg = content.balance.rankings;
  const rng = new Rng(`${seed}:prodigies`);
  const out: Prodigy[] = [];
  for (let i = 0; i < cfg.count; i++) {
    const age = Math.max(0, Math.min(cfg.maxAge, playerAge + rng.int(cfg.ageOffset[0], cfg.ageOffset[1])));
    let p = newProdigy(content, rng, Math.min(age, cfg.startAge), out.map((x) => x.name));
    while (p.age < age) p = growProdigy(p, content, rng, false)!;
    out.push(p);
  }
  return out;
}

/** Realm index + share of the realm done: comparable across realms. */
function score(content: Content, realm: string, stage: number, progress: number): number {
  const realms = content.cultivation.realms.realms;
  const i = realms.findIndex((r) => r.id === realm);
  if (i <= 0) return 0;
  const stages = realms[i].stages.length;
  return i + (stage + Math.min(100, progress) / 100) / stages;
}

function playerScore(state: GameState, content: Content): number | null {
  const cfg = content.balance.rankings;
  if (!state.alive || state.cult.realm === 'pham_nhan' || state.character.age > cfg.maxAge) return null;
  return score(content, state.cult.realm, state.cult.stage, state.cult.progress);
}

function realmText(content: Content, realm: string, stage: number): string {
  const r = content.cultivation.realms.realms.find((x) => x.id === realm);
  return r ? `${r.name} ${r.stages[stage] ?? ''}`.trim() : realm;
}

/** One year for a prodigy: cultivate, break through (or not), maybe fall. Returns null if they die. */
function growProdigy(p: Prodigy, content: Content, rng: Rng, mortal = true): Prodigy | null {
  const cfg = content.balance.rankings;
  const realms = content.cultivation.realms.realms;
  let n: Prodigy = { ...p, age: p.age + 1 };
  if (n.realm === 'pham_nhan' && n.age >= cfg.startAge) n = { ...n, realm: realms[1]?.id ?? n.realm, stage: 0, progress: 0 };
  if (n.realm !== 'pham_nhan') {
    const speed = content.balance.realms[n.realm]?.speedPct ?? 0;
    n = { ...n, progress: n.progress + speed * (cfg.speedBase + n.aptitude / cfg.speedDivisor) };
    while (n.progress >= 100) {
      const ri = realms.findIndex((r) => r.id === n.realm);
      if (n.stage + 1 < realms[ri].stages.length) {
        n = { ...n, stage: n.stage + 1, progress: n.progress - 100 };
        continue;
      }
      const next = realms[ri + 1];
      const chance = next ? (content.balance.realms[next.id]?.breakthroughChance ?? 0) * cfg.breakthroughMul : 0;
      n = next && rng.chance(Math.min(1, chance)) ? { ...n, realm: next.id, stage: 0, progress: 0 } : { ...n, progress: 50 };
      break;
    }
  }
  return mortal && rng.chance(cfg.deathPerYear) ? null : n;
}

export interface RankRow {
  rank: number;
  name: string;
  realm: string;
  sect: string;
  age: number;
  player: boolean;
}

/** The board: top `size` prodigies plus the player when eligible. */
export function rankingBoard(state: GameState, content: Content): RankRow[] {
  const cfg = content.balance.rankings;
  const sectName = (id: string | null) => content.sects.find((s) => s.id === id)?.name ?? 'Tán tu';
  type Entry = { score: number; row: Omit<RankRow, 'rank'> };
  const entries: Entry[] = state.ranking.prodigies
    .filter((p) => p.realm !== 'pham_nhan')
    .map((p) => ({
      score: score(content, p.realm, p.stage, p.progress),
      row: { name: p.name, realm: realmText(content, p.realm, p.stage), sect: sectName(p.sect), age: p.age, player: false },
    }));
  const mine = playerScore(state, content);
  if (mine !== null) {
    entries.push({
      score: mine,
      row: { name: state.character.name, realm: realmText(content, state.cult.realm, state.cult.stage), sect: sectName(state.sect.id), age: state.character.age, player: true },
    });
  }
  // Ties go to the player, so a rival never shares a spot.
  entries.sort((a, b) => b.score - a.score || Number(b.row.player) - Number(a.row.player));
  return entries.slice(0, cfg.size).map((e, i) => ({ rank: i + 1, ...e.row }));
}

/** Yearly update: prodigies grow, the fallen and the too-old are replaced, the player's rank is logged when it changes. */
export function rankingYear(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  const cfg = content.balance.rankings;
  const t = content.rankings;
  const rng = new Rng(`${state.seed}:ranking:${state.character.age}`);
  const lines: LogLine[] = [];
  const kept: Prodigy[] = [];
  const before = rankingBoard(state, content);
  // The board is filled the first year it is needed (new lives and old saves alike).
  const start = state.ranking.prodigies.length > 0 ? state.ranking.prodigies : rollProdigies(state.seed, content, state.character.age);
  for (const p of start) {
    const grown = growProdigy(p, content, rng);
    if (!grown) {
      // Only a fall from the board is news.
      if (before.some((r) => !r.player && r.name === p.name)) {
        lines.push({ text: t.fallen.replace('{prodigy}', p.name).replace('{realm}', realmText(content, p.realm, p.stage)), tone: 'normal' });
      }
      continue;
    }
    if (grown.age <= cfg.maxAge) kept.push(grown);
  }
  while (kept.length < cfg.count) {
    kept.push(newProdigy(content, rng, rng.int(cfg.newAge[0], cfg.newAge[1]), [state.character.name, ...kept.map((p) => p.name)]));
  }

  let s: GameState = { ...state, ranking: { ...state.ranking, prodigies: kept } };
  const rank = rankingBoard(s, content).find((r) => r.player)?.rank ?? null;
  const old = state.ranking.rank;
  const fill = (text: string) => text.replace(/\{name\}/g, state.character.name).replace(/\{rank\}/g, String(rank));
  if (rank !== null && rank !== old) {
    if (rank === 1) lines.push({ text: fill(t.top), tone: 'rare' });
    else if (old === null) lines.push({ text: fill(t.enter), tone: 'good' });
    else if (rank < old) lines.push({ text: fill(t.rise), tone: 'good' });
  } else if (rank === null && old !== null) {
    lines.push({ text: fill(state.character.age > cfg.maxAge ? t.age : t.drop), tone: 'normal' });
  }
  s = { ...s, ranking: { ...s.ranking, rank } };
  if (lines.length > 0) {
    const log = s.log.slice();
    const last = log[log.length - 1];
    log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
    s = { ...s, log };
  }
  return s;
}
