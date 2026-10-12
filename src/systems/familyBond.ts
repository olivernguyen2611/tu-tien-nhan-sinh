// Gia đạo (backlog 2): what a parent or spouse can do with a child or the đạo lữ beyond a chat:
// luận bàn (spar), luận đạo (discuss the Way), truyền công pháp (teach a technique they know)
// and tặng vật phẩm (gift). Each is once a year per person. Gifting a thousand-year spirit
// item to someone without a root may open a hậu thiên linh căn: roots stay innate, so it is a
// rare chance that needs such an item (balance.familyBond.rootGift), not a reward for effort.
// What a child learns carries to them if they take over the line (heir.ts). Numbers in
// balance.familyBond, texts in family-bond.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc, Relative, SpiritRoot, Tone } from '../core/types';
import { itemById, removeItems } from './items';
import { techniqueById, techniqueMatches } from './technique';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const between = (rng: Rng, [a, b]: readonly [number, number]) => rng.int(a, b);

export type BondAction = 'spar' | 'discuss' | 'teach' | 'gift';
export type BondTarget = { kind: 'child'; id: string } | { kind: 'partner' };

export interface BondOption { id: string; name: string; hint: string; group: string }
export interface BondActionView {
  id: BondAction;
  name: string;
  blocked: string | null;
  /** teach: techniques you know; gift: items you carry (grouped by kind). */
  options: BondOption[] | null;
}
export interface BondView {
  target: BondTarget;
  key: string;
  name: string;
  label: string;
  age: number;
  /** One line about their progress: root, insight, technique. */
  note: string;
  actions: BondActionView[];
}

const usableGrade = (content: Content, root: SpiritRoot | null | undefined) => !!root && (content.balance.roots.gradeSpeed[root.grade] ?? 0) > 0;

/** Can a hậu thiên linh căn still be opened for this child (rootless, tested, tries left)? */
function rootless(content: Content, r: Relative): boolean {
  return !!r.root && !r.bodyId && !usableGrade(content, r.root);
}

function child(state: GameState, id: string): Relative | undefined {
  return state.family.find((r) => r.id === id && r.role === 'child' && r.alive);
}

function partnerOf(state: GameState): Npc | undefined {
  return state.npcs.find((n) => n.id === state.romance.partner && n.alive);
}

const targetKey = (t: BondTarget) => (t.kind === 'child' ? `child:${t.id}` : 'partner');

function lastDone(state: GameState, t: BondTarget, action: BondAction): number | undefined {
  if (t.kind === 'child') return child(state, t.id)?.lastActions[`bond_${action}`];
  return partnerOf(state)?.lastBond?.[action];
}

/** Items the life carries, for the gift list. */
function giftOptions(state: GameState, content: Content, rootlessTarget: boolean): BondOption[] {
  const cfg = content.balance.familyBond;
  const kinds = content.lifeTexts.familyBond.kindNames;
  return Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .flatMap(([id]) => {
      const it = itemById(content, id);
      if (!it) return [];
      const root = cfg.rootGift.items[id];
      const hint = rootlessTarget && root !== undefined ? `có thể mở linh căn (${Math.round(root * 100)}%)` : (it.summary ?? '');
      return [{ id, name: it.name, hint, group: kinds[it.kind] ?? it.kind }];
    });
}

function teachOptions(state: GameState, content: Content, root: SpiritRoot | null | undefined, bodyId: string | null | undefined): BondOption[] {
  return state.cult.learned.flatMap((id) => {
    const t = techniqueById(content, id);
    if (!t) return [];
    const fits = techniqueMatches(t, root ?? null, content, bodyId ?? null);
    return [{ id, name: t.name, hint: fits ? 'hợp linh căn' : 'không hợp linh căn', group: content.cultivation.realms.gradeNames[t.grade] ?? t.grade }];
  });
}

function blockedFor(state: GameState, content: Content, t: BondTarget, action: BondAction, age: number, root: SpiritRoot | null | undefined, bodyId: string | null | undefined): string | null {
  const a = content.balance.familyBond.actions[action];
  if (!state.alive) return 'Đã hết một đời.';
  if (state.character.age < content.balance.familyBond.minPlayerAge) return `Đủ ${content.balance.familyBond.minPlayerAge} tuổi mới làm được.`;
  if (age < a.minAge) return `Còn quá nhỏ (từ ${a.minAge} tuổi).`;
  if (lastDone(state, t, action) === state.character.age) return 'Năm nay đã làm rồi.';
  if (action === 'discuss' && state.aptitudes.comprehension < (a.minComprehension ?? 0)) return `Cần Ngộ tính ${a.minComprehension ?? 0} mới luận đạo được.`;
  if (action === 'teach') {
    if (state.cult.learned.length === 0) return 'Ngươi chưa học công pháp nào để truyền.';
    if (!usableGrade(content, root) && !bodyId) return 'Chưa có linh căn thì chưa tu được công pháp.';
  }
  if (action === 'gift' && Object.values(state.inventory).every((n) => !n)) return 'Trong túi không có gì để tặng.';
  return null;
}

