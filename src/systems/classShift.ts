// 15.11 Đổi giai cấp: a life is not stuck where it was born. Each year the rules of character/class-shifts.json are
// read in order (a farmer with a shop becomes a merchant, an official's house a quan gia, a ruined one bần dân…);
// the first that holds moves the life, at most once every balance.classShift.gap years. A hoàng tộc whose dynasty
// fell is the tiền triều's, no longer the court's. Events move it too (effect setClass).
import type { Content } from '../core/content';
import type { GameState, LogLine } from '../core/types';
import { meets } from './events/conditions';
import { classDef, classOf, houseFell, setClass, stipendYear } from './socialClass';

function pushLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Into another giai cấp with its line ("{class}" = the new class's name). */
export function shiftClass(state: GameState, content: Content, to: string, text: string, tone: LogLine['tone']): GameState {
  const def = classDef(content, to);
  if (!def || classOf(state, content) === to) return state;
  return pushLine(setClass(state, content, to), { text: text.replace(/\{class\}/g, def.name), tone });
}

/** The year's shift, if any. */
export function classShiftYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.classShift;
  const cls = classOf(state, content);
  if (!cfg || !cls || !state.alive) return state;
  if (state.character.age - (state.character.classSince ?? -Infinity) < cfg.gap) return state;
  if (cls === 'hoang_toc' && !state.reign && houseFell(state)) {
    const text = content.classShifts?.texts.fallen;
    return text ? shiftClass(state, content, cfg.dynastyFall, text, 'bad') : state;
  }
  const rule = (content.classShifts?.shifts ?? []).find((r) => r.to !== cls && (r.from.length === 0 || r.from.includes(cls)) && meets(state, r.when, content));
  return rule ? shiftClass(state, content, rule.to, rule.text, rule.tone) : state;
}

/** The giai cấp's year: the disguise of last year is put away, the class may shift, the bổng lộc is paid. */
export function classYear(state: GameState, content: Content): GameState {
  const flag = content.balance.classDisguise?.flag;
  const s = flag && state.flags[flag] ? { ...state, flags: { ...state.flags, [flag]: false } } : state;
  return stipendYear(classShiftYear(s, content), content);
}

/** Effect setClass (an event moves the life): the class's line follows the event's own text. */
export function eventSetClass(state: GameState, content: Content, to: string): GameState {
  const text = content.classShifts?.texts.changed;
  return text ? shiftClass(state, content, to, text, 'rare') : setClass(state, content, to);
}
