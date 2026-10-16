import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeHooks } from '../src/systems/cultivation';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { devSpecial } from '../src/systems/dev';
import { chooseVariant, pendingVariants, seeSpecial } from '../src/systems/specialOrigin';
import { trungSinhYear } from '../src/systems/trungSinh';
import { withBalancePatch } from '../src/systems/simulate';

const content = loadContent();
const born = (seed: string, c = content) => devSpecial(confirmDestiny(rollDestiny(createLife({ seed, lifeNo: 5 }, c), c), c), c, 'trung_sinh');
const at = (s: GameState, age: number): GameState => ({ ...s, character: { ...s.character, age } });

describe('Trùng sinh (9.S3)', () => {
  it('waits for the player to pick thật or đoạt xá; an unpicked one falls to the first', () => {
    const s = born('a');
    expect(pendingVariants(s, content).map((o) => o.id)).toEqual(['trung_sinh']);
    const seen = seeSpecial(s, content);
    expect(seen.special!.variants).toEqual({ trung_sinh: 'that' });
    expect(seen.trungSinh).toBeDefined();
  });

  it('thật: memories with ages, recalled by realm; experience only until Kim Đan', () => {
    const s = chooseVariant(born('b'), content, 'trung_sinh', 'that');
    const ts = s.trungSinh!;
    expect(ts.memories.length).toBe(content.balance.trungSinh.memories);
    expect(ts.memories.every((m, i) => i === 0 || m.age >= ts.memories[i - 1].age)).toBe(true);
    // A memory needing Trúc Cơ stays hidden for a mortal.
    for (const m of ts.memories) {
      const need = content.trungSinh!.memories.find((d) => d.id === m.id)!.recallRealm;
      expect(m.recalled).toBe(need === 'pham_nhan');
    }
    expect(lifeHooks(s, content).some((h) => h.hook === 'cultivationSpeed' && h.add === 0.25)).toBe(true);
    const kd = { ...s, cult: { ...s.cult, realm: 'kim_dan' } };
    expect(lifeHooks(kd, content).some((h) => h.hook === 'cultivationSpeed' && h.add === 0.25)).toBe(false);
    expect(chooseVariant(s, content, 'trung_sinh', 'doat_xa')).toBe(s);
  });

  it('a memory plays its event at its age and bends history; a drifted one breaks', () => {
    const exact = withBalancePatch(content, { trungSinh: { falseChance: 0 } }).content;
    let s = chooseVariant(born('c', exact), exact, 'trung_sinh', 'that');
    s = { ...s, cult: { ...s.cult, realm: 'kim_dan' } };
    const first = s.trungSinh!.memories[0];
    const due = trungSinhYear(at(s, first.age), exact);
    const m = due.trungSinh!.memories[0];
    expect(m.state).toBe('done');
    expect(due.events.followUps[0].event).toBe(exact.trungSinh!.memories.find((d) => d.id === m.id)!.event);
    expect(due.trungSinh!.drift).toBeGreaterThan(s.trungSinh!.drift);
    const drifted = trungSinhYear(at({ ...s, trungSinh: { ...s.trungSinh!, drift: 100 } }, first.age), withBalancePatch(exact, { trungSinh: { maxBreak: 1 } }).content);
    expect(drifted.trungSinh!.memories[0].state).toBe('broken');
  });

  it('đoạt xá: no memories, its own start events and costs', () => {
    const s = chooseVariant(born('d'), content, 'trung_sinh', 'doat_xa');
    expect(s.trungSinh).toBeUndefined();
    expect(s.events.followUps.map((f) => f.event)).toEqual(expect.arrayContaining(['ts_doat_xa_nhan_ra', 'ts_doat_xa_phan_phe']));
    expect(lifeHooks(s, content).some((h) => h.hook === 'heartDemonResist' && h.add === -0.1)).toBe(true);
    expect(s.flags.origin_trung_sinh_doat_xa).toBe(true);
  });

  it('a whole reborn life runs', () => {
    let s = seeSpecial(born('e'), content);
    for (let i = 0; i < 70 && s.alive; i++) {
      if (s.events.pending) s = { ...s, events: { ...s.events, pending: null } };
      s = advanceYear(s, content);
    }
    expect(s.trungSinh!.memories.some((m) => m.state !== 'waiting')).toBe(true);
  });
});
