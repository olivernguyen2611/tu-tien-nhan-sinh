// 10.4 Tài sản và kinh tế phàm tục: nhà, ruộng, cửa hiệu, súc vật, xe thuyền, đồ quý (content/assets.json).
// Each year: incomes and upkeep, the ruộng harvest (the crop sown against the year's weather), each shop's
// way of trading, risks, thuế, and debts that grow until the creditor comes. Numbers: balance.assets.
// Rolls use side streams (seed:asset:…, seed:weather:age), so the life's own rng stays where it was.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, OwnedAsset } from '../core/types';
import { meets } from './events/conditions';
import { changeNpc } from './npcs';
import { meetAside } from './schooling';
import { timesPriceMul } from './worldState';

type Assets = NonNullable<GameState['assets']>;
type Kind = 'house' | 'land' | 'shop' | 'animal' | 'vehicle' | 'valuable';
const EMPTY: Assets = { owned: [], loans: [], crop: null, nextUid: 1 };
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
// Asset names sit mid-sentence in lower case; the line itself starts with a capital.
const fill = (t: string, ctx: Record<string, string | number>) => {
  const out = t.replace(/\{(\w+)\}/g, (m, k: string) => (k === 'asset' ? String(ctx[k]).toLowerCase() : String(ctx[k] ?? m)));
  return out.charAt(0).toUpperCase() + out.slice(1);
};

export const assetsOf = (state: GameState): Assets => state.assets ?? EMPTY;
export const assetDef = (content: Content, id: string | null | undefined) => content.assets?.assets.find((a) => a.id === id);
export const ownedOf = (state: GameState, content: Content, kind?: Kind, id?: string) =>
  assetsOf(state).owned.filter((o) => (!id || o.id === id) && (!kind || assetDef(content, o.id)?.kind === kind));
export const debtTotal = (state: GameState) => Math.round(assetsOf(state).loans.reduce((s, l) => s + l.owed, 0));

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return log;
}
const withLines = (s: GameState, lines: LogLine[]): GameState => ({ ...s, log: pushLines(s, lines) });

/** Today's price: the asset's price, following the thời cuộc price multiplier by priceFollow. */
export function assetPrice(state: GameState, content: Content, id: string): number {
  const def = assetDef(content, id);
  const cfg = content.balance.assets;
  if (!def || !cfg) return 0;
  return Math.max(0, Math.round(def.price * (1 + (timesPriceMul(state, content) - 1) * cfg.priceFollow)));
}

/** Why this asset cannot be bought now (null = it can). */
export function assetBlocked(state: GameState, content: Content, id: string): string | null {
  const def = assetDef(content, id);
  if (!def || !content.balance.assets) return 'Không có thứ này.';
  if (!state.alive) return 'Đã hết một đời.';
  if (def.kind !== 'house' && ownedOf(state, content, undefined, id).length >= def.maxOwn) return `Đã có đủ ${def.maxOwn}.`;
  if (def.kind === 'house' && ownedOf(state, content, undefined, id).length > 0) return 'Đang ở nhà này.';
  if (!meets(state, def.requires, content)) return def.requiresText ?? 'Chưa đủ điều kiện.';
  const old = def.kind === 'house' ? ownedOf(state, content, 'house')[0] : undefined;
  const credit = old ? sellValue(state, content, old) : 0;
  if (state.money.silver + credit < assetPrice(state, content, id)) return `Cần ${assetPrice(state, content, id)} lượng bạc.`;
  return null;
}

function sellValue(state: GameState, content: Content, o: OwnedAsset): number {
  const cfg = content.balance.assets!;
  return Math.round(assetPrice(state, content, o.id) * (o.fake ? cfg.fakeResale : cfg.resale));
}

function remove(state: GameState, uid: number): GameState {
  const a = assetsOf(state);
  return { ...state, assets: { ...a, owned: a.owned.filter((o) => o.uid !== uid) } };
}

