// Task 5.6: Hộ đạo / Lợi dụng / Mặc kệ towards a khí vận chi tử, and what each brings back.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, resolveChoice } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { chosenDisciple, setChosenRole, takeChosen } from '../src/systems/chosen';
import { hookSum } from '../src/systems/cultivation';

const content = loadContent();

function withChosen(template: string): GameState {
  const b = createLife({ seed: 'roles' }, content);
  const s: GameState = {
    ...b,
    character: { ...b.character, age: 80 },
    log: [...b.log, { age: 80, lines: [] }],
    events: { ...b.events, followUps: [] },
    cult: { ...b.cult, realm: 'kim_dan', lineage: 'tien', root: { grade: 'song', elements: ['kim', 'hoa'] } },
  };
  return takeChosen(s, content, template);
}
const at = (s: GameState, event: string): GameState => ({ ...s, events: { ...s.events, pending: event, npc: chosenDisciple(s)!.id } });

describe('vai trò với khí vận chi tử (task 5.6)', () => {
  it('each template ends its chain at a fork with the three roles, each with its own sequel', () => {
    for (const [last, fork] of [['kvct_xk_npc', 'kvct_xk_nga_re'], ['kvct_pv_thieu_chu', 'kvct_pv_nga_re'], ['kvct_ts_dai_kiep', 'kvct_ts_nga_re']]) {
      const outs = findEvent(content, last)!.choices.flatMap((c) => [c.result, c.success, c.fail, c.result?.fight?.win, c.result?.fight?.lose]).filter((o) => o && !('fight' in o && o.fight));
      for (const o of outs) expect(o!.effects.followUp?.event, last).toBe(fork);
      const e = findEvent(content, fork)!;
      expect(e.choices.map((c) => c.result!.effects.chosenRole)).toEqual(['protect', 'exploit', 'ignore']);
      expect(e.choices.map((c) => c.result!.effects.followUp?.event)).toEqual(['kvct_bao_dap', 'kvct_phan_phe', 'kvct_tro_ve']);
    }
  });

  it('a role is chosen once; Mặc kệ lets them leave the master', () => {
    let s = setChosenRole(withChosen('xuyen_khong'), content, 'ignore');
    expect(chosenDisciple(s)!.chosen!.role).toBe('ignore');
    expect(chosenDisciple(s)!.disciple).toBeUndefined();
    s = setChosenRole(s, content, 'protect');
    expect(chosenDisciple(s)!.chosen!.role).toBe('ignore');
  });

  it('Hộ đạo shares the fortune, Lợi dụng draws thiên đạo phản phệ; both end with the chosen one', () => {
    const base = withChosen('trong_sinh');
    const guard = setChosenRole(base, content, 'protect');
    expect(hookSum(guard, content, 'breakthroughChance') - hookSum(base, content, 'breakthroughChance')).toBe(3);
    const user = setChosenRole(base, content, 'exploit');
    expect(hookSum(user, content, 'tribulationPct') - hookSum(base, content, 'tribulationPct')).toBe(25);
    const dead = { ...user, npcs: user.npcs.map((n) => (n.chosen ? { ...n, alive: false } : n)) };
    expect(hookSum(dead, content, 'tribulationPct')).toBe(hookSum(base, content, 'tribulationPct'));
  });

  it('seizing the ring: the master gets it, the disciple holds a grudge, phản phệ is on its way', () => {
    const s = withChosen('phe_vat_nghich_tap');
    const r = resolveChoice(at(s, 'kvct_pv_nga_re'), content, 1).state;
    expect(r.inventory.nhan_co_tan_hon).toBe(1);
    expect(chosenDisciple(r)!.grudge).toBeGreaterThanOrEqual(50);
    expect(r.events.followUps.some((f) => f.event === 'kvct_phan_phe')).toBe(true);
  });

  it('each sequel only fits its role', () => {
    const s = withChosen('xuyen_khong');
    for (const [role, ev] of [['protect', 'kvct_bao_dap'], ['exploit', 'kvct_phan_phe'], ['ignore', 'kvct_tro_ve']] as const) {
      const c = findEvent(content, ev)!.conditions;
      expect(meets(setChosenRole(s, content, role), c, content), ev).toBe(true);
      expect(meets(s, c, content), ev).toBe(false);
    }
  });
});
