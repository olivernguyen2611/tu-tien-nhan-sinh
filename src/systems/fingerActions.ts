// Kim Thủ Chỉ actions (playtest 2): what the player does with their finger from its own panel,
// e.g. ask the ring elder for advice, take a System quest, drink a drop from the vial.
// Each action needs a level and has a cooldown in years; content in golden-fingers.json (actions).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, Tone } from '../core/types';
import { applyOutcome, checkChance } from './events/engine';
import { fingerAwake, fingerDef } from './goldenFinger';
import { removeItems } from './items';
import { outcomeText } from './textPool';

export interface FingerActionView {
  id: string;
  name: string;
  text: string;
  /** Success chance when the action is a check. */
  chance: number | null;
  blocked: string | null;
}

export function fingerActionViews(state: GameState, content: Content): FingerActionView[] {
  const g = state.goldenFinger;
  const f = fingerDef(content, g?.id);
  if (!g || !f) return [];
  return f.actions.map((a) => {
    const last = g.used?.[a.id];
    const wait = last === undefined ? 0 : last + a.cooldownYears - state.character.age;
    return {
      id: a.id,
      name: a.name,
      text: a.text,
      chance: a.check ? checkChance(state, content, a.check.stat, a.check.difficulty) : null,
      blocked: !state.alive ? 'Đã hết một đời.'
        : state.character.age < content.balance.goldenFinger.actionMinAge ? 'Còn nhỏ quá, chưa hiểu chuyện.'
        : g.level === 0 && !fingerAwake(state, content, f) ? 'Còn đang ngủ say.'
        : g.level < a.minLevel ? `Cần thức tỉnh tới tầng "${f.levels[a.minLevel - 1].name}".`
        : a.needItem && !state.inventory[a.needItem] ? `Cần ${content.items.find((i) => i.id === a.needItem)?.name ?? a.needItem}.`
        : wait > 0 ? (a.cooldownYears === 1 ? 'Năm nay đã dùng rồi.' : `Còn ${wait} năm nữa.`)
        : null,
    };
  });
}

/** Use one action: a check (or a sure result), its effects, a log line, and the cooldown starts. */
export function doFingerAction(state: GameState, content: Content, actionId: string): { state: GameState; text: string; tone: Tone } | null {
  const view = fingerActionViews(state, content).find((v) => v.id === actionId);
  const action = fingerDef(content, state.goldenFinger?.id)?.actions.find((a) => a.id === actionId);
  if (!view || view.blocked || !action || !state.goldenFinger) return null;
  const rng = Rng.fromState(state.rng);
  const success = view.chance === null ? null : rng.chance(view.chance);
  const outcome = success === null ? action.result! : success ? action.success! : action.fail!;
  const used = { ...state.goldenFinger.used, [action.id]: state.character.age };
  const count = { ...state.goldenFinger.count, [action.id]: (state.goldenFinger.count?.[action.id] ?? 0) + 1 };
  let marked: GameState = { ...state, rng: rng.getState(), goldenFinger: { ...state.goldenFinger, used, count } };
  // 9.R3a: the price is paid whatever the result; the item is used up.
  if (action.needItem) marked = removeItems(marked, [action.needItem]);
  if (action.cost) marked = applyOutcome(marked, content, { text: '', effects: action.cost }, rng).state;
  const worded = outcomeText(marked, content, `finger.${action.id}.${success === false ? 'f' : 's'}`, outcome, rng);
  const r = applyOutcome(worded.state, content, { ...outcome, text: worded.text }, rng);
  const tone: Tone = success === false ? 'bad' : 'rare';
  const text = `${action.name}: ${r.text}`;
  const log = r.state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone }] };
  return { state: { ...r.state, log }, text, tone };
}

/** 9.R3a: once awake, the finger's yearly price (a drawback with `yearly`). */
export function goldenFingerYear(state: GameState, content: Content): GameState {
  const g = state.goldenFinger;
  const f = fingerDef(content, g?.id);
  if (!g || !f || g.level === 0 || !f.drawback?.yearly || !state.alive) return state;
  const rng = Rng.fromState(state.rng);
  const r = applyOutcome(state, content, { text: f.drawback.yearlyText ?? '', effects: f.drawback.yearly }, rng);
  let next: GameState = { ...r.state, rng: rng.getState() };
  if (f.drawback.yearlyText) {
    const log = next.log.slice();
    const last = log[log.length - 1];
    if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text: `${f.name}: ${r.text}`, tone: 'normal' }] };
    next = { ...next, log };
  }
  return next;
}
