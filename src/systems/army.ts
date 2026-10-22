// 12.3 Binh nghiệp và chiến tranh (content/army.json): a mortal goes to the army drafted (the bắt lính of 12.1) or of
// their own will. Each year in the army: quân lương by quân hàm; in a war year (an đại sự that calls men) a trận is
// fought, in peace only sometimes. A trận is chiến lực (combat.ts; from Bách hộ up, intellect leads too) against the
// enemy at that hàm: won, quân công and loot; lost, health, maybe a maiming (thương binh, sent home) or death. Quân công
// raises the hàm up to Đại tướng quân. A draftee goes home when the war is over; anyone at retireAge; a deserter is
// hunted (crime dao_ngu, 10.9). Rolls use side streams. Numbers: balance.army.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { combatPower } from './combat';
import { courtDraft } from './court';
import { injure } from './health';
import { addRenown } from './jianghu';
import { quitJob } from './jobs';
import { addWanted, lawOf } from './law';
import { checkDeath } from './time';

type Army = NonNullable<GameState['army']>;
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

export const armyOf = (state: GameState): Army | null => (state.alive && state.cult.realm === 'pham_nhan' ? state.army ?? null : null);
export const atWar = (state: GameState, content: Content): boolean => courtDraft(state, content);
export const armyRankName = (content: Content, rank: number) => content.army?.ranks[Math.min(rank, content.army.ranks.length - 1)] ?? '';

/** Enlist. Not for an official, someone in ngục, or someone already serving. */
export function armyJoin(state: GameState, content: Content, via: Army['via']): GameState {
  const file = content.army;
  if (!file || armyOf(state) || state.cult.realm !== 'pham_nhan' || !state.alive || state.law?.jail || state.career.id === content.office?.career) return state;
  let s = state.job?.id ? quitJob(state, content, 'quit') : state;
  s = { ...s, army: { rank: 0, merit: 0, since: s.character.age, via, battles: 0, wins: 0, best: 0 }, flags: { ...s.flags, tung_tong_quan: true } };
  return pushLines(s, [{ text: file.texts.join[via] ?? '', tone: 'normal' }]);
}

export function addArmyMerit(state: GameState, d: number): GameState {
  const a = armyOf(state);
  return a ? { ...state, army: { ...a, merit: Math.max(0, a.merit + d) } } : state;
}

/** Out of the army: giải ngũ (bạc thưởng), đào ngũ (a hunted crime), or the army scattered. */
export function armyLeave(state: GameState, content: Content, how: 'discharge' | 'desert' | 'scatter' | 'retire'): GameState {
  const file = content.army;
  const cfg = content.balance.army;
  const a = armyOf(state);
  if (!file || !cfg || !a) return state;
  let s: GameState = { ...state, army: null };
  if (how === 'discharge' || how === 'retire') {
    const bonus = (cfg.pay[Math.min(a.rank, cfg.pay.length - 1)] ?? 0) * 2;
    s = { ...s, money: { ...s.money, silver: s.money.silver + bonus } };
  }
  if (how === 'desert') {
    s = addWanted({ ...s, flags: { ...s.flags, dao_ngu: true } }, content, cfg.desertWanted);
    s = { ...s, law: { ...lawOf(s), lastCrime: 'dao_ngu', lastCrimeAge: s.character.age } };
  }
  return pushLines(s, [{ text: file.texts[how], tone: how === 'desert' ? 'bad' : 'normal' }]);
}

/** Chance to win a trận at this hàm (war or peace). */
export function battleChance(state: GameState, content: Content, war: boolean): number {
  const cfg = content.balance.army;
  const a = armyOf(state);
  if (!cfg || !a) return 0;
  const lead = a.rank >= cfg.leadFrom ? 1 + ((state.stats.intellect - 50) / 100) * cfg.leadWeight : 1;
  const own = combatPower(state, content) * lead;
  const foe = (cfg.foe[Math.min(a.rank, cfg.foe.length - 1)] ?? 1) * (war ? cfg.warMul : cfg.peaceMul);
  const p = Math.pow(own, cfg.sharpness);
  return p / (p + Math.pow(foe, cfg.sharpness));
}

