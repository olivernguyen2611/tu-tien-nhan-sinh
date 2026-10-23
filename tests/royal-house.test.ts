import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { act } from '../src/systems/combat';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { relationLabel } from '../src/systems/relationships';
import { emperorRelative, houseYear } from '../src/systems/royalHouse';

const content = loadContent();

/** Play a life year by year, taking the first open choice of every event. Calls `check` right after each year. */
function play(seed: string, origin: string, years: number, check: (s: GameState, before: GameState) => void): GameState {
  let s = createLife({ seed, originId: origin, gender: 'nam' }, content);
  s = { ...s, destiny: { ...s.destiny, confirmed: true } };
  for (let i = 0; i < years * 4 && s.alive && s.character.age < years; i++) {
    if (s.events.pending) {
      const ev = findEvent(content, s.events.pending);
      const open = ev ? visibleChoices(s, content, ev).filter((c) => !c.disabled) : [];
      s = resolveChoice(s, content, open[0]?.index ?? 0).state;
      continue;
    }
    if (s.combat) { s = act(s, content, 'flee').state; continue; }
    if (s.fate) break;
    const before = s;
    s = advanceYear(s, content);
    if (s === before) break;
    check(s, before);
  }
  return s;
}

describe('Hoàng tộc khớp triều đình (15.0)', () => {
  it('a hoàng tử carries the quốc tính; the father is the emperor, the mother a hậu or phi, the family calls them Phụ hoàng…', () => {
    const s = createLife({ seed: 'hoang-15', originId: 'hoang_tu', gender: 'nam' }, content);
    const surname = content.worldState!.royalSurnames[s.times!.dynasty];
    expect(s.character.name.startsWith(`${surname} `)).toBe(true);
    const father = s.family.find((r) => r.role === 'father')!;
    expect(father.rank).toBe('emperor');
    expect(father.name.startsWith(`${surname} `)).toBe(true);
    expect(relationLabel(father, 0, content)).toBe('Phụ hoàng');
    const mother = s.family.find((r) => r.role === 'mother')!;
    expect(['Mẫu hậu', 'Mẫu phi']).toContain(relationLabel(mother, 0, content));
    for (const r of s.family) expect(r.house).toBe('hoang');
    // A farmer's family is untouched.
    const farmer = createLife({ seed: 'hoang-15', originId: 'nong_dan' }, content);
    expect(farmer.family.every((r) => !r.house && !r.rank)).toBe(true);
    expect(relationLabel(farmer.family[0], 0, content)).toBe('Cha');
  });

  it('a hoàng thân carries the quốc tính and calls the father Phụ vương, with no throne of its own', () => {
    const s = createLife({ seed: 'vuong-15', originId: 'hoang_than' }, content);
    const surname = content.worldState!.royalSurnames[s.times!.dynasty];
    expect(s.character.name.startsWith(`${surname} `)).toBe(true);
    const father = s.family.find((r) => r.role === 'father')!;
    expect(relationLabel(father, 0, content)).toBe('Phụ vương');
    expect(father.rank).toBeUndefined();
  });

  it('over many lives: the emperor is the living father or a brother, the thái tử is in the family, and the emperor dies with the niên hiệu', () => {
    let fatherDied = 0;
    let brotherCrowned = 0;
    let heirs = 0;
    for (let i = 0; i < 24; i++) {
      play(`hoang-sync-${i}`, 'hoang_tu', 70, (s, before) => {
        const age = s.character.age;
        const c = s.court;
        // A life that ends mid-year does not see the court's year.
        if (!c || !s.alive) return;
        const emp = emperorRelative(s);
        // An emperor of the family is alive after the year (a death ends the niên hiệu the same year).
        if (emp && !s.reign) {
          expect(emp.alive, `${s.seed} age ${age}: emperor ${emp.name} dead`).toBe(true);
          expect(c.emperor.age).toBe(emp.age);
          expect(emp.rank).toBe('emperor');
        }
        // The father who reigned and died this year: a new niên hiệu this year.
        const f0 = before.family.find((r) => r.role === 'father');
        const f1 = s.family.find((r) => r.role === 'father');
        if (f0?.alive && f0.rank === 'emperor' && before.court?.emperor.npcId === f0.id && f1 && !f1.alive) {
          fatherDied++;
          expect(s.times!.eraFrom, `${s.seed} age ${age}: father died, niên hiệu kept`).toBe(age);
        }
        // A niên hiệu that ends while the father reigns ends with him (or with the dynasty).
        if (s.times!.eraFrom === age && f0?.alive && before.court?.emperor.npcId === f0.id) expect(f1?.alive).toBe(false);
        // While the father reigns, the thái tử is the life or a brother (a crowned brother's heir is his own son).
        if (c.heir && emp?.role === 'father') {
          heirs++;
          expect(c.heir.name === s.character.name || s.family.some((r) => r.id === c.heir!.npcId)).toBe(true);
        }
        if (emp && emp.role === 'sibling' && !before.court?.emperor.npcId?.startsWith('sibling')) brotherCrowned++;
      });
    }
    expect(fatherDied).toBeGreaterThan(5);
    expect(heirs).toBeGreaterThan(0);
    expect(brotherCrowned).toBeGreaterThan(0);
  }, 60_000);

  it('an older royal life (before 15.0) is linked: the father reigns or has retired, the rivals become the brothers', () => {
    const s = createLife({ seed: 'hoang-old', originId: 'hoang_tu', gender: 'nam' }, content);
    const old: GameState = {
      ...s,
      family: s.family.map(({ house: _h, rank: _r, ...r }) => r),
      court: { emperor: { name: 'Cựu đế', age: 60, temper: 'trung_quan' }, heir: null, minister: null, affairs: [], started: {} },
      throne: { path: 'royal', bars: { favor: 40, power: 10, suspicion: 5 }, since: 0, step: 0, rank: 2, mother: 'phi', rivals: [{ name: 'Hoàng tử Cũ', favor: 40, power: 30, alive: true }], heir: 'Hoàng tử Cũ' },
    };
    const linked = houseYear(old, content);
    const father = linked.family.find((r) => r.role === 'father')!;
    expect(father.house).toBe('hoang');
    expect(['emperor', 'retired']).toContain(father.rank);
    if (linked.family.some((r) => r.role === 'sibling' && r.gender === 'nam')) {
      expect(linked.throne!.rivals![0].npcId).toBeDefined();
      expect(linked.throne!.heir).toBe(linked.throne!.rivals![0].name);
    }
  });
});
