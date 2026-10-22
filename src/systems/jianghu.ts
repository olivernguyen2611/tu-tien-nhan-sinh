// 11.1 Danh vọng giang hồ và ngoại hiệu (content/jianghu.json): reputation.giang_ho splits into hiệp danh (fame,
// chính) and ác danh (infamy, tà); both can be high. reputation.giang_ho stays the net of the two, so older events
// and labels read it as before. Past balance.jianghu.aliasAt in either, the giang hồ gives a ngoại hiệu built from
// parts: a trait word (by hiệp/ác, or a scar the body carries) + a weapon or beast. Numbers: balance.jianghu.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';

type Jianghu = NonNullable<GameState['jianghu']>;
const EMPTY: Jianghu = { fame: 0, infamy: 0, alias: null, aliasAt: null };

/** Fame and infamy; an old save with only reputation.giang_ho reads its sign. */
export function jianghuOf(state: GameState): Jianghu {
  if (state.jianghu) return state.jianghu;
  const net = state.social.reputation.giang_ho ?? 0;
  return { ...EMPTY, fame: Math.max(0, net), infamy: Math.max(0, -net) };
}

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

/** Hiệp danh ± and ác danh ± (each 0…max); reputation.giang_ho follows as fame − infamy. */
export function addRenown(state: GameState, content: Content, fame: number, infamy: number): GameState {
  const max = content.balance.jianghu?.max ?? 100;
  const j = jianghuOf(state);
  const clamp = (v: number) => Math.max(0, Math.min(max, Math.round(v)));
  const next: Jianghu = { ...j, fame: clamp(j.fame + fame), infamy: clamp(j.infamy + infamy) };
  const net = Math.max(-100, Math.min(100, next.fame - next.infamy));
  return giveAlias({ ...state, jianghu: next, social: { ...state.social, reputation: { ...state.social.reputation, giang_ho: net } } }, content);
}

/** A change to reputation.giang_ho from older content: + is hiệp danh, − is ác danh. */
export const addNetRenown = (state: GameState, content: Content, d: number): GameState => (d >= 0 ? addRenown(state, content, d, 0) : addRenown(state, content, 0, -d));

/** Build a ngoại hiệu: a trait word (a scar wins, else by hiệp/ác) + a weapon or beast. */
export function makeAlias(state: GameState, content: Content, side: 'hiep' | 'ac'): string | null {
  const file = content.jianghu;
  if (!file) return null;
  const rng = new Rng(`${state.seed}:alias:${state.character.age}`);
  const scar = (state.body?.injuries ?? []).map((i) => file.aliases.injury[i]).find(Boolean);
  const trait = scar ?? rng.pick([...file.aliases.traits[side], ...file.aliases.traits.any]);
  const style = state.paths ? Object.entries(state.paths).sort((a, b) => b[1] - a[1])[0]?.[0] : undefined;
  const nouns = [...(style && file.aliases.nounsByPath[style] ? file.aliases.nounsByPath[style] : []), ...file.aliases.nouns];
  return `${trait} ${rng.pick(nouns)}`;
}

/** 11.1: an NPC's ngoại hiệu (a side stream by the NPC's id; tà when `evil`). */
export function npcAlias(content: Content, seed: string, evil: boolean): string | null {
  const a = content.jianghu?.aliases;
  if (!a) return null;
  const rng = new Rng(seed);
  return `${rng.pick([...(evil ? a.traits.ac : a.traits.hiep), ...a.traits.any])} ${rng.pick(a.nouns)}`;
}

/** Past aliasAt in hiệp danh or ác danh, the giang hồ names you (once). */
function giveAlias(state: GameState, content: Content): GameState {
  const cfg = content.balance.jianghu;
  const file = content.jianghu;
  const j = jianghuOf(state);
  if (!cfg || !file || j.alias || Math.max(j.fame, j.infamy) < cfg.aliasAt) return state;
  const side = j.fame >= j.infamy ? 'hiep' : 'ac';
  const alias = makeAlias(state, content, side);
  if (!alias) return state;
  const s: GameState = { ...state, jianghu: { ...j, alias, aliasAt: state.character.age } };
  return pushLines(s, [{ text: file.texts.alias[side].replace('{alias}', alias), tone: 'rare' }]);
}

/** The title that goes with a renown value (texts.ranks: from low to high). */
export function renownRank(content: Content, side: 'hiep' | 'ac', v: number): string | null {
  const ranks = content.jianghu?.texts.ranks[side] ?? [];
  const steps = content.balance.jianghu?.ranks ?? [];
  let name: string | null = null;
  steps.forEach((at, i) => { if (v >= at && ranks[i]) name = ranks[i]; });
  return name;
}

/** "Ngoại hiệu «Thiết Thủ Hắc Ưng» · Hiệp danh 42 (Có tiếng) · Ác danh 5" for the profile. */
export function jianghuLine(state: GameState, content: Content): string | null {
  const j = jianghuOf(state);
  if (!content.jianghu || (j.fame <= 0 && j.infamy <= 0 && !j.alias)) return null;
  const parts: string[] = [];
  if (j.alias) parts.push(`Ngoại hiệu «${j.alias}»`);
  const label = (name: string, side: 'hiep' | 'ac', v: number) => { const r = renownRank(content, side, v); return `${name} ${v}${r ? ` (${r})` : ''}`; };
  if (j.fame > 0) parts.push(label('Hiệp danh', 'hiep', j.fame));
  if (j.infamy > 0) parts.push(label('Ác danh', 'ac', j.infamy));
  return parts.join(' · ');
}
