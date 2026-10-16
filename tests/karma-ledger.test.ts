import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState, KarmaTie } from '../src/core/types';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { devPastTie } from '../src/systems/dev';
import { rollYearEvent } from '../src/systems/events/engine';
import { lifeTies, nextKarmaLedger, readKarmaLedger, reunionYear } from '../src/systems/karmaLedger';
import { createNpc, npcInfo } from '../src/systems/npcs';
import { readMeta, recordKarmaLedger, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const life = confirmDestiny(rollDestiny(createLife({ seed: 'nq' }, content), content), content);
const tie = (over: Partial<KarmaTie> = {}): KarmaTie => ({ kind: 'an', name: 'Cố Nhân', gender: 'nam', self: 'Tiền Thân', weight: 80, lives: 0, ...over });

function withNpcs(): GameState {
  let s: GameState = { ...life, character: { ...life.character, age: 40 } };
  const add = (spec: Parameters<typeof createNpc>[2]) => { const r = createNpc(s, content, spec); s = r.state; return r.id; };
  const wife = add({ role: 'đạo lữ', affinity: 90 });
  add({ role: 'ân nhân', favor: 70 });
  add({ role: 'kẻ thù', grudge: 90 });
  add({ role: 'người dưng', favor: 5 });
  return { ...s, romance: { ...s.romance, partner: wife, couple: true } };
}

describe('Nhân quả xuyên kiếp (9.R9)', () => {
  it('keeps the heavy ties of a life, not strangers', () => {
    const ties = lifeTies(withNpcs(), content);
    expect(ties.map((t) => t.kind).sort()).toEqual(['an', 'dao_lu', 'ke_thu']);
    expect(ties.every((t) => t.self === life.character.name)).toBe(true);
  });

  it('ages old ties and drops them after maxLives', () => {
    const cfg = content.balance.karmaLedger;
    const old = [tie({ lives: cfg.maxLives - 1 }), tie({ lives: 0, name: 'Gần' })];
    const next = nextKarmaLedger(old, withNpcs(), content);
    expect(next.some((t) => t.name === 'Gần' && t.lives === 1)).toBe(true);
    expect(next.some((t) => t.name === 'Cố Nhân')).toBe(false);
    expect(next.length).toBeLessThanOrEqual(cfg.max);
  });

  it('a new life carries the ledger; none in a first life', () => {
    expect(createLife({ seed: 'a' }, content).pastTies).toEqual([]);
    expect(createLife({ seed: 'a', karmaLedger: [tie()] }, content).pastTies).toEqual([{ ...tie(), met: false }]);
  });

  it('a tie comes back as a cố nhân and their reunion event follows once', () => {
    let s: GameState = { ...createLife({ seed: 'r', karmaLedger: [tie({ weight: 100 })] }, content), alive: true };
    s = { ...s, character: { ...s.character, age: 20 } };
    let found = -1;
    for (let y = 0; y < 200 && found < 0; y++) {
      s = reunionYear({ ...s, character: { ...s.character, age: 20 + y } }, content);
      if (s.npcs.some((n) => n.pastLife)) found = y;
    }
    expect(found).toBeGreaterThanOrEqual(0);
    const n = s.npcs.find((x) => x.pastLife)!;
    expect(n.pastLife).toMatchObject({ kind: 'an', name: 'Cố Nhân', met: false });
    expect(s.pastTies![0].met).toBe(true);
    const rolled = rollYearEvent(s, content);
    expect(rolled.events.npc).toBe(n.id);
    expect(rolled.events.pending?.startsWith('tai_ngo_an')).toBe(true);
    expect(rolled.npcs.find((x) => x.id === n.id)!.pastLife!.met).toBe(true);
    expect(npcInfo(rolled, content, { ...rolled.npcs.find((x) => x.id === n.id)!, affinity: 90 }).rows.some((r) => r.label === 'Tiền duyên')).toBe(true);
  });

  it('dev mode brings one back; the meta keeps the ledger', () => {
    const s = devPastTie({ ...life, character: { ...life.character, age: 30 } }, content, 'ke_thu');
    expect(s.npcs.some((n) => n.pastLife?.kind === 'ke_thu' && n.grudge > 0)).toBe(true);
    const m = new Map<string, string>();
    const store: KeyValueStore = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
    expect(readMeta(store).karmaLedger).toEqual([]);
    recordKarmaLedger(store, [tie()]);
    expect(readMeta(store).karmaLedger).toEqual([tie()]);
    expect(readKarmaLedger([{ kind: 'x' }, tie(), null])).toEqual([tie()]);
  });

  it('a whole life runs with ties', () => {
    let s = confirmDestiny(rollDestiny(createLife({ seed: 'full', karmaLedger: [tie({ weight: 100 }), tie({ kind: 'ke_thu', weight: 100 })] }, content), content), content);
    for (let i = 0; i < 40 && s.alive; i++) s = s.events.pending ? { ...s, events: { ...s.events, pending: null } } : advanceYear(s, content);
    expect(s.character.age).toBeGreaterThan(10);
  });
});
