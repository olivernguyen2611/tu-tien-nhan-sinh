// Ngao du (6b.2): once a year, set cultivation aside to lift happiness. Cultivators pay in
// spirit stones, mortals in silver; an empty purse still allows a free walk with a smaller lift.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';

export interface LeisureView {
  /** Why the trip cannot happen now, or null. */
  blocked: string | null;
  /** What it costs, e.g. "3 linh thạch", or null when it is free. */
  cost: string | null;
}

const isCultivator = (state: GameState) => state.cult.realm !== 'pham_nhan';

export function leisureView(state: GameState, content: Content): LeisureView {
  const b = content.balance.leisure;
  let blocked: string | null = null;
  if (!state.alive) blocked = 'Đã qua đời.';
  else if (state.character.age < b.minAge) blocked = `Cần ${b.minAge} tuổi.`;
  else if (state.seclusion) blocked = 'Đang bế quan.';
  else if (state.extremes.lastLeisure === state.character.age) blocked = 'Năm nay đã đi ngao du rồi.';
  return { blocked, cost: paidCost(state, content) };
}

function paidCost(state: GameState, content: Content): string | null {
  const b = content.balance.leisure;
  if (isCultivator(state)) return state.money.spiritStones >= b.spiritStones ? `${b.spiritStones} linh thạch` : null;
  return state.money.silver >= b.silver ? `${b.silver} lượng bạc` : null;
}

export function goLeisure(state: GameState, content: Content): { state: GameState; text: string } | null {
  const view = leisureView(state, content);
  if (view.blocked) return null;
  const b = content.balance.leisure;
  const texts = content.lifeTexts.leisure;
  const rng = Rng.fromState(state.rng);
  const paid = view.cost !== null;
  const [lo, hi] = paid ? b.happiness : b.freeHappiness;
  const gain = rng.int(lo, hi);
  const text = rng.pick(paid ? texts.paid : texts.free);
  const money = !paid ? state.money
    : isCultivator(state) ? { ...state.money, spiritStones: state.money.spiritStones - b.spiritStones }
    : { ...state.money, silver: state.money.silver - b.silver };
  const daoHeart = state.stats.happiness <= b.daoHeartBelow ? Math.min(100, state.aptitudes.daoHeart + b.daoHeart) : state.aptitudes.daoHeart;
  const lines: LogLine[] = [{ text, tone: 'good' }];
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  const next: GameState = {
    ...state,
    rng: rng.getState(),
    money,
    stats: { ...state.stats, happiness: Math.min(100, state.stats.happiness + gain) },
    aptitudes: { ...state.aptitudes, daoHeart },
    extremes: { ...state.extremes, lastLeisure: state.character.age },
    log,
  };
  return { state: next, text };
}
