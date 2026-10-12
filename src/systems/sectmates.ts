// Đồng môn (task 5c.1): joining a sect brings a named cast of NPCs (trưởng lão,
// chấp sự, sư huynh/tỷ, sư đệ/muội, một kẻ ganh đua) who live, age and remember the
// player like any NPC (task 3.4). They belong to the life that met them (state.npcs).
// Each year the player may spend time with a few of them (once each): ask for pointers,
// debate the Way, spar, drink tea, make peace. Numbers: balance.sects, texts and the list
// of interactions: sect-life.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc, SectmateKind } from '../core/types';
import { combatPower } from './combat';
import { changeNpc, createNpc, npcById } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

const fill = (text: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), text);

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** Living members of the sect the player belongs to now. */
export function sectmates(state: GameState): Npc[] {
  const id = state.sect.id;
  return id ? state.npcs.filter((n) => n.alive && n.sectmate?.sect === id) : [];
}

/** "Sư huynh", "Sư muội", "Trưởng lão"… depending on kind, gender and who is older. */
export function sectmateTitle(state: GameState, content: Content, n: Npc): string {
  const t = content.sectLife?.titles;
  const kind = n.sectmate?.kind;
  if (!t || !kind) return n.role;
  if (kind === 'master') return t.master;
  if (kind === 'elder') return t.elder;
  if (kind === 'steward') return t.steward;
  if (kind === 'rival') return t.rival;
  const older = n.age >= state.character.age;
  return n.gender === 'nam' ? (older ? t.olderM : t.youngerM) : (older ? t.olderF : t.youngerF);
}

function realmIdAt(content: Content, index: number) {
  const realms = content.cultivation.realms.realms;
  return realms[Math.max(0, Math.min(realms.length - 1, index))]!;
}

function castOne(state: GameState, content: Content, kind: SectmateKind, spec: { minRealm: number; aboveSelf: number; ageOffset: [number, number]; affinity: number; grudge?: number }): GameState {
  const realms = content.cultivation.realms.realms;
  const rng = Rng.fromState(state.rng);
  const here = realms.findIndex((r) => r.id === state.cult.realm);
  const realm = realmIdAt(content, Math.max(spec.minRealm, here + spec.aboveSelf));
  const stage = rng.int(0, realm.stages.length - 1);
  const age = state.character.age + rng.int(spec.ageOffset[0], spec.ageOffset[1]);
  const seeded = { ...state, rng: rng.getState() };
  const made = createNpc(seeded, content, { role: kind, age, realm: realm.id, stage, root: true, affinity: spec.affinity, grudge: spec.grudge });
  const npcs = made.state.npcs.map((n) => (n.id === made.id ? { ...n, sectmate: { sect: state.sect.id!, kind, lastMet: null } } : n));
  const titled = { ...made.state, npcs };
  const npc = npcs.find((n) => n.id === made.id)!;
  return { ...titled, npcs: npcs.map((n) => (n.id === made.id ? { ...n, role: sectmateTitle(titled, content, npc) } : n)) };
}

/** Meet the sect's people on joining (rank 0 already set). */
export function seedCast(state: GameState, content: Content): GameState {
  const life = content.sectLife;
  const sect = content.sects.find((s) => s.id === state.sect.id);
  if (!life || !sect) return state;
  const before = new Set(state.npcs.map((n) => n.id));
  let s = state;
  for (const c of content.balance.sects.cast) {
    for (let i = 0; i < c.count; i++) s = castOne(s, content, c.kind, c);
  }
  const names = s.npcs.filter((n) => !before.has(n.id) && n.sectmate).map((n) => `${n.role} ${n.name}`).join(', ');
  return { ...s, log: addLines(s, [{ text: fill(life.texts.castMet, { sect: sect.name, names }), tone: 'normal' }]) };
}

/**
 * A master as a named NPC: a living elder of the sect is promoted if there is one, else a new elder.
 * Returns the display name (with the "Trưởng lão" title) for sect.master.
 */
export function chooseMaster(state: GameState, content: Content): { state: GameState; name: string } {
  const texts = content.sectLife!.texts;
  let s = state;
  let elder = s.npcs.find((n) => n.alive && n.sectmate?.sect === s.sect.id && n.sectmate.kind === 'elder');
  if (!elder) {
    s = castOne(s, content, 'elder', content.balance.sects.masterCast);
    elder = s.npcs[s.npcs.length - 1]!;
  }
  const id = elder.id;
  s = {
    ...s,
    npcs: s.npcs.map((n) => (n.id === id ? { ...n, role: content.sectLife!.titles.master, sectmate: { sect: n.sectmate!.sect, kind: 'master' as const, lastMet: n.sectmate!.lastMet } } : n)),
  };
  s = changeNpc(s, content, id, { affinity: content.balance.sects.masterCast.affinity - elder.affinity });
  s = { ...s, sect: { ...s.sect, masterId: id } };
  return { state: s, name: fill(texts.masterTitle, { master: elder.name }) };
}

