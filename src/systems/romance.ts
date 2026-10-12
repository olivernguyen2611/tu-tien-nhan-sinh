// Tình duyên (task 3.6): court an NPC met along the way, give gifts, confess.
// Affinity has named tiers (romance.json); a gift may be turned down, a masked
// lover may use the player; a yes makes a couple.
// Đạo lữ (task 3.7): a couple weds; a cultivating đạo lữ speeds cultivation
// (song tu, in cultivation.ts); children inherit spirit roots, sometimes mutated.
// Nobody under balance.romance.minAge takes part, and Phật đạo keeps its precept.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameEvent } from '../core/schemas';
import type { GameState, LogLine, Npc, Relative, SpiritRoot, Tone } from '../core/types';
import { rollRoot, rootName } from './cultivation';
import { changeNpc, isMasked, npcById } from './npcs';
import { clanRootRolls } from './clan';
import { makeName, splitName } from './names';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export type RomanceAction = 'pursue' | 'giveUp' | 'gift' | 'confess' | 'wed' | 'child';

export function affinityTier(content: Content, affinity: number): string {
  let name = content.romance.tiers[0].name;
  for (const t of content.romance.tiers) if (affinity >= t.min) name = t.name;
  return name;
}

/** Why the player cannot take part in romance now, or null. */
export function romanceBlocked(state: GameState, content: Content): string | null {
  if (!state.alive) return 'Đã mất';
  if (state.character.age < content.balance.romance.minAge) return `Cần ${content.balance.romance.minAge} tuổi`;
  if (state.cult.lineage === 'phat') return 'Phật đạo kiêng tình duyên';
  return null;
}

/** An NPC who can be courted or loved: alive and of age. */
function ofAge(content: Content, n: Npc | undefined): n is Npc {
  return !!n && n.alive && n.age >= content.balance.romance.minAge;
}

/** Lover, partner, or the partner if there is one (else the lover). */
export function romanceTarget(state: GameState, target: 'lover' | 'partner' | 'beloved' | 'ex'): Npc | undefined {
  const r = state.romance;
  if (target === 'ex') return [...r.exes].reverse().map((id) => npcById(state, id)).find((n) => n?.alive);
  const id = target === 'lover' ? r.lover : target === 'partner' ? r.partner : r.partner ?? r.lover;
  return npcById(state, id);
}

/** Event conditions on romance (see ConditionsSchema.romance). */
export function romanceMeets(state: GameState, c: NonNullable<GameEvent['conditions']['romance']>, content: Content): boolean {
  if (romanceBlocked(state, content)) return false;
  const r = state.romance;
  const lover = npcById(state, r.lover);
  const partner = npcById(state, r.partner);
  if (c.lover !== undefined && ofAge(content, lover) !== c.lover) return false;
  if (c.couple !== undefined && (ofAge(content, lover) && r.couple) !== c.couple) return false;
  if (c.partner !== undefined && ofAge(content, partner) !== c.partner) return false;
  if (c.ex !== undefined && r.exes.some((id) => ofAge(content, npcById(state, id))) !== c.ex) return false;
  if (c.target) {
    const t = romanceTarget(state, c.target);
    if (!ofAge(content, t)) return false;
    if (c.minAffinity !== undefined && t.affinity < c.minAffinity) return false;
    if (c.maxAffinity !== undefined && t.affinity > c.maxAffinity) return false;
    if (c.targetRooted !== undefined && t.root !== c.targetRooted) return false;
  }
  return true;
}

