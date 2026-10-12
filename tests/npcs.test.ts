import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import { NpcTraitsFileSchema } from '../src/core/schemas';
import type { GameState } from '../src/core/types';
import { ageNpcs, changeNpc, createNpc, killNpc, npcById, npcLabel } from '../src/systems/npcs';

const base = loadContent();
// Personalities shaped like npcs-draft.md; the real list comes once approved.
const content: Content = {
  ...base,
  npcTraits: NpcTraitsFileSchema.parse({
    surface: [{ id: 'on_hoa', name: 'Ôn hòa', text: '.' }, { id: 'lanh_lung', name: 'Lạnh lùng', text: '.' }],
    nature: [
      { id: 'tham_lam', name: 'Tham lam', text: '.' },
      { id: 'thu_dai', name: 'Thù dai', text: '.', grudgeFade: 0 },
      { id: 'chan_thanh', name: 'Chân thành', text: '.', surface: 'on_hoa' },
    ],
    goals: [{ id: 'truong_sinh', name: 'Trường sinh', text: '.' }],
  }),
};
const life: GameState = { ...createLife({ seed: 'npc', originId: 'nong_dan' }, content), character: { ...createLife({ seed: 'npc', originId: 'nong_dan' }, content).character, age: 20 } };

describe('NPCs (task 3.4)', () => {
  it('meeting someone adds a named NPC with a surface trait and a hidden nature', () => {
    const { state, id } = createNpc(life, content, { role: 'bằng hữu', root: true, realm: 'luyen_khi' });
    const n = npcById(state, id)!;
    expect(n.name).not.toBe(life.character.name);
    expect(n.surface).not.toBeNull();
    expect(n.realm).toBe('luyen_khi');
    if (n.nature !== 'chan_thanh') expect(npcLabel(content, n).nature).toBeNull();
  });

  it('NPCs age, cultivate and die of old age', () => {
    let { state, id } = createNpc(life, content, { role: 'sư huynh', root: true, realm: 'luyen_khi', age: 30 });
    state = { ...state, npcs: state.npcs.map((n) => ({ ...n, aptitude: 80 })) };
    const before = npcById(state, id)!;
    for (let i = 0; i < 10; i++) state = ageNpcs(state, content);
    const after = npcById(state, id)!;
    expect(after.age).toBe(before.age + 10);
    expect(after.stage > before.stage || after.realm !== before.realm || !after.alive).toBe(true);
    state = { ...state, npcs: state.npcs.map((n) => ({ ...n, lifespan: n.age + 1, affinity: 80 })) };
    state = ageNpcs(state, content);
    expect(npcById(state, id)!.alive).toBe(false);
    expect(state.log.at(-1)!.lines.some((l) => l.text.includes('qua đời'))).toBe(true);
  });

  it('favor and grudge fade, except a grudge held by Thù dai', () => {
    let { state, id } = createNpc(life, content, { role: 'kẻ thù', grudge: 40, favor: 20 });
    state = { ...state, npcs: state.npcs.map((n) => ({ ...n, nature: 'thu_dai', lifespan: 999 })) };
    state = { ...state, npcs: state.npcs.map((n) => ({ ...n, root: false })) };
    const s2 = ageNpcs(state, content);
    expect(npcById(s2, id)!.grudge).toBe(40);
    expect(npcById(s2, id)!.favor).toBe(19);
  });

  it('high affinity reveals the nature', () => {
    const { state, id } = createNpc(life, content, { role: 'bằng hữu' });
    const s2 = changeNpc(state, content, id, { affinity: 50 });
    expect(npcById(s2, id)!.natureKnown).toBe(true);
  });

  it('killing an NPC passes the grudge to kin with the same surname', () => {
    const { state, id } = createNpc(life, content, { role: 'kẻ thù', grudge: 40 });
    const s2 = killNpc(state, content, id);
    expect(npcById(s2, id)!.alive).toBe(false);
    const heir = s2.npcs.find((n) => n.heirOf === id)!;
    expect(heir.grudge).toBeGreaterThanOrEqual(content.balance.npcs.revengeAt);
    expect(heir.name.split(' ')[0]).toBe(npcById(s2, id)!.name.split(' ')[0]);
  });

  it('keeps at most balance.npcs.max NPCs and runs inside advanceYear', () => {
    let s = life;
    for (let i = 0; i < content.balance.npcs.max + 5; i++) s = createNpc(s, content, { role: 'người quen' }).state;
    expect(s.npcs.length).toBe(content.balance.npcs.max);
    const ages = s.npcs.map((n) => n.age);
    s = advanceYear(s, content);
    expect(s.npcs.map((n) => n.age).filter((_, i) => s.npcs[i].alive)).toEqual(ages.map((a) => a + 1).filter((_, i) => s.npcs[i].alive));
  });
});
