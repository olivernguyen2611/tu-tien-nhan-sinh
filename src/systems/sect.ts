// Sect life (task 2.5): joining, ranks (Ký danh → Ngoại môn → Nội môn → Chân
// truyền), yearly stipend, one mission a year for contribution, sect techniques
// by rank, and asking an elder to be one's master.
import type { Content } from '../core/content';
import { Rng, hashSeed } from '../core/rng';
import type { EffectHook, Sect } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { chooseMaster, sectmateYear, seedCast } from './sectmates';
import { rootAffinities } from './technique';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export function sectById(content: Content, id: string | null): Sect | undefined {
  return id ? content.sects.find((s) => s.id === id) : undefined;
}

export function currentSect(state: GameState, content: Content): Sect | undefined {
  return sectById(content, state.sect.id);
}

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

const fill = (text: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), text);

const statValue = (state: GameState, key: string) =>
  key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];

const STAT_NAMES: Record<string, string> = {
  health: 'Sức khỏe', happiness: 'Hạnh phúc', intellect: 'Trí tuệ', charm: 'Mị lực',
  physique: 'Căn cốt', comprehension: 'Ngộ tính', luck: 'Khí vận', daoHeart: 'Đạo tâm',
};

function statsShort(state: GameState, min: Record<string, number> | undefined): string | null {
  for (const [k, v] of Object.entries(min ?? {})) if (statValue(state, k) < v) return `cần ${STAT_NAMES[k] ?? k} ${v}`;
  return null;
}

/** Why this life cannot join the sect now, or null. */
export function sectEligibility(state: GameState, content: Content, sectId: string): string | null {
  const sect = sectById(content, sectId);
  if (!sect) return 'không có tông môn này';
  if (!sect.recruitable) return 'chưa nhận đệ tử';
  if (!state.alive) return 'đã hết một đời';
  if (state.sect.id) return 'đang là đệ tử tông môn khác';
  if (state.sect.left.includes(sectId)) return 'đã từng rời đi, không được quay lại';
  if (state.character.age < content.balance.sects.minJoinAge) return `cần ${content.balance.sects.minJoinAge} tuổi`;
  const root = state.cult.root;
  if (!root || (content.balance.roots.gradeSpeed[root.grade] ?? 0) <= 0) {
    // Phật duyên (task 3.12): some sects take the rootless with a strong đạo tâm.
    const need = sect.requires.rootlessMinDaoHeart;
    if (need === undefined) return 'cần có linh căn';
    return state.aptitudes.daoHeart >= need ? null : `không linh căn thì cần Đạo tâm ${need}`;
  }
  const missing = statsShort(state, sect.requires.minStats);
  if (missing) return missing;
  if (sect.requires.oneOf) {
    const ok = sect.requires.oneOf.some((o) =>
      (!o.rootElements || rootAffinities(root, content).some((e) => o.rootElements!.includes(e))) && !statsShort(state, o.minStats));
    if (!ok) return 'tư chất không hợp yêu cầu nhập môn';
  }
  return null;
}

/** Join a sect (rank 0). Returns the log text; when refused, the state is unchanged. */
export function joinSect(state: GameState, content: Content, sectId: string): { state: GameState; text: string; joined: boolean } {
  const sect = sectById(content, sectId);
  const texts = content.sectLife?.texts;
  if (!sect || !texts) return { state, text: '', joined: false };
  const reason = sectEligibility(state, content, sectId);
  if (reason) {
    const text = fill(texts.refused, { sect: sect.name, reason: reason.charAt(0).toUpperCase() + reason.slice(1) + '.' });
    return { state: { ...state, log: addLines(state, [{ text, tone: 'bad' }]) }, text, joined: false };
  }
  const rep = { ...state.social.reputation };
  for (const [faction, add] of Object.entries(content.balance.sects.joinReputation[sectId] ?? {})) {
    rep[faction as keyof typeof rep] = clamp(rep[faction as keyof typeof rep] + add, -100, 100);
  }
  const text = fill(texts.join, { sect: sect.name, rank: sect.ranks[0] });
  const next: GameState = {
    ...state,
    social: { ...state.social, reputation: rep },
    sect: { ...state.sect, id: sectId, rank: 0, since: state.character.age, contribution: 0, master: null, lastMission: null, lastMasterTry: null, chain: null, spent: 0, bought: {} },
  };
  const withCast = seedCast({ ...next, log: addLines(next, [{ text, tone: 'good' }]) }, content);
  return { state: withCast, text, joined: true };
}

export function leaveSect(state: GameState, content: Content): { state: GameState; text: string } | null {
  const sect = currentSect(state, content);
  if (!sect || !content.sectLife) return null;
  const text = fill(content.sectLife.texts.leave, { sect: sect.name });
  const next: GameState = {
    ...state,
    sect: { ...state.sect, id: null, rank: 0, contribution: 0, master: null, masterId: null, left: [...state.sect.left, sect.id] },
  };
  return { state: { ...next, log: addLines(next, [{ text, tone: 'normal' }]) }, text };
}

