// 10.11 Gia tộc phàm tục (content/kin.json): the life is born into a họ, not a nuclear family. A tộc trưởng and
// họ hàng nội ngoại (chú bác, cô dì, anh em họ) are real acquaintances; the gia phả shows three generations; the
// father's death brings the phân gia (chia đều, giành phần trưởng, nhường hết); the head of a house sets gia quy,
// keeps the từ đường and the tế tổ, and chooses who carries the line (heirOptions lists that one first).
// Numbers: balance.kin. Rolls use side streams.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { createNpc } from './npcs';
import { makeName, splitName } from './names';

type Kin = NonNullable<GameState['kin']>;
const EMPTY: Kin = { elder: null, relatives: [], forebears: [], split: false, heir: null, rules: [], shrine: 0, rites: 0 };
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export const kinOf = (state: GameState): Kin => state.kin ?? EMPTY;

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

function applyStats(state: GameState, fx: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const apts = { ...state.aptitudes };
  let karma = state.social.karma;
  for (const [key, d] of Object.entries(fx)) {
    if (key === 'karma') { karma += d; continue; }
    const k = key.replace(/^stat\./, '');
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + d);
    else if (k in apts) apts[k as keyof typeof apts] = clamp(apts[k as keyof typeof apts] + d);
  }
  return { ...state, stats, aptitudes: apts, social: { ...state.social, karma } };
}

/** The họ comes into view once the child is old enough: tộc trưởng, họ hàng, and the forebears' names. */
function meetKin(state: GameState, content: Content): GameState {
  const file = content.kin!;
  const cfg = content.balance.kin!;
  const rng = new Rng(`${state.seed}:kin`);
  const { surname } = splitName(state.character.name, content.names);
  let s = state;
  const meet = (role: string, kind: string, paternal: boolean, ageOffset: [number, number], affinity: number) => {
    const met = createNpc({ ...s, rng: rng.getState() }, content, { role, kind, surname: paternal ? surname : undefined, age: Math.max(1, s.character.age + rng.int(ageOffset[0], ageOffset[1])), affinity, root: false });
    s = { ...met.state, rng: state.rng };
    return met.id;
  };
  const elder = meet(file.elder.role, file.elder.kind, true, file.elder.ageOffset, cfg.elderAffinity);
  const count = rng.int(cfg.relatives[0], cfg.relatives[1]);
  const pool = rng.shuffle(file.relatives.slice());
  const relatives: string[] = [];
  for (let i = 0; i < count && i < pool.length; i++) {
    const r = pool[i];
    relatives.push(meet(r.role, r.kind, r.paternal, r.ageOffset, rng.int(cfg.affinity[0], cfg.affinity[1])));
  }
  const taken = [state.character.name, ...s.family.map((r) => r.name), ...s.npcs.map((n) => n.name)];
  const forebears = file.forebears.map((f) => ({ role: f.role, name: makeName(rng, content.names, f.gender, { surname: f.paternal ? surname : undefined, taken }) }));
  const elderName = s.npcs.find((n) => n.id === elder)?.name ?? '';
  s = { ...s, kin: { ...kinOf(s), elder, relatives, forebears } };
  return pushLines(s, [{ text: fill(file.texts.met, { elder: elderName, count: relatives.length }), tone: 'normal' }]);
}

/** A year: the họ is met; gia quy shape the house a little every year. */
export function kinYear(state: GameState, content: Content): GameState {
  const file = content.kin;
  const cfg = content.balance.kin;
  if (!file || !cfg || !state.alive) return state;
  let s = state;
  if (!s.kin && s.character.age >= cfg.meetAge) s = meetKin(s, content);
  const k = kinOf(s);
  for (const id of k.rules) {
    const rule = file.rules.find((r) => r.id === id);
    if (rule) s = applyStats(s, rule.stats);
  }
  return scholarYear(s, content);
}

/** 10.13: a child coming of age this year may pass Tú tài (gia quy hiếu học, a strict upbringing, the parent's own bậc help). */
function scholarYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.kin?.scholar;
  const t = content.kin?.texts.scholar;
  if (!cfg || !t) return state;
  const due = state.family.filter((r) => r.role === 'child' && r.alive && r.age === cfg.age && !r.scholar);
  if (due.length === 0) return state;
  const rng = new Rng(`${state.seed}:scholar:${state.character.age}`);
  const rank = state.exam ? state.exam.rank + 1 : 0;
  const study = kinOf(state).rules.includes('hieu_hoc') ? cfg.studyRule : 0;
  const passed = new Set<string>();
  for (const r of due) {
    const chance = Math.min(cfg.max, cfg.base + study + ((r.rearing ?? 0) < 0 ? cfg.strict : 0) + rank * cfg.perRank + (r.insight ?? 0) * cfg.perInsight);
    if (rng.chance(chance)) passed.add(r.id);
  }
  if (passed.size === 0) return state;
  const family = state.family.map((r) => (passed.has(r.id) ? { ...r, scholar: true, affinity: clamp(r.affinity + 5) } : r));
  const lines = state.family.filter((r) => passed.has(r.id)).map((r) => ({ text: fill(t, { child: r.name }), tone: 'good' as const }));
  return pushLines(applyStats({ ...state, family }, { 'stat.happiness': 4 * passed.size }), lines);
}