function describe(content: Content, r: Relative): string {
  const parts: string[] = [];
  if (r.root) parts.push(r.bodyId ? `thể chất ${content.cultivation.roots.bodies.find((b) => b.id === r.bodyId)?.name ?? r.bodyId}` : usableGrade(content, r.root) ? `${r.acquired ? 'hậu thiên ' : ''}linh căn ${content.cultivation.roots.grades.find((g) => g.id === r.root!.grade)?.name ?? r.root.grade}` : 'chưa có linh căn');
  if ((r.insight ?? 0) > 0) parts.push(`ngộ ${r.insight}/${content.balance.familyBond.insightMax}`);
  if (r.technique) parts.push(`biết ${techniqueById(content, r.technique)?.name ?? r.technique}`);
  return parts.join(' · ');
}

const ACTION_ORDER: BondAction[] = ['spar', 'discuss', 'teach', 'gift'];

/** Everyone the life can bond with now: living children, and the đạo lữ. */
export function bondViews(state: GameState, content: Content): BondView[] {
  if (!state.alive) return [];
  const names = content.lifeTexts.familyBond.actionNames;
  const out: BondView[] = [];
  for (const r of state.family.filter((x) => x.role === 'child' && x.alive)) {
    const t: BondTarget = { kind: 'child', id: r.id };
    out.push({
      target: t, key: targetKey(t), name: r.name, age: r.age,
      label: r.gender === 'nam' ? 'Con trai' : 'Con gái',
      note: r.root ? describe(content, r) : 'Chưa thử linh căn',
      actions: ACTION_ORDER.map((id) => ({
        id, name: names[id], blocked: blockedFor(state, content, t, id, r.age, r.root, r.bodyId),
        options: id === 'teach' ? teachOptions(state, content, r.root, r.bodyId) : id === 'gift' ? giftOptions(state, content, rootless(content, r)) : null,
      })),
    });
  }
  const p = partnerOf(state);
  if (p) {
    const t: BondTarget = { kind: 'partner' };
    const root: SpiritRoot | null = p.root ? { grade: 'ngu', elements: [] } : null;
    out.push({
      target: t, key: targetKey(t), name: p.name, age: p.age,
      label: p.gender === 'nam' ? 'Phu quân' : 'Phu nhân',
      note: p.root ? `${p.acquired ? 'hậu thiên ' : ''}tu sĩ` : 'phàm nhân',
      actions: ACTION_ORDER.map((id) => ({
        id, name: names[id],
        blocked: id === 'teach' && !p.root ? 'Phàm nhân chưa tu được công pháp.' : blockedFor(state, content, t, id, p.age, root, null),
        options: id === 'teach' ? teachOptions(state, content, null, null) : id === 'gift' ? giftOptions(state, content, !p.root) : null,
      })),
    });
  }
  return out;
}

export interface BondResult { state: GameState; text: string; tone: Tone }

function applyNumbers(state: GameState, effects: Record<string, number>): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [key, v] of Object.entries(effects)) {
    const k = key.slice(5);
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  return { ...state, stats, aptitudes };
}

function fill(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), text);
}

/** A rootless person given a thousand-year item: the chance of a hậu thiên linh căn, and what root it is. */
function tryAcquiredRoot(content: Content, itemId: string, rng: Rng): { ok: boolean; root: SpiritRoot | null } {
  const cfg = content.balance.familyBond.rootGift;
  const chance = cfg.items[itemId] ?? 0;
  if (!rng.chance(chance)) return { ok: false, root: null };
  const grade = rng.chance(cfg.tuChance) ? 'tu' : 'ngu';
  const basic = content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id);
  const count = content.balance.roots.elementCount[grade] ?? 5;
  const pool = basic.slice();
  const picked: string[] = [];
  while (picked.length < Math.min(count, basic.length)) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return { ok: true, root: { grade, elements: basic.filter((e) => picked.includes(e)) } };
}

/**
 * Do one bond action. `arg` is the technique id (teach) or item id (gift). The result is logged in
 * this year's block; nothing happens (empty text) when it is blocked.
 */