/** Sell one (the latest of this id, or this uid). */
export function sellAsset(state: GameState, content: Content, id: string, uid?: number): { state: GameState; text: string } | null {
  const o = [...assetsOf(state).owned].reverse().find((x) => (uid !== undefined ? x.uid === uid : x.id === id));
  const def = assetDef(content, o?.id);
  if (!o || !def || !content.assets) return null;
  const got = sellValue(state, content, o);
  const s = remove({ ...state, money: { ...state.money, silver: state.money.silver + got } }, o.uid);
  const text = fill(o.fake ? content.assets.texts.soldFake : content.assets.texts.sold, { asset: def.name, silver: got });
  return { state: withLines(s, [{ text, tone: o.fake ? 'bad' : 'normal' }]), text };
}

/** Buy at today's price (a new house sells the old one first). */
export function buyAsset(state: GameState, content: Content, id: string): { state: GameState; text: string } | null {
  const def = assetDef(content, id);
  if (!def || !content.assets || assetBlocked(state, content, id)) return null;
  let s = state;
  const old = def.kind === 'house' ? ownedOf(s, content, 'house')[0] : undefined;
  if (old) s = sellAsset(s, content, old.id, old.uid)!.state;
  const a = assetsOf(s);
  const price = assetPrice(s, content, id);
  const fake = def.fakeChance > 0 && new Rng(`${s.seed}:asset:${a.nextUid}`).chance(def.fakeChance);
  const owned: OwnedAsset = { uid: a.nextUid, id, since: s.character.age, paid: price, fake, strategy: def.kind === 'shop' ? content.assets.strategies[0].id : null };
  s = { ...s, money: { ...s.money, silver: s.money.silver - price }, assets: { ...a, owned: [...a.owned, owned], nextUid: a.nextUid + 1 } };
  const text = fill(content.assets.texts.bought, { asset: def.name, silver: price });
  return { state: withLines(s, [{ text, tone: 'good' }]), text };
}

/** Lose one without pay (taken by a cường hào, burnt, died). */
export function loseAsset(state: GameState, _content: Content, id: string): GameState {
  const o = [...assetsOf(state).owned].reverse().find((x) => x.id === id);
  return o ? remove(state, o.uid) : state;
}

export function setStrategy(state: GameState, content: Content, strategyId: string): GameState {
  if (!content.assets?.strategies.some((x) => x.id === strategyId)) return state;
  const a = assetsOf(state);
  return { ...state, assets: { ...a, owned: a.owned.map((o) => (assetDef(content, o.id)?.kind === 'shop' ? { ...o, strategy: strategyId } : o)) } };
}

export function sowCrop(state: GameState, content: Content, cropId: string): GameState {
  if (!content.assets?.crops.some((c) => c.id === cropId)) return state;
  return { ...state, assets: { ...assetsOf(state), crop: cropId } };
}

/** This year's weather and the news about it (right with forecastTrue). */
export function forecast(state: GameState, content: Content): { actual: 'wet' | 'dry' | 'normal'; news: string } | null {
  const file = content.assets;
  const cfg = content.balance.assets;
  if (!file || !cfg) return null;
  const rng = new Rng(`${state.seed}:weather:${state.character.age}`);
  const actual = rng.pick(file.weather).id;
  const said = rng.chance(cfg.forecastTrue) ? actual : rng.pick(file.weather.filter((w) => w.id !== actual)).id;
  return { actual, news: file.weather.find((w) => w.id === said)!.news };
}

/** Borrow: the lender becomes a chủ nợ acquaintance. */
export function borrow(state: GameState, content: Content, loanId: string): { state: GameState; text: string } | null {
  const def = content.assets?.loans.find((l) => l.id === loanId);
  if (!def || !state.alive) return null;
  const a = assetsOf(state);
  const met = meetAside(state, content, new Rng(`${state.seed}:loan:${a.nextUid}`), { role: def.lenderRole, kind: 'chu_no', age: state.character.age + 15, affinity: 40, root: false });
  const s: GameState = {
    ...met.state,
    money: { ...met.state.money, silver: met.state.money.silver + def.amount },
    assets: { ...a, loans: [...a.loans, { uid: a.nextUid, id: def.id, lender: met.id, owed: def.amount, since: state.character.age }], nextUid: a.nextUid + 1 },
  };
  const text = fill(content.assets!.texts.borrowed, { loan: def.name, silver: def.amount });
  return { state: withLines(s, [{ text, tone: 'normal' }]), text };
}

