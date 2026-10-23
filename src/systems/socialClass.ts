// 15.1 Giai cấp: who a life is in the world's order (hoàng tộc … bần dân), from character/classes.json. A life is born
// into its origin's class; `character.classId` holds a class it rose or fell into later. Activities, events, jobs and
// schools name the classes they belong to (conditions classes / notClasses, balance.classes in standing.ts).
import type { Content } from '../core/content';
import type { SocialClass } from '../core/schemas';
import type { GameState } from '../core/types';

/** The life's giai cấp now (null when the world has none). Read lazily, so older saves need no migration. */
export function classOf(state: GameState, content?: Content): string | null {
  if (state.character.classId) return state.character.classId;
  return content?.origins.find((o) => o.id === state.character.originId)?.class ?? null;
}

export const classDef = (content: Content, id: string | null | undefined): SocialClass | undefined =>
  id ? content.classes?.find((c) => c.id === id) : undefined;

/** Rise or fall into another class (the origin's class clears the override). */
export function setClass(state: GameState, content: Content, id: string): GameState {
  if (!classDef(content, id)) return state;
  const born = content.origins.find((o) => o.id === state.character.originId)?.class;
  const { classId: _old, ...character } = state.character;
  return { ...state, character: id === born ? character : { ...character, classId: id } };
}

/**
 * 15.4 Bổng lộc: a tông thất or thế gia child draws a yearly allowance (balance.classStipend) instead of working, while
 * a mortal, free, not on the throne, and (hoàng tộc) while the house still rules. A ledger line in the year's block.
 */
export function stipendYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.classStipend;
  const cls = classOf(state, content);
  const silver = cls ? cfg?.silver[cls] ?? 0 : 0;
  if (!cfg || !cls || silver <= 0 || !state.alive || state.character.age < cfg.fromAge) return state;
  if (state.cult.realm !== 'pham_nhan' || state.reign || state.law?.jail) return state;
  const t = state.times;
  if (cls === 'hoang_toc' && t && t.eras[0] && t.eras[0].dynasty !== t.dynasty) return state;
  const text = classDef(content, cls)?.stipendText?.replace('{silver}', String(silver));
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (text && last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'normal', ledger: true }] };
  return { ...state, money: { ...state.money, silver: state.money.silver + silver }, log };
}

/**
 * 15.5 Cải trang vi hành: the life as the activity sees it. In disguise (balance.classDisguise.flag) a hoàng tộc or
 * quyền quý does the listed commoner activities (hội chợ, lôi đài…) as a commoner would, words and all.
 */
export function seenAs(state: GameState, content: Content, activityId: string): GameState {
  const d = content.balance.classDisguise;
  if (!d || !state.flags[d.flag] || !d.activityIds.includes(activityId)) return state;
  const cls = classOf(state, content);
  return cls && d.classes.includes(cls) ? { ...state, character: { ...state.character, classId: d.as } } : state;
}

/** The giai cấp's year: the disguise of last year is put away, the bổng lộc is paid. */
export function classYear(state: GameState, content: Content): GameState {
  const flag = content.balance.classDisguise?.flag;
  const s = flag && state.flags[flag] ? { ...state, flags: { ...state.flags, [flag]: false } } : state;
  return stipendYear(s, content);
}