/** Event effects on romance, applied to the event's NPC. */
export function applyRomance(
  state: GameState, content: Content, npcId: string | null,
  fx: { pursue?: boolean; lose?: boolean; couple?: boolean; rival?: number; rivalExposed?: boolean; marry?: { affinity?: number }; partnerProgress?: number; loverAffinity?: number },
): GameState {
  let s = state;
  // Task 3.7: a match (political or not) with the event's NPC; the progress of the đạo lữ.
  if (fx.marry && npcId && !s.romance.partner && !romanceBlocked(s, content) && ofAge(content, npcById(s, npcId))) {
    s = wed(s, npcId);
    if (fx.marry.affinity !== undefined) s = { ...s, npcs: s.npcs.map((n) => (n.id === npcId ? { ...n, affinity: clamp(fx.marry!.affinity!) } : n)) };
  }
  if (fx.partnerProgress && s.romance.partner) {
    const id = s.romance.partner;
    s = { ...s, npcs: s.npcs.map((n) => (n.id === id && n.realm !== 'pham_nhan' ? { ...n, progress: Math.max(0, n.progress + fx.partnerProgress!) } : n)) };
  }
  const beloved = romanceTarget(s, 'beloved');
  if (fx.loverAffinity && beloved?.alive) s = changeNpc(s, content, beloved.id, { affinity: fx.loverAffinity });
  state = s;
  let r = state.romance;
  if (fx.pursue && npcId && !r.lover && !r.partner && !romanceBlocked(state, content) && ofAge(content, npcById(state, npcId))) {
    r = { ...r, lover: npcId, couple: false, exes: r.exes.filter((x) => x !== npcId) };
  }
  if (fx.couple && npcId && r.lover === npcId) r = { ...r, couple: true };
  if (fx.rival) r = { ...r, rivals: Math.max(0, r.rivals + fx.rival) };
  if (fx.rivalExposed) r = { ...r, rivals: 0 };
  if (fx.lose && npcId) r = loseRomance(r, npcId);
  return { ...state, romance: r };
}

function wed(state: GameState, id: string): GameState {
  const r = state.romance;
  return { ...state, romance: { ...r, partner: id, lover: r.lover === id ? null : r.lover, couple: r.lover === id ? false : r.couple, rivals: 0 } };
}

function loseRomance(r: GameState['romance'], id: string): GameState['romance'] {
  if (r.lover === id) return { ...r, lover: null, couple: false, rivals: 0, exes: r.exes.includes(id) ? r.exes : [...r.exes, id] };
  if (r.partner === id) return { ...r, partner: null, exes: r.exes.includes(id) ? r.exes : [...r.exes, id] };
  return r;
}

export interface RomanceView {
  action: RomanceAction;
  label: string;
  /** Cost text, if any. */
  cost: string | null;
  blocked: string | null;
}

function giftCost(state: GameState, content: Content): { silver: number; stones: number } {
  const b = content.balance.romance;
  return state.cult.realm === 'pham_nhan' ? { silver: b.giftSilver, stones: 0 } : { silver: 0, stones: b.giftStones };
}

/** What the player can do with this NPC now (empty when romance is out of the question). */
export function romanceViews(state: GameState, content: Content, npcId: string): RomanceView[] {
  const n = npcById(state, npcId);
  if (romanceBlocked(state, content) || !ofAge(content, n)) return [];
  const r = state.romance;
  const b = content.balance.romance;
  const doneThisYear = (a: RomanceAction) => r.lastActions[a] === state.character.age;
  if (r.partner === npcId) {
    const birth = birthBlocked(state, content, n);
    return [{ action: 'child', label: sameGender(state, n) ? 'Nhận con nuôi' : 'Sinh con', cost: null, blocked: doneThisYear('child') ? 'Năm nay đã thử' : birth }];
  }
  if (r.lover !== npcId) {
    if (r.partner || r.exes.includes(npcId)) return [];
    return [{ action: 'pursue', label: 'Theo đuổi', cost: null, blocked: r.lover ? 'Đang theo đuổi người khác' : null }];
  }
  const cost = giftCost(state, content);
  const poor = state.money.silver < cost.silver || state.money.spiritStones < cost.stones;
  const views: RomanceView[] = [
    {
      action: 'gift', label: 'Tặng quà',
      cost: cost.stones ? `${cost.stones} linh thạch` : `${cost.silver} bạc`,
      blocked: doneThisYear('gift') ? 'Năm nay đã tặng' : poor ? 'Không đủ tiền' : null,
    },
  ];
  if (r.couple && !r.partner) {
    const wedCost = weddingCost(state, content);
    const short = state.money.silver < wedCost.silver || state.money.spiritStones < wedCost.stones;
    views.push({
      action: 'wed', label: state.cult.realm === 'pham_nhan' ? 'Thành thân' : 'Đạo lữ đại điển',
      cost: wedCost.stones ? `${wedCost.stones} linh thạch` : `${wedCost.silver} bạc`,
      blocked: short ? 'Không đủ tiền' : null,
    });
  }
  if (!r.couple) {
    views.push({
      action: 'confess', label: 'Tỏ tình', cost: null,
      blocked: doneThisYear('confess') ? 'Năm nay đã nói' : n.affinity < b.confessAt ? `Cần thiện cảm ${b.confessAt}` : null,
    });
  }
  views.push({ action: 'giveUp', label: r.couple ? 'Chia tay' : 'Thôi theo đuổi', cost: null, blocked: null });
  return views;
}