/** Hooks from the sect (its perks) and from having a master (speed). */
export function sectHooks(state: GameState, content: Content): EffectHook[] {
  const sect = currentSect(state, content);
  if (!sect) return [];
  const master: EffectHook[] = state.sect.master ? [{ hook: 'cultivationSpeed', add: content.balance.sects.masterSpeed }] : [];
  return [...sect.effects, ...master];
}

/** One rank up (events and yearly checks). */
export function promoteSect(state: GameState, content: Content): GameState {
  const sect = currentSect(state, content);
  if (!sect || !content.sectLife || state.sect.rank >= sect.ranks.length - 1) return state;
  const rank = state.sect.rank + 1;
  const text = fill(content.sectLife.texts.promote, { sect: sect.name, rank: sect.ranks[rank] });
  const next: GameState = { ...state, sect: { ...state.sect, rank, since: state.character.age } };
  return { ...next, log: addLines(next, [{ text, tone: 'good' }]) };
}

/** Next rank's requirement, or null at the top. Ký danh moves up by time alone. */
export function nextRankNeed(state: GameState, content: Content): { contribution: number; realm: string; stage: number } | null {
  const sect = currentSect(state, content);
  if (!sect || state.sect.rank >= sect.ranks.length - 1) return null;
  return content.balance.sects.promotion.find((p) => p.rank === state.sect.rank + 1) ?? null;
}

function meetsRealm(state: GameState, content: Content, realm: string, stage: number): boolean {
  const order = content.cultivation.realms.realms.map((r) => r.id);
  const at = order.indexOf(state.cult.realm);
  const need = order.indexOf(realm);
  return at > need || (at === need && state.cult.stage >= stage);
}

export function addContribution(state: GameState, amount: number): GameState {
  if (!state.sect.id) return state;
  return { ...state, sect: { ...state.sect, contribution: Math.max(0, state.sect.contribution + amount) } };
}

/** Yearly: stipend, karma drift (U Hà), and at most one promotion. */
export function sectYear(state: GameState, content: Content): GameState {
  const sect = currentSect(state, content);
  const life = content.sectLife;
  if (!state.alive || !sect || !life) return state;
  state = sectmateYear(state, content);
  const cfg = content.balance.sects;
  const stones = Math.round((cfg.stipend[sect.id] ?? 0) * (cfg.rankStipendMul[state.sect.rank] ?? 1));
  let s: GameState = {
    ...state,
    money: { ...state.money, spiritStones: state.money.spiritStones + stones },
    social: { ...state.social, karma: clamp(state.social.karma + (cfg.karmaPerYear[sect.id] ?? 0), -100, 100) },
  };
  // Playtest 2: the stipend line shows when the amount is new (first year at a rank) and then once a decade, not every year.
  const yearsAtRank = state.character.age - state.sect.since;
  if (stones > 0 && (yearsAtRank <= 1 || yearsAtRank % cfg.stipendLogEvery === 0)) {
    s = { ...s, log: addLines(s, [{ text: fill(life.texts.stipend, { sect: sect.name, stones }), tone: 'normal' }]) };
  }

  if (s.sect.rank === 0) {
    if (s.character.age - s.sect.since >= cfg.outerAfterYears) s = promoteSect(s, content);
  } else {
    const need = nextRankNeed(s, content);
    if (need && s.sect.contribution >= need.contribution && meetsRealm(s, content, need.realm, need.stage)) s = promoteSect(s, content);
  }
  return s;
}

export interface MissionView { id: string; name: string; text: string; chance: number; blocked: string | null }

function checkChance(state: GameState, content: Content, stat: string, difficulty: number): number {
  const c = content.balance.events.check;
  return Math.max(c.min, Math.min(c.max, c.base + (statValue(state, stat) - difficulty) * c.perPoint));
}

/**
 * This year's mission board (playtest 2): from the missions this sect posts and the rank allows,
 * a fixed handful chosen by hashing seed + age + id, so the board changes yearly without using the RNG.
 */
export function missionViews(state: GameState, content: Content): MissionView[] {
  const sectId = state.sect.id;
  if (!sectId || !content.sectLife) return [];
  const key = (id: string) => hashSeed(`${state.seed}|${state.character.age}|${id}`);
  const board = content.sectLife.missions
    .filter((m) => m.minRank <= state.sect.rank && (!m.sects || m.sects.includes(sectId)))
    .sort((a, b) => key(a.id) - key(b.id))
    .slice(0, content.balance.sects.missionBoard);
  return board.map((m) => ({
    id: m.id,
    name: m.name,
    text: m.text,
    chance: checkChance(state, content, m.stat, m.difficulty),
    blocked: !state.alive ? 'Đã hết một đời.'
      : state.sect.lastMission === state.character.age ? 'Năm nay đã làm một nhiệm vụ rồi.'
      : null,
  }));
}

