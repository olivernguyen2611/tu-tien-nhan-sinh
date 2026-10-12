// Khai tông lập phái (task 5.1): from Kim Đan, a cultivator with the spirit
// stones may open a mountain gate: pick a name, carry their own lineage, and set
// up to three tông quy. The founder leaves any sect they were in. Rules change
// who comes (recruitMul), karma each year, reputation on founding and give the
// founder K.6 hooks.
// Task 5.2: the sect runs itself each year (members come and go, tithes and
// building income fill the treasury, upkeep drains it, Luyện Đan Phòng sends
// pills) and reports to the master with 1–3 decisions; the ones left open the
// elders handle as usual. Buildings are raised from the treasury.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { addItems, itemById } from './items';
import { sectById } from './sect';
import { seedElders } from './sectElders';

function realmIndex(content: Content, id: string): number {
  return content.cultivation.realms.realms.findIndex((r) => r.id === id);
}

/** Why this life cannot found a sect now, or null. */
export function foundBlocked(state: GameState, content: Content): string | null {
  const cfg = content.balance.founding;
  if (!state.alive) return 'Đã hết một đời.';
  if (state.ownSect) return 'Đã khai tông rồi.';
  if (realmIndex(content, state.cult.realm) < realmIndex(content, cfg.minRealm)) {
    return `Tới ${content.cultivation.realms.realms[realmIndex(content, cfg.minRealm)]?.name ?? cfg.minRealm} mới đủ uy khai tông.`;
  }
  if (state.money.spiritStones < cfg.cost) return `Cần ${cfg.cost} linh thạch để mở sơn môn.`;
  return null;
}

/** A name to start from: "Thanh Tiêu Tông", "Huyền Nguyệt Các"… */
export function suggestSectName(state: GameState, content: Content, salt = 0): string {
  const p = content.founding.nameParts;
  const rng = new Rng(`${state.seed}:sect-name:${state.character.age}:${salt}`);
  return `${rng.pick(p.first)} ${rng.pick(p.second)} ${rng.pick(p.suffix)}`;
}

/** Name rule: trimmed length within balance.founding.nameLength. */
export function sectNameProblem(name: string, content: Content): string | null {
  const [min, max] = content.balance.founding.nameLength;
  const n = name.trim().length;
  if (n < min) return 'Tên tông môn quá ngắn.';
  if (n > max) return 'Tên tông môn quá dài.';
  return null;
}

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

export function foundSect(state: GameState, content: Content, input: { name: string; rules: string[] }): { state: GameState; text: string } | null {
  const cfg = content.balance.founding;
  const rules = [...new Set(input.rules)].filter((id) => content.founding.rules.some((r) => r.id === id));
  if (foundBlocked(state, content) || sectNameProblem(input.name, content) || rules.length > cfg.maxRules) return null;
  const name = input.name.trim();
  const lineage = state.cult.lineage ?? 'tien';
  const lineageName = content.lineages.find((l) => l.id === lineage)?.name ?? lineage;
  const t = content.founding.texts;
  const lines: LogLine[] = [];
  let s = state;
  const old = sectById(content, state.sect.id);
  if (old) {
    lines.push({ text: t.leftOld.replaceAll('{old}', old.name), tone: 'normal' });
    s = { ...s, sect: { ...s.sect, id: null, rank: 0, contribution: 0, master: null, left: [...s.sect.left, old.id] } };
  }
  const members = cfg.startMembers[state.cult.realm] ?? 0;
  const rep = { ...s.social.reputation };
  for (const id of rules) {
    for (const [k, v] of Object.entries(content.founding.rules.find((r) => r.id === id)!.reputation)) {
      rep[k as keyof typeof rep] = Math.max(-100, Math.min(100, rep[k as keyof typeof rep] + v));
    }
  }
  s = {
    ...s,
    money: { ...s.money, spiritStones: s.money.spiritStones - cfg.cost },
    social: { ...s.social, reputation: rep },
    ownSect: { name, lineage, rules, founded: state.character.age, members, treasury: 0, buildings: {} },
  };
  const text = t.founded.replaceAll('{sect}', name).replaceAll('{lineage}', lineageName).replaceAll('{members}', String(members));
  lines.push({ text, tone: 'rare' });
  return { state: seedElders(pushLines(s, lines), content), text: lines.map((l) => l.text).join(' ') };
}

/** Task 5c.6: take the master's seat of the sect the player belongs to. It becomes ownSect, at no cost; the membership ends. */
export function succeedSect(state: GameState, content: Content): GameState {
  const old = sectById(content, state.sect.id);
  if (!old || state.ownSect) return state;
  const cfg = content.balance.founding;
  const text = content.founding.texts.succeeded.replaceAll('{sect}', old.name).replaceAll('{members}', String(cfg.inheritMembers));
  const s: GameState = {
    ...state,
    sect: { ...state.sect, id: null, rank: 0, contribution: 0, master: null, masterId: null, chain: null, left: [...state.sect.left, old.id] },
    ownSect: { name: old.name, lineage: old.lineage, rules: [], founded: state.character.age, members: cfg.inheritMembers, treasury: cfg.inheritTreasury, buildings: {} },
  };
  return seedElders(pushLines(s, [{ text, tone: 'rare' }]), content);
}