export function doBond(state: GameState, content: Content, target: BondTarget, action: BondAction, arg?: string): BondResult {
  const none: BondResult = { state, text: '', tone: 'normal' };
  const view = bondViews(state, content).find((v) => v.key === targetKey(target));
  const act = view?.actions.find((a) => a.id === action);
  if (!view || !act || act.blocked) return none;
  if ((action === 'teach' || action === 'gift') && !act.options?.some((o) => o.id === arg)) return none;
  const cfg = content.balance.familyBond;
  const a = cfg.actions[action];
  const texts = content.lifeTexts.familyBond.texts;
  const rng = Rng.fromState(state.rng);
  const c = target.kind === 'child' ? child(state, target.id)! : null;
  const p = target.kind === 'partner' ? partnerOf(state)! : null;
  const vars = { name: view.name, technique: action === 'teach' ? techniqueById(content, arg!)?.name ?? '' : '', item: action === 'gift' ? itemById(content, arg!)?.name ?? '' : '' };
  const affinity = between(rng, a.affinity);
  let insight = a.insight ?? 0;
  let tone: Tone = 'good';
  let line = fill(rng.pick(texts[target.kind][action]), vars);
  let next = state;
  let acquired: SpiritRoot | null = null;
  let attempted = false;

  if (action === 'teach') {
    const t = techniqueById(content, arg!)!;
    // The đạo lữ's elements are not tracked: a technique always suits them.
    const fits = c ? techniqueMatches(t, c.root ?? null, content, c.bodyId ?? null) : true;
    insight += fits ? a.matchBonus ?? 0 : 0;
    if (!fits) line += ` ${texts.mismatch}`;
  }
  if (action === 'gift') {
    const it = itemById(content, arg!)!;
    insight = a.insightByKind?.[it.kind] ?? 0;
    next = removeItems(next, [arg!]);
    const needsRoot = c ? rootless(content, c) : !!p && !p.root;
    const tries = c ? c.rootTries ?? 0 : p?.rootTries ?? 0;
    if (needsRoot && cfg.rootGift.items[arg!] !== undefined && tries < cfg.rootGift.maxTries) {
      attempted = true;
      const r = tryAcquiredRoot(content, arg!, rng);
      if (r.ok) {
        acquired = r.root;
        line = fill(rng.pick(texts.rootGift.success), { ...vars, root: content.cultivation.roots.grades.find((g) => g.id === r.root!.grade)?.name ?? r.root!.grade });
        tone = 'rare';
        insight += cfg.rootGift.insight;
      } else {
        line = fill(rng.pick(texts.rootGift.fail), vars);
        tone = 'bad';
        next = applyNumbers(next, { 'stat.happiness': cfg.rootGift.failHappiness });
      }
    }
  }

  const age = state.character.age;
  if (c) {
    next = {
      ...next,
      family: next.family.map((r) => {
        if (r.id !== c.id) return r;
        const upd: Relative = { ...r, affinity: clamp(r.affinity + affinity), insight: Math.min(cfg.insightMax, (r.insight ?? 0) + insight), lastActions: { ...r.lastActions, [`bond_${action}`]: age } };
        if (action === 'teach') upd.technique = arg!;
        if (attempted) upd.rootTries = (r.rootTries ?? 0) + 1;
        if (acquired) { upd.root = acquired; upd.acquired = true; }
        return upd;
      }),
    };
  } else if (p) {
    next = {
      ...next,
      npcs: next.npcs.map((n) => {
        if (n.id !== p.id) return n;
        const upd: Npc = { ...n, affinity: clamp(n.affinity + affinity), lastBond: { ...(n.lastBond ?? {}), [action]: age } };
        if (n.root) upd.progress = n.progress + (a.partnerProgress ?? 0);
        if (attempted) upd.rootTries = (n.rootTries ?? 0) + 1;
        if (acquired) { upd.root = true; upd.acquired = true; }
        return upd;
      }),
    };
  }
  next = applyNumbers({ ...next, rng: rng.getState() }, a.playerEffects);
  const log = next.log.slice();
  const last = log[log.length - 1];
  const entry: LogLine = { text: line, tone };
  if (last && last.age === age) log[log.length - 1] = { ...last, lines: [...last.lines, entry] };
  else log.push({ age, lines: [entry] });
  return { state: { ...next, log }, text: line, tone };
}

/** What a child carries into the heir's life: Ngộ tính from what they learned, and the technique they were taught. */
export function heirInsightBonus(content: Content, r: Relative): number {
  const cfg = content.balance.familyBond;
  return Math.min(cfg.insightAptitudeMax, Math.round((r.insight ?? 0) * cfg.insightAptitude));
}