/** Phân gia: the estate the father left, shared among the living siblings by `how`. */
export function shareEstate(state: GameState, content: Content, how: 'equal' | 'eldest' | 'yield'): GameState {
  const file = content.kin;
  const cfg = content.balance.kin;
  if (!file || !cfg) return state;
  const rng = new Rng(`${state.seed}:estate:${state.character.age}`);
  const siblings = state.family.filter((r) => r.role === 'sibling' && r.alive);
  const pot = rng.int(cfg.estate[0], cfg.estate[1]);
  const share = how === 'equal' ? Math.round(pot / (siblings.length + 1)) : how === 'eldest' ? Math.round(pot * cfg.eldestShare) : 0;
  const d = cfg.siblingAffinity[how];
  const family = state.family.map((r) => (r.role === 'sibling' && r.alive ? { ...r, affinity: clamp(r.affinity + d) } : r));
  let s: GameState = { ...state, family, money: { ...state.money, silver: state.money.silver + share }, kin: { ...kinOf(state), split: true } };
  if (how === 'yield') s = { ...s, social: { ...s.social, karma: s.social.karma + cfg.yieldKarma } };
  return pushLines(s, [{ text: fill(file.texts.split[how], { silver: share, pot }), tone: how === 'eldest' ? 'bad' : 'normal' }]);
}

/** Chọn người nối dõi among the grown children: the eldest, the ablest, or the most filial. */
export function chooseHeir(state: GameState, content: Content, how: 'eldest' | 'ablest' | 'filial'): GameState {
  const file = content.kin;
  if (!file) return state;
  const kids = state.family.filter((r) => r.role === 'child' && r.alive && r.age >= (content.balance.heir.minAge ?? 16));
  if (kids.length === 0) return pushLines(state, [{ text: file.texts.noHeir, tone: 'normal' }]);
  const pick = how === 'eldest' ? kids.sort((a, b) => b.age - a.age)[0]
    : how === 'filial' ? kids.sort((a, b) => b.affinity - a.affinity)[0]
    : kids.sort((a, b) => ((b.root ? 1 : 0) - (a.root ? 1 : 0)) || (b.rearing ?? 0) - (a.rearing ?? 0) || b.age - a.age)[0];
  // The others feel passed over.
  const d = content.balance.kin?.passedOver ?? 0;
  const family = state.family.map((r) => (r.role === 'child' && r.alive && r.id !== pick.id ? { ...r, affinity: clamp(r.affinity + d) } : r));
  const s: GameState = { ...state, family, kin: { ...kinOf(state), heir: pick.id } };
  return pushLines(s, [{ text: fill(file.texts.heir, { child: pick.name }), tone: 'good' }]);
}

/** Gia quy: at most balance.kin.maxRules; a new one replaces the oldest. */
export function setRule(state: GameState, content: Content, id: string): GameState {
  const file = content.kin;
  const rule = file?.rules.find((r) => r.id === id);
  if (!file || !rule) return state;
  const max = content.balance.kin?.maxRules ?? 2;
  const k = kinOf(state);
  if (k.rules.includes(id)) return state;
  const rules = [...k.rules, id].slice(-max);
  return pushLines({ ...state, kin: { ...k, rules } }, [{ text: fill(file.texts.rule, { rule: rule.name, text: rule.text }), tone: 'good' }]);
}

export function worship(state: GameState): GameState {
  const k = kinOf(state);
  return { ...state, kin: { ...k, rites: k.rites + 1 } };
}

export function repairShrine(state: GameState, content: Content): GameState {
  const k = kinOf(state);
  const max = content.balance.kin?.shrineMax ?? 3;
  return { ...state, kin: { ...k, shrine: Math.min(max, k.shrine + 1) } };
}

/** All living children's affinity ± (a quarrel over the gia sản, a feast). */
export function childrenAffinity(state: GameState, d: number): GameState {
  return { ...state, family: state.family.map((r) => (r.role === 'child' && r.alive ? { ...r, affinity: clamp(r.affinity + d) } : r)) };
}

/** Gia phả, three generations or more: forebears (or the past lives of the line), parents, the player, children. */
export function lineageRows(state: GameState, content: Content): { gen: string; names: string[] }[] {
  const file = content.kin;
  if (!file) return [];
  const k = kinOf(state);
  const rows: { gen: string; names: string[] }[] = [];
  if (state.ancestry.length) rows.push({ gen: file.texts.ancestors, names: state.ancestry.map((a) => a.name) });
  else if (k.forebears.length) rows.push({ gen: file.texts.forebears, names: k.forebears.map((f) => f.name) });
  const parents = state.family.filter((r) => r.role === 'father' || r.role === 'mother').map((r) => r.name);
  if (parents.length) rows.push({ gen: file.texts.parents, names: parents });
  rows.push({ gen: file.texts.self, names: [state.character.name] });
  const mark = file.texts.scholarMark;
  const kids = state.family.filter((r) => r.role === 'child').map((r) => `${r.name}${r.scholar && mark ? ` ${mark}` : ''}${r.id === k.heir ? ' (nối dõi)' : ''}`);
  if (kids.length) rows.push({ gen: file.texts.children, names: kids });
  return rows;
}

/** "Tổ phụ: … · Cha mẹ: … · Bản thân: … · Con: …" for the profile. */
export function lineageLine(state: GameState, content: Content): string | null {
  if (!state.kin) return null;
  return lineageRows(state, content).map((r) => `${r.gen}: ${r.names.join(', ')}`).join(' · ');
}
