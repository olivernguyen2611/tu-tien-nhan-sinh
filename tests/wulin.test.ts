import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { addPrestige, foePower, roundChance, wulinLine, wulinOpen, wulinResign, wulinTournament, wulinYear } from '../src/systems/wulin';
import { meets } from '../src/systems/events/conditions';

const content = loadContent();
const cfg = content.balance.wulin!;
const life = (stage: number, age = 30): GameState => {
  const s = createLife({ seed: 'vo-lam', originId: 'vo_lam' }, content);
  return { ...s, character: { ...s.character, age }, cult: { ...s.cult, realm: 'pham_nhan' }, martial: { ...s.martial, stage }, aptitudes: { ...s.aptitudes, physique: 80 } };
};

describe('Võ lâm đại hội và minh chủ (11.5)', () => {
  it('a đại hội is held once every `every` years', () => {
    const open = Array.from({ length: cfg.every * 3 }, (_, i) => wulinOpen(life(2, 20 + i), content)).filter(Boolean);
    expect(open).toHaveLength(3);
  });

  it('the field grows stronger round by round; a stronger fighter wins more often', () => {
    expect(foePower(content, 2)).toBeGreaterThan(foePower(content, 0));
    expect(roundChance(life(5), content, 2)).toBeGreaterThan(roundChance(life(1), content, 2));
  });

  it('winning every round makes the minh chủ; one đại hội a year', () => {
    let s = wulinTournament(life(6), content);
    expect(s.wulin!.last).toBe(30);
    expect(wulinTournament(s, content)).toBe(s);
    // A Ngũ khí fighter wins the đại hội now and then; try a handful of seeds.
    const won = Array.from({ length: 30 }, (_, k) => k).map((k) => wulinTournament({ ...life(6), seed: `vo-lam-${k}` }, content)).find((x) => x.wulin?.leader);
    expect(won).toBeTruthy();
    s = won!;
    expect(s.wulin!.held).toBe(1);
    expect(meets(s, { wulin: { leader: true, prestigeMin: cfg.prestigeStart } }, content)).toBe(true);
    expect(wulinLine(s, content)).toContain('Minh chủ');
  });

  it('a minh chủ draws a stipend; uy vọng at 0 deposes; an undefended term ends; stepping down keeps hiệp danh', () => {
    const leader: GameState = { ...life(4), wulin: { last: 30, best: 3, leader: { since: 30, prestige: 50 }, held: 1 } };
    const y = wulinYear({ ...leader, character: { ...leader.character, age: 31 } }, content);
    expect(y.money.silver).toBe(leader.money.silver + cfg.stipend);
    expect(y.wulin!.leader!.prestige).toBe(50 + cfg.prestigeDrift);
    expect(addPrestige(leader, content, -60).wulin!.leader).toBeNull();
    expect(wulinYear({ ...leader, character: { ...leader.character, age: 30 + cfg.every + 1 } }, content).wulin!.leader).toBeNull();
    const out = wulinResign(leader, content);
    expect(out.wulin!.leader).toBeNull();
    expect(out.jianghu!.fame).toBeGreaterThan(0);
    expect(wulinLine(out, content)).toContain('Từng làm minh chủ');
  });
});
