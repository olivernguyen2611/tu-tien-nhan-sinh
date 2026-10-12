// Gia tộc tu tiên (task 5.4): from Trúc Cơ, with a child, a cultivator founds
// a clan named after the family ("Lâm gia"), sets up to two gia quy and buys
// sản nghiệp that bring silver or spirit stones each year. Gia quy shape the
// line: more root rolls for children born into it, property income, what an
// heir keeps, karma. The clan passes to the heir (task 5.7); tộc phả lists the
// generations. Numbers in balance.clan, data in clan.json.
import type { Content } from '../core/content';
import type { GameState, LogLine } from '../core/types';
import { splitName } from './names';

function realmIndex(content: Content, id: string): number {
  return content.cultivation.realms.realms.findIndex((r) => r.id === id);
}

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

export function clanName(state: GameState, content: Content): string {
  return state.clan?.name ?? `${splitName(state.character.name, content.names).surname} gia`;
}

export function clanBlocked(state: GameState, content: Content): string | null {
  const cfg = content.balance.clan;
  if (!state.alive) return 'Đã hết một đời.';
  if (state.clan) return 'Đã lập gia tộc.';
  if (realmIndex(content, state.cult.realm) < realmIndex(content, cfg.minRealm)) {
    return `Tới ${content.cultivation.realms.realms[realmIndex(content, cfg.minRealm)]?.name ?? cfg.minRealm} mới lập được gia tộc tu tiên.`;
  }
  if (state.family.filter((r) => r.role === 'child' && r.alive).length < cfg.minChildren) return 'Cần có con nối dõi.';
  if (state.money.spiritStones < cfg.cost) return `Cần ${cfg.cost} linh thạch dựng từ đường.`;
  return null;
}

export function foundClan(state: GameState, content: Content, rules: string[]): { state: GameState; text: string } | null {
  const picked = [...new Set(rules)].filter((id) => content.clan.rules.some((r) => r.id === id));
  if (clanBlocked(state, content) || picked.length > content.balance.clan.maxRules) return null;
  const name = clanName(state, content);
  const text = content.clan.texts.founded.replaceAll('{clan}', name);
  const s: GameState = {
    ...state,
    money: { ...state.money, spiritStones: state.money.spiritStones - content.balance.clan.cost },
    clan: { name, founded: state.character.age, founder: state.character.name, rules: picked, properties: {} },
  };
  return { state: pushLines(s, [{ text, tone: 'rare' }]), text };
}

function rules(state: GameState, content: Content) {
  return (state.clan?.rules ?? []).map((id) => content.clan.rules.find((r) => r.id === id)).filter((r) => r !== undefined);
}

/** Extra root rolls for children born into the clan (gia quy Trọng tu luyện). */
export function clanRootRolls(state: GameState, content: Content): number {
  return rules(state, content).reduce((n, r) => n + r.rootRolls, 0);
}

/** Extra share of money an heir keeps (gia quy Độc đinh truyền thừa). */
export function clanInheritBonus(state: GameState, content: Content): number {
  return rules(state, content).reduce((n, r) => n + r.inheritMoney, 0);
}

export interface PropertyView {
  id: string;
  name: string;
  text: string;
  count: number;
  max: number;
  cost: string;
  income: string;
  blocked: string | null;
}

const money = (m: { silver?: number; spiritStones?: number }) =>
  [m.spiritStones ? `${m.spiritStones} linh thạch` : '', m.silver ? `${m.silver} bạc` : ''].filter(Boolean).join(' · ');

export function propertyViews(state: GameState, content: Content): PropertyView[] {
  const clan = state.clan;
  if (!clan) return [];
  return content.clan.properties.map((p) => {
    const count = clan.properties[p.id] ?? 0;
    let blocked: string | null = null;
    if (count >= p.max) blocked = 'Đã đủ.';
    else if ((p.cost.silver ?? 0) > state.money.silver || (p.cost.spiritStones ?? 0) > state.money.spiritStones) blocked = 'Không đủ tiền.';
    return { id: p.id, name: p.name, text: p.text, count, max: p.max, cost: money(p.cost), income: money(p.income), blocked };
  });
}

export function buyProperty(state: GameState, content: Content, propertyId: string): { state: GameState; text: string } | null {
  const view = propertyViews(state, content).find((p) => p.id === propertyId);
  const p = content.clan.properties.find((x) => x.id === propertyId);
  if (!state.clan || !view || view.blocked || !p) return null;
  const text = content.clan.texts.bought.replaceAll('{clan}', state.clan.name).replaceAll('{property}', p.name);
  const s: GameState = {
    ...state,
    money: { silver: state.money.silver - (p.cost.silver ?? 0), spiritStones: state.money.spiritStones - (p.cost.spiritStones ?? 0) },
    clan: { ...state.clan, properties: { ...state.clan.properties, [p.id]: view.count + 1 } },
  };
  return { state: pushLines(s, [{ text, tone: 'good' }]), text };
}

/** Yearly: sản nghiệp bring income (× gia quy), gia quy move karma. */
export function clanYear(state: GameState, content: Content): GameState {
  const clan = state.clan;
  if (!state.alive || !clan) return state;
  const mul = rules(state, content).reduce((m, r) => m * r.incomeMul, 1);
  let silver = 0;
  let stones = 0;
  for (const p of content.clan.properties) {
    const n = clan.properties[p.id] ?? 0;
    silver += (p.income.silver ?? 0) * n;
    stones += (p.income.spiritStones ?? 0) * n;
  }
  silver = Math.round(silver * mul);
  stones = Math.round(stones * mul);
  const karma = rules(state, content).reduce((k, r) => k + r.karmaPerYear, 0);
  let s: GameState = {
    ...state,
    money: { silver: state.money.silver + silver, spiritStones: state.money.spiritStones + stones },
    social: { ...state.social, karma: Math.max(-100, Math.min(100, state.social.karma + karma)) },
  };
  if (silver > 0 || stones > 0) {
    s = pushLines(s, [{ text: content.clan.texts.income.replaceAll('{clan}', clan.name).replaceAll('{income}', money({ silver, spiritStones: stones })), tone: 'good' }]);
  }
  return s;
}

/** Tộc phả: the generations so far, then the one living now and their children. */
export function familyTree(state: GameState, content: Content): { name: string; note: string; current?: boolean }[] {
  const past = state.ancestry.map((a) => ({ name: a.name, note: `${a.realm}, mất năm ${a.age} tuổi` }));
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  const me = { name: state.character.name, note: `${realm?.name ?? ''}, ${state.character.age} tuổi`, current: true };
  const kids = state.family.filter((r) => r.role === 'child').map((r) => ({ name: r.name, note: r.alive ? `${r.age} tuổi` : `mất năm ${r.age} tuổi` }));
  return [...past, me, ...kids];
}