/** Do one sect mission this year: a stat check, contribution and maybe spirit stones. */
export function doMission(state: GameState, content: Content, missionId: string): { state: GameState; text: string; success: boolean } | null {
  const view = missionViews(state, content).find((m) => m.id === missionId);
  const mission = content.sectLife?.missions.find((m) => m.id === missionId);
  if (!view || view.blocked || !mission) return null;
  const rng = Rng.fromState(state.rng);
  const success = rng.chance(view.chance);
  const out = success ? mission.success : mission.fail;
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [k, v] of Object.entries(out.stats)) {
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  let next: GameState = {
    ...state,
    rng: rng.getState(),
    stats,
    aptitudes,
    money: { ...state.money, spiritStones: state.money.spiritStones + out.spiritStones },
    sect: { ...state.sect, lastMission: state.character.age },
  };
  next = addContribution(next, out.contribution);
  const text = `${mission.name}: ${out.text} Cống hiến +${out.contribution}.`;
  return { state: { ...next, log: addLines(next, [{ text, tone: success ? 'good' : 'bad' }]) }, text, success };
}

/** Techniques the sect teaches at or below the current rank. */
export function sectTechniques(state: GameState, content: Content): { id: string; rank: number; open: boolean }[] {
  const sect = currentSect(state, content);
  if (!sect) return [];
  return sect.techniques.map((t) => ({ ...t, open: state.sect.rank >= t.rank }));
}

export function masterBlocked(state: GameState, content: Content): string | null {
  const sect = currentSect(state, content);
  if (!sect) return 'Chưa có tông môn.';
  if (state.sect.master) return 'Đã có sư phụ.';
  const min = content.balance.sects.masterMinRank;
  if (state.sect.rank < min) return `Cần là đệ tử ${sect.ranks[min] ?? ''}.`;
  if (state.sect.lastMasterTry === state.character.age) return 'Năm nay đã xin rồi.';
  return null;
}

export function masterChance(state: GameState, content: Content): number {
  const cfg = content.balance.sects;
  return Math.max(0.02, Math.min(0.9, cfg.masterChanceBase + (state.aptitudes.comprehension - 50) * cfg.masterChancePerPoint));
}

/** Ask an elder to take you as a personal disciple (once a year). */
export function requestMaster(state: GameState, content: Content): { state: GameState; text: string; success: boolean } | null {
  if (masterBlocked(state, content) || !content.sectLife) return null;
  const rng = Rng.fromState(state.rng);
  const success = rng.chance(masterChance(state, content));
  const texts = content.sectLife.texts;
  let next: GameState = { ...state, sect: { ...state.sect, lastMasterTry: state.character.age } };
  let text: string;
  if (success) {
    next = { ...next, rng: rng.getState() };
    const chosen = chooseMaster(next, content);
    const master = chosen.name;
    next = { ...chosen.state, sect: { ...chosen.state.sect, master }, flags: { ...chosen.state.flags, co_su_phu: true } };
    text = fill(texts.master, { master });
    return { state: { ...next, log: addLines(next, [{ text, tone: 'good' }]) }, text, success };
  } else {
    text = texts.masterRefused;
  }
  next = { ...next, rng: rng.getState() };
  return { state: { ...next, log: addLines(next, [{ text, tone: success ? 'good' : 'bad' }]) }, text, success };
}

/** An elder takes the life as a personal disciple (event effect, task 2.8). */
export function grantMaster(state: GameState, content: Content): GameState {
  if (!state.sect.id || state.sect.master || !content.sectLife) return state;
  const chosen = chooseMaster(state, content);
  const master = chosen.name;
  const next: GameState = { ...chosen.state, sect: { ...chosen.state.sect, master }, flags: { ...chosen.state.flags, co_su_phu: true } };
  return { ...next, log: addLines(next, [{ text: fill(content.sectLife.texts.master, { master }), tone: 'good' }]) };
}

/** "Bích Lạc Tông · Ngoại môn" for the profile. */
export function sectLabel(state: GameState, content: Content): string | null {
  // The founder of a sect (task 5.1).
  if (state.ownSect) return `${state.ownSect.name} · Chưởng môn`;
  const sect = currentSect(state, content);
  return sect ? `${sect.name} · ${sect.ranks[state.sect.rank]}` : null;
}

/** Phật đạo precepts (task 3.12): a kill costs đạo tâm; too many breaks and a Phật sect expels you. */
export function breakPrecept(state: GameState, content: Content): { state: GameState; text: string } {
  if (state.cult.lineage !== 'phat' || !content.sectLife) return { state, text: '' };
  const cfg = content.balance.buddhism.precepts;
  const breaks = state.cult.preceptBreaks + 1;
  let s: GameState = {
    ...state,
    aptitudes: { ...state.aptitudes, daoHeart: clamp(state.aptitudes.daoHeart + cfg.killDaoHeart) },
    cult: { ...state.cult, preceptBreaks: breaks },
  };
  const lines: LogLine[] = [{ text: content.sectLife.texts.preceptBroken, tone: 'bad' }];
  const sect = currentSect(s, content);
  if (sect?.lineage === 'phat' && breaks >= cfg.maxBreaks) {
    lines.push({ text: fill(content.sectLife.texts.expelled, { sect: sect.name }), tone: 'bad' });
    s = { ...s, sect: { ...s.sect, id: null, rank: 0, contribution: 0, master: null, left: [...s.sect.left, sect.id] } };
  }
  return { state: { ...s, log: addLines(s, lines) }, text: lines.map((l) => l.text).join(' ') };
}
