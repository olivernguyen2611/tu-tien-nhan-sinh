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
