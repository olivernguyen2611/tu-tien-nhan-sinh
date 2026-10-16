// Yearly money of a cultivator (6c.5): silver, useless once the Way is taken up, is swapped for
// spirit stones at a poor rate, and the family and disciples eat upkeep stones from Trúc Cơ on.
import type { Content } from '../core/content';
import type { GameState, LogLine } from '../core/types';

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** Living children, the đạo lữ and disciples the player has to feed, capped by balance. */
export function dependents(state: GameState, content: Content): number {
  const kids = state.family.filter((r) => r.alive && r.role === 'child').length;
  const disciples = state.npcs.filter((n) => n.alive && n.disciple).length;
  const partner = state.romance.couple && state.npcs.some((n) => n.id === state.romance.partner && n.alive) ? 1 : 0;
  return Math.min(content.balance.economy.maxDependents, kids + disciples + partner);
}

export function economyYear(state: GameState, content: Content): GameState {
  if (!state.alive || state.cult.realm === 'pham_nhan') return state;
  const cfg = content.balance.economy;
  const texts = content.lifeTexts.economy;
  const lines: LogLine[] = [];
  let s = state;
  if (realmIndex(content, s.cult.realm) >= realmIndex(content, cfg.exchangeFrom)) {
    const stones = Math.floor(s.money.silver / cfg.silverPerStone);
    if (stones >= 1) {
      const silver = stones * cfg.silverPerStone;
      s = { ...s, money: { silver: s.money.silver - silver, spiritStones: s.money.spiritStones + stones } };
      // 9.3: the yearly exchange is said the first time, then once a decade.
      if (!s.textMemory?.['economy.exchange'] || s.character.age % 10 === 0) {
        lines.push({ text: texts.exchange.replace('{silver}', String(silver)).replace('{stones}', String(stones)), tone: 'normal', ledger: true });
        s = { ...s, textMemory: { ...s.textMemory, 'economy.exchange': ['1'] } };
      }
    }
  }
  const rate = cfg.upkeepPerDependent[s.cult.realm] ?? 0;
  const need = Math.ceil(dependents(s, content) * rate);
  if (need > 0) {
    if (s.money.spiritStones >= need) {
      s = { ...s, money: { ...s.money, spiritStones: s.money.spiritStones - need } };
      // 9.3: the same upkeep each year is said once, then again when it changes or every decade.
      const last = s.textMemory?.['economy.upkeep']?.at(-1);
      if (last !== String(need) || s.character.age % 10 === 0) {
        lines.push({ text: texts.upkeepPaid.replace('{stones}', String(need)), tone: 'normal', ledger: true });
        s = { ...s, textMemory: { ...s.textMemory, 'economy.upkeep': [String(need)] } };
      }
    } else {
      s = { ...s, money: { ...s.money, spiritStones: 0 }, stats: { ...s.stats, happiness: Math.max(0, s.stats.happiness + cfg.shortHappiness) } };
      lines.push({ text: texts.upkeepShort, tone: 'bad' });
    }
  }
  if (lines.length === 0) return s;
  const log = s.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...s, log };
}
