import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc, npcById } from '../src/systems/npcs';
import { applyRomance, birthChance, romanceAction, romanceViews } from '../src/systems/romance';
import { resolveChoice } from '../src/systems/events/engine';
import { sectYear, joinSect } from '../src/systems/sect';

const content = loadContent();
const b = content.balance.romance;

function adult(age = 25): GameState {
  const base = createLife({ seed: 'peer' }, content);
  return { ...base, character: { ...base.character, age, gender: 'nam' }, stats: { ...base.stats, charm: 80, intellect: 80 }, log: [...base.log, { age, lines: [] }] };
}

describe('romance and children (playtest 2)', () => {
  it('someone met to court is of the player\'s generation', () => {
    for (let i = 0; i < 20; i++) {
      const s = { ...adult(25), rng: createLife({ seed: `p${i}` }, content).rng, events: { ...adult().events, pending: 'pe_ban_thoi_tho_au' } };
      const r = resolveChoice(s, content, 0).state;
      const n = npcById(r, r.romance.lover)!;
      expect(Math.abs(n.age - 25)).toBeLessThanOrEqual(3);
    }
  });

  it('Bà mối now brings someone real', () => {
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      const s = { ...adult(22), rng: createLife({ seed: `bm${i}` }, content).rng, events: { ...adult().events, pending: 'ba_moi_toi_nha' } };
      const r = resolveChoice(s, content, 0);
      if (r.success) {
        found = true;
        expect(r.state.flags.da_dinh_than).toBe(true);
        expect(r.state.romance.lover).not.toBeNull();
        expect(r.text).not.toContain('{npc}');
      }
    }
    expect(found).toBe(true);
  });

  it('the child button shows its chance, and each miss raises it', () => {
    const s0 = adult(30);
    const met = createNpc(s0, content, { role: 'bằng hữu', age: 28, affinity: 90, gender: 'nu', root: true, realm: 'luyen_khi' });
    let s = applyRomance(met.state, content, met.id, { pursue: true, couple: true });
    s = romanceAction({ ...s, money: { silver: 500, spiritStones: 500 }, cult: { ...s.cult, realm: 'luyen_khi' } }, content, met.id, 'wed').state;
    const n = npcById(s, met.id)!;
    const p0 = birthChance(s, content, n);
    expect(p0).toBeCloseTo(b.birthChance * b.cultivatorFertility ** 2);
    expect(romanceViews(s, content, met.id).find((v) => v.action === 'child')!.label).toContain(`${Math.round(p0 * 100)}%`);
    const tried = { ...s, romance: { ...s.romance, birthTries: 3 } };
    expect(birthChance(tried, content, n)).toBeCloseTo(Math.min(b.birthMax, p0 + 3 * b.birthPityStep));
  });

  it('the stipend line is not logged every year', () => {
    let s = joinSect({ ...adult(14), cult: { ...adult().cult, root: { grade: 'song', elements: ['kim', 'hoa'] }, realm: 'luyen_khi' } }, content, 'bich_lac_tong').state;
    let lines = 0;
    for (let age = 15; age < 40; age++) {
      s = sectYear({ ...s, character: { ...s.character, age }, log: [...s.log, { age, lines: [] }] }, content);
      lines += s.log.at(-1)!.lines.filter((l) => l.text.startsWith('Nhận bổng lộc')).length;
    }
    expect(lines).toBeGreaterThan(0);
    expect(lines).toBeLessThan(8);
  });
});
