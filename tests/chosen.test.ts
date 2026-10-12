// Task 5.5: khí vận chi tử as a disciple, three templates with their own chains.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice, rollYearEvent } from '../src/systems/events/engine';
import { fillTemplate } from '../src/core/state';
import { chosenDisciple, takeChosen } from '../src/systems/chosen';
import { ageNpcs } from '../src/systems/npcs';

const content = loadContent();
const omens = content.events.filter((e) => e.category === 'chosen' && e.conditions.chosen?.has === false);

function master(): GameState {
  const b = createLife({ seed: 'chosen' }, content);
  return {
    ...b,
    character: { ...b.character, age: 60 },
    log: [...b.log, { age: 60, lines: [] }],
    events: { ...b.events, followUps: [] },
    cult: { ...b.cult, realm: 'truc_co', lineage: 'tien', root: { grade: 'song', elements: ['kim', 'hoa'], body: null } },
  };
}

describe('khí vận chi tử (task 5.5)', () => {
  it('one omen per template, from Trúc Cơ, once a life', () => {
    expect(omens.map((e) => e.choices[0].result!.effects.chosenOne).sort()).toEqual(content.chosenOnes.templates.map((t) => t.id).sort());
    const low = { ...master(), cult: { ...master().cult, realm: 'luyen_khi' } };
    for (const e of omens) {
      expect(eventWeight(master(), content, e), e.id).toBeGreaterThan(0);
      expect(eventWeight(low, content, e), e.id).toBe(0);
    }
  });

  it('taking one in makes a disciple with the template; no second one comes', () => {
    const s = resolveChoice({ ...master(), events: { ...master().events, pending: 'kvct_pv_di_tuong' } }, content, 0).state;
    const n = chosenDisciple(s)!;
    expect(n.chosen).toEqual({ template: 'phe_vat_nghich_tap', since: 60 });
    expect(n.disciple).toBeDefined();
    expect(n.aptitude).toBeLessThanOrEqual(40);
    for (const e of omens) expect(eventWeight(s, content, e)).toBe(0);
    expect(s.events.followUps.some((f) => f.event === 'kvct_pv_huy_hon')).toBe(true);
  });

  it('every template has a chain of follow-ups, each about the disciple ({npc})', () => {
    for (const omen of omens) {
      const template = omen.choices[0].result!.effects.chosenOne!;
      let id = omen.choices[0].result!.effects.followUp?.event;
      let steps = 0;
      while (id) {
        const e = findEvent(content, id)!;
        if (e.conditions.chosen?.role) break; // task 5.6: the fork and its outcomes
        expect(e.conditions.chosen?.template).toEqual([template]);
        expect(e.weight).toBe(0);
        steps++;
        const outs = e.choices.flatMap((c) => [c.result, c.success, c.fail]).filter((o) => o !== undefined);
        id = outs.map((o) => o.effects.followUp?.event).find(Boolean);
      }
      expect(steps, template).toBeGreaterThanOrEqual(3);
    }
  });

  it('a chain event is bound to the chosen one and names them', () => {
    let s = takeChosen(master(), content, 'trong_sinh');
    const n = chosenDisciple(s)!;
    s = { ...s, events: { ...s.events, npc: null, followUps: [{ event: 'kvct_ts_co_duyen', atAge: s.character.age }] } };
    const r = rollYearEvent(s, content);
    expect(r.events.pending).toBe('kvct_ts_co_duyen');
    expect(r.events.npc).toBe(n.id);
    expect(fillTemplate(findEvent(content, 'kvct_ts_co_duyen')!.text, r, content)).toContain(n.name);
  });

  it('hào quang: faster than an equal disciple and never dies by mishap', () => {
    const s = takeChosen(master(), content, 'xuyen_khong');
    const n = chosenDisciple(s)!;
    const plain = { ...n, id: 'plain', chosen: undefined };
    const risky = { ...s, npcs: [...s.npcs, plain], rng: s.rng };
    const c = { ...content, balance: { ...content.balance, npcs: { ...content.balance.npcs, deathPerYear: 1 } } };
    const next = ageNpcs(risky, c);
    expect(next.npcs.find((x) => x.id === n.id)!.alive).toBe(true);
    expect(next.npcs.find((x) => x.id === 'plain')!.alive).toBe(false);
    const grown = ageNpcs(risky, content);
    const prog = (id: string) => grown.npcs.find((x) => x.id === id)!;
    expect(prog(n.id).progress + prog(n.id).stage * 100).toBeGreaterThan(prog('plain').progress + prog('plain').stage * 100);
  });
});