/** Pay every debt back, when the silver is there. */
export function repayDebts(state: GameState, content: Content): { state: GameState; text: string } | null {
  const owed = debtTotal(state);
  if (owed === 0 || state.money.silver < owed || !content.assets) return null;
  const text = fill(content.assets.texts.repaid, { silver: owed });
  const s: GameState = { ...state, money: { ...state.money, silver: state.money.silver - owed }, assets: { ...assetsOf(state), loans: [] } };
  return { state: withLines(s, [{ text, tone: 'good' }]), text };
}

/** Months the fields and shops take this year (fields count once). */
export function assetMonths(state: GameState, content: Content): number {
  const seen = new Set<string>();
  let m = 0;
  for (const o of assetsOf(state).owned) {
    const def = assetDef(content, o.id);
    if (!def || !def.months) continue;
    if (def.kind === 'land') { if (seen.has('land')) continue; seen.add('land'); }
    m += def.months;
  }
  return m;
}

function applyStats(state: GameState, fx: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const apts = { ...state.aptitudes };
  for (const [key, d] of Object.entries(fx)) {
    const k = key.replace(/^stat\./, '');
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + d);
    else if (k in apts) apts[k as keyof typeof apts] = clamp(apts[k as keyof typeof apts] + d);
  }
  return { ...state, stats, aptitudes: apts };
}

