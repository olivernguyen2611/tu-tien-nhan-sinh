// Góp ý 23/10: a phàm nhân sees nothing of the tu tiên world (linh căn, linh thạch, tu vi, Tu luyện, Tông môn)
// until it is theirs: tested for a root, or in the Dao. Nhập đạo (the first cultivation, which takes Luyện Khí)
// opens it all, and the phàm gian giang hồ (võ lâm fame, thế lực, minh chủ) steps back from the profile.
import type { Content } from '../core/content';
import type { GameState } from '../core/types';
import { rootUsable } from './cultivation';

/** In the Dao (Luyện Khí or higher). */
export const inDao = (state: GameState): boolean => state.cult.realm !== 'pham_nhan';

/** A root that can cultivate and a scroll in hand: the Tu luyện sheet opens so the first cultivation can be pressed. */
export const daoReady = (state: GameState, content: Content): boolean =>
  !inDao(state) && rootUsable(state, content) && (state.cult.scrolls.length > 0 || !!state.cult.technique);

export interface DaoView {
  /** Linh căn and thể chất lines. */
  root: boolean;
  /** The linh thạch purse. */
  stones: boolean;
  /** The tu vi bar. */
  cultivation: boolean;
  /** Giang hồ, thế lực and võ lâm lines (phàm gian). */
  jianghu: boolean;
}

export function daoView(state: GameState): DaoView {
  const dao = inDao(state);
  return { root: dao || state.cult.root !== null, stones: dao || state.money.spiritStones > 0, cultivation: dao, jianghu: !dao };
}