export function confessChance(state: GameState, content: Content, n: Npc): number {
  const b = content.balance.romance;
  const p = b.confessBase + (n.affinity - b.confessAt) * b.confessPerAffinity + (state.stats.charm - 50) * b.confessPerCharm;
  return Math.max(b.confessMin, Math.min(b.confessMax, p));
}

/** Do one romance action; returns the new state and the log line. */
export function romanceAction(state: GameState, content: Content, npcId: string, action: RomanceAction): { state: GameState; text: string; tone: Tone } {
  const view = romanceViews(state, content, npcId).find((v) => v.action === action);
  const n = npcById(state, npcId);
  if (!view || view.blocked || !n) return { state, text: '', tone: 'normal' };
  const b = content.balance.romance;
  const t = content.romance.texts;
  const rng = Rng.fromState(state.rng);
  const fill = (text: string) => text.replace(/\{npc\}/g, n.name).replace(/\{name\}/g, state.character.name);
  let s: GameState = { ...state, romance: { ...state.romance, lastActions: { ...state.romance.lastActions, [action]: state.character.age } } };
  const lines: LogLine[] = [];

  if (action === 'pursue') {
    s = applyRomance(s, content, npcId, { pursue: true });
    lines.push({ text: fill(t.pursue), tone: 'normal' });
  } else if (action === 'giveUp') {
    s = { ...s, romance: loseRomance(s.romance, npcId) };
    lines.push({ text: fill(t.giveUp), tone: 'normal' });
  } else if (action === 'gift') {
    const cost = giftCost(s, content);
    s = { ...s, money: { ...s.money, silver: s.money.silver - cost.silver, spiritStones: s.money.spiritStones - cost.stones } };
    if (n.affinity < b.rejectBelow && rng.chance(b.rejectChance)) {
      s = changeNpc(s, content, npcId, { affinity: b.rejectAffinity });
      lines.push({ text: fill(t.giftRejected), tone: 'bad' });
    } else {
      const gain = rng.int(b.giftAffinity[0], b.giftAffinity[1]) + Math.max(0, (s.stats.charm - 50) / b.giftCharmDivisor);
      s = changeNpc(s, content, npcId, { affinity: gain });
      lines.push({ text: fill(t.gift), tone: 'good' });
      // A kind face over a greedy heart: the lover takes more than a gift.
      if (isMasked(content, n) && rng.chance(b.usedChance)) {
        const silver = Math.min(s.money.silver, cost.silver ? b.usedSilver : 0);
        const stones = Math.min(s.money.spiritStones, cost.stones ? b.usedStones : 0);
        s = { ...s, money: { ...s.money, silver: s.money.silver - silver, spiritStones: s.money.spiritStones - stones } };
        lines.push({ text: fill(t.used), tone: 'bad' });
      }
    }
  } else if (action === 'wed') {
    const cost = weddingCost(s, content);
    s = wed({ ...s, money: { ...s.money, silver: s.money.silver - cost.silver, spiritStones: s.money.spiritStones - cost.stones } }, npcId);
    s = { ...s, stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.weddingHappiness) } };
    lines.push({ text: fill(state.cult.realm === 'pham_nhan' ? t.wedMortal : t.wedCultivator), tone: 'rare' });
  } else if (action === 'child') {
    const adopt = sameGender(s, n);
    if (adopt || rng.chance(birthChance(s, content, n))) {
      const child = makeChild(s, content, n, rng, adopt);
      s = { ...s, family: [...s.family, child], stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.childHappiness) } };
      lines.push({ text: fill(adopt ? t.adopt : t.child).replace(/\{child\}/g, child.name), tone: 'good' });
    } else {
      lines.push({ text: fill(t.noChild), tone: 'normal' });
    }
  } else if (action === 'confess') {
    if (rng.chance(confessChance(s, content, n))) {
      s = { ...s, romance: { ...s.romance, couple: true }, stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.confessHappiness) } };
      lines.push({ text: fill(t.confessYes), tone: 'good' });
    } else {
      s = changeNpc(s, content, npcId, { affinity: b.rejectAffinity * 2 });
      s = {
        ...s,
        stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.rejectHappiness) },
        aptitudes: { ...s.aptitudes, daoHeart: clamp(s.aptitudes.daoHeart + b.rejectDaoHeart) },
      };
      lines.push({ text: fill(t.confessNo), tone: 'bad' });
    }
  }
  s = { ...s, rng: rng.getState() };
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { state: { ...s, log }, text: lines.map((l) => l.text).join(' '), tone: lines[0]?.tone ?? 'normal' };
}