/** Danh vọng (task 5c.7). */
export function prestigeOf(state: GameState, content: Content): number {
  return state.ownSect?.prestige ?? content.balance.founding.prestige.start;
}

/** The standing tier for the sect's danh vọng. */
export function prestigeTier(state: GameState, content: Content) {
  const p = prestigeOf(state, content);
  return [...content.founding.prestigeTiers].reverse().find((t) => p >= t.min) ?? content.founding.prestigeTiers[0]!;
}

/** Hooks from the founder's own tông quy and buildings (× level), part of lifeHooks. */
export function ownSectHooks(state: GameState, content: Content): EffectHook[] {
  const own = state.ownSect;
  if (!own) return [];
  const rules = own.rules.flatMap((id) => content.founding.rules.find((r) => r.id === id)?.effects ?? []);
  const buildings = content.founding.buildings.flatMap((b) => {
    const level = own.buildings[b.id] ?? 0;
    return level > 0 ? b.effects.map((e) => (e.add !== undefined ? { ...e, add: e.add * level } : e)) : [];
  });
  return [...rules, ...buildings];
}

// ---------- Task 5.2: buildings, yearly running, report ----------

export interface BuildingView {
  id: string;
  name: string;
  text: string;
  level: number;
  maxLevel: number;
  /** Cost of the next level from the treasury, or null at max. */
  cost: number | null;
  blocked: string | null;
}

export function buildingViews(state: GameState, content: Content): BuildingView[] {
  const own = state.ownSect;
  if (!own) return [];
  return content.founding.buildings.map((b) => {
    const level = own.buildings[b.id] ?? 0;
    const cost = level < b.cost.length ? b.cost[level] : null;
    let blocked: string | null = null;
    if (cost === null) blocked = 'Đã tới cấp cao nhất.';
    else if (own.treasury < cost) blocked = `Kho cần ${cost} linh thạch.`;
    return { id: b.id, name: b.name, text: b.text, level, maxLevel: b.cost.length, cost, blocked };
  });
}

/** Raise a building one level, paid from the treasury. */
export function build(state: GameState, content: Content, buildingId: string): { state: GameState; text: string } | null {
  const view = buildingViews(state, content).find((b) => b.id === buildingId);
  const own = state.ownSect;
  if (!own || !view || view.blocked || view.cost === null) return null;
  const level = view.level + 1;
  const text = content.founding.texts.built.replaceAll('{building}', view.name).replaceAll('{sect}', own.name).replaceAll('{level}', String(level));
  const s: GameState = { ...state, ownSect: { ...own, treasury: own.treasury - view.cost, buildings: { ...own.buildings, [buildingId]: level } } };
  return { state: pushLines(s, [{ text, tone: 'good' }]), text };
}

function sum(content: Content, own: NonNullable<GameState['ownSect']>, key: 'growth' | 'income' | 'upkeep' | 'defense'): number {
  return content.founding.buildings.reduce((n, b) => n + b[key] * (own.buildings[b.id] ?? 0), 0);
}

/** The sect's defense from buildings (Hộ Sơn Đại Trận), for the sect events of task 5.3. */
export function sectDefense(state: GameState, content: Content): number {
  return state.ownSect ? sum(content, state.ownSect, 'defense') : 0;
}

