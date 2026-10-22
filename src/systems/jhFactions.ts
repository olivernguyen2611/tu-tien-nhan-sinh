// 11.2 Môn phái và bang hội võ lâm (worlds/<id>/jianghu-factions.json, content/jianghu.json `factions`): a life joins
// one thế lực at a time through its entrance test, climbs its ranks by cống hiến from nhiệm vụ, trades cống hiến for
// võ học, and may leave in peace or phản bang, which sends the thế lực's men after them for years. Chính missions
// bring hiệp danh, tà and ma ones ác danh. Numbers: balance.factions. Rolls use side streams.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { JianghuFaction } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { addRenown, jianghuOf } from './jianghu';

type Member = NonNullable<NonNullable<GameState['jianghu']>['faction']>;
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

const withJ = (state: GameState, patch: Partial<NonNullable<GameState['jianghu']>>): GameState => ({ ...state, jianghu: { ...jianghuOf(state), ...patch } });

export const memberOf = (state: GameState): Member | null => state.jianghu?.faction ?? null;
export const factionDef = (content: Content, id: string | undefined | null): JianghuFaction | undefined => (content.jianghuFactions ?? []).find((f) => f.id === id);
export const kindDef = (content: Content, kind: string) => content.jianghu?.factions?.kinds[kind];

/** The rank name the member holds. */
export function rankName(content: Content, m: Member): string {
  const def = factionDef(content, m.id);
  const ranks = def?.ranks ?? (def ? kindDef(content, def.kind)?.ranks : undefined) ?? [];
  return ranks[Math.min(m.rank, ranks.length - 1)] ?? '';
}

/** Why this thế lực would not take the player now (null = it would). */
export function joinBlock(state: GameState, content: Content, f: JianghuFaction): string | null {
  const t = content.jianghu?.factions?.texts;
  const k = kindDef(content, f.kind);
  if (!t || !k) return 'none';
  const j = jianghuOf(state);
  if ((j.left ?? []).includes(f.id)) return t.blocked.left;
  const age = state.character.age;
  const [lo, hi] = f.join?.age ?? k.age;
  if (age < lo || age > hi) return t.blocked.age;
  if (k.bornOnly && !f.join?.open) return t.blocked.born;
  const fameMin = f.join?.fameMin ?? k.fameMin ?? 0;
  if (j.fame < fameMin) return t.blocked.fame;
  const infamyMin = f.join?.infamyMin ?? k.infamyMin ?? 0;
  if (j.infamy < infamyMin && !(f.join?.flag && state.flags[f.join.flag])) return t.blocked.infamy;
  const karma = state.social.karma;
  if (f.alignment === 'chinh' && karma < (content.balance.factions?.chinhKarmaMin ?? -999)) return t.blocked.karma;
  return null;
}

/** Join a thế lực of these kinds / alignments: the first that takes the player (a side stream orders them). */
export function joinFaction(state: GameState, content: Content, spec: { kinds?: string[]; alignments?: string[]; id?: string }): GameState {
  const t = content.jianghu?.factions?.texts;
  if (!t || memberOf(state)) return state;
  const rng = new Rng(`${state.seed}:faction-join:${state.character.age}`);
  const pool = rng.shuffle((content.jianghuFactions ?? []).filter((f) => (!spec.id || f.id === spec.id) && (!spec.kinds || spec.kinds.includes(f.kind)) && (!spec.alignments || spec.alignments.includes(f.alignment))));
  const open = pool.find((f) => joinBlock(state, content, f) === null);
  if (!open) {
    const why = pool.length ? joinBlock(state, content, pool[0]) : null;
    return pushLines(state, [{ text: why && why !== 'none' ? why : t.none, tone: 'normal' }]);
  }
  const m: Member = { id: open.id, rank: 0, merit: 0, since: state.character.age, missions: 0 };
  const s = withJ(state, { faction: m });
  return pushLines(s, [{ text: fill(t.joined, { faction: open.name, rank: rankName(content, m) }), tone: 'good' }]);
}

/** Cống hiến ±; enough of it lifts the rank (balance.factions.rankMerit, one rank at a time). */
export function addMerit(state: GameState, content: Content, d: number): GameState {
  const m = memberOf(state);
  const cfg = content.balance.factions;
  const t = content.jianghu?.factions?.texts;
  if (!m || !cfg || !t) return state;
  let next: Member = { ...m, merit: Math.max(0, m.merit + d) };
  const def = factionDef(content, m.id);
  const ranks = def?.ranks ?? (def ? kindDef(content, def.kind)?.ranks : undefined) ?? [];
  const lines: LogLine[] = [];
  const need = cfg.rankMerit[next.rank];
  // The top rank (chưởng môn, bang chủ) is not reached by cống hiến alone.
  if (need !== undefined && next.merit >= need && next.rank < ranks.length - 2) {
    next = { ...next, rank: next.rank + 1 };
    lines.push({ text: fill(t.promoted, { faction: def?.name ?? '', rank: rankName(content, next) }), tone: 'good' });
  }
  return pushLines(withJ(state, { faction: next }), lines);
}

