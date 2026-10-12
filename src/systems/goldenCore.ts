// Kết đan (task 4.2): forming the golden core is played out in three rounds.
// Each round offers a few qi strands (elements); the one placed adds purity when
// it matches the root, flows from the last strand (Ngũ hành tương sinh) or matches
// the technique, and cracks the core when it clashes with the last one. Purity
// sets the grade (Nhất phẩm best … Cửu phẩm) and adds to the breakthrough chance;
// too many cracks shatter the core (a failed big breakthrough). Numbers in
// balance.coreForming, texts in realms.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { CorePattern } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { majorFailure, majorSuccess, type BreakthroughResult } from './cultivation';
import { currentTechnique } from './technique';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function elementName(content: Content, id: string): string {
  return content.cultivation.roots.elements.find((e) => e.id === id)?.name ?? id;
}

/** Strands for one round: distinct basic elements, sometimes one variant. */
function drawStrands(content: Content, rng: Rng): string[] {
  const cfg = content.balance.coreForming;
  const all = content.cultivation.roots.elements;
  const basic = all.filter((e) => !e.variant).map((e) => e.id);
  const variants = all.filter((e) => e.variant).map((e) => e.id);
  const out: string[] = [];
  while (out.length < Math.min(cfg.offered, basic.length)) {
    const e = rng.pick(basic);
    if (!out.includes(e)) out.push(e);
  }
  if (variants.length > 0 && rng.chance(cfg.variantChance)) out[rng.int(0, out.length - 1)] = rng.pick(variants);
  return out;
}

/** Start kết đan (called by attemptMajorBreakthrough when the next realm is Kim Đan). */
export function startCoreForming(state: GameState, content: Content, chancePct: number): GameState {
  const cfg = content.balance.coreForming;
  const rng = Rng.fromState(state.rng);
  const purity = cfg.startPurity
    + (state.aptitudes.comprehension - 50) * cfg.comprehensionPerPoint
    + (state.cult.foundation ? cfg.foundationBonus[state.cult.foundation] ?? 0 : 0);
  const forming = { round: 0, offered: drawStrands(content, rng), placed: [], purity: clamp(purity), cracks: 0, chancePct };
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, { text: content.cultivation.realms.texts.coreStart, tone: 'normal' }] };
  return { ...state, rng: rng.getState(), log, cult: { ...state.cult, coreForming: forming } };
}

export type StrandKind = 'root' | 'flow' | 'technique' | 'clash' | 'plain';

export interface StrandView {
  element: string;
  name: string;
  /** Purity change and whether it cracks the core. */
  purity: number;
  crack: boolean;
  kind: StrandKind;
}

/** What placing this strand would do (shown on the buttons). */
export function strandEffect(state: GameState, content: Content, element: string): StrandView {
  const cfg = content.balance.coreForming;
  const f = state.cult.coreForming;
  const prev = f?.placed.at(-1);
  const elements = content.cultivation.roots.elements;
  const beats = (a: string, b: string) => elements.find((e) => e.id === a)?.beats.includes(b) ?? false;
  const view = { element, name: elementName(content, element) };
  if (prev && (beats(prev, element) || beats(element, prev))) return { ...view, purity: cfg.clashPurity, crack: true, kind: 'clash' };
  const rooted = state.cult.root?.elements.includes(element) ?? false;
  const flows = !!prev && cfg.generates[prev] === element;
  const tech = currentTechnique(state, content);
  const techMatch = !!tech && Array.isArray(tech.elements) && tech.elements.includes(element);
  const purity = cfg.baseGain + (rooted ? cfg.rootMatch : 0) + (flows ? cfg.flow : 0) + (techMatch ? cfg.techniqueMatch : 0);
  return { ...view, purity, crack: false, kind: rooted ? 'root' : flows ? 'flow' : techMatch ? 'technique' : 'plain' };
}

export function coreGradeFor(content: Content, purity: number): number {
  const t = content.balance.coreForming.gradeThresholds;
  const i = t.findIndex((min) => purity >= min);
  return i === -1 ? 9 : i + 1;
}

/** Breakthrough chance with the purity's bonus, as shown during kết đan. */
export function coreChancePct(state: GameState, content: Content): number {
  const f = state.cult.coreForming;
  if (!f) return 0;
  const b = content.balance.cultivation.breakthrough;
  const pct = f.chancePct + (f.purity - 50) * content.balance.coreForming.purityChancePerPoint;
  return Math.max(b.minPct, Math.min(b.maxPct, pct));
}