/** Yearly: a master who has died leaves the player without one. */
export function sectmateYear(state: GameState, content: Content): GameState {
  if (!state.sect.masterId) return state;
  const m = npcById(state, state.sect.masterId);
  if (m && m.alive) return state;
  const text = fill(content.sectLife!.texts.masterDied, { master: m?.name ?? state.sect.master ?? '' });
  const s: GameState = { ...state, sect: { ...state.sect, master: null, masterId: null } };
  return { ...s, log: addLines(s, [{ text, tone: 'bad' }]) };
}

export interface TalkView { id: string; name: string; text: string; chance: number; blocked: string | null }
export interface SectmateView { npc: Npc; title: string; talks: TalkView[] }

function npcPower(content: Content, n: Npc): number {
  const c = content.balance.combat;
  const base = content.balance.realms[n.realm]?.combatPower ?? 1;
  return base * (1 + c.stagePct * n.stage) * (c.physiqueBase + n.aptitude / c.physiqueDivisor);
}

function talkChance(state: GameState, content: Content, n: Npc, stat: string, difficulty: number): number {
  if (stat === 'power') {
    const mine = combatPower(state, content);
    const theirs = npcPower(content, n);
    return Math.max(0.05, Math.min(0.95, mine / (mine + theirs)));
  }
  const c = content.balance.events.check;
  const value = stat in state.stats ? state.stats[stat as keyof GameState['stats']] : state.aptitudes[stat as keyof GameState['aptitudes']];
  return Math.max(c.min, Math.min(c.max, c.base + (value - difficulty) * c.perPoint));
}

function talkBlocked(state: GameState, content: Content, n: Npc, cost: number, minAffinity: number | undefined): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  if (n.sectmate?.lastMet === state.character.age) return 'Năm nay đã gặp rồi.';
  const talks = state.sect.talks;
  if (talks && talks.age === state.character.age && talks.count >= content.balance.sects.talksPerYear) return 'Năm nay đã đi lại đủ nhiều.';
  if (minAffinity !== undefined && n.affinity < minAffinity) return 'Chưa đủ thân thiết.';
  if (state.money.spiritStones < cost) return `Cần ${cost} linh thạch làm quà.`;
  return null;
}

/** Everyone in the sect and what the player can do with them this year. */
export function sectmateViews(state: GameState, content: Content): SectmateView[] {
  const life = content.sectLife;
  if (!life) return [];
  const order: SectmateKind[] = ['master', 'elder', 'steward', 'senior', 'peer', 'rival'];
  return sectmates(state)
    .sort((a, b) => order.indexOf(a.sectmate!.kind) - order.indexOf(b.sectmate!.kind))
    .map((npc) => ({
      npc,
      title: sectmateTitle(state, content, npc),
      talks: life.interactions
        .filter((i) => i.kinds.includes(npc.sectmate!.kind))
        .map((i) => ({
          id: i.id,
          name: i.name,
          text: fill(i.text, { npc: npc.name }),
          chance: talkChance(state, content, npc, i.stat, i.difficulty),
          blocked: talkBlocked(state, content, npc, i.cost ?? 0, i.minAffinity),
        })),
    }));
}

/** Spend the year's time with one sectmate. */
export function doTalk(state: GameState, content: Content, npcId: string, talkId: string): { state: GameState; text: string; success: boolean } | null {
  const npc = npcById(state, npcId);
  const talk = content.sectLife?.interactions.find((i) => i.id === talkId);
  if (!npc || !npc.alive || !talk || npc.sectmate?.sect !== state.sect.id || !talk.kinds.includes(npc.sectmate.kind)) return null;
  if (talkBlocked(state, content, npc, talk.cost ?? 0, talk.minAffinity)) return null;
  const rng = Rng.fromState(state.rng);
  const success = rng.chance(talkChance(state, content, npc, talk.stat, talk.difficulty));
  const out = success ? talk.success : talk.fail;
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [k, v] of Object.entries(out.stats)) {
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  const talks = state.sect.talks && state.sect.talks.age === state.character.age ? state.sect.talks : { age: state.character.age, count: 0 };
  let s: GameState = {
    ...state,
    rng: rng.getState(),
    stats,
    aptitudes,
    money: { ...state.money, spiritStones: state.money.spiritStones - (talk.cost ?? 0) },
    cult: out.progress && state.cult.realm !== 'pham_nhan' ? { ...state.cult, progress: clamp(state.cult.progress + out.progress) } : state.cult,
    sect: { ...state.sect, contribution: Math.max(0, state.sect.contribution + (out.contribution ?? 0)), talks: { age: talks.age, count: talks.count + 1 } },
    npcs: state.npcs.map((n) => (n.id === npcId ? { ...n, sectmate: { ...n.sectmate!, lastMet: state.character.age } } : n)),
  };
  s = changeNpc(s, content, npcId, { affinity: out.affinity, favor: out.favor, grudge: out.grudge });
  const text = `${talk.name} với ${sectmateTitle(state, content, npc)} ${npc.name}: ${fill(out.text, { npc: npc.name })}`;
  return { state: { ...s, log: addLines(s, [{ text, tone: success ? 'good' : 'bad' }]) }, text, success };
}