/** One year of the founder's sect, ending with a report. */
export function ownSectYear(state: GameState, content: Content): GameState {
  const own = state.ownSect;
  if (!state.alive || !own) return state;
  const cfg = content.balance.founding;
  const t = content.founding.texts;
  const rng = new Rng(`${state.seed}:own-sect:${state.character.age}`);
  const rules = own.rules.map((id) => content.founding.rules.find((r) => r.id === id)).filter((r) => r !== undefined);
  const recruitMul = rules.reduce((m, r) => m * r.recruitMul, 1);
  const tier = prestigeTier(state, content);
  const rate = cfg.growth + tier.growth + sum(content, own, 'growth') + (own.growthBonus ?? 0);
  const joined = Math.round(Math.max(cfg.baseRecruit, own.members * rate) * recruitMul);
  const left = Math.round(own.members * cfg.attrition);
  const cap = cfg.maxMembers[state.cult.realm] ?? own.members;
  const members = Math.max(0, Math.min(Math.max(cap, own.members), own.members + joined - left));
  const recruited = state.npcs.filter((n) => n.alive && n.member).length;
  const income = Math.round(members * cfg.tithe + recruited * cfg.recruit.memberTithe + sum(content, own, 'income') - sum(content, own, 'upkeep'));
  const treasury = Math.max(0, own.treasury + income);

  // Danh vọng drifts towards what the sect has built: many disciples and many buildings.
  const levels = Object.values(own.buildings).reduce((n, l) => n + l, 0);
  const target = Math.min(100, members / cfg.prestige.membersFor60 * 60 + levels * cfg.prestige.perBuildingLevel);
  const before = prestigeOf(state, content);
  const prestige = Math.max(0, Math.min(100, Math.round((before + (target - before) * cfg.prestige.approach) * 10) / 10));
  const lines: LogLine[] = [];
  let s: GameState = state;
  // Luyện Đan Phòng sends its pills to the master.
  for (const b of content.founding.buildings) {
    const level = own.buildings[b.id] ?? 0;
    for (const pill of level > 0 ? b.pills : []) {
      s = addItems(s, Array<string>(level).fill(pill));
      lines.push({ text: t.pills.replaceAll('{count}', String(level)).replaceAll('{item}', itemById(content, pill)?.name ?? pill), tone: 'good' });
    }
  }
  const karma = rules.reduce((k, r) => k + r.karmaPerYear, 0);
  const delta = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const text = t.report.replaceAll('{sect}', own.name).replaceAll('{members}', String(members)).replaceAll('{membersDelta}', delta(members - own.members))
    .replaceAll('{treasury}', String(treasury)).replaceAll('{treasuryDelta}', delta(treasury - own.treasury));
  lines.unshift({ text, tone: 'normal' });
  const pool = content.founding.decisions.filter((d) => !d.default);
  const want = Math.min(pool.length, rng.int(cfg.decisions[0], cfg.decisions[1]));
  const decisions: string[] = [];
  while (decisions.length < want) {
    const d = rng.pick(pool).id;
    if (!decisions.includes(d)) decisions.push(d);
  }
  s = {
    ...s,
    social: { ...s.social, karma: Math.max(-100, Math.min(100, s.social.karma + karma)) },
    ownSect: { ...own, members, treasury, growthBonus: 0, prestige, report: { age: state.character.age, text, decisions, done: [] } },
  };
  return pushLines(s, lines);
}

export interface DecisionView {
  id: string;
  name: string;
  text: string;
  cost: number;
  blocked: string | null;
}

/** The open decisions of this year's report. */
export function decisionViews(state: GameState, content: Content): DecisionView[] {
  const report = state.ownSect?.report;
  if (!report || report.age !== state.character.age) return [];
  return report.decisions
    .map((id) => content.founding.decisions.find((d) => d.id === id))
    .filter((d) => d !== undefined)
    .map((d) => ({
      id: d.id, name: d.name, text: d.text, cost: d.cost,
      blocked: report.done.includes(d.id) ? 'Đã quyết.' : d.cost > (state.ownSect?.treasury ?? 0) ? `Kho cần ${d.cost} linh thạch.` : null,
    }));
}

/** Take one of this year's decisions (each once; those left open the elders handle as usual). */
export function decide(state: GameState, content: Content, decisionId: string): { state: GameState; text: string } | null {
  const own = state.ownSect;
  const view = decisionViews(state, content).find((d) => d.id === decisionId);
  const d = content.founding.decisions.find((x) => x.id === decisionId);
  if (!own || !own.report || !view || view.blocked || !d) return null;
  const afterCost = own.treasury - d.cost;
  const withdrawn = Math.floor(afterCost * d.withdrawPct);
  const text = content.founding.texts.decided.replaceAll('{decision}', d.name) + ' ' + d.text;
  const s: GameState = {
    ...state,
    money: { ...state.money, spiritStones: state.money.spiritStones + withdrawn },
    social: { ...state.social, karma: Math.max(-100, Math.min(100, state.social.karma + d.karma)) },
    ownSect: {
      ...own,
      treasury: afterCost - withdrawn,
      members: Math.max(0, own.members + d.members),
      growthBonus: (own.growthBonus ?? 0) + d.growthBonus,
      report: { ...own.report, done: [...own.report.done, d.id] },
    },
  };
  return { state: pushLines(s, [{ text, tone: 'normal' }]), text };
}

/** The master puts their own spirit stones into the treasury. */
export function donate(state: GameState, content: Content): { state: GameState; text: string } | null {
  const n = content.balance.founding.donation;
  if (!state.ownSect || state.money.spiritStones < n) return null;
  const text = content.founding.texts.donated.replaceAll('{count}', String(n)).replaceAll('{sect}', state.ownSect.name);
  const s: GameState = { ...state, money: { ...state.money, spiritStones: state.money.spiritStones - n }, ownSect: { ...state.ownSect, treasury: state.ownSect.treasury + n } };
  return { state: pushLines(s, [{ text, tone: 'normal' }]), text };
}
