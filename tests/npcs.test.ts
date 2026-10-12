import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { advanceYear, createLife, fillTemplate } from '../src/core/state';
import { EventSchema, NpcTraitsFileSchema } from '../src/core/schemas';
import { eventWeight, resolveChoice, rollYearEvent } from '../src/systems/events/engine';
import { meets } from '../src/systems/events/conditions';
import { settle } from '../src/systems/combat';
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

describe('NPCs in events and fights (task 3.4)', () => {
  const ev = (raw: unknown) => EventSchema.parse(raw);
  const meet = ev({
    id: 't_meet', category: 'test', title: 'Gặp', text: 'Gặp người.', weight: 0,
    choices: [{ text: 'Cướp', result: { text: '{npc} hận ngươi.', effects: { 'stat.happiness': 1, meetNpc: { role: 'kẻ thù', realm: 'pham_nhan', root: false }, npc: { grudge: 40 } } } }],
  });
  const revenge = ev({
    id: 't_revenge', category: 'test', title: 'Báo thù', text: '{npc} tìm tới.', weight: 1, npcTrigger: 'revenge',
    conditions: { npc: { minGrudge: 30 } },
    choices: [{
      text: 'Đánh',
      result: {
        text: 'Ra tay.',
        fight: {
          foe: { name: 'x', intent: 'kill', fromNpc: true },
          win: { text: 'Thắng {npc}.', effects: { 'stat.happiness': 1, npc: { grudge: 10 } } },
          lose: { text: 'Thua.', effects: { 'stat.happiness': -1 } },
        },
      },
    }],
  });
  const c2: Content = { ...content, events: [meet, revenge] };
  const pend = (s: GameState, id: string) => ({ ...s, events: { ...s.events, pending: id } });

  it('meetNpc creates the NPC, the ledger change hits them, {npc} names them', () => {
    const r = resolveChoice(pend(life, 't_meet'), c2, 0);
    const n = r.state.npcs[0];
    expect(n.grudge).toBe(40);
    expect(r.text).toContain(n.name);
    expect(r.state.events.npc).toBeNull();
  });

  it('npcTrigger events stay out of the random pool and fire from the ledger', () => {
    expect(eventWeight(life, c2, revenge)).toBe(0);
    let s = resolveChoice(pend(life, 't_meet'), c2, 0).state;
    s = { ...s, npcs: s.npcs.map((n) => ({ ...n, grudge: 100 })) };
    const c3: Content = { ...c2, balance: { ...c2.balance, npcs: { ...c2.balance.npcs, revengeChance: 1 } } };
    const rolled = rollYearEvent(s, c3);
    expect(rolled.events.pending).toBe('t_revenge');
    expect(rolled.events.npc).toBe(s.npcs[0].id);
    expect(fillTemplate('{npc} tìm tới.', rolled, c3)).toBe(`${s.npcs[0].name} tìm tới.`);
  });

  it('a fight fromNpc is against that NPC; killing them leaves an heir', () => {
    let s = resolveChoice(pend(life, 't_meet'), c2, 0).state;
    const id = s.npcs[0].id;
    s = { ...s, events: { ...s.events, pending: 't_revenge', npc: id } };
    s = resolveChoice(s, c2, 0).state;
    expect(s.combat!.foe.name).toBe(s.npcs[0].name);
    expect(s.combat!.npcId).toBe(id);
    expect(s.events.npc).toBeNull();
    // Skip to the aftermath and kill.
    s = { ...s, combat: { ...s.combat!, phase: 'won', won: 2 } };
    s = settle(s, c2, 'kill').state;
    expect(npcById(s, id)!.alive).toBe(false);
    expect(s.npcs.some((n) => n.heirOf === id)).toBe(true);
    expect(s.combat).toBeNull();
  });

  it('conditions.npc reads the event NPC', () => {
    const s = resolveChoice(pend(life, 't_meet'), c2, 0).state;
    const id = s.npcs[0].id;
    const withNpc = { ...s, events: { ...s.events, npc: id } };
    expect(meets(withNpc, { npc: { minGrudge: 30 } }, c2)).toBe(true);
    expect(meets(withNpc, { npc: { minFavor: 1 } }, c2)).toBe(false);
    expect(meets(s, { npc: { present: false } }, c2)).toBe(true);
    expect(meets(withNpc, { npc: { heir: true } }, c2)).toBe(false);
  });
});