/** A nhiệm vụ done (the activity's check decides): cống hiến, bạc by rank, danh by the thế lực's side. */
export function factionMission(state: GameState, content: Content, ok: boolean): GameState {
  const m = memberOf(state);
  const cfg = content.balance.factions;
  const t = content.jianghu?.factions?.texts;
  const def = factionDef(content, m?.id);
  if (!m || !cfg || !t || !def) return state;
  const rng = new Rng(`${state.seed}:faction-mission:${state.character.age}:${m.missions}`);
  const side = def.alignment === 'chinh' ? 'chinh' : def.alignment === 'trung_lap' ? 'trung_lap' : 'ta';
  let s = withJ(state, { faction: { ...m, missions: m.missions + 1 } });
  if (!ok) {
    s = { ...s, stats: { ...s.stats, health: Math.max(0, s.stats.health + cfg.missionFailHealth) } };
    return addMerit(pushLines(s, [{ text: fill(rng.pick(t.missionFail), { faction: def.name }), tone: 'bad' }]), content, cfg.missionFailMerit);
  }
  const pay = cfg.missionPay[Math.min(m.rank, cfg.missionPay.length - 1)];
  s = { ...s, money: { ...s.money, silver: s.money.silver + pay } };
  s = side === 'chinh' ? addRenown(s, content, cfg.missionRenown, 0) : side === 'ta' ? addRenown(s, content, 0, cfg.missionRenown) : s;
  if (side === 'ta') s = { ...s, social: { ...s.social, karma: s.social.karma + cfg.taKarma } };
  s = pushLines(s, [{ text: fill(rng.pick(t.mission[side]), { faction: def.name, silver: pay }), tone: 'good' }]);
  return addMerit(s, content, rng.int(cfg.missionMerit[0], cfg.missionMerit[1]));
}

/** Đổi cống hiến lấy võ học: costs balance.factions.teachCost cống hiến; the next võ đạo stage comes easier. */
export function factionTeach(state: GameState, content: Content): GameState {
  const m = memberOf(state);
  const cfg = content.balance.factions;
  const t = content.jianghu?.factions?.texts;
  const def = factionDef(content, m?.id);
  if (!m || !cfg || !t || !def) return state;
  if (m.merit < cfg.teachCost) return pushLines(state, [{ text: t.teachPoor, tone: 'normal' }]);
  const s = withJ(state, { faction: { ...m, merit: m.merit - cfg.teachCost } });
  const taught = { ...s, martial: { ...s.martial, bonus: s.martial.bonus + cfg.teachBonus } };
  return pushLines(taught, [{ text: fill(t.taught, { faction: def.name, signature: def.signature }), tone: 'good' }]);
}

/** Leave: in peace (tạ sư, the door stays shut), or phản bang (men come after you for balance.factions.huntYears). */
export function leaveFaction(state: GameState, content: Content, how: 'quit' | 'betray'): GameState {
  const m = memberOf(state);
  const cfg = content.balance.factions;
  const t = content.jianghu?.factions?.texts;
  const def = factionDef(content, m?.id);
  if (!m || !cfg || !t || !def) return state;
  const j = jianghuOf(state);
  const left = [...(j.left ?? []), m.id];
  let s = withJ(state, { faction: null, left, hunted: how === 'betray' ? { by: m.id, until: state.character.age + cfg.huntYears } : j.hunted ?? null });
  if (how === 'betray') s = addRenown(s, content, -cfg.betrayFame, cfg.betrayInfamy);
  return pushLines(s, [{ text: fill(how === 'betray' ? t.betrayed : t.left, { faction: def.name }), tone: how === 'betray' ? 'bad' : 'normal' }]);
}

/** Lying low: the hunt ends sooner. */
export function hideFromHunt(state: GameState, content: Content): GameState {
  const h = state.jianghu?.hunted;
  if (!h) return state;
  return withJ(state, { hunted: { ...h, until: Math.max(state.character.age, h.until - (content.balance.factions?.hideYears ?? 1)) } });
}

/** A year: the stipend of the rank; the hunt ends after its years. */
export function factionYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.factions;
  const t = content.jianghu?.factions?.texts;
  if (!cfg || !t || !state.alive || !state.jianghu) return state;
  let s = state;
  const lines: LogLine[] = [];
  const m = memberOf(s);
  const stipend = m ? cfg.stipend[Math.min(m.rank, cfg.stipend.length - 1)] ?? 0 : 0;
  if (stipend) s = { ...s, money: { ...s.money, silver: s.money.silver + stipend } };
  const h = s.jianghu?.hunted;
  if (h && s.character.age >= h.until) {
    s = withJ(s, { hunted: null });
    lines.push({ text: fill(t.huntOver, { faction: factionDef(content, h.by)?.name ?? '' }), tone: 'good' });
  }
  return pushLines(s, lines);
}

/** "Hoa Sơn phái · Nội môn đệ tử · cống hiến 34 · bị Huyết Sát Lâu truy sát" for the profile. */
export function factionLine(state: GameState, content: Content): string | null {
  const m = memberOf(state);
  const h = state.jianghu?.hunted;
  const parts: string[] = [];
  if (m) parts.push(`${factionDef(content, m.id)?.name ?? m.id} · ${rankName(content, m)} · cống hiến ${m.merit}`);
  if (h) parts.push(`bị ${factionDef(content, h.by)?.name ?? h.by} truy sát tới năm ${h.until} tuổi`);
  return parts.length ? parts.join(' · ') : null;
}