function weddingCost(state: GameState, content: Content): { silver: number; stones: number } {
  const b = content.balance.romance;
  return state.cult.realm === 'pham_nhan' ? { silver: b.weddingSilver, stones: 0 } : { silver: 0, stones: b.weddingStones };
}

function sameGender(state: GameState, n: Npc): boolean {
  return state.character.gender === n.gender;
}

function childCount(state: GameState): number {
  return state.family.filter((r) => r.role === 'child').length;
}

/** Why no child can come this year, or null. Same-gender couples adopt. */
function birthBlocked(state: GameState, content: Content, partner: Npc): string | null {
  const b = content.balance.romance;
  if (childCount(state) >= b.maxChildren) return 'Đã đủ con';
  if (sameGender(state, partner)) return null;
  const mother = state.character.gender === 'nu'
    ? { age: state.character.age, cultivator: state.cult.realm !== 'pham_nhan' }
    : { age: partner.age, cultivator: partner.realm !== 'pham_nhan' };
  if (mother.age > (mother.cultivator ? b.cultivatorMotherMaxAge : b.motherMaxAge)) return 'Đã qua tuổi sinh nở';
  return null;
}

/** Chance of a child this year: cultivators conceive less often. */
export function birthChance(state: GameState, content: Content, partner: Npc): number {
  const b = content.balance.romance;
  const cultivators = Number(state.cult.realm !== 'pham_nhan') + Number(partner.realm !== 'pham_nhan');
  return b.birthChance * b.cultivatorFertility ** cultivators;
}

/**
 * A child's spirit root (task 3.7): each rooted parent adds rolls (keep the best), elements lean
 * to the player's, a special body may pass on, and a rare mutation gives a variant root.
 */
export function inheritRoot(state: GameState, content: Content, partner: Npc | null, rng: Rng): SpiritRoot {
  const b = content.balance.romance;
  const mine = state.cult.root;
  const rooted = Number(!!mine && (content.balance.roots.gradeSpeed[mine.grade] ?? 0) > 0) + Number(!!partner?.root);
  if (mine?.body && rng.chance(b.bodyInheritChance)) return { ...mine };
  if (rooted > 0 && rng.chance(b.mutationChance)) {
    const variants = content.cultivation.roots.elements.filter((e) => e.variant);
    if (variants.length > 0) return { grade: 'bien_di', elements: [rng.pick(variants).id], body: null };
  }
  // Gia quy Trọng tu luyện adds rolls (task 5.4).
  const root = rollRoot(rng, content, 1 + rooted * b.rootRollsPerParent + clanRootRolls(state, content));
  const own = (mine?.elements ?? []).filter((e) => !root.elements.includes(e));
  if (root.body || root.elements.length === 0 || own.length === 0 || root.grade === 'bien_di') return root;
  // Keep the count, take the player's elements first.
  const pool = [...(mine?.elements ?? []), ...root.elements.filter((e) => !(mine?.elements ?? []).includes(e))];
  return { ...root, elements: pool.slice(0, root.elements.length) };
}

