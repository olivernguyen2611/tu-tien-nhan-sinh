import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { martialPromote } from '../src/systems/martial';
import {
  beginQuestStep, gameSymbols, martialQuestYear, miniGameHide, miniGameInput, miniGameQuit, questView,
} from '../src/systems/martialQuest';
import { devQuestStep } from '../src/systems/dev';

const content = loadContent();

function mortalAt(stage: number, age = 30, patch: Partial<GameState['martial']> = {}): GameState {
  const b = createLife({ seed: `quest-${stage}` }, content);
  return {
    ...b,
    character: { ...b.character, age },
    stats: { ...b.stats, health: 80 },
    aptitudes: { ...b.aptitudes, physique: 90, comprehension: 90, daoHeart: 50 },
    martial: { ...b.martial, stage, years: 0, reachedAt: age - 2, ...patch },
    log: [...b.log, { age, lines: [] }],
  };
}

/** Play the open mini-game to a win by entering its target. */
function solve(s: GameState): GameState {
  let cur = miniGameHide(s);
  const game = cur.martial.quest!.game!;
  for (const sym of game.target.slice(game.input.length)) cur = miniGameInput(cur, content, sym).state;
  return cur;
}

describe('martial quest chain', () => {
  it('reaching a stage records the age; the chain starts only the year after', () => {
    const s = mortalAt(3, 30, { reachedAt: null });
    const up = martialPromote(s, content);
    expect(up.martial.stage).toBe(4);
    expect(up.martial.reachedAt).toBe(30);
    expect(martialQuestYear(up, content).martial.quest).toBeFalsy();
    const next = martialQuestYear({ ...up, character: { ...up.character, age: 31 } }, content);
    expect(next.martial.quest).toMatchObject({ id: 'tam_hoa', step: 0 });
    expect(next.log.at(-1)!.lines.at(-1)!.text).toBe(content.martial.quests[0].start);
  });

  it('no chain before Hóa cảnh, after a chain is done, or once in cultivation', () => {
    expect(martialQuestYear(mortalAt(3), content).martial.quest).toBeFalsy();
    expect(martialQuestYear(mortalAt(4, 30, { done: ['tam_hoa'] }), content).martial.quest).toBeFalsy();
    const cultivator = { ...mortalAt(4), cult: { ...mortalAt(4).cult, realm: 'luyen_khi' } };
    expect(martialQuestYear(cultivator, content).martial.quest).toBeFalsy();
  });

  it('a chain is dropped when the stage moves on by other means', () => {
    const s = martialQuestYear(mortalAt(4), content);
    expect(s.martial.quest).toBeTruthy();
    const moved = martialQuestYear({ ...s, martial: { ...s.martial, stage: 5 } }, content);
    expect(moved.martial.quest?.id).not.toBe('tam_hoa');
  });

  it('a mini-game step opens a game, wins on the right input, and allows one try a year', () => {
    let s = martialQuestYear(mortalAt(4), content);
    const begun = beginQuestStep(s, content, false)!;
    s = begun.state;
    const g = s.martial.quest!.game!;
    expect(g.kind).toBe('dieu_tuc');
    expect(g.shown).toBe(true);
    // Input is ignored until the pattern is hidden.
    expect(miniGameInput(s, content, g.target[0]).state).toBe(s);
    s = solve(s);
    expect(s.martial.quest).toMatchObject({ step: 1, game: null, lastTry: 30 });
    expect(questView(s, content)!.blocked).toMatch(/sang năm/);
    expect(beginQuestStep(s, content, false)).toBeNull();
    const nextYear = { ...s, character: { ...s.character, age: 31 } };
    expect(questView(nextYear, content)!.blocked).toBeNull();
  });

  it('too many mistakes lose the step: health lost, step kept for next year', () => {
    let s = beginQuestStep(martialQuestYear(mortalAt(4), content), content, false)!.state;
    s = miniGameHide(s);
    const g = s.martial.quest!.game!;
    const wrong = gameSymbols(g, content).find((x) => x.id !== g.target[0])!.id;
    for (let i = 0; i <= g.allowed; i++) s = miniGameInput(s, content, wrong).state;
    expect(s.martial.quest).toMatchObject({ step: 0, game: null, lastTry: 30 });
    expect(s.stats.health).toBe(80 - content.balance.martial.quest.loseHealth);
  });

  it('giving up counts as a failed try', () => {
    const s = beginQuestStep(martialQuestYear(mortalAt(4), content), content, false)!.state;
    const quit = miniGameQuit(s, content).state;
    expect(quit.martial.quest).toMatchObject({ step: 0, game: null, lastTry: 30 });
  });

  it('ngu_hanh targets follow the tương sinh or tương khắc cycle and start with the first stone given', () => {
    const base = martialQuestYear(mortalAt(4, 30, { quest: { id: 'tam_hoa', step: 1, startedAt: 29, lastTry: null, game: null } }), content);
    const modes = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const s = beginQuestStep({ ...base, rng: new Rng(`modes${i}`).getState() }, content, false)!.state;
      const g = s.martial.quest!.game!;
      expect(g.kind).toBe('ngu_hanh');
      expect(g.input).toEqual([g.target[0]]);
      modes.add(g.mode!);
      const elements = content.cultivation.roots.elements;
      for (let k = 1; k < g.target.length; k++) {
        const prev = g.target[k - 1];
        if (g.mode === 'sinh') expect(content.balance.coreForming.generates[prev]).toBe(g.target[k]);
        else expect(elements.find((e) => e.id === prev)!.beats).toContain(g.target[k]);
      }
    }
    expect(modes.size).toBe(2);
  });

  it('a check step rolls once; winning gives Đạo tâm', () => {
    const s0 = martialQuestYear(mortalAt(4, 30, { quest: { id: 'tam_hoa', step: 2, startedAt: 29, lastTry: null, game: null } }), content);
    expect(questView(s0, content)!.chance).toBeGreaterThan(0.5);
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const r = beginQuestStep({ ...s0, rng: new Rng(`check${i}`).getState() }, content, false)!.state;
      expect(r.martial.quest!.game).toBeNull();
      expect(r.martial.quest!.lastTry).toBe(30);
      if (r.martial.quest!.step === 3) { wins++; expect(r.aptitudes.daoHeart).toBe(51); }
    }
    expect(wins).toBeGreaterThan(15);
    expect(wins).toBeLessThan(40);
  });

  it('an aid item is spent and gives an extra mistake; none held means no aid', () => {
    const s = martialQuestYear(mortalAt(4), content);
    expect(questView(s, content)!.aid).toMatchObject({ item: 'ngo_dao_tra', have: false });
    const noAid = beginQuestStep(s, content, true)!.state;
    expect(noAid.martial.quest!.game!.aided).toBe(false);
    const withItem = { ...s, inventory: { ngo_dao_tra: 1 } };
    const aided = beginQuestStep(withItem, content, true)!.state;
    expect(aided.inventory.ngo_dao_tra).toBeUndefined();
    expect(aided.martial.quest!.game).toMatchObject({ aided: true, allowed: noAid.martial.quest!.game!.allowed + content.balance.martial.quest.aidAllowed });
  });

  it('finishing the last step promotes to Tam hoa tụ đỉnh and marks the chain done', () => {
    const last = content.martial.quests[0].steps.length - 1;
    const s0 = martialQuestYear(mortalAt(4, 30, { quest: { id: 'tam_hoa', step: last, startedAt: 20, lastTry: null, game: null } }), content);
    const s = solve(beginQuestStep(s0, content, false)!.state);
    expect(s.martial.stage).toBe(5);
    expect(s.martial.quest).toBeNull();
    expect(s.martial.done).toEqual(['tam_hoa']);
    expect(s.martial.reachedAt).toBe(30);
    // The second chain starts the year after.
    expect(martialQuestYear({ ...s, character: { ...s.character, age: 31 } }, content).martial.quest?.id).toBe('ngu_khi');
  });

  it('the last chain ends in Ngũ khí triều nguyên: a five-element root that cultivates faster than a plain one', () => {
    const last = content.martial.quests[1].steps.length - 1;
    const s0 = martialQuestYear(mortalAt(5, 30, { quest: { id: 'ngu_khi', step: last, startedAt: 20, lastTry: null, game: null } }), content);
    const s = solve(beginQuestStep(s0, content, false)!.state);
    expect(s.martial.stage).toBe(6);
    expect(s.cult.root).toMatchObject({ grade: 'ngu' });
    expect(s.cult.root!.elements).toHaveLength(5);
    expect(s.flags.vo_dao_nhap_tien).toBe(true);
    const boost = content.martial.ascendEffects.find((e) => e.hook === 'cultivationSpeed')!;
    expect(boost.add).toBeGreaterThan(0);
  });

  it('developer shortcuts win a step or free the try', () => {
    const s0 = martialQuestYear(mortalAt(4), content);
    expect(devQuestStep(s0, content, 'win').martial.quest!.step).toBe(1);
    const tried = beginQuestStep(s0, content, false)!.state;
    expect(devQuestStep(tried, content, 'retry').martial.quest).toMatchObject({ lastTry: null, game: null });
  });
});

describe('Ngũ khí triều nguyên: five-root techniques', () => {
  const five = ['ngu_hanh_dong_tam_cong', 'ngu_khi_trieu_nguyen_quyet', 'van_phap_quy_nhat_kinh'];
  it('the new techniques exist and want a many-element root', () => {
    for (const id of five) {
      const t = content.techniques.find((x) => x.id === id)!;
      expect(t.elements).toBe('five');
      expect(t.requires.minRootElements).toBeGreaterThanOrEqual(4);
    }
  });
  it('the events for them only open to the right roots', () => {
    const ev = (id: string) => content.events.find((e) => e.id === id)!;
    expect(ev('nlc_ngu_khi_chi_dan').conditions.flagsAll).toContain('vo_dao_nhap_tien');
    expect(ev('nlc_ngu_hanh_dien_tich').conditions.root?.minElements).toBe(4);
    expect(ev('nlc_van_phap_di_khac').conditions.root?.minElements).toBe(5);
  });
});