/** Fight one trận now. */
export function armyBattle(state: GameState, content: Content, rng?: Rng): GameState {
  const file = content.army;
  const cfg = content.balance.army;
  const a = armyOf(state);
  if (!file || !cfg || !a) return state;
  const r = rng ?? new Rng(`${state.seed}:army:battle:${state.character.age}:${a.battles}`);
  const war = atWar(state, content);
  const battle = r.pick(war ? file.battles.war : file.battles.peace);
  const rank = Math.min(a.rank, cfg.winMerit.length - 1);
  if (r.chance(battleChance(state, content, war))) {
    let s: GameState = { ...state, money: { ...state.money, silver: state.money.silver + (cfg.winSilver[rank] ?? 0) }, army: { ...a, battles: a.battles + 1, wins: a.wins + 1, merit: a.merit + (cfg.winMerit[rank] ?? 0) } };
    if (a.rank >= file.generalFrom) s = addRenown(s, content, 2, 0);
    return pushLines(s, [{ text: fill(r.pick(file.texts.win), { battle }), tone: 'good' }]);
  }
  let s: GameState = { ...state, stats: { ...state.stats, health: Math.max(0, state.stats.health - cfg.loseHealth) }, army: { ...a, battles: a.battles + 1 } };
  s = pushLines(s, [{ text: fill(r.pick(file.texts.lose), { battle }), tone: 'bad' }]);
  if (r.chance(cfg.loseDeath)) return checkDeath(pushLines(s, [{ text: file.texts.died, tone: 'bad' }]), content, 'combat');
  if (r.chance(cfg.loseMaim)) {
    const fresh = file.maims.filter((id) => !s.body?.injuries.includes(id));
    if (fresh.length) s = injure(s, content, r.pick(fresh));
    s = pushLines({ ...s, army: null, flags: { ...s.flags, thuong_binh: true } }, [{ text: file.texts.maimed, tone: 'bad' }]);
  }
  return checkDeath(s, content);
}

/** One year in the army: pay, a trận (always at war, sometimes in peace), promotion, going home. */
export function armyYear(state: GameState, content: Content): GameState {
  const file = content.army;
  const cfg = content.balance.army;
  if (!file || !cfg || !state.army) return state;
  if (state.cult.realm !== 'pham_nhan' || !state.alive) return { ...state, army: null };
  if (state.law?.jail) return { ...state, army: null };
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:army:${age}`);
  const a = state.army;
  const war = atWar(state, content);
  const pay = cfg.pay[Math.min(a.rank, cfg.pay.length - 1)] ?? 0;
  let s: GameState = pushLines({ ...state, money: { ...state.money, silver: state.money.silver + pay } }, [{ text: fill(file.texts.pay, { silver: pay }), tone: 'normal', ledger: true }]);

  if (war || rng.chance(cfg.peaceBattle)) s = armyBattle(s, content, rng);
  const b = armyOf(s);
  if (!b) return s;

  // Quân công raises the hàm.
  const need = cfg.meritNeed[Math.min(b.rank, cfg.meritNeed.length - 1)];
  if (b.rank < file.ranks.length - 1 && b.merit >= need && rng.chance(cfg.promoteChance)) {
    const rank = b.rank + 1;
    s = { ...s, army: { ...b, rank, merit: b.merit - need, best: Math.max(b.best, rank) } };
    const general = rank >= file.generalFrom;
    if (general) s = { ...s, flags: { ...s.flags, phong_tuong: true } };
    s = pushLines(s, [{ text: fill(general ? file.texts.general : file.texts.promote, { rank: armyRankName(content, rank) }), tone: general ? 'rare' : 'good' }]);
  }
  // Home: a draftee once the war is over, anyone too old.
  const c = armyOf(s)!;
  if (age >= cfg.retireAge) return armyLeave(s, content, 'retire');
  if (c.via === 'draft' && !war && age - c.since >= cfg.draftYears) return pushLines(armyLeave(s, content, 'discharge'), [{ text: file.texts.warOver, tone: 'normal' }]);
  return s;
}

/** "Thập trưởng · quân công 12/35 · 4 trận, thắng 3 · đang có chiến sự" */
export function armyLine(state: GameState, content: Content): string | null {
  const a = armyOf(state);
  const cfg = content.balance.army;
  if (!a || !cfg) return null;
  const parts = [armyRankName(content, a.rank), `quân công ${a.merit}/${cfg.meritNeed[Math.min(a.rank, cfg.meritNeed.length - 1)]}`, `${a.battles} trận, thắng ${a.wins}`];
  parts.push(atWar(state, content) ? 'đang có chiến sự' : 'thời bình');
  return parts.join(' · ');
}