function makeChild(state: GameState, content: Content, partner: Npc, rng: Rng, adopted: boolean): Relative {
  const gender = rng.chance(0.5) ? 'nam' : 'nu';
  const father = state.character.gender === 'nam' ? state.character.name : partner.gender === 'nam' ? partner.name : state.character.name;
  const { surname } = splitName(father, content.names);
  const name = makeName(rng, content.names, gender, { surname, taken: [state.character.name, partner.name, ...state.family.map((r) => r.name)] });
  const root = adopted ? rollRoot(rng, content, 1) : inheritRoot(state, content, partner, rng);
  const l = content.balance.lifespan;
  const usable = (content.balance.roots.gradeSpeed[root.grade] ?? 0) > 0;
  // A child with a usable root grows up to cultivate and lives about as long as a Luyện Khí cultivator.
  const lifespan = usable ? content.balance.realms.luyen_khi?.lifespan ?? l.mortalBase : l.mortalBase + rng.int(-l.mortalVariance, l.mortalVariance);
  return {
    id: `child_${childCount(state)}_${state.character.age}`,
    role: 'child', gender, name, age: 0, alive: true, lifespan,
    affinity: rng.int(content.balance.family.affinityStart[0], content.balance.family.affinityStart[1]),
    lastActions: {},
    root,
  };
}

/** Yearly: rivals cool the lover; a lover or partner who died is mourned and let go. */
export function romanceYear(state: GameState, content: Content): GameState {
  const b = content.balance.romance;
  const t = content.romance.texts;
  let s = state;
  const lines: LogLine[] = [];
  for (const id of [s.romance.lover, s.romance.partner]) {
    const n = npcById(s, id);
    if (!id || !n || n.alive) continue;
    s = {
      ...s,
      romance: { ...s.romance, lover: s.romance.lover === id ? null : s.romance.lover, couple: s.romance.lover === id ? false : s.romance.couple, partner: s.romance.partner === id ? null : s.romance.partner },
      stats: { ...s.stats, happiness: clamp(s.stats.happiness + b.griefHappiness) },
    };
    lines.push({ text: t.died.replace(/\{npc\}/g, n.name), tone: 'bad' });
  }
  if (s.romance.lover && s.romance.rivals > 0) s = changeNpc(s, content, s.romance.lover, { affinity: b.rivalAffinityPerYear * s.romance.rivals });
  // Task 3.7: children meet the root test at the same age as the player once did.
  const testAge = content.balance.roots.testAge[0];
  for (const c of s.family) {
    if (c.role !== 'child' || !c.alive || c.age !== testAge || !c.root) continue;
    const usable = (content.balance.roots.gradeSpeed[c.root.grade] ?? 0) > 0;
    const text = (usable ? t.childRoot : t.childNoRoot).replace(/\{child\}/g, c.name).replace(/\{age\}/g, String(c.age)).replace(/\{root\}/g, rootName(c.root, content));
    lines.push({ text, tone: usable ? 'rare' : 'normal' });
  }
  if (lines.length === 0) return s;
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...s, log };
}

/** Label for the Người quen tab: Người trong lòng / Người yêu / Người cũ, plus the affinity tier. */
export function romanceLabel(state: GameState, content: Content, n: Npc): { role: string | null; tier: string } {
  const r = state.romance;
  const l = content.romance.labels;
  const role = r.partner === n.id ? (state.cult.realm === 'pham_nhan' ? l.spouse : l.partner)
    : r.lover === n.id ? (r.couple ? l.couple : l.lover) : r.exes.includes(n.id) ? l.ex : null;
  return { role, tier: affinityTier(content, n.affinity) };
}

/** "Linh căn: …" for a child old enough to have been tested, else null. */
export function childRootLabel(content: Content, r: Relative): string | null {
  if (r.role !== 'child' || !r.root || r.age < content.balance.roots.testAge[0]) return null;
  return `Linh căn: ${rootName(r.root, content)}`;
}