/** A year of owning: harvest, shops, upkeep, stats, risks, thuế, debts. */
export function assetsYear(state: GameState, content: Content): GameState {
  const file = content.assets;
  const cfg = content.balance.assets;
  if (!file || !cfg || !state.alive) return state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:asset-year:${age}`);
  let s = state;
  let silver = 0;
  const lines: LogLine[] = [];
  const a = assetsOf(s);
  // Ruộng: the crop against the weather.
  const fields = ownedOf(s, content, 'land');
  if (fields.length) {
    const w = forecast(s, content)!;
    const crop = file.crops.find((c) => c.id === a.crop);
    const fit = !crop ? cfg.cropFit.none : crop.weather === 'any' || w.actual === 'normal' ? cfg.cropFit.normal : crop.weather === w.actual ? cfg.cropFit.right : cfg.cropFit.wrong;
    const harvest = (s.times?.vars.harvest ?? 50) / 50;
    const got = Math.round(fields.reduce((sum, o) => sum + (assetDef(content, o.id)?.income ?? 0), 0) * harvest * fit);
    silver += got;
    lines.push({ text: fill(file.texts.harvest, { count: fields.length, silver: got }), tone: fit >= cfg.cropFit.normal ? 'good' : 'bad' });
  }
  let landRolled = false;
  for (const o of a.owned) {
    const def = assetDef(content, o.id);
    if (!def) continue;
    silver -= def.upkeep;
    if (def.kind === 'shop') {
      const st = file.strategies.find((x) => x.id === o.strategy) ?? file.strategies[0];
      if (st.illegal && rng.chance(st.risk)) {
        silver -= def.income * 2;
        s = { ...s, flags: { ...s.flags, buon_lau: true }, social: { ...s.social, karma: s.social.karma + st.karma, reputation: { ...s.social.reputation, trieu_dinh: s.social.reputation.trieu_dinh - 5 } } };
        lines.push({ text: fill(st.caughtText ?? file.texts.shop, { asset: def.name, silver: -def.income * 2 }), tone: 'bad' });
      } else {
        const bad = !st.illegal && rng.chance(st.risk);
        const got = bad ? -Math.round(def.income * 0.5) : Math.round(def.income * st.profit * (1 + (rng.next() * 2 - 1) * cfg.shopSpread));
        silver += got;
        if (st.karma) s = { ...s, social: { ...s.social, karma: s.social.karma + st.karma } };
        lines.push({ text: fill(file.texts.shop, { asset: def.name, silver: got }), tone: got >= 0 ? 'normal' : 'bad' });
      }
    } else if (def.kind !== 'land') {
      silver += def.income;
    }
    if ((age - o.since) % cfg.statEvery === 0 && age > o.since) s = applyStats(s, def.stats);
    // Fields share one roll a year (twenty mẫu are not twenty times the cường hào).
    const rolls = def.kind !== 'land' || !landRolled;
    if (def.kind === 'land') landRolled = true;
    for (const r of rolls ? def.risks : []) {
      if (!rng.chance(r.chance)) continue;
      silver += r.silver;
      s = applyStats(s, r.effects);
      if (r.lose) s = remove(s, o.uid);
      lines.push({ text: fill(r.text, { asset: def.name }), tone: 'bad' });
      break;
    }
  }
  s = { ...s, money: { ...s.money, silver: Math.max(0, s.money.silver + silver) }, assets: { ...assetsOf(s), crop: null } };
  // Thuế, sưu: Phàm gian only.
  if (s.tier === 'pham_gian' && s.cult.realm === 'pham_nhan' && age >= cfg.tax.minAge) {
    const t = cfg.tax;
    const hidden = !!s.flags.giau_ruong;
    const head = t.exemptFlags.some((f) => s.flags[f]) ? 0 : t.head;
    const due = Math.round((head + (hidden ? 0 : ownedOf(s, content, 'land').length * t.land) + ownedOf(s, content, 'shop').length * t.shop) * (t.phaseMul[s.times?.phase ?? ''] ?? 1));
    if (hidden) s = { ...s, flags: { ...s.flags, giau_ruong: false } };
    if (due > 0) {
      const paid = Math.min(due, s.money.silver);
      s = { ...s, money: { ...s.money, silver: s.money.silver - paid } };
      // A small shortfall the lý trưởng lets go; the tax line shows only now and then.
      if (due - paid >= t.forgiveBelow) {
        s = { ...s, stats: { ...s.stats, happiness: clamp(s.stats.happiness - t.shortHappiness) }, social: { ...s.social, reputation: { ...s.social.reputation, trieu_dinh: s.social.reputation.trieu_dinh - 2 } } };
        lines.push({ text: fill(file.texts.taxShort, { silver: due - paid }), tone: 'bad' });
      } else if (paid === due && due >= t.logAt && age % t.logEvery === 0) lines.push({ text: fill(file.texts.tax, { silver: due }), tone: 'normal' });
    }
  }
  // Nợ: interest; long unpaid debts end with an asset seized, or labour to pay it off.
  const loans = assetsOf(s).loans;
  if (loans.length) {
    const grown = loans.map((l) => ({ ...l, owed: Math.round(l.owed * (1 + (file.loans.find((x) => x.id === l.id)?.rate ?? 0))) }));
    s = { ...s, assets: { ...assetsOf(s), loans: grown } };
    for (const l of grown.filter((x) => age - x.since >= cfg.defaultYears)) {
      const owned = [...assetsOf(s).owned].sort((x, y) => sellValue(s, content, y) - sellValue(s, content, x))[0];
      const lender = s.npcs.find((n) => n.id === l.lender)?.name ?? 'chủ nợ';
      if (owned && sellValue(s, content, owned) > 0) {
        s = remove(s, owned.uid);
        lines.push({ text: fill(file.texts.seized, { lender, asset: assetDef(content, owned.id)?.name ?? '' }), tone: 'bad' });
      } else {
        s = applyStats({ ...s, flags: { ...s.flags, lam_tru_no: true } }, { 'stat.happiness': -10, 'stat.health': -3 });
        lines.push({ text: fill(file.texts.bonded, { lender }), tone: 'bad' });
      }
      if (l.lender) s = changeNpc(s, content, l.lender, { affinity: -30, grudge: 20 });
      s = { ...s, assets: { ...assetsOf(s), loans: assetsOf(s).loans.filter((x) => x.uid !== l.uid) } };
    }
  }
  return withLines(s, lines);
}

/** "Nhà ngói · 3 mẫu ruộng · Quán trà · nợ 50 lượng" for the profile. */
export function assetsLine(state: GameState, content: Content): string | null {
  const counts = new Map<string, number>();
  for (const o of assetsOf(state).owned) counts.set(o.id, (counts.get(o.id) ?? 0) + 1);
  const parts = [...counts].map(([id, n]) => {
    const def = assetDef(content, id);
    if (!def) return id;
    return def.kind === 'land' ? `${n} mẫu ${def.name.toLowerCase()}` : n > 1 ? `${n} ${def.name.toLowerCase()}` : def.name;
  });
  const owed = debtTotal(state);
  if (owed > 0) parts.push(`nợ ${owed} lượng`);
  return parts.length ? parts.join(' · ') : null;
}

/** Hand the estate to the heir: everything with a di chúc, each asset by chance without one. Debts pass on. */
export function inheritAssets(dead: GameState, heir: GameState, content: Content): GameState {
  const a = assetsOf(dead);
  const cfg = content.balance.assets;
  if (!cfg || (a.owned.length === 0 && a.loans.length === 0)) return heir;
  const rng = new Rng(`${dead.seed}:will`);
  const owned = dead.flags.di_chuc ? a.owned : a.owned.filter(() => rng.chance(cfg.noWillKeep));
  return { ...heir, assets: { ...a, owned: owned.map((o) => ({ ...o, since: heir.character.age })), crop: null } };
}

export const ASSET_KINDS: { id: Kind; name: string }[] = [
  { id: 'house', name: 'Nhà cửa' }, { id: 'land', name: 'Ruộng đất' }, { id: 'shop', name: 'Cửa hiệu' },
  { id: 'animal', name: 'Súc vật' }, { id: 'vehicle', name: 'Xe thuyền' }, { id: 'valuable', name: 'Đồ quý' },
];

export interface AssetView { id: string; name: string; kind: Kind; description: string; price: number; income: number; owned: number; blocked: string | null }

/** Every asset with today's price and why it cannot be bought. */
export function assetViews(state: GameState, content: Content): AssetView[] {
  return (content.assets?.assets ?? []).map((a) => ({
    id: a.id, name: a.name, kind: a.kind, description: a.description, price: assetPrice(state, content, a.id), income: a.income,
    owned: ownedOf(state, content, undefined, a.id).length, blocked: assetBlocked(state, content, a.id),
  }));
}

/** Owned rows with what they would sell for. */
export function ownedViews(state: GameState, content: Content): { uid: number; id: string; name: string; value: number }[] {
  return assetsOf(state).owned.map((o) => ({ uid: o.uid, id: o.id, name: assetDef(content, o.id)?.name ?? o.id, value: sellValue(state, content, o) }));
}

export type AssetAction =
  | { kind: 'buy'; id: string } | { kind: 'sell'; id: string; uid: number } | { kind: 'crop'; id: string }
  | { kind: 'strategy'; id: string } | { kind: 'borrow'; id: string } | { kind: 'repay' };

/** One action from the Gia sản sheet. */
export function assetAction(state: GameState, content: Content, a: AssetAction): { state: GameState; text: string } | null {
  switch (a.kind) {
    case 'buy': return buyAsset(state, content, a.id);
    case 'sell': return sellAsset(state, content, a.id, a.uid);
    case 'borrow': return borrow(state, content, a.id);
    case 'repay': return repayDebts(state, content);
    case 'crop': {
      const c = content.assets?.crops.find((x) => x.id === a.id);
      return c ? { state: sowCrop(state, content, a.id), text: c.text } : null;
    }
    case 'strategy': {
      const st = content.assets?.strategies.find((x) => x.id === a.id);
      return st ? { state: setStrategy(state, content, a.id), text: `Cửa hiệu: ${st.name.toLowerCase()}.` } : null;
    }
  }
}