/**
 * The đan văn a finished core takes from the strands placed: the first entry of
 * core-patterns.json whose rule fits (cracked, all flowing, all one element, a
 * variant strand, then the element placed most, ties going to the later strand).
 */
export function corePatternFor(content: Content, placed: string[], cracks: number): CorePattern | null {
  const gen = content.balance.coreForming.generates;
  const allFlow = placed.length > 1 && placed.every((e, i) => i === 0 || gen[placed[i - 1]] === e);
  const allSame = placed.length > 1 && placed.every((e) => e === placed[0]);
  const variants = content.cultivation.roots.elements.filter((e) => e.variant).map((e) => e.id);
  const variant = [...placed].reverse().find((e) => variants.includes(e));
  const count = (e: string) => placed.filter((x) => x === e).length;
  const main = [...placed].reverse().reduce<string | undefined>((best, e) => (best === undefined || count(e) > count(best) ? e : best), undefined);
  return content.corePatterns.find(({ when: w }) =>
    (w.cracked === undefined || (cracks > 0) === w.cracked)
    && (w.allFlow === undefined || allFlow === w.allFlow)
    && (w.allSame === undefined || allSame === w.allSame)
    && (w.variant === undefined || variant === w.variant)
    && (w.element === undefined || main === w.element)) ?? null;
}

/** Place one of the offered strands; after the last round the core forms or shatters. */
export function placeStrand(state: GameState, content: Content, element: string): { state: GameState; result: BreakthroughResult | null } {
  const f = state.cult.coreForming;
  if (!f || !f.offered.includes(element)) return { state, result: null };
  const cfg = content.balance.coreForming;
  const texts = content.cultivation.realms.texts;
  const effect = strandEffect(state, content, element);
  const textByKind = { root: texts.coreRoot, flow: texts.coreFlow, technique: texts.corePlain, clash: texts.coreClash, plain: texts.corePlain };
  const line: LogLine = { text: textByKind[effect.kind].replaceAll('{element}', effect.name), tone: effect.crack ? 'bad' : 'normal' };
  const rng = Rng.fromState(state.rng);
  const next = {
    ...f,
    round: f.round + 1,
    placed: [...f.placed, element],
    purity: clamp(f.purity + effect.purity),
    cracks: f.cracks + (effect.crack ? 1 : 0),
  };
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  let s: GameState = { ...state, log, cult: { ...state.cult, coreForming: { ...next, offered: next.round < cfg.rounds ? drawStrands(content, rng) : [] } } };
  if (next.cracks < cfg.crackLimit && next.round < cfg.rounds) return { state: { ...s, rng: rng.getState() }, result: null };

  // The end: shattered by cracks, or the breakthrough roll with the purity's bonus.
  const chance = coreChancePct(s, content);
  s = { ...s, cult: { ...s.cult, coreForming: null } };
  const target = content.cultivation.realms.realms.find((r) => r.id === cfg.realm)!;
  if (next.cracks >= cfg.crackLimit) {
    const shattered = majorFailure(state, s, content, rng, texts.coreShattered);
    return { state: shattered.state, result: shattered };
  }
  const result = rng.chance(chance / 100)
    ? majorSuccess(state, s, content, rng, { id: target.id, name: target.name }, coreGradeFor(content, next.purity))
    : majorFailure(state, s, content, rng);
  // Đan văn: the strands leave their mark on a core that formed.
  const pattern = result.success ? corePatternFor(content, next.placed, next.cracks) : null;
  if (pattern) {
    const formed = result.state;
    const log = formed.log.slice();
    const at = log[log.length - 1];
    const line: LogLine = { text: texts.corePattern.replaceAll('{pattern}', pattern.name).replaceAll('{text}', pattern.text), tone: 'rare' };
    log[log.length - 1] = { ...at, lines: [...at.lines, line] };
    const withPattern: GameState = { ...formed, log, cult: { ...formed.cult, corePattern: pattern.id } };
    return { state: withPattern, result: { ...result, state: withPattern, text: `${result.text} ${line.text}` } };
  }
  return { state: result.state, result };
}