export interface TournamentView { id: string; name: string; text: string; best: number | null; blocked: string | null }

function tournamentOpen(state: GameState, content: Content, id: string): { cfg: Content['balance']['sects']['tournaments'][number]; blocked: string | null } | null {
  const cfg = content.balance.sects.tournaments.find((t) => t.id === id);
  if (!cfg) return null;
  let blocked: string | null = null;
  if (!state.alive) blocked = 'Đã hết một đời.';
  else if (state.character.age % cfg.every !== cfg.offset) blocked = 'Năm nay không mở.';
  else if (state.sect.rank < cfg.minRank) blocked = 'Cần là đệ tử chính thức.';
  else if (state.sect.tournaments?.[id]?.last === state.character.age) blocked = 'Năm nay đã dự rồi.';
  else if (opponents(state, cfg.rounds).length === 0) blocked = 'Không có đồng môn nào để đấu.';
  return { cfg, blocked };
}

/** Sectmates of the player's generation, closest in strength first. */
function opponents(state: GameState, rounds: number): Npc[] {
  const kinds: SectmateKind[] = ['senior', 'peer', 'rival'];
  return sectmates(state).filter((n) => kinds.includes(n.sectmate!.kind)).slice(0, rounds);
}

/** Tournaments that open this year (or are listed with the reason they are shut). */
export function tournamentViews(state: GameState, content: Content): TournamentView[] {
  const life = content.sectLife;
  const sect = content.sects.find((s) => s.id === state.sect.id);
  if (!life || !sect) return [];
  return life.tournaments.flatMap((t) => {
    const open = tournamentOpen(state, content, t.id);
    if (!open) return [];
    return [{ id: t.id, name: t.name, text: fill(t.text, { sect: sect.name }), best: state.sect.tournaments?.[t.id]?.best ?? null, blocked: open.blocked }];
  });
}

/** Enter a tournament: one round per opponent, then a placement by wins. */
export function enterTournament(state: GameState, content: Content, id: string): { state: GameState; text: string; success: boolean } | null {
  const life = content.sectLife;
  const sect = content.sects.find((s) => s.id === state.sect.id);
  const texts = life?.tournaments.find((t) => t.id === id);
  const open = tournamentOpen(state, content, id);
  if (!life || !sect || !texts || !open || open.blocked) return null;
  const cfg = open.cfg;
  const rng = Rng.fromState(state.rng);
  let s: GameState = state;
  const lines: LogLine[] = [];
  let wins = 0;
  for (const foe of opponents(state, cfg.rounds)) {
    const title = sectmateTitle(state, content, foe);
    const win = rng.chance(talkChance(state, content, foe, cfg.stat, cfg.difficulty));
    if (win) wins++;
    const line = rng.pick(win ? texts.win : texts.lose);
    lines.push({ text: fill(line, { npc: foe.name, title }), tone: win ? 'good' : 'bad' });
    // A rival remembers a defeat; the others grow closer through the contest.
    const rival = foe.sectmate!.kind === 'rival';
    s = changeNpc(s, content, foe.id, win ? (rival ? { grudge: 5 } : { affinity: 2 }) : (rival ? { affinity: 1 } : { affinity: 3 }));
  }
  const reward = cfg.rewards[Math.min(wins, cfg.rewards.length - 1)]!;
  const stats = { ...s.stats };
  const aptitudes = { ...s.aptitudes };
  for (const [k, v] of Object.entries(reward.stats)) {
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  const prev = s.sect.tournaments ?? {};
  const placement = fill(texts.placements[Math.min(wins, texts.placements.length - 1)]!, { sect: sect.name });
  s = {
    ...s,
    rng: rng.getState(),
    stats,
    aptitudes,
    money: { ...s.money, spiritStones: s.money.spiritStones + reward.spiritStones },
    cult: reward.progress && s.cult.realm !== 'pham_nhan' ? { ...s.cult, progress: clamp(s.cult.progress + reward.progress) } : s.cult,
    sect: {
      ...s.sect,
      contribution: s.sect.contribution + reward.contribution,
      tournaments: { ...prev, [id]: { last: s.character.age, best: Math.max(prev[id]?.best ?? 0, wins) } },
    },
  };
  lines.push({ text: `${placement} Cống hiến +${reward.contribution}.`, tone: wins >= 2 ? 'good' : wins === 1 ? 'normal' : 'bad' });
  return { state: { ...s, log: addLines(s, lines) }, text: lines.map((l) => l.text).join(' '), success: wins >= 2 };
}
