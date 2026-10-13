// Động phủ linh mạch (6b.14): a place to spend spirit stones in mid-life. A cultivator rents a cave
// on a spirit vein for a lease of years; while it runs, cultivation is faster. The price grows
// with the realm (balance.caveRent), so a Nguyên Anh's hoard has somewhere to go.
import type { Content } from '../core/content';
import type { GameState, LogLine } from '../core/types';
import { addSpeedBuff } from './cultivation';

export interface CaveLease { years: number; cost: number }

export interface CaveView {
  /** Why no lease can be taken now, or null. */
  blocked: string | null;
  leases: (CaveLease & { blocked: string | null })[];
  speedMul: number;
  /** Last year of the lease under way, or null. */
  until: number | null;
}

function leaseCost(content: Content, realm: string, years: number): number {
  const b = content.balance.caveRent;
  const perYear = b.cost[realm] ?? 0;
  return Math.round(perYear * years * (years > 1 ? 1 - b.leaseDiscount : 1));
}

export function caveView(state: GameState, content: Content): CaveView {
  const b = content.balance.caveRent;
  const until = state.cult.caveUntil !== null && state.cult.caveUntil > state.character.age ? state.cult.caveUntil : null;
  let blocked: string | null = null;
  if (!state.alive) blocked = 'Đã qua đời.';
  else if (!(state.cult.realm in b.cost)) blocked = 'Chưa tu hành.';
  else if (until !== null) blocked = `Đang thuê tới năm ${until} tuổi.`;
  const leases = b.leases.map((years) => {
    const cost = leaseCost(content, state.cult.realm, years);
    return { years, cost, blocked: blocked ?? (state.money.spiritStones < cost ? 'Không đủ linh thạch.' : null) };
  });
  return { blocked, leases, speedMul: b.speedMul, until };
}

export function rentCave(state: GameState, content: Content, years: number): { state: GameState; text: string } | null {
  const lease = caveView(state, content).leases.find((l) => l.years === years);
  if (!lease || lease.blocked) return null;
  const text = content.lifeTexts.cave.rent.replaceAll('{years}', String(years)).replaceAll('{cost}', String(lease.cost));
  // The buff counts from next year's cultivation (it is checked after the age turns).
  let s = addSpeedBuff(state, content.balance.caveRent.speedMul, years + 1);
  s = {
    ...s,
    money: { ...s.money, spiritStones: s.money.spiritStones - lease.cost },
    cult: { ...s.cult, caveUntil: state.character.age + years },
  };
  const line: LogLine = { text, tone: 'good' };
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { state: { ...s, log }, text };
}
